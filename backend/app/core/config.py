"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "QA-Arena API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: Optional[str] = (
        "postgresql://qa_arena_user:qa_arena_password@localhost:5432/qa_arena"
    )

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # LLM / AI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-5-mini"  # 기본 모델 (비용 효율적)
    OPENAI_REASONING_MODEL: str = "gpt-5.1"  # Reasoning 모델 (문제 생성용)
    OPENAI_REASONING_EFFORT: str = "high"  # Reasoning effort: none, low, medium, high

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
