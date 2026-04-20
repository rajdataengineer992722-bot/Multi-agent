"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Activity, BotMessageSquare, Radar, ScrollText, Sparkles } from "lucide-react";

import { AgentCard } from "@/components/agent-card";
import { IntermediatePanels } from "@/components/intermediate-panels";
import { OutputPanel } from "@/components/output-panel";
import { PromptInput } from "@/components/prompt-input";
import { RunHistory } from "@/components/run-history";
import { WorkflowGraph } from "@/components/workflow-graph";
import { getRuns, streamRun } from "@/lib/api";
import { RunRecord } from "@/lib/types";

export default function DashboardPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRun, setActiveRun] = useState<RunRecord | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    void refreshRuns();
  }, []);

  async function refreshRuns() {
    const items = await getRuns();
    setRuns(items);
    if (!activeRun && items.length > 0) {
      setActiveRun(items[0]);
    }
  }

  async function handleRun(prompt: string) {
    setIsRunning(true);

    await streamRun(prompt, (eventName, payload) => {
      const run = payload.run as RunRecord | undefined;
      if (!run) return;

      setActiveRun(run);
      setRuns((previous) => {
        const filtered = previous.filter((item) => item.id !== run.id);
        return [run, ...filtered];
      });

      if (eventName === "run.completed" || eventName === "run.error") {
        setIsRunning(false);
      }
    }).finally(() => {
      setIsRunning(false);
    });
  }

  const activityLog = useMemo(() => activeRun?.events.slice().reverse().slice(0, 10) ?? [], [activeRun]);
  const completedAgents = activeRun?.agents.filter((agent) => agent.status === "completed").length ?? 0;
  const runningAgent = activeRun?.agents.find((agent) => agent.status === "running")?.name ?? "Idle";

  return (
    <main className="dashboard-shell min-h-screen px-4 py-4 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-[1860px] flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel overflow-hidden p-5 md:p-6"
        >
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-accent/70">Multi-Agent AI Studio</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">
                Premium orchestration workspace for planning, research, execution, and review.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Inspect each specialized agent, monitor status changes, and revisit previous runs locally.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  <Sparkles className="size-3.5 text-accent" />
                  Active run
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-medium text-slate-200">
                  {activeRun?.prompt ?? "No active run selected"}
                </p>
              </div>
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  <Radar className="size-3.5 text-accentCold" />
                  Current agent
                </div>
                <p className="mt-3 text-lg font-semibold capitalize">{runningAgent}</p>
              </div>
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  <Activity className="size-3.5 text-accentWarm" />
                  Completion
                </div>
                <p className="mt-3 text-lg font-semibold">{completedAgents} agents complete</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)_480px] xl:items-start">
          <aside className="space-y-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-hidden">
            <div className="panel p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-accent/70">Agent Mesh</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Control center</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Track each specialist as the orchestrator pushes work through the graph and turns a prompt into a stakeholder-ready deliverable.
              </p>
            </div>
            <div className="data-scroll space-y-5 xl:overflow-y-auto xl:pr-1">
              <div className="space-y-3">
                {(activeRun?.agents ?? []).map((agent) => (
                  <AgentCard key={agent.name} agent={agent} />
                ))}
              </div>
              <RunHistory runs={runs} activeRunId={activeRun?.id ?? null} onSelect={setActiveRun} />
            </div>
          </aside>

          <section className="space-y-5">
            <PromptInput onSubmit={handleRun} isRunning={isRunning} />
            <WorkflowGraph agents={activeRun?.agents ?? []} />
            <div className="panel p-6">
              <div className="mb-5 flex items-center gap-2">
                <ScrollText className="size-4 text-accentCold" />
                <h2 className="text-2xl font-semibold">Intermediate results</h2>
              </div>
              <IntermediatePanels run={activeRun} />
            </div>
          </section>

          <aside className="grid gap-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:grid-rows-[minmax(0,1fr)_320px] xl:overflow-hidden xl:pr-2">
            <OutputPanel run={activeRun} />
            <div className="panel flex min-h-0 flex-col p-6">
              <div className="mb-5 flex items-center gap-2">
                <Activity className="size-4 text-accentWarm" />
                <h2 className="text-xl font-semibold">Live logs</h2>
              </div>
              <div className="data-scroll min-h-0 space-y-3 overflow-y-auto pr-1">
                {activityLog.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-[24px] border border-dashed border-line p-4 text-sm text-slate-400">
                    <BotMessageSquare className="size-4" />
                    Agent logs will stream here during execution.
                  </div>
                ) : (
                  activityLog.map((event) => (
                    <div key={event.event_id} className="rounded-[24px] border border-line bg-slate-950/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-accentCold/80">
                          {event.agent ?? "system"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-200">{event.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
