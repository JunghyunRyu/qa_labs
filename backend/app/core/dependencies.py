"""FastAPI dependencies for authentication and AI access control."""

from typing import Optional, Tuple
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.core.auth import decode_token
from app.core.config import settings
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

    def __init__(self, user: User, token_service: TokenService, can_use: bool, reason: str, action_type: str = "AI_CHAT"):
        self.user = user
        self.token_service = token_service
        self.can_use = can_use
        self.reason = reason
        self.action_type = action_type
        self._deducted = False

    def deduct(self, cost: int = 1) -> Tuple[bool, str]:
        """
        Deduct token after successful AI operation.

        token-policy.md §6.2 중복 차감 방지:
        - 더블 클릭/네트워크 재시도 시 중복 차감 방지
        """
        if self._deducted:
            return True, "already_deducted"

        # Idempotency check (5초 내 중복 요청 방지)
        from app.services.idempotency_guard import idempotency_guard
        is_allowed, idem_reason = idempotency_guard.check_and_mark(self.user.id, self.action_type)
        if not is_allowed:
            return True, "idempotent_skip"  # 중복이므로 차감 없이 성공 반환

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
    - No tokens left (and no daily free): 402 Payment Required
    - OK: Returns AIAccessResult for token deduction after operation

    token-policy.md 준수:
    - §4.3: 차감 우선순위 (Daily Free → Monthly)
    - §6.2: 중복 차감 방지 (Idempotency)
    - §8.2: 표준 에러 규격 (TOKEN_INSUFFICIENT)

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
        # token-policy.md §8.2 표준 에러 규격
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": {
                    "code": "TOKEN_INSUFFICIENT",
                    "message": "토큰이 부족합니다.",
                    "details": {
                        "daily_free_remaining": status_info["daily_bonus_remaining"],
                        "monthly_remaining": status_info["tokens_remaining"],
                        "next_daily_reset_at": status_info.get("daily_reset_at"),
                        "next_monthly_reset_at": status_info["next_reset"],
                    }
                }
            },
            headers={"X-Error-Code": "TOKEN_INSUFFICIENT"}
        )

    # Extract action type from request path
    action_type = "AI_CHAT"  # Default
    if "/hint" in request.url.path:
        action_type = "AI_HINT"
    elif "/feedback" in request.url.path:
        action_type = "FEEDBACK"

    return AIAccessResult(user, token_service, can_use, reason, action_type)


def get_token_service(db: Session = Depends(get_db)) -> TokenService:
    """Get TokenService instance."""
    return TokenService(db)


async def require_admin_key(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
) -> str:
    """
    Admin API 인증을 위한 의존성.

    X-Admin-Key 헤더로 관리자 인증을 수행합니다.
    ADMIN_SECRET_KEY 환경변수와 일치해야 합니다.

    Usage:
        @router.patch("/admin/endpoint")
        async def admin_endpoint(
            admin_key: str = Depends(require_admin_key),
        ):
            # Admin-only operation
            ...
    """
    if not settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin key not configured on server"
        )

    if not x_admin_key or x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin key"
        )

    return x_admin_key
