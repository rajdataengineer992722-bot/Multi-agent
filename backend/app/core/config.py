from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Multi-Agent AI Studio"
    api_prefix: str = "/api"
    openai_api_key: str = ""
    xai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    xai_model: str = "grok-4.20-reasoning"
    openai_base_url: str = "https://api.openai.com/v1"
    xai_base_url: str = "https://api.x.ai/v1"
    llm_provider: str = "openai"
    llm_timeout_seconds: float = 60.0
    llm_max_retries: int = 2
    storage_path: str = ".data/runs.json"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
