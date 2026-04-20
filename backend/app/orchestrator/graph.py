from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any, Callable, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

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
    OrchestrationRuntime,
    PlanStep,
    PlannerOutput,
    ResearchOutput,
    ReviewOutput,
    RunRecord,
    RunStatus,
    WorkflowEvent,
    WorkflowPhase,
)
from app.services.llm import LLMService
from app.storage.history import HistoryStore


def now() -> datetime:
    return datetime.now(timezone.utc)


class GraphState(TypedDict, total=False):
    prompt: str
    run: RunRecord
    runtime: OrchestrationRuntime
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
        builder.add_node("bootstrap", self._bootstrap_node)
        builder.add_node("planner", self._planner_node)
        builder.add_node("researcher", self._researcher_node)
        builder.add_node("executor", self._executor_node)
        builder.add_node("reviewer", self._reviewer_node)
        builder.add_node("composer", self._composer_node)

        builder.add_edge(START, "bootstrap")
        builder.add_edge("bootstrap", "planner")
        builder.add_edge("planner", "researcher")
        builder.add_edge("researcher", "executor")
        builder.add_edge("executor", "reviewer")
        builder.add_conditional_edges(
            "reviewer",
            self._route_after_review,
            {
                "executor": "executor",
                "composer": "composer",
            },
        )
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

    def _initial_state(self, prompt: str) -> GraphState:
        run = RunRecord(prompt=prompt, status=RunStatus.running, agents=self._initial_agents())
        self._touch(run)
        self.store.save_run(run)
        return {
            "prompt": prompt,
            "run": run,
            "runtime": run.runtime.model_copy(deep=True),
        }

    async def stream_run(self, prompt: str) -> AsyncGenerator[str, None]:
        state = self._initial_state(prompt)
        run = state["run"]
        yield self._sse("run.started", {"run": run.model_dump(mode="json")})

        try:
            self._mark_status(run, AgentName.orchestrator, AgentStatus.running, "Workflow started")
            self.store.save_run(run)
            yield self._sse("agent.updated", {"run": run.model_dump(mode="json")})

            async for chunk in self.graph.astream(state, stream_mode="updates"):
                updated_run = self._extract_run_from_chunk(chunk) or run
                self.store.save_run(updated_run)
                yield self._sse("agent.updated", {"run": updated_run.model_dump(mode="json")})

            completed_run = self.store.get_run(run.id) or run
            self._finalize_run(completed_run)
            yield self._sse("run.completed", {"run": completed_run.model_dump(mode="json")})
        except Exception as exc:  # noqa: BLE001
            run.status = RunStatus.error
            run.error = str(exc)
            run.runtime.phase = WorkflowPhase.error
            run.runtime.last_error = str(exc)
            run.updated_at = now()
            self._mark_status(run, AgentName.orchestrator, AgentStatus.error, str(exc))
            self.store.save_run(run)
            yield self._sse("run.error", {"run": run.model_dump(mode="json"), "error": str(exc)})

        yield "event: done\ndata: {}\n\n"

    async def run_once(self, prompt: str) -> RunRecord:
        state = self._initial_state(prompt)
        run = state["run"]
        self._mark_status(run, AgentName.orchestrator, AgentStatus.running, "Workflow started")
        self.store.save_run(run)
        final_state = await self.graph.ainvoke(state)
        completed_run = final_state.get("run", run)
        self._finalize_run(completed_run)
        return completed_run

    async def _bootstrap_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        runtime = state["runtime"]
        runtime.active_node = "bootstrap"
        runtime.current_agent = AgentName.orchestrator
        runtime.phase = WorkflowPhase.planning
        run.runtime = runtime
        self._append_event(run, "workflow.bootstrap", "Initialized structured workflow state", AgentName.orchestrator)
        return {**state, "run": run, "runtime": runtime}

    async def _planner_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        runtime = state["runtime"]
        runtime.active_node = "planner"
        runtime.current_agent = AgentName.planner
        runtime.phase = WorkflowPhase.planning

        output = await self._run_with_retry(
            run=run,
            runtime=runtime,
            agent=AgentName.planner,
            action=lambda: self.planner.run(state["prompt"]),
            fallback=lambda: self._fallback_plan(state["prompt"]),
        )
        run.plan = output
        return self._state_update(state, run=run, runtime=runtime, plan=output)

    async def _researcher_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        runtime = state["runtime"]
        runtime.active_node = "researcher"
        runtime.current_agent = AgentName.researcher
        runtime.phase = WorkflowPhase.research

        output = await self._run_with_retry(
            run=run,
            runtime=runtime,
            agent=AgentName.researcher,
            action=lambda: self.researcher.run(ResearcherInput(prompt=state["prompt"], plan=state["plan"])),
            fallback=lambda: self._fallback_research(state["prompt"], state["plan"]),
        )
        run.research = output
        return self._state_update(state, run=run, runtime=runtime, research=output)

    async def _executor_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        runtime = state["runtime"]
        runtime.active_node = "executor"
        runtime.current_agent = AgentName.executor
        runtime.phase = WorkflowPhase.revision if runtime.needs_revision else WorkflowPhase.execution
        runtime.execution_iterations += 1

        output = await self._run_with_retry(
            run=run,
            runtime=runtime,
            agent=AgentName.executor,
            action=lambda: self.executor.run(
                ExecutorInput(
                    prompt=state["prompt"],
                    plan=state["plan"],
                    research=state["research"],
                    review_feedback=runtime.revision_notes,
                    previous_execution=state.get("execution"),
                )
            ),
            fallback=lambda: self._fallback_execution(state["plan"], state["research"]),
        )
        run.execution = output
        return self._state_update(state, run=run, runtime=runtime, execution=output)

    async def _reviewer_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        runtime = state["runtime"]
        runtime.active_node = "reviewer"
        runtime.current_agent = AgentName.reviewer
        runtime.phase = WorkflowPhase.review
        runtime.review_iterations += 1

        output = await self._run_with_retry(
            run=run,
            runtime=runtime,
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

        runtime.needs_revision = not output.approved and bool(output.revision_requests)
        runtime.revision_notes = output.revision_requests
        run.review = output
        self._append_event(
            run,
            "review.decision",
            "Reviewer requested another execution pass" if runtime.needs_revision else "Reviewer approved output for composition",
            AgentName.reviewer,
            {
                "approved": output.approved,
                "review_iterations": runtime.review_iterations,
                "revision_requests": output.revision_requests,
            },
        )
        return self._state_update(state, run=run, runtime=runtime, review=output)

    async def _composer_node(self, state: GraphState) -> GraphState:
        run = state["run"]
        runtime = state["runtime"]
        runtime.active_node = "composer"
        runtime.current_agent = AgentName.composer
        runtime.phase = WorkflowPhase.composition
        runtime.needs_revision = False

        output = await self._run_with_retry(
            run=run,
            runtime=runtime,
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
            fallback=lambda: self._fallback_final(
                state["prompt"],
                state["plan"],
                state["research"],
                state["execution"],
                state["review"],
            ),
        )
        run.final = output
        runtime.phase = WorkflowPhase.completed
        return self._state_update(state, run=run, runtime=runtime, final=output)

    def _route_after_review(self, state: GraphState) -> Literal["executor", "composer"]:
        runtime = state["runtime"]
        if runtime.needs_revision and runtime.review_iterations <= runtime.max_review_loops:
            return "executor"
        return "composer"

    async def _run_with_retry(
        self,
        *,
        run: RunRecord,
        runtime: OrchestrationRuntime,
        agent: AgentName,
        action: Callable[[], Any],
        fallback: Callable[[], Any],
    ):
        self._mark_status(run, agent, AgentStatus.running, f"{agent.value.title()} agent started")
        run.runtime = runtime
        self.store.save_run(run)
        attempts = 0

        while True:
            try:
                result = await action()
                self._mark_status(run, agent, AgentStatus.completed, f"{agent.value.title()} agent completed", result)
                runtime.completed_nodes.append(agent.value)
                runtime.last_error = None
                run.runtime = runtime
                self.store.save_run(run)
                return result
            except Exception as exc:  # noqa: BLE001
                attempts += 1
                runtime.last_error = str(exc)
                if attempts > 2:
                    result = fallback()
                    self._mark_status(
                        run,
                        agent,
                        AgentStatus.completed,
                        f"{agent.value.title()} used fallback after retries",
                        result,
                    )
                    runtime.completed_nodes.append(f"{agent.value}:fallback")
                    run.runtime = runtime
                    self._append_event(
                        run,
                        "agent.fallback",
                        f"{agent.value.title()} fallback used",
                        agent,
                        {"error": str(exc), "phase": runtime.phase.value},
                    )
                    self.store.save_run(run)
                    return result
                self._append_event(
                    run,
                    "agent.retry",
                    f"Retrying {agent.value}",
                    agent,
                    {"attempt": attempts, "error": str(exc), "phase": runtime.phase.value},
                )
                run.runtime = runtime
                self.store.save_run(run)
                await asyncio.sleep(0.4 * attempts)

    def _state_update(self, state: GraphState, **updates: Any) -> GraphState:
        merged = {**state, **updates}
        run: RunRecord = merged["run"]
        runtime: OrchestrationRuntime = merged["runtime"]
        run.runtime = runtime
        self._touch(run)
        return merged

    def _finalize_run(self, run: RunRecord) -> None:
        run.status = RunStatus.completed
        run.updated_at = now()
        run.runtime.phase = WorkflowPhase.completed
        run.runtime.current_agent = AgentName.orchestrator
        run.runtime.active_node = "completed"
        self._mark_status(run, AgentName.orchestrator, AgentStatus.completed, "Workflow completed")
        self.store.save_run(run)

    def _extract_run_from_chunk(self, chunk: dict[str, Any]) -> RunRecord | None:
        for payload in chunk.values():
            if isinstance(payload, dict) and "run" in payload:
                return payload["run"]
        return None

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
