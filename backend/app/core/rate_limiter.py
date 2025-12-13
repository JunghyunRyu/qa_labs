"""Rate limiting configuration using slowapi."""

import logging
from typing import Optional, TYPE_CHECKING

from limits import parse
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings

if TYPE_CHECKING:
    from app.models.user import User

logger = logging.getLogger(__name__)


class SubmissionRateLimitExceeded(Exception):
    """Custom exception for submission rate limit exceeded."""

    def __init__(self, limit_str: str, retry_after: int):
        self.limit_str = limit_str
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded: {limit_str}")


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


def get_rate_limit_key(
    request: Request,
    user: Optional["User"] = None,
    anonymous_id: Optional[str] = None,
) -> str:
    """
    Generate rate limit key based on user type.

    Args:
        request: Starlette request object
        user: Authenticated user (if any)
        anonymous_id: Anonymous ID from cookie (for guests)

    Returns:
        Rate limit key string:
        - Member: "user:{user_id}"
        - Guest: "guest:{ip}:{anonymous_id}"
    """
    if user:
        return f"user:{user.id}"
    else:
        ip = get_client_ip(request)
        return f"guest:{ip}:{anonymous_id or 'unknown'}"


def check_submission_rate_limit(
    request: Request,
    user: Optional["User"] = None,
    anonymous_id: Optional[str] = None,
) -> None:
    """
    Check rate limit for submission based on user type.

    Checks both per-minute and per-day limits.

    Args:
        request: Starlette request object
        user: Authenticated user (if any)
        anonymous_id: Anonymous ID from cookie (for guests)

    Raises:
        RateLimitExceeded: If rate limit is exceeded
    """
    if not settings.RATE_LIMIT_ENABLED:
        return

    key = get_rate_limit_key(request, user, anonymous_id)

    if user:
        limits_to_check = [
            settings.RATE_LIMIT_MEMBER_SUBMISSIONS,
            settings.RATE_LIMIT_MEMBER_SUBMISSIONS_DAILY,
        ]
        user_type = "member"
    else:
        limits_to_check = [
            settings.RATE_LIMIT_GUEST_SUBMISSIONS,
            settings.RATE_LIMIT_GUEST_SUBMISSIONS_DAILY,
        ]
        user_type = "guest"

    storage = limiter._storage

    for limit_str in limits_to_check:
        limit_item = parse(limit_str)

        # Generate storage key for this specific limit
        # Format: LIMITER/{endpoint}/{limit}/{key}
        storage_key = f"LIMITER/submissions/{limit_str}/{key}"

        # Check current count
        current = storage.get(storage_key)
        if current >= limit_item.amount:
            retry_after = limit_item.get_expiry()
            logger.warning(
                f"[RATE_LIMIT_EXCEEDED] key={key} limit={limit_str} "
                f"current={current} user_type={user_type} retry_after={retry_after}"
            )
            raise SubmissionRateLimitExceeded(limit_str, retry_after)

    # Increment counters for all limits
    for limit_str in limits_to_check:
        limit_item = parse(limit_str)
        storage_key = f"LIMITER/submissions/{limit_str}/{key}"
        expiry = limit_item.get_expiry()
        storage.incr(storage_key, expiry)

    logger.debug(f"[RATE_LIMIT_PASSED] key={key} user_type={user_type}")


class AIRateLimitExceeded(Exception):
    """Custom exception for AI rate limit exceeded."""

    def __init__(self, limit_str: str, retry_after: int):
        self.limit_str = limit_str
        self.retry_after = retry_after
        super().__init__(f"AI rate limit exceeded: {limit_str}")


def check_ai_rate_limit(
    request: Request,
    user: Optional["User"] = None,
    anonymous_id: Optional[str] = None,
) -> None:
    """
    Check rate limit for AI chat based on user type.

    Checks both per-minute and per-day limits.

    Args:
        request: Starlette request object
        user: Authenticated user (if any)
        anonymous_id: Anonymous ID from cookie (for guests)

    Raises:
        AIRateLimitExceeded: If rate limit is exceeded
    """
    if not settings.RATE_LIMIT_ENABLED:
        return

    key = get_rate_limit_key(request, user, anonymous_id)

    if user:
        limits_to_check = [
            settings.RATE_LIMIT_AI_MEMBER,
            settings.RATE_LIMIT_AI_MEMBER_DAILY,
        ]
        user_type = "member"
    else:
        limits_to_check = [
            settings.RATE_LIMIT_AI_GUEST,
            settings.RATE_LIMIT_AI_GUEST_DAILY,
        ]
        user_type = "guest"

    storage = limiter._storage

    for limit_str in limits_to_check:
        limit_item = parse(limit_str)

        # Generate storage key for this specific limit
        # Format: LIMITER/{endpoint}/{limit}/{key}
        storage_key = f"LIMITER/ai_chat/{limit_str}/{key}"

        # Check current count
        current = storage.get(storage_key)
        if current >= limit_item.amount:
            retry_after = limit_item.get_expiry()
            logger.warning(
                f"[AI_RATE_LIMIT_EXCEEDED] key={key} limit={limit_str} "
                f"current={current} user_type={user_type} retry_after={retry_after}"
            )
            raise AIRateLimitExceeded(limit_str, retry_after)

    # Increment counters for all limits
    for limit_str in limits_to_check:
        limit_item = parse(limit_str)
        storage_key = f"LIMITER/ai_chat/{limit_str}/{key}"
        expiry = limit_item.get_expiry()
        storage.incr(storage_key, expiry)

    logger.debug(f"[AI_RATE_LIMIT_PASSED] key={key} user_type={user_type}")
