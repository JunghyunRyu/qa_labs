"""Sentry error tracking configuration."""

import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Sentry SDK는 조건부로 import
_sentry_initialized = False


def init_sentry() -> None:
    """
    Initialize Sentry SDK for error tracking.

    Should be called early in application startup, before other imports.
    """
    global _sentry_initialized

    if _sentry_initialized:
        return

    if not settings.SENTRY_ENABLED or not settings.SENTRY_DSN:
        logger.info("Sentry is disabled or DSN not configured")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        from sentry_sdk.integrations.redis import RedisIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
    except ImportError:
        logger.warning("sentry-sdk not installed, skipping Sentry initialization")
        return

    # 환경별 샘플링 비율 조정
    traces_sample_rate = settings.SENTRY_TRACES_SAMPLE_RATE
    profiles_sample_rate = settings.SENTRY_PROFILES_SAMPLE_RATE

    # Development 환경에서는 샘플링 비율 높임 (디버깅 목적)
    if settings.ENVIRONMENT == "development":
        traces_sample_rate = 1.0
        profiles_sample_rate = 0.5

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,  # development, staging, production
        release=f"qa-arena-backend@{settings.APP_VERSION}",

        # 통합 설정
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(transaction_style="endpoint"),
            CeleryIntegration(
                monitor_beat_tasks=True,  # Beat 스케줄 작업 모니터링
                propagate_traces=True,    # 분산 추적
            ),
            SqlalchemyIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=logging.INFO,        # 로깅 breadcrumb 최소 레벨
                event_level=logging.ERROR,  # 이벤트로 전송할 최소 레벨
            ),
        ],

        # 성능 모니터링
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,

        # 추가 설정
        send_default_pii=False,  # 개인정보 전송 비활성화
        attach_stacktrace=True,  # 모든 이벤트에 스택트레이스 포함
        max_breadcrumbs=50,      # breadcrumb 최대 개수

        # 민감한 데이터 필터링
        before_send=_filter_sensitive_data,
    )

    _sentry_initialized = True
    logger.info(
        f"Sentry initialized - Environment: {settings.ENVIRONMENT}, "
        f"Release: qa-arena-backend@{settings.APP_VERSION}"
    )


def _filter_sensitive_data(event, hint):
    """
    민감한 데이터를 필터링하는 before_send 핸들러.
    """
    # 특정 에러 타입 무시 (예: 사용자 입력 오류)
    if "exc_info" in hint:
        exc_type, exc_value, tb = hint["exc_info"]
        # RequestValidationError는 사용자 입력 오류이므로 무시
        if exc_type.__name__ == "RequestValidationError":
            return None

    # healthcheck 요청 에러 무시
    request_url = event.get("request", {}).get("url", "")
    if any(path in request_url for path in ["/health", "/healthz"]):
        return None

    # 요청 데이터에서 민감한 필드 제거
    if "request" in event and "data" in event["request"]:
        sensitive_fields = ["password", "token", "api_key", "secret", "authorization"]
        data = event["request"]["data"]
        if isinstance(data, dict):
            for field in sensitive_fields:
                if field in data:
                    data[field] = "[FILTERED]"

    return event


def capture_exception_with_context(
    exception: Exception,
    context: Optional[dict] = None,
    tags: Optional[dict] = None,
) -> Optional[str]:
    """
    예외를 Sentry에 보고하고 이벤트 ID를 반환합니다.

    Args:
        exception: 보고할 예외
        context: 추가 컨텍스트 정보
        tags: 태그 정보

    Returns:
        Sentry 이벤트 ID (Sentry가 비활성화된 경우 None)
    """
    if not _sentry_initialized:
        return None

    try:
        import sentry_sdk

        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)
            if tags:
                for key, value in tags.items():
                    scope.set_tag(key, str(value))

            return sentry_sdk.capture_exception(exception)
    except Exception as e:
        logger.error(f"Failed to capture exception to Sentry: {e}")
        return None


def set_user_context(user_id: str, email: Optional[str] = None, username: Optional[str] = None) -> None:
    """
    현재 요청의 사용자 컨텍스트를 설정합니다.

    Args:
        user_id: 사용자 ID
        email: 사용자 이메일 (선택)
        username: 사용자명 (선택)
    """
    if not _sentry_initialized:
        return

    try:
        import sentry_sdk

        sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            "username": username,
        })
    except Exception as e:
        logger.error(f"Failed to set user context in Sentry: {e}")
