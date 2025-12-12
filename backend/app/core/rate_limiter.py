"""Rate limiting configuration using slowapi."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxy headers.

    Nginx sets X-Real-IP header with the actual client IP.
    Falls back to X-Forwarded-For or direct remote address.
    """
    # X-Real-IP header (set by Nginx)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # X-Forwarded-For header (first IP in the chain)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    # Fallback to default remote address
    return get_remote_address(request)


def get_rate_limit_redis_url() -> str:
    """Get Redis URL for rate limiting (separate DB from Celery)."""
    base_url = settings.REDIS_URL.rsplit("/", 1)[0]
    return f"{base_url}/{settings.RATE_LIMIT_REDIS_DB}"


# Create limiter instance
limiter = Limiter(
    key_func=get_client_ip,
    storage_uri=get_rate_limit_redis_url(),
    default_limits=[settings.RATE_LIMIT_DEFAULT],
)
