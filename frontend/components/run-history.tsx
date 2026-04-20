"use client";

import { History } from "lucide-react";

import { RunRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RunHistoryProps {
  runs: RunRecord[];
  activeRunId: string | null;
  onSelect: (run: RunRecord) => void;
}

export function RunHistory({ runs, activeRunId, onSelect }: RunHistoryProps) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="size-4 text-accentWarm" />
        <h2 className="text-lg font-semibold">Previous runs</h2>
      </div>

      <div className="data-scroll space-y-3 xl:max-h-[320px] xl:overflow-y-auto xl:pr-1">
        {runs.length === 0 ? (
          <p className="text-sm text-slate-400">No runs yet. Launch a prompt to build a local history.</p>
        ) : (
          runs.map((run) => (
            <button
              key={run.id}
              onClick={() => onSelect(run)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left transition",
                activeRunId === run.id
                  ? "border-accent bg-accent/10"
                  : "border-line bg-slate-950/20 hover:border-accentCold/40",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="line-clamp-1 text-sm font-medium">{run.prompt}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{run.status}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(run.updated_at).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
