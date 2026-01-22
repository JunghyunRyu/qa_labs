"""QA-Arena FastAPI application."""

import logging
import uuid

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.core.logging import setup_logging
from app.core.security_utils import sanitize_log_message, sanitize_url_path
from app.core.sentry import init_sentry
from app.api import problems, submissions, admin, health, auth, users, ai, test_quality, progress, plans, tokens, feedback, daily_bounty, ai_verifier
from app.middleware.anonymous import AnonymousIDMiddleware
from app.middleware.request_context import RequestContextMiddleware, get_request_id

# Sentry 초기화 (가장 먼저 실행)
init_sentry()

# 로깅 설정
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Rate Limiter 설정
app.state.limiter = limiter


# Rate Limit 초과 예외 핸들러
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Rate limit 초과 시 일관된 형식으로 응답."""
    logger.warning(
        sanitize_log_message(
            f"Rate limit exceeded: {request.client.host} - "
            f"Path: {sanitize_url_path(str(request.url))} - Limit: {exc.detail}"
        )
    )
    return JSONResponse(
        status_code=429,
        content={
            "detail": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
            "type": "rate_limit_exceeded",
            "retry_after": str(exc.detail),
        },
        headers={"Retry-After": "60"},
    )


# 전역 예외 핸들러
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP 예외 핸들러."""
    logger.warning(
        sanitize_log_message(
            f"HTTP {exc.status_code} error: {exc.detail} - "
            f"Path: {sanitize_url_path(str(request.url))}"
        )
    )

    # 에러 타입 결정
    error_type = "http_error"
    if exc.status_code == 404:
        error_type = "not_found"
    elif exc.status_code == 400:
        error_type = "bad_request"
    elif exc.status_code == 401:
        error_type = "unauthorized"
    elif exc.status_code == 403:
        error_type = "forbidden"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "type": error_type,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """요청 검증 예외 핸들러."""
    logger.warning(
        sanitize_log_message(
            f"Validation error: {exc.errors()} - "
            f"Path: {sanitize_url_path(str(request.url))}"
        )
    )

    # 프로덕션에서는 상세 정보 숨김
    if settings.DEBUG:
        content = {
            "detail": exc.errors(),
            "type": "validation_error",
        }
    else:
        # 프로덕션: 필드 위치만 반환, 상세 에러 메시지 숨김
        fields = []
        for err in exc.errors():
            loc = err.get("loc", [])
            if loc:
                fields.append(loc[-1] if len(loc) > 0 else "unknown")
        content = {
            "detail": "요청 형식이 올바르지 않습니다.",
            "type": "validation_error",
            "fields": fields,
        }

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=content,
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """일반 예외 핸들러."""
    import sentry_sdk

    # 에러 ID 생성
    error_id = str(uuid.uuid4())[:8]
    # Request ID 가져오기
    request_id = get_request_id() or getattr(request.state, "request_id", "-")

    # Sentry에 에러 전송
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("error_id", error_id)
        scope.set_tag("request_id", request_id)
        scope.set_context("request", {
            "method": request.method,
            "path": request.url.path,
        })
        sentry_sdk.capture_exception(exc)

    # 로깅 (민감정보 마스킹 적용)
    sanitized_path = sanitize_url_path(str(request.url))
    sanitized_error = sanitize_log_message(str(exc))

    logger.error(
        f"[{request_id}] Unhandled exception [ID: {error_id}]: "
        f"{type(exc).__name__}: {sanitized_error} - Path: {sanitized_path}",
        exc_info=True,
    )

    # 프로덕션에서는 일반적인 메시지만 반환
    detail_message = "Internal server error. Please try again later."
    if settings.DEBUG:
        detail_message = f"{type(exc).__name__}: {str(exc)}"
    else:
        detail_message = f"Internal server error (Error ID: {error_id}). Please try again later."

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": detail_message,
            "type": "internal_server_error",
            "error_id": error_id,
        },
    )


# 요청 로깅 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """요청/응답 로깅 미들웨어."""
    import time

    start_time = time.time()
    # Request ID 가져오기 (RequestContextMiddleware에서 설정됨)
    request_id = get_request_id() or getattr(request.state, "request_id", "-")

    # URL 경로만 로깅 (쿼리 파라미터 제외하여 민감정보 노출 방지)
    logger.info(f"[{request_id}] Request: {request.method} {request.url.path}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"[{request_id}] Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Time: {process_time:.3f}s"
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        # 에러 메시지 마스킹
        logger.error(
            f"[{request_id}] Request failed: {request.method} {request.url.path} - "
            f"Error: {sanitize_log_message(str(e))} - Time: {process_time:.3f}s",
            exc_info=True,
        )
        raise

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anonymous ID middleware for guest users
app.add_middleware(AnonymousIDMiddleware)

# Request context middleware for request tracing
app.add_middleware(RequestContextMiddleware)

# Include routers
app.include_router(
    problems.router,
    prefix="/api/v1/problems",
    tags=["problems"],
)

app.include_router(
    submissions.router,
    prefix="/api/v1/submissions",
    tags=["submissions"],
)

app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["admin"],
)

app.include_router(
    health.router,
    prefix="/healthz",
    tags=["health"],
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["auth"],
)

app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["users"],
)

app.include_router(
    ai.router,
    prefix="/api/v1/ai",
    tags=["ai"],
)

app.include_router(
    test_quality.router,
    prefix="/api/v1/test-quality",
    tags=["test-quality"],
)

app.include_router(
    progress.router,
    prefix="/api/v1",
    tags=["progress"],
)

app.include_router(
    plans.router,
    prefix="/api/v1",
    tags=["plans"],
)

app.include_router(
    tokens.router,
    prefix="/api/v1",
    tags=["tokens"],
)

app.include_router(
    feedback.router,
    prefix="/api/v1/feedback",
    tags=["feedback"],
)

app.include_router(
    daily_bounty.router,
    prefix="/api/v1",
    tags=["daily-bounty"],
)

app.include_router(
    ai_verifier.router,
    prefix="/api/v1/ai-verifier",
    tags=["ai-verifier"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Hello World",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
