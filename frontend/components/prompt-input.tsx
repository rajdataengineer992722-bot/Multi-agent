"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => Promise<void>;
  isRunning: boolean;
}

const demoPrompts = [
  "Build a project plan for an AI learning assistant",
  "Research vector databases and recommend one for a startup MVP",
  "Create a learning roadmap for Kubernetes",
];

export function PromptInput({ onSubmit, isRunning }: PromptInputProps) {
  const [prompt, setPrompt] = useState(demoPrompts[0]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isRunning) return;
    await onSubmit(prompt.trim());
  }

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-accentCold/70">Mission Control</p>
          <h2 className="mt-1 text-2xl font-semibold">Launch a multi-agent run</h2>
        </div>
        <div className="rounded-full border border-line px-3 py-1 text-xs text-slate-300">
          Structured execution
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-line bg-slate-950/40 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-accentCold/60"
          placeholder="Describe the task you want the agent team to solve..."
        />

        <div className="flex flex-wrap gap-2">
          {demoPrompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPrompt(item)}
              className="rounded-full border border-line bg-slate-900/70 px-3 py-2 text-xs text-slate-300 transition hover:border-accentCold/50 hover:text-white"
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRunning}
        >
          {isRunning ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isRunning ? "Agents Working..." : "Run Agent Team"}
        </button>
      </form>
    </div>
  );
}
