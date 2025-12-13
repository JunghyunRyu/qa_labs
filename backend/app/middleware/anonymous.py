"""Anonymous ID middleware for guest users."""

import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings

logger = logging.getLogger(__name__)


class AnonymousIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to issue anonymous_id cookie for guest users.

    This allows tracking guest submissions and migrating them
    to user accounts upon login.
    """

    COOKIE_NAME = "qa_anonymous_id"
    COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add anonymous_id cookie if not present."""
        response = await call_next(request)

        # Check if cookie already exists
        anonymous_id = request.cookies.get(self.COOKIE_NAME)

        if not anonymous_id:
            # Generate new UUID v4
            anonymous_id = str(uuid.uuid4())

            # Set cookie on response
            response.set_cookie(
                key=self.COOKIE_NAME,
                value=anonymous_id,
                httponly=True,
                secure=settings.COOKIE_SECURE,
                samesite="lax",
                max_age=self.COOKIE_MAX_AGE,
                path="/"
            )

            logger.debug(f"[ANONYMOUS_ID_ISSUED] anonymous_id={anonymous_id}")

        return response
