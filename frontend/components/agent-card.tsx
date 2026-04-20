"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, CircleDashed, Sparkles, TriangleAlert } from "lucide-react";

import { AgentSnapshot } from "@/lib/types";
import { cn, statusTone } from "@/lib/utils";

const iconByStatus = {
  idle: CircleDashed,
  running: BrainCircuit,
  completed: CheckCircle2,
  error: TriangleAlert,
};

export function AgentCard({ agent }: { agent: AgentSnapshot }) {
  const Icon = iconByStatus[agent.status];
  const isRunning = agent.status === "running";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-soft relative overflow-hidden p-4"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div
        className={cn(
          "absolute -right-12 -top-12 h-24 w-24 rounded-full blur-2xl",
          agent.status === "completed" && "bg-accent/15",
          agent.status === "running" && "bg-accentCold/15",
          agent.status === "error" && "bg-rose-400/15",
          agent.status === "idle" && "bg-white/5",
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-slate-950/40">
              <Icon className={cn("size-4", statusTone(agent.status), isRunning && "animate-pulse")} />
            </div>
            <div>
              <h3 className="text-base font-semibold capitalize tracking-wide">{agent.name}</h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-500">Specialized agent</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-400">{agent.role}</p>
        </div>
        <div className={cn("rounded-full border border-line bg-slate-950/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em]", statusTone(agent.status))}>
          {agent.status}
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-slate-950/30 p-3.5">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          <Sparkles className="size-3" />
          Output preview
        </div>
        <div className="data-scroll max-h-[156px] overflow-y-auto pr-1">
          <p className="text-xs leading-6 text-slate-300 break-words">
            {agent.output_preview || "Waiting for execution details."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
