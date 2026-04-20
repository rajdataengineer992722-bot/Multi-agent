from __future__ import annotations

from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.prompts import EXECUTOR_PROMPT
from app.models.schemas import ExecutionOutput, PlannerOutput, ResearchOutput
from app.services.llm import LLMService


class ExecutorInput(BaseModel):
    prompt: str
    plan: PlannerOutput
    research: ResearchOutput


class ExecutorAgent(BaseAgent[ExecutorInput, ExecutionOutput]):
    name = "executor"
    role = "Builds the main deliverable from the plan and research."

    SYSTEM_PROMPT = EXECUTOR_PROMPT

    def __init__(self, llm: LLMService) -> None:
        super().__init__(llm)

    async def run(self, data: ExecutorInput) -> ExecutionOutput:
        return await self.llm.complete_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"User request:\n{data.prompt}\n\n"
                f"Plan:\n{data.plan.model_dump_json(indent=2)}\n\n"
                f"Research:\n{data.research.model_dump_json(indent=2)}"
            ),
            response_model=ExecutionOutput,
        )
