from __future__ import annotations

from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.prompts import COMPOSER_PROMPT
from app.models.schemas import ExecutionOutput, FinalOutput, PlannerOutput, ResearchOutput, ReviewOutput
from app.services.llm import LLMService


class ComposerInput(BaseModel):
    prompt: str
    plan: PlannerOutput
    research: ResearchOutput
    execution: ExecutionOutput
    review: ReviewOutput


class ComposerAgent(BaseAgent[ComposerInput, FinalOutput]):
    name = "composer"
    role = "Builds a polished final response from all agent outputs."

    SYSTEM_PROMPT = COMPOSER_PROMPT

    def __init__(self, llm: LLMService) -> None:
        super().__init__(llm)

    async def run(self, data: ComposerInput) -> FinalOutput:
        return await self.llm.complete_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"User request:\n{data.prompt}\n\n"
                f"Plan:\n{data.plan.model_dump_json(indent=2)}\n\n"
                f"Research:\n{data.research.model_dump_json(indent=2)}\n\n"
                f"Execution:\n{data.execution.model_dump_json(indent=2)}\n\n"
                f"Review:\n{data.review.model_dump_json(indent=2)}"
            ),
            response_model=FinalOutput,
        )
