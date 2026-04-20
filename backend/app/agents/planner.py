from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.prompts import PLANNER_PROMPT
from app.models.schemas import PlannerOutput
from app.services.llm import LLMService


class PlannerAgent(BaseAgent[str, PlannerOutput]):
    name = "planner"
    role = "Breaks the user task into a structured execution plan."

    SYSTEM_PROMPT = PLANNER_PROMPT

    def __init__(self, llm: LLMService) -> None:
        super().__init__(llm)

    async def run(self, data: str) -> PlannerOutput:
        return await self.llm.complete_json(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=f"User request:\n{data}",
            response_model=PlannerOutput,
        )
