"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-soft p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={cn("size-4", statusTone(agent.status), agent.status === "running" && "animate-pulse")} />
            <h3 className="text-sm font-semibold capitalize">{agent.name}</h3>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">{agent.role}</p>
        </div>
        <div className={cn("rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]", statusTone(agent.status))}>
          {agent.status}
        </div>
      </div>
      <p className="mt-4 line-clamp-4 text-xs leading-5 text-slate-300">
        {agent.output_preview || "Waiting for execution details."}
      </p>
    </motion.div>
  );
}
