"""
FastAPI server for PictoBrick ML endpoints.
Standalone — does not import from ptb_ml to keep deps minimal.
"""
from __future__ import annotations

import base64
import io
import logging
from functools import lru_cache

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="PictoBrick ML API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

DEPTH_MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"


@lru_cache(maxsize=1)
def _get_depth_pipe():
    from transformers import pipeline
    log.info("Loading %s (first request — may take a moment)…", DEPTH_MODEL_ID)
    return pipeline(task="depth-estimation", model=DEPTH_MODEL_ID, device=-1)


@app.get("/health")
def health():
    return {"ok": True}


class DepthGridReq(BaseModel):
    image_b64: str       # base64 data URL or raw base64
    grid_w: int
    grid_h: int
    max_height: int = 8  # tallest column in bricks


class DepthGridResp(BaseModel):
    depths: list[int]    # flat row-major array, length = grid_w * grid_h, values 1..max_height


@app.post("/api/depth-grid", response_model=DepthGridResp)
def depth_grid(req: DepthGridReq) -> DepthGridResp:
    if req.grid_w < 1 or req.grid_h < 1 or req.grid_w * req.grid_h > 25000:
        raise HTTPException(400, "Invalid grid dimensions")
    if req.max_height < 1 or req.max_height > 32:
        raise HTTPException(400, "max_height must be 1–32")

    # Decode image
    b64 = req.image_b64
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    try:
        img_bytes = base64.b64decode(b64)
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(400, f"Could not decode image: {exc}") from exc

    # Depth estimation
    pipe = _get_depth_pipe()
    result = pipe(pil_img)

    # result["depth"] is a PIL Image (relative depth; larger = closer for Depth Anything V2)
    depth_pil = result["depth"]
    depth_np = np.array(depth_pil, dtype=np.float32)

    # Resize to mosaic grid using PIL for good quality
    depth_small = np.array(
        Image.fromarray(depth_np).resize((req.grid_w, req.grid_h), Image.LANCZOS),
        dtype=np.float32,
    )

    # Normalize to [0, 1] — larger value = closer = taller column
    d_min, d_max = depth_small.min(), depth_small.max()
    if d_max > d_min:
        norm = (depth_small - d_min) / (d_max - d_min)
    else:
        norm = np.full_like(depth_small, 0.5)

    # Quantize to 1..max_height
    heights = np.clip(
        np.round(norm * (req.max_height - 1) + 1).astype(int),
        1,
        req.max_height,
    )

    return DepthGridResp(depths=heights.flatten().tolist())
