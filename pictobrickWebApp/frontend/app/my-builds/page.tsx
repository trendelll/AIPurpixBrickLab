"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Trash2 } from "lucide-react";

// TODO: replace with real data once the FastAPI `GET /builds/mine` endpoint exists.
// Shape is intentionally minimal and mirrors what the backend will likely return.
type Build = {
  id: string;
  title: string;
  createdAt: string;
  size: "Small" | "Medium" | "Large";
  thumbColor: string;
};

const PLACEHOLDER_BUILDS: Build[] = [
  { id: "b_01", title: "Golden Retriever", createdAt: "2026-04-14", size: "Medium", thumbColor: "bg-yellow-500/20" },
  { id: "b_02", title: "Skyline at Dusk", createdAt: "2026-04-02", size: "Large", thumbColor: "bg-orange-500/20" },
  { id: "b_03", title: "Family Portrait", createdAt: "2026-03-21", size: "Small", thumbColor: "bg-indigo-500/20" },
];

export default function MyBuildsPage() {
  const { user, isLoaded } = useUser();
  const builds = PLACEHOLDER_BUILDS;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">My Builds</h1>
          <p className="text-slate-400">
            {isLoaded && user?.firstName
              ? `Welcome back, ${user.firstName}. Here are your previous brick creations.`
              : "Your previous brick creations."}
          </p>
        </div>
        <Link href="/create">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Build
          </Button>
        </Link>
      </div>

      {builds.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-slate-800 text-center space-y-6 bg-slate-900/20">
          <h2 className="text-2xl font-semibold text-white">No builds yet.</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Once you generate your first brick layout, it will show up here so you can
            revisit, download, or share it.
          </p>
          <Link href="/create">
            <Button className="px-8 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium shadow-lg shadow-indigo-500/20">
              Start Your First Build
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {builds.map((build, index) => (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group relative bg-slate-900/40 border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
                <div className={`aspect-[4/5] w-full ${build.thumbColor} flex items-center justify-center relative overflow-hidden`}>
                  <div
                    className="absolute inset-0 opacity-20 group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                  />
                  <span className="text-slate-500 font-mono text-xs z-10">BUILD_{build.id.toUpperCase()}</span>

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-md" aria-label="Download">
                      <Download className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-red-500/80 rounded-full hover:bg-red-500 transition shadow-xl" aria-label="Delete">
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium">{build.title}</h3>
                    <span className="text-[10px] border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase font-semibold">
                      {build.size}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Created {new Date(build.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
