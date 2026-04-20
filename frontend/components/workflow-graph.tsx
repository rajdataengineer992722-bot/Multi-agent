"use client";

import { motion } from "framer-motion";
import { Activity, CheckCheck, Sparkles } from "lucide-react";

import { AgentSnapshot } from "@/lib/types";

const flow = ["User Prompt", "Orchestrator", "Planner", "Researcher", "Executor", "Reviewer", "Final Result"];

export function WorkflowGraph({ agents }: { agents: AgentSnapshot[] }) {
  const completedCount = agents.filter((agent) => agent.status === "completed").length;
  const runningAgent = agents.find((agent) => agent.status === "running");

  return (
    <div className="panel overflow-hidden p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-accentWarm/70">Workflow</p>
          <h2 className="mt-1 text-2xl font-semibold">Execution timeline</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Follow how the orchestrator advances the task through planning, research, execution, review, and final composition.
          </p>
        </div>
        <div className="grid min-w-[260px] gap-3 sm:grid-cols-3">
          <div className="panel-soft p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <CheckCheck className="size-3.5 text-accent" />
              Completed
            </div>
            <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
          </div>
          <div className="panel-soft p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <Activity className="size-3.5 text-accentCold" />
              Active
            </div>
            <p className="mt-2 line-clamp-1 text-sm font-medium capitalize text-slate-200">
              {runningAgent?.name ?? "Idle"}
            </p>
          </div>
          <div className="panel-soft p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="size-3.5 text-accentWarm" />
              Stages
            </div>
            <p className="mt-2 text-2xl font-semibold">{flow.length}</p>
          </div>
        </div>
      </div>

      <div className="data-scroll overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-4">
          {flow.map((item, index) => {
            const key = item.toLowerCase().replace(" ", "");
            const match = agents.find((agent) => agent.name === key || (item === "Final Result" && agent.name === "composer"));
            const isRunning = match?.status === "running";
            const active = isRunning || match?.status === "completed";
            const isCompleted = match?.status === "completed";
            const statusLabel = match?.status ?? (index === 0 ? "input" : "pending");

            return (
              <div key={item} className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0.7 }}
                  animate={{
                    scale: isRunning ? 1.04 : active ? 1.01 : 1,
                    opacity: active ? 1 : 0.72,
                    y: isRunning ? [-1, 1, -1] : 0,
                  }}
                  transition={{ duration: isRunning ? 1.8 : 0.25, repeat: isRunning ? Number.POSITIVE_INFINITY : 0 }}
                  className={`relative flex min-h-[176px] w-[190px] flex-col justify-between rounded-[28px] border px-5 py-5 text-left ${
                    isRunning
                      ? "border-accentCold bg-accentCold/10 text-accentCold shadow-[0_0_30px_rgba(124,200,255,0.16)]"
                      : isCompleted
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-slate-950/40 text-slate-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Stage</div>
                      <div className="mt-2 text-3xl font-semibold">{index + 1}</div>
                    </div>
                    <div className="rounded-full border border-line bg-slate-950/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      {statusLabel}
                    </div>
                  </div>
                  <div className="mt-5 min-w-0">
                    <div className="text-[28px] font-semibold leading-none text-slate-100">{item}</div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                      {index === 0 ? "User entry point" : item === "Final Result" ? "Composed output" : "Workflow stage"}
                    </div>
                  </div>
                </motion.div>
                {index < flow.length - 1 ? (
                  <div className="hidden h-px w-10 shrink-0 xl:block">
                    <div className="glass-divider mt-[0.35rem] h-px w-full" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
