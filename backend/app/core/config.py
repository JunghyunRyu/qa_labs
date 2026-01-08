"""Application configuration."""

import json
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
from pydantic import field_validator


def get_env_file_path() -> str:
    """
    .env 파일 경로를 결정합니다.
    1. 환경변수 ENV_FILE이 설정되어 있으면 해당 경로 사용
    2. Docker 환경(DOCKER_CONTAINER=true)이면 .env 파일 사용 안함
    3. 그 외: 프로젝트 루트의 .env 파일 사용
    """
    # 환경변수로 명시적 지정
    if os.getenv("ENV_FILE"):
        return os.getenv("ENV_FILE")

    # Docker 환경에서는 환경변수가 직접 주입되므로 .env 불필요
    if os.getenv("DOCKER_CONTAINER") == "true":
        return ""

    # 로컬 개발: 프로젝트 루트의 .env 파일 찾기
    current = Path(__file__).resolve()
    # backend/app/core/config.py -> 3단계 위가 프로젝트 루트
    project_root = current.parent.parent.parent.parent
    env_file = project_root / ".env"

    if env_file.exists():
        return str(env_file)

    # 폴백: 현재 디렉토리의 .env
    return ".env"


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
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
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

    # LLM / AI - GPT-5.2 업그레이드 (2024.12)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-5.2"  # 기본 모델 (gpt-5-mini → gpt-5.2)
    OPENAI_REASONING_MODEL: str = "gpt-5.2"  # Reasoning 모델 (gpt-5.1 → gpt-5.2)
    OPENAI_REASONING_EFFORT: str = "medium"  # Reasoning effort: none, low, medium, high, xhigh
    OPENAI_DEFAULT_VERBOSITY: str = "medium"  # GPT-5.2 verbosity: low, medium, high
    OPENAI_COMPACTION_ENABLED: bool = True  # GPT-5.2 컨텍스트 압축 기능

    # Worker Monitoring
    WORKER_MONITOR_ENABLED: bool = True
    WORKER_MONITOR_INTERVAL_SECONDS: int = 30
    WORKER_DOWN_THRESHOLD: int = 3  # 연속 N회 미응답시 Down 판정
    WORKER_HEARTBEAT_TIMEOUT: int = 10  # Inspect 타임아웃 (초)

    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REDIS_DB: int = 2  # Celery uses DB 0-1, rate limiting uses DB 2
    RATE_LIMIT_DEFAULT: str = "100/minute"  # Default rate limit for all endpoints
    RATE_LIMIT_SUBMISSIONS: str = "5/minute"  # Submissions endpoint (legacy, use GUEST/MEMBER)
    RATE_LIMIT_GUEST_SUBMISSIONS: str = "5/minute"  # Guest submissions per minute
    RATE_LIMIT_GUEST_SUBMISSIONS_DAILY: str = "30/day"  # Guest submissions per day
    RATE_LIMIT_MEMBER_SUBMISSIONS: str = "10/minute"  # Member submissions per minute
    RATE_LIMIT_MEMBER_SUBMISSIONS_DAILY: str = "200/day"  # Member submissions per day
    RATE_LIMIT_ADMIN: str = "2/minute"  # Admin endpoints (AI generation)
    RATE_LIMIT_ADMIN_CREATE: str = "5/minute"  # Admin problem creation

    # AI Coach
    OPENAI_AI_COACH_MODEL: str = "gpt-4o-mini"  # AI Coach 전용 모델 (빠른 chat 모델)

    # AI Coach Rate Limiting
    RATE_LIMIT_AI_GUEST: str = "5/minute"  # Guest AI chat per minute
    RATE_LIMIT_AI_GUEST_DAILY: str = "30/day"  # Guest AI chat per day
    RATE_LIMIT_AI_MEMBER: str = "10/minute"  # Member AI chat per minute
    RATE_LIMIT_AI_MEMBER_DAILY: str = "200/day"  # Member AI chat per day

    # GitHub OAuth
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/github/callback"

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # JWT Settings
    JWT_SECRET_KEY: str = "change-this-secret-key-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie Settings
    COOKIE_DOMAIN: Optional[str] = None  # None for localhost, set for production
    COOKIE_SECURE: bool = False  # True in production (HTTPS only)
    COOKIE_SAMESITE: str = "lax"  # "strict", "lax", or "none"

    # Admin API Security
    ADMIN_SECRET_KEY: Optional[str] = None  # .env에서 설정 필수 (Admin API 보호용)

    # Frontend URL (for OAuth callback redirect)
    FRONTEND_URL: Optional[str] = None  # e.g., "https://qa-arena.qalabs.kr"

    # Server-side execution (disabled in production for resource optimization)
    ALLOW_SERVER_EXECUTION: bool = False

    # Sentry Error Tracking
    SENTRY_DSN: Optional[str] = None  # Sentry DSN (None이면 비활성화)
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1  # 성능 모니터링 샘플링 비율 (프로덕션: 0.1)

    model_config = SettingsConfigDict(
        env_file=get_env_file_path(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # .env에 정의되지 않은 추가 환경변수 무시
    )


settings = Settings()
