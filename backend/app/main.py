"""QA-Arena FastAPI application."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.api import problems, submissions, admin

# 로깅 설정
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# 전역 예외 핸들러
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP 예외 핸들러."""
    logger.warning(
        f"HTTP {exc.status_code} error: {exc.detail} - Path: {request.url.path}"
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
        f"Validation error: {exc.errors()} - Path: {request.url.path}"
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "type": "validation_error",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """일반 예외 핸들러."""
    # 프로덕션에서는 상세한 에러 정보를 로그에만 기록
    error_id = None
    if not settings.DEBUG:
        import uuid
        error_id = str(uuid.uuid4())[:8]
        logger.error(
            f"Unhandled exception [ID: {error_id}]: {type(exc).__name__}: {str(exc)} - "
            f"Path: {request.url.path}",
            exc_info=True,
        )
    else:
        # DEBUG 모드에서는 상세 정보 로깅
        logger.error(
            f"Unhandled exception: {type(exc).__name__}: {str(exc)} - "
            f"Path: {request.url.path}",
            exc_info=True,
        )
    
    # 프로덕션에서는 일반적인 메시지만 반환
    detail_message = "Internal server error. Please try again later."
    if settings.DEBUG:
        detail_message = f"{type(exc).__name__}: {str(exc)}"
    elif error_id:
        detail_message = f"Internal server error (Error ID: {error_id}). Please try again later."
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": detail_message,
            "type": "internal_server_error",
        },
    )


# 요청 로깅 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """요청/응답 로깅 미들웨어."""
    import time

    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Time: {process_time:.3f}s"
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} - "
            f"Error: {e} - Time: {process_time:.3f}s",
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
