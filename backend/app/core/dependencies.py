"""FastAPI dependencies for authentication and AI access control."""

from typing import Optional, Tuple
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.core.auth import decode_token
from app.models.user import User
from app.services.token_service import TokenService


async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user from cookie if present, None otherwise."""
    access_token = request.cookies.get("access_token")
    if not access_token:
        return None

    try:
        payload = decode_token(access_token)
        if payload.get("type") != "access":
            return None

        user_id = UUID(payload["sub"])
        user = db.query(User).filter(
            User.id == user_id,
            User.is_active == True
        ).first()
        return user
    except Exception:
        return None


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user (required)."""
    user = await get_current_user_optional(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


class AIAccessResult:
    """Result of AI access check with token deduction capability."""

    def __init__(self, user: User, token_service: TokenService, can_use: bool, reason: str):
        self.user = user
        self.token_service = token_service
        self.can_use = can_use
        self.reason = reason
        self._deducted = False

    def deduct(self, cost: int = 1) -> Tuple[bool, str]:
        """Deduct token after successful AI operation."""
        if self._deducted:
            return True, "already_deducted"
        success, deduction_type = self.token_service.deduct_token(self.user, cost)
        self._deducted = success
        return success, deduction_type

    def get_status(self) -> dict:
        """Get current token status."""
        return self.token_service.get_token_status(self.user)


async def require_ai_access(
    request: Request,
    db: Session = Depends(get_db),
) -> AIAccessResult:
    """
    Dependency that requires authentication and checks AI token availability.

    - Non-members: 401 Unauthorized
    - No tokens left (and no daily bonus): 402 Payment Required
    - OK: Returns AIAccessResult for token deduction after operation

    Usage:
        @router.post("/ai/chat")
        async def chat(
            ai_access: AIAccessResult = Depends(require_ai_access)
        ):
            # Do AI operation
            result = await do_ai_stuff()
            # Deduct token on success
            ai_access.deduct()
            return result
    """
    # Check authentication
    user = await get_current_user_optional(request, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="AI 기능을 사용하려면 로그인이 필요합니다.",
            headers={"X-Error-Code": "AUTH_REQUIRED"}
        )

    # Check token availability
    token_service = TokenService(db)
    can_use, reason = token_service.can_use_ai_feature(user, cost=1)

    if not can_use:
        status_info = token_service.get_token_status(user)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": "이번 달 AI 토큰이 소진되었습니다. 다음 달 1일에 리셋됩니다.",
                "tokens_remaining": status_info["tokens_remaining"],
                "daily_bonus_remaining": status_info["daily_bonus_remaining"],
                "next_reset": status_info["next_reset"],
            },
            headers={"X-Error-Code": "TOKEN_EXHAUSTED"}
        )

    return AIAccessResult(user, token_service, can_use, reason)


def get_token_service(db: Session = Depends(get_db)) -> TokenService:
    """Get TokenService instance."""
    return TokenService(db)
