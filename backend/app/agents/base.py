from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from pydantic import BaseModel

from app.services.llm import LLMService

InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT", bound=BaseModel)


class BaseAgent(ABC, Generic[InputT, OutputT]):
    name: str
    role: str

    def __init__(self, llm: LLMService) -> None:
        self.llm = llm

    @abstractmethod
    async def run(self, data: InputT) -> OutputT:
        raise NotImplementedError
