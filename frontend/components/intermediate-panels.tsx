"use client";

import { CheckCheck, ClipboardList, Radar, SearchCode, ShieldCheck, Wrench } from "lucide-react";

import { RunRecord } from "@/lib/types";

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-line bg-slate-950/20 p-5 text-sm text-slate-400">
      {label}
    </div>
  );
}

export function IntermediatePanels({ run }: { run: RunRecord | null }) {
  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      <div className="panel-soft p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-slate-950/40">
            <ClipboardList className="size-4 text-accentWarm" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-accentWarm">Planner</h3>
            <p className="mt-1 text-xs text-slate-500">Objective, strategy, and step structure</p>
          </div>
        </div>
        {!run?.plan ? (
          <div className="mt-4">
            <EmptyState label="No plan yet." />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Objective</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{run.plan.objective}</p>
            </div>
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Execution strategy</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{run.plan.execution_strategy}</p>
            </div>
            <div className="space-y-3">
              {run.plan.steps.map((step, index) => (
                <div key={step.id} className="rounded-[22px] border border-line bg-slate-950/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-slate-100">{index + 1}. {step.title}</p>
                    <span className="rounded-full border border-line bg-slate-950/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      {step.owner}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-300">{step.description}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Success: {step.success_criteria}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel-soft p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-slate-950/40">
            <SearchCode className="size-4 text-accentCold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-accentCold">Researcher</h3>
            <p className="mt-1 text-xs text-slate-500">Findings, risks, and assumptions</p>
          </div>
        </div>
        {!run?.research ? (
          <div className="mt-4">
            <EmptyState label="No research yet." />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Summary</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{run.research.summary}</p>
            </div>
            <div className="space-y-3">
              {run.research.findings.map((finding) => (
                <div key={finding.topic} className="rounded-[22px] border border-line bg-slate-950/30 p-4">
                  <p className="text-sm font-medium text-slate-100">{finding.topic}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">{finding.insight}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Evidence: {finding.evidence}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Relevance: {finding.relevance}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Risks</div>
                <div className="mt-3 space-y-2">
                  {run.research.risks.map((risk) => (
                    <div key={risk} className="rounded-[18px] border border-line bg-slate-950/35 px-3 py-3 text-xs leading-6 text-slate-300">
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Assumptions</div>
                <div className="mt-3 space-y-2">
                  {run.research.assumptions.map((assumption) => (
                    <div key={assumption} className="rounded-[18px] border border-line bg-slate-950/35 px-3 py-3 text-xs leading-6 text-slate-300">
                      {assumption}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-soft p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-slate-950/40">
            <Wrench className="size-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Executor</h3>
            <p className="mt-1 text-xs text-slate-500">Draft output and recommended next actions</p>
          </div>
        </div>
        {!run?.execution ? (
          <div className="mt-4">
            <EmptyState label="No execution output yet." />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Draft summary</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{run.execution.summary}</p>
            </div>
            <div className="space-y-3">
              {run.execution.sections.map((section) => (
                <div key={section.title} className="rounded-[22px] border border-line bg-slate-950/30 p-4">
                  <p className="text-sm font-medium text-slate-100">{section.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-300">{section.content}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Recommended actions</div>
              <div className="mt-3 space-y-2">
                {run.execution.recommended_actions.map((action) => (
                  <div key={action} className="rounded-2xl bg-slate-950/40 px-3 py-2 text-xs leading-6 text-slate-300">
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-soft p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-slate-950/40">
            <ShieldCheck className="size-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Reviewer</h3>
            <p className="mt-1 text-xs text-slate-500">Quality score, strengths, and revision guidance</p>
          </div>
        </div>
        {!run?.review ? (
          <div className="mt-4">
            <EmptyState label="No review yet." />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <div className="rounded-[22px] border border-line bg-slate-950/30 p-4 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Approved</div>
                <p className="mt-2 text-lg font-semibold text-slate-100">{run.review.approved ? "Yes" : "Needs work"}</p>
              </div>
              <div className="rounded-[22px] border border-line bg-slate-950/30 p-4 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Score</div>
                <p className="mt-2 text-lg font-semibold text-slate-100">{run.review.score}/10</p>
              </div>
              <div className="rounded-[22px] border border-line bg-slate-950/30 p-4 min-w-0 md:col-span-2 2xl:col-span-1">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Revision loop</div>
                <p className="mt-2 text-base font-medium text-slate-100">
                  {run.runtime?.needs_revision ? "Requested" : "Clear"}
                </p>
              </div>
            </div>
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <CheckCheck className="size-3.5 text-accent" />
                Strengths
              </div>
              <div className="flex flex-wrap gap-2">
                {run.review.strengths.map((strength) => (
                  <span key={strength} className="rounded-full border border-line px-3 py-2 text-xs text-slate-300">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Gaps</div>
              <div className="mt-3 space-y-2">
                {run.review.gaps.length === 0 ? (
                  <p className="text-xs text-slate-400">No gaps flagged.</p>
                ) : (
                  run.review.gaps.map((gap) => (
                    <div key={gap} className="rounded-2xl bg-slate-950/40 px-3 py-2 text-xs leading-6 text-slate-300">
                      {gap}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Revision requests</div>
              <div className="mt-3 space-y-2">
                {run.review.revision_requests.length === 0 ? (
                  <p className="text-xs text-slate-400">No revision requests.</p>
                ) : (
                  run.review.revision_requests.map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-950/40 px-3 py-2 text-xs leading-6 text-slate-300">
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>
            {run.runtime ? (
              <div className="rounded-[22px] border border-line bg-slate-950/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <Radar className="size-3.5 text-accentCold" />
                  Workflow runtime
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-300">Phase: {run.runtime.phase}</div>
                  <div className="rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-300">Active node: {run.runtime.active_node}</div>
                  <div className="rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-300">
                    Execution loops: {run.runtime.execution_iterations}
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-300">
                    Review loops: {run.runtime.review_iterations}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
