"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BotMessageSquare, ScrollText } from "lucide-react";

import { AgentCard } from "@/components/agent-card";
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

  return (
    <main className="min-h-screen px-4 py-4 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
          <aside className="space-y-4">
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-accent/70">Agent Mesh</p>
              <h1 className="mt-2 text-2xl font-semibold">Control center</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Inspect each specialized agent, monitor status changes, and revisit previous runs locally.
              </p>
            </div>
            <div className="space-y-3">
              {(activeRun?.agents ?? []).map((agent) => (
                <AgentCard key={agent.name} agent={agent} />
              ))}
            </div>
            <RunHistory runs={runs} activeRunId={activeRun?.id ?? null} onSelect={setActiveRun} />
          </aside>

          <section className="space-y-4">
            <PromptInput onSubmit={handleRun} isRunning={isRunning} />
            <WorkflowGraph agents={activeRun?.agents ?? []} />
            <div className="panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <ScrollText className="size-4 text-accentCold" />
                <h2 className="text-xl font-semibold">Intermediate results</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="panel-soft p-4">
                  <h3 className="text-sm font-semibold text-accentWarm">Planner</h3>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
                    {JSON.stringify(activeRun?.plan, null, 2) || "No plan yet."}
                  </pre>
                </div>
                <div className="panel-soft p-4">
                  <h3 className="text-sm font-semibold text-accentCold">Researcher</h3>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
                    {JSON.stringify(activeRun?.research, null, 2) || "No research yet."}
                  </pre>
                </div>
                <div className="panel-soft p-4">
                  <h3 className="text-sm font-semibold text-accent">Executor</h3>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
                    {JSON.stringify(activeRun?.execution, null, 2) || "No execution output yet."}
                  </pre>
                </div>
                <div className="panel-soft p-4">
                  <h3 className="text-sm font-semibold text-white">Reviewer</h3>
                  <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-300">
                    {JSON.stringify(activeRun?.review, null, 2) || "No review yet."}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          <aside className="grid gap-4 xl:grid-rows-[minmax(0,1fr)_340px]">
            <OutputPanel run={activeRun} />
            <div className="panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="size-4 text-accentWarm" />
                <h2 className="text-lg font-semibold">Live logs</h2>
              </div>
              <div className="space-y-3 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-sm text-slate-400">
                    <BotMessageSquare className="size-4" />
                    Agent logs will stream here during execution.
                  </div>
                ) : (
                  activityLog.map((event) => (
                    <div key={event.event_id} className="rounded-2xl border border-line bg-slate-950/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-accentCold/80">
                          {event.agent ?? "system"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{event.message}</p>
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
