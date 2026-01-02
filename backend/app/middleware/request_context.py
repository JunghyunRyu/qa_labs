"""Request context middleware for request tracing."""

import uuid
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Context variables for request tracing
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


def get_request_id() -> str:
    """현재 요청의 Request ID를 반환합니다."""
    return request_id_var.get()


def get_correlation_id() -> str:
    """현재 요청의 Correlation ID를 반환합니다."""
    return correlation_id_var.get()


def set_correlation_id(correlation_id: str) -> None:
    """Correlation ID를 설정합니다 (Celery task에서 사용)."""
    correlation_id_var.set(correlation_id)


def generate_request_id() -> str:
    """8자리 고유 Request ID를 생성합니다."""
    return str(uuid.uuid4())[:8]


class RequestContextMiddleware(BaseHTTPMiddleware):
    """요청에 고유 ID를 부여하고 컨텍스트에 저장하는 미들웨어.

    - X-Request-ID 헤더가 있으면 해당 값 사용
    - 없으면 새로운 ID 생성
    - 응답 헤더에 X-Request-ID 포함
    """

    async def dispatch(self, request: Request, call_next):
        # 요청 헤더에서 Request ID 가져오기 (없으면 생성)
        request_id = request.headers.get("X-Request-ID", generate_request_id())

        # Context variable에 저장 (로깅에서 사용)
        request_id_var.set(request_id)

        # Correlation ID도 동일하게 설정 (Celery task로 전파될 예정)
        correlation_id_var.set(request_id)

        # request.state에도 저장 (다른 미들웨어/핸들러에서 접근 가능)
        request.state.request_id = request_id

        # 요청 처리
        response = await call_next(request)

        # 응답 헤더에 Request ID 추가
        response.headers["X-Request-ID"] = request_id

        return response
