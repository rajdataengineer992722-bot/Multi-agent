from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AgentStatus(str, Enum):
    idle = "idle"
    running = "running"
    completed = "completed"
    error = "error"


class RunStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    error = "error"


class AgentName(str, Enum):
    orchestrator = "orchestrator"
    planner = "planner"
    researcher = "researcher"
    executor = "executor"
    reviewer = "reviewer"
    composer = "composer"


class TaskRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)


class PlanStep(BaseModel):
    id: str
    title: str
    description: str
    owner: str
    success_criteria: str


class PlannerOutput(BaseModel):
    objective: str
    deliverable_type: str
    execution_strategy: str
    steps: list[PlanStep]


class ResearchFinding(BaseModel):
    topic: str
    insight: str
    evidence: str
    relevance: str


class ResearchOutput(BaseModel):
    summary: str
    findings: list[ResearchFinding]
    risks: list[str]
    assumptions: list[str]


class ExecutionSection(BaseModel):
    title: str
    content: str


class ExecutionOutput(BaseModel):
    summary: str
    sections: list[ExecutionSection]
    recommended_actions: list[str]


class ReviewOutput(BaseModel):
    approved: bool
    score: int = Field(ge=1, le=10)
    strengths: list[str]
    gaps: list[str]
    revision_requests: list[str]


class FinalOutput(BaseModel):
    title: str
    objective: str
    plan: list[PlanStep]
    research_summary: str
    execution_output: list[ExecutionSection]
    review_notes: list[str]
    final_deliverable: str


class AgentSnapshot(BaseModel):
    name: AgentName
    role: str
    status: AgentStatus = AgentStatus.idle
    started_at: datetime | None = None
    completed_at: datetime | None = None
    output_preview: str = ""
    detail: dict[str, Any] | None = None


class WorkflowEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    run_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    type: str
    message: str
    agent: AgentName | None = None
    payload: dict[str, Any] | None = None


class RunRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    prompt: str
    status: RunStatus = RunStatus.queued
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    agents: list[AgentSnapshot]
    events: list[WorkflowEvent] = Field(default_factory=list)
    plan: PlannerOutput | None = None
    research: ResearchOutput | None = None
    execution: ExecutionOutput | None = None
    review: ReviewOutput | None = None
    final: FinalOutput | None = None
    error: str | None = None


class HistoryResponse(BaseModel):
    runs: list[RunRecord]
