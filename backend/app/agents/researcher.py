from __future__ import annotations

from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.prompts import RESEARCHER_PROMPT
from app.models.schemas import PlannerOutput, ResearchOutput
from app.services.llm import LLMService


class ResearcherInput(BaseModel):
    prompt: str
    plan: PlannerOutput


class ResearcherAgent(BaseAgent[ResearcherInput, ResearchOutput]):
    name = "researcher"
    role = "Collects helpful context, risks, evidence, and constraints."

    SYSTEM_PROMPT = RESEARCHER_PROMPT

    def __init__(self, llm: LLMService) -> None:
        super().__init__(llm)

    async def run(self, data: ResearcherInput) -> ResearchOutput:
        return await self.llm.complete_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"User request:\n{data.prompt}\n\n"
                f"Execution plan:\n{data.plan.model_dump_json(indent=2)}"
            ),
            response_model=ResearchOutput,
        )
