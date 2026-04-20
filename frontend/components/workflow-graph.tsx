"use client";

import { motion } from "framer-motion";

import { AgentSnapshot } from "@/lib/types";

const flow = ["User Prompt", "Orchestrator", "Planner", "Researcher", "Executor", "Reviewer", "Final Result"];

export function WorkflowGraph({ agents }: { agents: AgentSnapshot[] }) {
  return (
    <div className="panel p-5">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.25em] text-accentWarm/70">Workflow</p>
        <h2 className="mt-1 text-xl font-semibold">Execution timeline</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {flow.map((item, index) => {
          const key = item.toLowerCase().replace(" ", "");
          const match = agents.find((agent) => agent.name === key || (item === "Final Result" && agent.name === "composer"));
          const active = match?.status === "running" || match?.status === "completed";

          return (
            <div key={item} className="flex items-center gap-3 md:flex-col">
              <motion.div
                initial={{ scale: 0.95, opacity: 0.7 }}
                animate={{ scale: active ? 1.04 : 1, opacity: active ? 1 : 0.7 }}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-center text-xs ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-slate-950/40 text-slate-400"
                }`}
              >
                {index + 1}
              </motion.div>
              <div className="text-xs text-slate-300">{item}</div>
              {index < flow.length - 1 ? <div className="hidden h-px flex-1 bg-line md:block" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
