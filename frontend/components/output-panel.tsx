"use client";

import { Download, FileText } from "lucide-react";

import { RunRecord } from "@/lib/types";

function downloadMarkdown(run: RunRecord) {
  if (!run.final) return;
  const blob = new Blob([run.final.final_deliverable], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${run.id}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OutputPanel({ run }: { run: RunRecord | null }) {
  return (
    <div className="panel flex min-h-0 flex-col p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-accent/70">Output</p>
          <h2 className="mt-1 text-2xl font-semibold">Final deliverable</h2>
        </div>
        {run?.final ? (
          <button
            onClick={() => downloadMarkdown(run)}
            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs text-slate-200 transition hover:border-accent/50"
          >
            <Download className="size-3.5" />
            Markdown
          </button>
        ) : null}
      </div>

      {!run?.final ? (
        <div className="flex flex-1 items-center justify-center rounded-[28px] border border-dashed border-line bg-slate-950/20 p-6 text-center text-sm text-slate-400">
          <div>
            <FileText className="mx-auto mb-3 size-8 text-slate-500" />
            Final response appears here after the agent chain completes.
          </div>
        </div>
      ) : (
        <div className="data-scroll min-h-0 space-y-5 overflow-y-auto pr-1">
          <div className="panel-soft p-5">
            <h3 className="text-lg font-semibold">{run.final.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{run.final.objective}</p>
          </div>

          <div className="panel-soft p-5">
            <h4 className="text-sm font-semibold text-accentCold">Plan</h4>
            <div className="mt-3 space-y-3">
              {run.final.plan.map((step, index) => (
                <div key={step.id} className="rounded-[22px] border border-line bg-slate-950/30 p-3">
                  <p className="text-sm font-medium">{index + 1}. {step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-soft p-5">
            <h4 className="text-sm font-semibold text-accentWarm">Research Summary</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">{run.final.research_summary}</p>
          </div>

          <div className="panel-soft p-5">
            <h4 className="text-sm font-semibold text-accent">Execution Output</h4>
            <div className="mt-3 space-y-3">
              {run.final.execution_output.map((section) => (
                <div key={section.title} className="rounded-[22px] border border-line bg-slate-950/30 p-3">
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-300">{section.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-soft p-5">
            <h4 className="text-sm font-semibold text-accentCold">Review Notes</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {run.final.review_notes.map((note) => (
                <span key={note} className="rounded-full border border-line bg-slate-950/30 px-3 py-2 text-xs text-slate-200">
                  {note}
                </span>
              ))}
            </div>
          </div>

          <div className="panel-soft p-5">
            <h4 className="text-sm font-semibold text-white">Final Deliverable</h4>
            <pre className="mt-3 max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-[22px] border border-line bg-slate-950/25 p-4 text-sm leading-6 text-slate-200">
              {run.final.final_deliverable}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
