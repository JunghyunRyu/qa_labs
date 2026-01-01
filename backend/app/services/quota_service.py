"""
Quota Service (PR3: AI 호출 경로 통일 및 캡 강제)

일일 캡(Daily Cap) 및 기능 권한 관리 서비스입니다.
Redis를 사용하여 일일 사용량을 추적합니다.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, NamedTuple
from uuid import UUID
from zoneinfo import ZoneInfo
from enum import Enum

from sqlalchemy.orm import Session

from app.models.user import User
from app.core.plan_config import Feature, Limit, ActionType, get_plan_config
from app.services.redis_cache import RedisCache
from app.services.plan_service import PlanService
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)

KST = ZoneInfo("Asia/Seoul")


class QuotaCheckResult(NamedTuple):
    """Quota 체크 결과"""
    allowed: bool
    reason: str  # "ok", "feature_disabled", "daily_cap_exceeded", "token_insufficient"
    details: dict


class QuotaErrorCode(str, Enum):
    """Quota 에러 코드"""
    FEATURE_DISABLED = "FEATURE_DISABLED"
    DAILY_CAP_EXCEEDED = "DAILY_CAP_EXCEEDED"
    TOKEN_INSUFFICIENT = "TOKEN_INSUFFICIENT"
    AUTH_REQUIRED = "AUTH_REQUIRED"


class QuotaService:
    """
    Quota/Cap 관리 서비스

    기능:
    1. Feature 권한 확인 (Plan 기반)
    2. 일일 캡(Daily Cap) 확인 및 증가
    3. 토큰 잔액 확인

    Redis 키 패턴:
    - usage:{user_id}:{action}:{date} - 일일 사용량
    """

    USAGE_KEY_PREFIX = "usage"

    def __init__(self, db: Session):
        self.db = db
        self.cache = RedisCache.get_instance()
        self.plan_service = PlanService(db)
        self.token_service = TokenService(db)

    def check_quota(
        self,
        user: User,
        action_type: ActionType,
        cost: int = 1,
    ) -> QuotaCheckResult:
        """
        Quota 체크 (Feature 권한 + 일일 캡 + 토큰 잔액)

        순서:
        1. Feature 권한 확인
        2. 일일 캡 확인
        3. 토큰 잔액 확인

        Args:
            user: User 객체
            action_type: 액션 타입
            cost: 토큰 비용

        Returns:
            QuotaCheckResult: (allowed, reason, details)
        """
        # 1. Feature 권한 확인
        feature = self._action_to_feature(action_type)
        if feature and not self.plan_service.has_feature(user, feature):
            plan = self.plan_service.get_user_plan(user)
            return QuotaCheckResult(
                allowed=False,
                reason=QuotaErrorCode.FEATURE_DISABLED.value,
                details={
                    "feature": feature.value,
                    "current_plan": plan.plan_key.value,
                    "required_plan": self._get_required_plan_for_feature(feature),
                }
            )

        # 2. 일일 캡 확인
        daily_cap = self._get_daily_cap(user)
        current_usage = self.get_daily_usage(user, action_type)

        if current_usage >= daily_cap:
            return QuotaCheckResult(
                allowed=False,
                reason=QuotaErrorCode.DAILY_CAP_EXCEEDED.value,
                details={
                    "daily_cap": daily_cap,
                    "current_usage": current_usage,
                    "retry_after": self._seconds_until_midnight_kst(),
                }
            )

        # 3. 토큰 잔액 확인
        can_use, token_reason = self.token_service.can_use_ai_feature(user, cost)
        if not can_use:
            status = self.token_service.get_token_status(user)
            return QuotaCheckResult(
                allowed=False,
                reason=QuotaErrorCode.TOKEN_INSUFFICIENT.value,
                details={
                    "daily_free_remaining": status["daily_bonus_remaining"],
                    "monthly_remaining": status["tokens_remaining"],
                    "next_daily_reset": status.get("daily_reset_at"),
                    "next_monthly_reset": status["next_reset"],
                }
            )

        return QuotaCheckResult(
            allowed=True,
            reason="ok",
            details={
                "daily_usage": current_usage,
                "daily_cap": daily_cap,
                "token_source": token_reason,
            }
        )

    def consume_quota(
        self,
        user: User,
        action_type: ActionType,
        cost: int = 1,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Quota 소비 (일일 캡 증가 + 토큰 차감)

        Args:
            user: User 객체
            action_type: 액션 타입
            cost: 토큰 비용
            submission_id: 관련 제출 ID
            idempotency_key: 멱등성 키

        Returns:
            (success, deduction_type)
        """
        # 일일 사용량 증가
        self.increment_daily_usage(user, action_type)

        # 토큰 차감 (트랜잭션 기록 포함)
        from app.models.token_transaction import ActionType as TxActionType
        tx_action = self._action_to_tx_action(action_type)

        success, deduction_type = self.token_service.deduct_token(
            user=user,
            cost=cost,
            action_type=tx_action,
            submission_id=submission_id,
            idempotency_key=idempotency_key,
        )

        return success, deduction_type

    def get_daily_usage(self, user: User, action_type: ActionType) -> int:
        """
        일일 사용량 조회

        Args:
            user: User 객체
            action_type: 액션 타입

        Returns:
            오늘 사용량
        """
        key = self._get_usage_key(user.id, action_type)
        value = self.cache.get(key)
        return int(value) if value else 0

    def get_total_daily_usage(self, user: User) -> int:
        """
        전체 일일 AI 사용량 조회 (모든 액션 합계)

        Args:
            user: User 객체

        Returns:
            오늘 전체 AI 사용량
        """
        total = 0
        for action in ActionType:
            total += self.get_daily_usage(user, action)
        return total

    def increment_daily_usage(self, user: User, action_type: ActionType) -> int:
        """
        일일 사용량 증가

        Args:
            user: User 객체
            action_type: 액션 타입

        Returns:
            증가 후 사용량
        """
        key = self._get_usage_key(user.id, action_type)
        ttl = self._seconds_until_midnight_kst()
        return self.cache.incr_with_expire(key, ttl)

    def _get_usage_key(self, user_id: UUID, action_type: ActionType) -> str:
        """Redis 사용량 키 생성"""
        today = datetime.now(KST).strftime("%Y-%m-%d")
        action_value = action_type.value if isinstance(action_type, ActionType) else action_type
        return f"{self.USAGE_KEY_PREFIX}:{user_id}:{action_value}:{today}"

    def _get_daily_cap(self, user: User) -> int:
        """사용자의 일일 AI 호출 캡"""
        return self.plan_service.get_limit(user, Limit.DAILY_AI_CAP)

    def _seconds_until_midnight_kst(self) -> int:
        """자정(KST)까지 남은 초"""
        now = datetime.now(KST)
        tomorrow = now + timedelta(days=1)
        midnight = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
        return int((midnight - now).total_seconds())

    def _action_to_feature(self, action_type: ActionType) -> Optional[Feature]:
        """ActionType을 Feature로 변환"""
        mapping = {
            ActionType.AI_COACH: Feature.AI_COACH,
            ActionType.AI_HINT: Feature.AI_HINT,
            ActionType.FEEDBACK_BASE: Feature.FEEDBACK_REGENERATE,
            ActionType.FEEDBACK_DEEP: Feature.FEEDBACK_DEEP,
            ActionType.FEEDBACK_REGENERATE: Feature.FEEDBACK_REGENERATE,
            ActionType.SUCCESS_ANALYSIS: Feature.SUCCESS_ANALYSIS,
        }
        return mapping.get(action_type)

    def _action_to_tx_action(self, action_type: ActionType):
        """ActionType을 TokenTransaction ActionType으로 변환"""
        from app.models.token_transaction import ActionType as TxActionType
        mapping = {
            ActionType.AI_COACH: TxActionType.AI_COACH,
            ActionType.AI_HINT: TxActionType.AI_HINT,
            ActionType.FEEDBACK_BASE: TxActionType.FEEDBACK_BASE,
            ActionType.FEEDBACK_DEEP: TxActionType.FEEDBACK_DEEP,
            ActionType.FEEDBACK_REGENERATE: TxActionType.FEEDBACK_REGENERATE,
            ActionType.SUCCESS_ANALYSIS: TxActionType.SUCCESS_ANALYSIS,
        }
        return mapping.get(action_type, TxActionType.FEEDBACK_BASE)

    def _get_required_plan_for_feature(self, feature: Feature) -> str:
        """특정 기능에 필요한 최소 플랜 반환"""
        from app.core.plan_config import PlanKey, PLAN_CONFIGS

        # 플랜 순서: free -> lite -> pro
        plan_order = [PlanKey.FREE, PlanKey.LITE, PlanKey.PRO]

        for plan_key in plan_order:
            config = PLAN_CONFIGS[plan_key]
            if feature in config.features:
                return plan_key.value

        return "pro"  # 기본값


def get_quota_service(db: Session) -> QuotaService:
    """Factory function to create QuotaService instance."""
    return QuotaService(db)
