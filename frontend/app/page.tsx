import Link from "next/link";
import { ArrowRight, Blocks, BrainCircuit, Network, ScrollText } from "lucide-react";

const features = [
  {
    title: "Graph-based orchestration",
    description: "A central executor routes work through planner, researcher, executor, reviewer, and composer agents.",
    icon: Network,
  },
  {
    title: "Structured agent outputs",
    description: "Each handoff uses typed JSON so the workflow stays inspectable, debuggable, and production-friendly.",
    icon: Blocks,
  },
  {
    title: "Live execution visibility",
    description: "Track statuses, workflow steps, logs, and final deliverables inside a premium dashboard UI.",
    icon: BrainCircuit,
  },
  {
    title: "Interview-ready polish",
    description: "Built to demonstrate AI orchestration, full-stack engineering, and UX taste in one project.",
    icon: ScrollText,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-10 xl:px-14">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between rounded-full border border-line bg-slate-950/30 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accentCold/70">Multi-Agent AI Studio</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Open Dashboard
            <ArrowRight className="size-4" />
          </Link>
        </header>

        <section className="grid gap-10 pb-16 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent/70">Portfolio-grade AI product</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
              Turn one prompt into a polished deliverable with a collaborating agent team.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Launch a production-minded multi-agent workflow that plans, researches, executes, reviews, and composes a high-quality final response with real-time visibility.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Start Building
              </Link>
              <a
                href="#features"
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-slate-100"
              >
                Explore Features
              </a>
            </div>
          </div>

          <div className="panel relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,184,107,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(125,249,198,0.16),transparent_30%)]" />
            <div className="relative space-y-4">
              <div className="panel-soft p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Workflow</p>
                <p className="mt-2 text-sm text-white">User Prompt → Orchestrator → Planner → Researcher → Executor → Reviewer → Final Result</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Example prompts</p>
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  <p>Build project plan for an AI Learning Assistant</p>
                  <p>Research and compare vector databases</p>
                  <p>Create full-stack implementation roadmap</p>
                </div>
              </div>
              <div className="panel-soft p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Outputs</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                  <span className="rounded-full border border-line px-3 py-2">Objective</span>
                  <span className="rounded-full border border-line px-3 py-2">Plan</span>
                  <span className="rounded-full border border-line px-3 py-2">Research Summary</span>
                  <span className="rounded-full border border-line px-3 py-2">Execution</span>
                  <span className="rounded-full border border-line px-3 py-2">Review Notes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-4 pb-12 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="panel p-6">
              <feature.icon className="size-6 text-accent" />
              <h2 className="mt-4 text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
