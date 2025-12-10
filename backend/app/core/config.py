"""Application configuration."""

import json
from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import field_validator


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
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from environment variable."""
        if isinstance(v, str):
            # Try to parse as JSON first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            # If not JSON, split by comma
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # LLM / AI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-5-mini"  # 기본 모델 (비용 효율적)
    OPENAI_REASONING_MODEL: str = "gpt-5.1"  # Reasoning 모델 (문제 생성용)
    OPENAI_REASONING_EFFORT: str = "high"  # Reasoning effort: none, low, medium, high

    # Worker Monitoring
    WORKER_MONITOR_ENABLED: bool = True
    WORKER_MONITOR_INTERVAL_SECONDS: int = 30
    WORKER_DOWN_THRESHOLD: int = 3  # 연속 N회 미응답시 Down 판정
    WORKER_HEARTBEAT_TIMEOUT: int = 10  # Inspect 타임아웃 (초)

    # Slack Alert
    SLACK_WEBHOOK_URL: Optional[str] = None
    SLACK_ALERT_ENABLED: bool = False
    SLACK_ALERT_ON_RECOVERY: bool = True  # 복구 시 알림 여부

    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
