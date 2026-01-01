"""
Decorators for AI feature access control (PR3: AI 호출 경로 통일 및 캡 강제)

@require_quota 데코레이터로 AI 기능에 대한 통합 접근 제어를 제공합니다.
"""

import functools
import logging
from typing import Callable, Optional
from uuid import UUID

from fastapi import HTTPException, status, Request, Depends
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.core.plan_config import ActionType
from app.services.quota_service import QuotaService, QuotaErrorCode
from app.core.dependencies import get_current_user_optional

logger = logging.getLogger(__name__)


class QuotaContext:
    """
    Quota 컨텍스트 - 요청 처리 중 사용

    Usage:
        async def my_endpoint(quota_ctx: QuotaContext = Depends(require_quota(ActionType.AI_COACH))):
            # AI 작업 수행
            result = await do_ai_stuff()
            # 성공 시 quota 소비
            quota_ctx.consume()
            return result
    """

    def __init__(
        self,
        user: User,
        quota_service: QuotaService,
        action_type: ActionType,
        cost: int = 1,
    ):
        self.user = user
        self.quota_service = quota_service
        self.action_type = action_type
        self.cost = cost
        self._consumed = False

    def consume(
        self,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> tuple:
        """
        Quota 소비 (성공 시 호출)

        Args:
            submission_id: 관련 제출 ID
            idempotency_key: 멱등성 키

        Returns:
            (success, deduction_type)
        """
        if self._consumed:
            logger.debug(f"Quota already consumed for user {self.user.id}")
            return True, "already_consumed"

        success, deduction_type = self.quota_service.consume_quota(
            user=self.user,
            action_type=self.action_type,
            cost=self.cost,
            submission_id=submission_id,
            idempotency_key=idempotency_key,
        )

        if success:
            self._consumed = True

        return success, deduction_type

    def get_status(self) -> dict:
        """현재 토큰/quota 상태 조회"""
        return self.quota_service.token_service.get_token_status(self.user)

    @property
    def is_consumed(self) -> bool:
        """Quota가 이미 소비되었는지"""
        return self._consumed


def require_quota(
    action_type: ActionType,
    cost: int = 1,
):
    """
    Quota 확인 의존성 팩토리

    순서:
    1. 인증 확인
    2. Feature 권한 확인 (Plan 기반)
    3. 일일 캡 확인
    4. 토큰 잔액 확인

    에러 코드:
    - 401: AUTH_REQUIRED (미인증)
    - 403: FEATURE_DISABLED (플랜 미지원)
    - 429: DAILY_CAP_EXCEEDED (일일 한도 초과)
    - 402: TOKEN_INSUFFICIENT (토큰 부족)

    Usage:
        @router.post("/ai/chat")
        async def chat(
            request: ChatRequest,
            quota_ctx: QuotaContext = Depends(require_quota(ActionType.AI_COACH)),
        ):
            result = await do_ai_stuff()
            quota_ctx.consume()
            return result

    Args:
        action_type: 액션 타입 (AI_COACH, AI_HINT, FEEDBACK_DEEP 등)
        cost: 토큰 비용 (기본 1)

    Returns:
        FastAPI Depends 가능한 함수
    """

    async def _check_quota(
        request: Request,
        db: Session = Depends(get_db),
    ) -> QuotaContext:
        # 1. 인증 확인
        user = await get_current_user_optional(request, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": QuotaErrorCode.AUTH_REQUIRED.value,
                        "message": "AI 기능을 사용하려면 로그인이 필요합니다.",
                    }
                },
                headers={"X-Error-Code": QuotaErrorCode.AUTH_REQUIRED.value},
            )

        # 2-4. Quota 체크 (Feature + Daily Cap + Token)
        quota_service = QuotaService(db)
        result = quota_service.check_quota(user, action_type, cost)

        if not result.allowed:
            _raise_quota_error(result.reason, result.details)

        return QuotaContext(
            user=user,
            quota_service=quota_service,
            action_type=action_type,
            cost=cost,
        )

    return _check_quota


def _raise_quota_error(reason: str, details: dict):
    """Quota 에러를 HTTPException으로 변환"""

    if reason == QuotaErrorCode.FEATURE_DISABLED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": QuotaErrorCode.FEATURE_DISABLED.value,
                    "message": f"이 기능은 {details.get('required_plan', 'pro')} 플랜 이상에서 사용할 수 있습니다.",
                    "details": details,
                }
            },
            headers={"X-Error-Code": QuotaErrorCode.FEATURE_DISABLED.value},
        )

    elif reason == QuotaErrorCode.DAILY_CAP_EXCEEDED.value:
        retry_after = details.get("retry_after", 3600)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": QuotaErrorCode.DAILY_CAP_EXCEEDED.value,
                    "message": "일일 AI 호출 한도를 초과했습니다. 내일 다시 시도해주세요.",
                    "details": details,
                }
            },
            headers={
                "X-Error-Code": QuotaErrorCode.DAILY_CAP_EXCEEDED.value,
                "Retry-After": str(retry_after),
            },
        )

    elif reason == QuotaErrorCode.TOKEN_INSUFFICIENT.value:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": {
                    "code": QuotaErrorCode.TOKEN_INSUFFICIENT.value,
                    "message": "토큰이 부족합니다.",
                    "details": details,
                }
            },
            headers={"X-Error-Code": QuotaErrorCode.TOKEN_INSUFFICIENT.value},
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "UNKNOWN_ERROR",
                    "message": "알 수 없는 오류가 발생했습니다.",
                }
            },
        )


# Convenience functions for common action types
def require_ai_coach_quota(cost: int = 1):
    """AI 코치 기능 quota 의존성"""
    return require_quota(ActionType.AI_COACH, cost)


def require_ai_hint_quota(cost: int = 1):
    """AI 힌트 기능 quota 의존성"""
    return require_quota(ActionType.AI_HINT, cost)


def require_feedback_deep_quota(cost: int = 2):
    """심화 분석 기능 quota 의존성 (비용 2)"""
    return require_quota(ActionType.FEEDBACK_DEEP, cost)


def require_feedback_regenerate_quota(cost: int = 1):
    """피드백 재생성 기능 quota 의존성"""
    return require_quota(ActionType.FEEDBACK_REGENERATE, cost)


def require_success_analysis_quota(cost: int = 1):
    """성공 분석 기능 quota 의존성"""
    return require_quota(ActionType.SUCCESS_ANALYSIS, cost)
