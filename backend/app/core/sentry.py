"""Sentry error tracking configuration."""

import logging
from typing import Optional

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from app.core.config import settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialize Sentry SDK for FastAPI and Celery."""
    if not settings.SENTRY_DSN:
        logger.info("Sentry DSN not configured, skipping initialization")
        return

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,

        # 성능 모니터링
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,

        # 프로파일링 (성능 분석)
        profiles_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 0.0,

        # 통합 설정
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            CeleryIntegration(monitor_beat_tasks=True),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR,
            ),
        ],

        # 민감한 데이터 필터링
        send_default_pii=False,

        # 에러 필터링
        before_send=_before_send,

        # 무시할 에러
        ignore_errors=[
            # 의도적인 중단
            KeyboardInterrupt,
            SystemExit,
        ],

        # 디버그 모드 (개발 환경에서만)
        debug=settings.DEBUG,
    )

    logger.info(f"Sentry initialized for environment: {settings.ENVIRONMENT}")


def _before_send(event: dict, hint: dict) -> Optional[dict]:
    """
    이벤트 전송 전 필터링.
    민감한 정보 제거 및 불필요한 에러 필터링.
    """
    # 특정 예외 무시
    if "exc_info" in hint:
        exc_type, exc_value, _ = hint["exc_info"]

        # Rate limit 에러는 경고로 처리 (Sentry에 보내지 않음)
        if exc_type.__name__ == "RateLimitExceeded":
            return None

        # 404 에러는 보내지 않음
        if exc_type.__name__ == "HTTPException":
            if hasattr(exc_value, "status_code") and exc_value.status_code == 404:
                return None

    # request 데이터에서 민감 정보 제거
    if "request" in event:
        request = event["request"]

        # 쿠키 제거
        if "cookies" in request:
            request["cookies"] = "[Filtered]"

        # Authorization 헤더 마스킹
        if "headers" in request:
            headers = request["headers"]
            for key in ["Authorization", "Cookie", "X-Admin-Secret"]:
                if key.lower() in [h.lower() for h in headers]:
                    headers[key] = "[Filtered]"

    return event
