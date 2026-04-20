from __future__ import annotations

import json
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel

from app.core.config import get_settings

T = TypeVar("T", bound=BaseModel)


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _provider_config(self) -> tuple[str, str]:
        provider = self.settings.llm_provider.lower().strip()
        if provider == "xai":
            return self.settings.xai_api_key, self.settings.xai_base_url.rstrip("/")
        return self.settings.openai_api_key, self.settings.openai_base_url.rstrip("/")

    def _model_name(self) -> str:
        provider = self.settings.llm_provider.lower().strip()
        if provider == "xai":
            return self.settings.xai_model
        return self.settings.openai_model

    async def complete_json(self, *, system_prompt: str, user_prompt: str, response_model: type[T]) -> T:
        api_key, base_url = self._provider_config()
        if not api_key:
            provider = self.settings.llm_provider.upper()
            raise RuntimeError(f"{provider}_API_KEY is not configured.")

        payload = {
            "model": self._model_name(),
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]

        parsed: Any = json.loads(content)
        return response_model.model_validate(parsed)
