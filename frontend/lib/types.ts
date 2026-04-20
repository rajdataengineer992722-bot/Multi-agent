export type AgentStatus = "idle" | "running" | "completed" | "error";

export type AgentName =
  | "orchestrator"
  | "planner"
  | "researcher"
  | "executor"
  | "reviewer"
  | "composer";

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  owner: string;
  success_criteria: string;
}

export interface ExecutionSection {
  title: string;
  content: string;
}

export interface AgentSnapshot {
  name: AgentName;
  role: string;
  status: AgentStatus;
  started_at?: string | null;
  completed_at?: string | null;
  output_preview: string;
  detail?: Record<string, unknown> | null;
}

export interface WorkflowEvent {
  event_id: string;
  run_id: string;
  timestamp: string;
  type: string;
  message: string;
  agent?: AgentName | null;
  payload?: Record<string, unknown> | null;
}

export interface RunRecord {
  id: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "error";
  created_at: string;
  updated_at: string;
  agents: AgentSnapshot[];
  events: WorkflowEvent[];
  plan?: {
    objective: string;
    deliverable_type: string;
    execution_strategy: string;
    steps: PlanStep[];
  } | null;
  research?: {
    summary: string;
    findings: Array<{
      topic: string;
      insight: string;
      evidence: string;
      relevance: string;
    }>;
    risks: string[];
    assumptions: string[];
  } | null;
  execution?: {
    summary: string;
    sections: ExecutionSection[];
    recommended_actions: string[];
  } | null;
  review?: {
    approved: boolean;
    score: number;
    strengths: string[];
    gaps: string[];
    revision_requests: string[];
  } | null;
  final?: {
    title: string;
    objective: string;
    plan: PlanStep[];
    research_summary: string;
    execution_output: ExecutionSection[];
    review_notes: string[];
    final_deliverable: string;
  } | null;
  runtime?: {
    phase: string;
    current_agent: AgentName;
    execution_iterations: number;
    review_iterations: number;
    max_review_loops: number;
    needs_revision: boolean;
    revision_notes: string[];
    completed_nodes: string[];
    active_node: string;
    last_error?: string | null;
  } | null;
  error?: string | null;
}
