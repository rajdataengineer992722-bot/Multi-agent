from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any, Callable, TypedDict

from langgraph.graph import END, StateGraph

from app.agents.composer import ComposerAgent, ComposerInput
from app.agents.executor import ExecutorAgent, ExecutorInput
from app.agents.planner import PlannerAgent
from app.agents.researcher import ResearcherAgent, ResearcherInput
from app.agents.reviewer import ReviewerAgent, ReviewerInput
from app.models.schemas import (
    AgentName,
    AgentSnapshot,
    AgentStatus,
    ExecutionOutput,
    FinalOutput,
    PlanStep,
    PlannerOutput,
    ResearchOutput,
    ReviewOutput,
    RunRecord,
    RunStatus,
    WorkflowEvent,
)
from app.services.llm import LLMService
from app.storage.history import HistoryStore


def now() -> datetime:
    return datetime.now(timezone.utc)


class GraphState(TypedDict, total=False):
    prompt: str
    run: RunRecord
    plan: PlannerOutput | None
    research: ResearchOutput | None
    execution: ExecutionOutput | None
    review: ReviewOutput | None
    final: FinalOutput | None


class MultiAgentOrchestrator:
    def __init__(self) -> None:
        self.llm = LLMService()
        self.store = HistoryStore()
        self.planner = PlannerAgent(self.llm)
        self.researcher = ResearcherAgent(self.llm)
        self.executor = ExecutorAgent(self.llm)
        self.reviewer = ReviewerAgent(self.llm)
        self.composer = ComposerAgent(self.llm)
        self.graph = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(GraphState)
        builder.add_node("planner", self._planner_node)
        builder.add_node("researcher", self._researcher_node)
        builder.add_node("executor", self._executor_node)
        builder.add_node("reviewer", self._reviewer_node)
        builder.add_node("composer", self._composer_node)
        builder.set_entry_point("planner")
        builder.add_edge("planner", "researcher")
        builder.add_edge("researcher", "executor")
        builder.add_edge("executor", "reviewer")
        builder.add_edge("reviewer", "composer")
        builder.add_edge("composer", END)
        return builder.compile()

    def _initial_agents(self) -> list[AgentSnapshot]:
        return [
            AgentSnapshot(name=AgentName.orchestrator, role="Coordinates the agent workflow."),
            AgentSnapshot(name=AgentName.planner, role=self.planner.role),
            AgentSnapshot(name=AgentName.researcher, role=self.researcher.role),
            AgentSnapshot(name=AgentName.executor, role=self.executor.role),
            AgentSnapshot(name=AgentName.reviewer, role=self.reviewer.role),
            AgentSnapshot(name=AgentName.composer, role=self.composer.role),
        ]

    async def stream_run(self, prompt: str) -> AsyncGenerator[str, None]:
        run = RunRecord(prompt=prompt, status=RunStatus.running, agents=self._initial_agents())
        self._touch(run)
        self.store.save_run(run)
        yield self._sse("run.started", {"run": run.model_dump(mode="json")})

        try:
            completed_run = await self._execute_graph(run, prompt)
            yield self._sse("run.completed", {"run": completed_run.model_dump(mode="json")})
        except Exception as exc:  # noqa: BLE001
            run.status = RunStatus.error
            run.error = str(exc)
            run.updated_at = now()
            self._mark_status(run, AgentName.orchestrator, AgentStatus.error, str(exc))
            self.store.save_run(run)
            yield self._sse("run.error", {"run": run.model_dump(mode="json"), "error": str(exc)})

        yield "event: done\ndata: {}\n\n"

    async def run_once(self, prompt: str) -> RunRecord:
        run = RunRecord(prompt=prompt, status=RunStatus.running, agents=self._initial_agents())
        self._touch(run)
        self.store.save_run(run)
        return await self._execute_graph(run, prompt)

    async def _execute_graph(self, run: RunRecord, prompt: str) -> RunRecord:
        self._mark_status(run, AgentName.orchestrator, AgentStatus.running, "Workflow started")
        self.store.save_run(run)

        final_state = await self.graph.ainvoke({"prompt": prompt, "run": run})
        completed_run: RunRecord = final_state.get("run", run)
        completed_run.status = RunStatus.completed
        completed_run.updated_at = now()
        self._mark_status(completed_run, AgentName.orchestrator, AgentStatus.completed, "Workflow completed")
        self.store.save_run(completed_run)
        return completed_run

    async def _planner_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        output = await self._run_with_retry(
            run=run,
            agent=AgentName.planner,
            action=lambda: self.planner.run(state["prompt"]),
            fallback=lambda: self._fallback_plan(state["prompt"]),
        )
        run.plan = output
        return {**state, "run": run, "plan": output}

    async def _researcher_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        output = await self._run_with_retry(
            run=run,
            agent=AgentName.researcher,
            action=lambda: self.researcher.run(ResearcherInput(prompt=state["prompt"], plan=state["plan"])),
            fallback=lambda: self._fallback_research(state["prompt"], state["plan"]),
        )
        run.research = output
        return {**state, "run": run, "research": output}

    async def _executor_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        output = await self._run_with_retry(
            run=run,
            agent=AgentName.executor,
            action=lambda: self.executor.run(
                ExecutorInput(prompt=state["prompt"], plan=state["plan"], research=state["research"])
            ),
            fallback=lambda: self._fallback_execution(state["plan"], state["research"]),
        )
        run.execution = output
        return {**state, "run": run, "execution": output}

    async def _reviewer_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        output = await self._run_with_retry(
            run=run,
            agent=AgentName.reviewer,
            action=lambda: self.reviewer.run(
                ReviewerInput(
                    prompt=state["prompt"],
                    plan=state["plan"],
                    research=state["research"],
                    execution=state["execution"],
                )
            ),
            fallback=lambda: self._fallback_review(),
        )
        run.review = output
        return {**state, "run": run, "review": output}

    async def _composer_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        output = await self._run_with_retry(
            run=run,
            agent=AgentName.composer,
            action=lambda: self.composer.run(
                ComposerInput(
                    prompt=state["prompt"],
                    plan=state["plan"],
                    research=state["research"],
                    execution=state["execution"],
                    review=state["review"],
                )
            ),
            fallback=lambda: self._fallback_final(state["prompt"], state["plan"], state["research"], state["execution"], state["review"]),
        )
        run.final = output
        return {**state, "run": run, "final": output}

    async def _run_with_retry(self, *, run: RunRecord, agent: AgentName, action: Callable[[], Any], fallback: Callable[[], Any]):
        self._mark_status(run, agent, AgentStatus.running, f"{agent.value.title()} agent started")
        self.store.save_run(run)
        attempts = 0

        while True:
            try:
                result = await action()
                self._mark_status(run, agent, AgentStatus.completed, f"{agent.value.title()} agent completed", result)
                self.store.save_run(run)
                return result
            except Exception as exc:  # noqa: BLE001
                attempts += 1
                if attempts > 2:
                    result = fallback()
                    self._mark_status(
                        run,
                        agent,
                        AgentStatus.completed,
                        f"{agent.value.title()} used fallback after retries",
                        result,
                    )
                    self._append_event(run, "agent.fallback", f"{agent.value.title()} fallback used", agent, {"error": str(exc)})
                    self.store.save_run(run)
                    return result
                self._append_event(run, "agent.retry", f"Retrying {agent.value}", agent, {"attempt": attempts, "error": str(exc)})
                self.store.save_run(run)
                await asyncio.sleep(0.4 * attempts)

    def _mark_status(self, run: RunRecord, agent_name: AgentName, status: AgentStatus, message: str, detail: Any | None = None) -> None:
        for agent in run.agents:
            if agent.name == agent_name:
                agent.status = status
                if status == AgentStatus.running and not agent.started_at:
                    agent.started_at = now()
                if status in {AgentStatus.completed, AgentStatus.error}:
                    agent.completed_at = now()
                if detail is not None:
                    payload = detail.model_dump(mode="json") if hasattr(detail, "model_dump") else detail
                    agent.detail = payload
                    agent.output_preview = self._preview(payload)
                elif message:
                    agent.output_preview = message
                break
        self._append_event(run, "agent.status", message, agent_name, {"status": status.value})
        self._touch(run)

    def _append_event(
        self,
        run: RunRecord,
        event_type: str,
        message: str,
        agent: AgentName | None = None,
        payload: dict[str, Any] | None = None,
    ) -> None:
        run.events.append(WorkflowEvent(run_id=run.id, type=event_type, message=message, agent=agent, payload=payload))
        self._touch(run)

    def _touch(self, run: RunRecord) -> None:
        run.updated_at = now()

    def _preview(self, payload: Any) -> str:
        text = str(payload)
        return text[:180] + ("..." if len(text) > 180 else "")

    def _sse(self, event_name: str, data: dict[str, Any]) -> str:
        import json

        return f"event: {event_name}\ndata: {json.dumps(data, default=str)}\n\n"

    def _fallback_plan(self, prompt: str) -> PlannerOutput:
        return PlannerOutput(
            objective=prompt,
            deliverable_type="Structured multi-agent deliverable",
            execution_strategy="Analyze the task, gather context, create a draft, review quality, and compose a final response.",
            steps=[
                PlanStep(
                    id="step-1",
                    title="Clarify objective",
                    description="Translate the user prompt into a concrete outcome.",
                    owner="planner",
                    success_criteria="Objective is clear and scoped.",
                ),
                PlanStep(
                    id="step-2",
                    title="Gather context",
                    description="List relevant assumptions, risks, and decision inputs.",
                    owner="researcher",
                    success_criteria="Key context and constraints are captured.",
                ),
                PlanStep(
                    id="step-3",
                    title="Draft deliverable",
                    description="Create the main requested output in a structured format.",
                    owner="executor",
                    success_criteria="Draft is actionable and complete.",
                ),
                PlanStep(
                    id="step-4",
                    title="Review quality",
                    description="Check the draft for gaps and missing details.",
                    owner="reviewer",
                    success_criteria="Issues are identified or the draft is approved.",
                ),
            ],
        )

    def _fallback_research(self, prompt: str, plan: PlannerOutput) -> ResearchOutput:
        return ResearchOutput(
            summary=f"Research fallback generated from the prompt and plan for: {prompt}",
            findings=[
                {
                    "topic": "Objective framing",
                    "insight": "The response should emphasize practical structure over generic advice.",
                    "evidence": "Derived from the requested workflow and output format.",
                    "relevance": "Keeps the final deliverable useful and interview-ready.",
                },
                {
                    "topic": "Execution support",
                    "insight": f"The plan includes {len(plan.steps)} major steps that can anchor the deliverable.",
                    "evidence": "Taken from the planner output.",
                    "relevance": "Provides a visible reasoning path for the user.",
                },
            ],
            risks=["Live external research may be unavailable; assumptions should be labeled clearly."],
            assumptions=["The user wants a detailed, professional answer with visible task steps."],
        )

    def _fallback_execution(self, plan: PlannerOutput, research: ResearchOutput) -> ExecutionOutput:
        sections = [
            {
                "title": "Objective",
                "content": plan.objective,
            },
            {
                "title": "Execution Plan",
                "content": "\n".join(f"{index + 1}. {step.title}: {step.description}" for index, step in enumerate(plan.steps)),
            },
            {
                "title": "Research Summary",
                "content": research.summary,
            },
        ]
        return ExecutionOutput(
            summary="Structured draft created from plan and research fallback data.",
            sections=sections,
            recommended_actions=[
                "Validate assumptions against domain-specific requirements.",
                "Expand the draft with stakeholder-specific details if needed.",
            ],
        )

    def _fallback_review(self) -> ReviewOutput:
        return ReviewOutput(
            approved=True,
            score=8,
            strengths=["Clear structure", "Actionable sections", "Visible workflow steps"],
            gaps=["Could benefit from live domain research when available"],
            revision_requests=[],
        )

    def _fallback_final(
        self,
        prompt: str,
        plan: PlannerOutput,
        research: ResearchOutput,
        execution: ExecutionOutput,
        review: ReviewOutput,
    ) -> FinalOutput:
        review_notes = [*review.strengths, *review.gaps, *review.revision_requests]
        body = [
            f"Objective: {prompt}",
            "",
            "Plan:",
            *[f"- {step.title}: {step.description}" for step in plan.steps],
            "",
            f"Research Summary: {research.summary}",
            "",
            "Execution Output:",
            *[f"- {section.title}: {section.content}" for section in execution.sections],
        ]
        return FinalOutput(
            title="Multi-Agent Deliverable",
            objective=plan.objective,
            plan=plan.steps,
            research_summary=research.summary,
            execution_output=execution.sections,
            review_notes=review_notes,
            final_deliverable="\n".join(body),
        )
