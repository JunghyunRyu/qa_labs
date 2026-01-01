"""Token service for AI feature rate limiting."""

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.token_transaction import TokenTransaction, ActionType, SourceType
from app.repositories.token_repository import TokenRepository
from app.core.plan_config import Limit, get_plan_config

logger = logging.getLogger(__name__)

# Constants (하위 호환)
MONTHLY_TOKEN_BALANCE = 100  # Default monthly tokens for free tier
DAILY_BONUS_LIMIT = 3  # Max bonus uses per day when tokens exhausted
KST = ZoneInfo("Asia/Seoul")


class TokenService:
    """Service for managing user tokens for AI features."""

    def __init__(self, db: Session):
        self.db = db
        self.token_repo = TokenRepository(db)

    def get_token_status(self, user: User) -> dict:
        """
        Get current token status for a user.

        Returns:
            dict with token_balance, token_used, tokens_remaining,
            daily_bonus_remaining, next_reset, plan_key
        """
        self._check_and_reset_if_needed(user)

        tokens_remaining = user.token_balance - user.token_used
        daily_bonus_limit = self._get_daily_bonus_limit(user)
        daily_bonus_remaining = daily_bonus_limit - user.daily_bonus_used

        return {
            "token_balance": user.token_balance,
            "token_used": user.token_used,
            "tokens_remaining": max(0, tokens_remaining),
            "daily_bonus_remaining": max(0, daily_bonus_remaining),
            "daily_bonus_limit": daily_bonus_limit,
            "next_reset": user.token_reset_at.isoformat() if user.token_reset_at else None,
            "tier": user.tier,  # 하위 호환
            "plan_key": getattr(user, 'plan_key', 'free'),
        }

    def can_use_ai_feature(self, user: User, cost: int = 1) -> Tuple[bool, str]:
        """
        Check if user can use an AI feature.

        차감 우선순위 (token-policy.md §4.3):
        1) Daily Free에서 먼저 차감
        2) Daily Free 소진 시 Monthly에서 차감

        Args:
            user: User instance
            cost: Token cost for the feature (default 1)

        Returns:
            Tuple of (can_use: bool, reason: str)
        """
        self._check_and_reset_if_needed(user)

        daily_bonus_limit = self._get_daily_bonus_limit(user)

        # 1순위: Daily Free 토큰 확인
        if user.daily_bonus_used < daily_bonus_limit:
            return True, "daily_free"

        # 2순위: Monthly 토큰 확인
        tokens_remaining = user.token_balance - user.token_used
        if tokens_remaining >= cost:
            return True, "monthly"

        return False, "exhausted"

    def deduct_token(
        self,
        user: User,
        cost: int = 1,
        action_type: Optional[ActionType] = None,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Deduct token(s) from user's balance with transaction logging.

        차감 우선순위 (token-policy.md §4.3):
        1) Daily Free에서 먼저 차감
        2) Daily Free 소진 시 Monthly에서 차감

        Args:
            user: User instance
            cost: Number of tokens to deduct
            action_type: Type of action (for transaction logging)
            submission_id: Related submission ID (optional)
            idempotency_key: Idempotency key for deduplication (optional)

        Returns:
            Tuple of (success: bool, deduction_type: str)
            deduction_type: "daily_free" | "monthly" | "failed"
        """
        self._check_and_reset_if_needed(user)

        daily_bonus_limit = self._get_daily_bonus_limit(user)

        # 1순위: Daily Free에서 차감
        if user.daily_bonus_used < daily_bonus_limit:
            user.daily_bonus_used += 1
            self._log_transaction(
                user=user,
                action_type=action_type or ActionType.FEEDBACK_BASE,
                source_type=SourceType.DAILY_BONUS,
                amount=-1,  # Daily bonus는 항상 1 차감
                submission_id=submission_id,
                idempotency_key=idempotency_key,
            )
            self.db.commit()
            return True, "daily_free"

        # 2순위: Monthly에서 차감
        tokens_remaining = user.token_balance - user.token_used
        if tokens_remaining >= cost:
            user.token_used += cost
            self._log_transaction(
                user=user,
                action_type=action_type or ActionType.FEEDBACK_BASE,
                source_type=SourceType.MONTHLY,
                amount=-cost,
                submission_id=submission_id,
                idempotency_key=idempotency_key,
            )
            self.db.commit()
            return True, "monthly"

        return False, "failed"

    def deduct_token_with_lock(
        self,
        user_id: UUID,
        cost: int = 1,
        action_type: Optional[ActionType] = None,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Deduct token with pessimistic locking (동시성 제어).

        여러 요청이 동시에 들어올 때 안전한 차감을 보장합니다.

        Args:
            user_id: User ID (UUID)
            cost: Number of tokens to deduct
            action_type: Type of action
            submission_id: Related submission ID
            idempotency_key: Idempotency key

        Returns:
            Tuple of (success: bool, deduction_type: str)
        """
        # 멱등성 키 체크
        if idempotency_key:
            existing = self.token_repo.find_by_idempotency_key(idempotency_key)
            if existing:
                logger.info(f"Idempotent request: {idempotency_key}")
                return True, "idempotent"

        # 비관적 잠금으로 사용자 조회
        user = self.token_repo.get_user_with_lock(user_id)
        if not user:
            return False, "user_not_found"

        return self.deduct_token(
            user=user,
            cost=cost,
            action_type=action_type,
            submission_id=submission_id,
            idempotency_key=idempotency_key,
        )

    def _log_transaction(
        self,
        user: User,
        action_type: ActionType,
        source_type: SourceType,
        amount: int,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Optional[TokenTransaction]:
        """
        Log a token transaction.

        Args:
            user: User instance
            action_type: Type of action
            source_type: Source of tokens
            amount: Amount (negative for deduction)
            submission_id: Related submission ID
            idempotency_key: Idempotency key

        Returns:
            Created TokenTransaction or None
        """
        try:
            balance_before = user.token_balance - user.token_used
            balance_after = balance_before + amount

            transaction = TokenTransaction(
                user_id=user.id,
                action_type=action_type.value if isinstance(action_type, ActionType) else action_type,
                source_type=source_type.value if isinstance(source_type, SourceType) else source_type,
                amount=amount,
                balance_before=balance_before,
                balance_after=balance_after,
                submission_id=submission_id,
                idempotency_key=idempotency_key,
            )
            self.db.add(transaction)
            return transaction
        except Exception as e:
            logger.error(f"Failed to log transaction: {e}")
            return None

    def _check_and_reset_if_needed(self, user: User) -> None:
        """Check and perform token resets if needed."""
        now = datetime.now(KST)
        changed = False

        # Monthly reset check
        if user.token_reset_at is None or now >= user.token_reset_at:
            user.token_used = 0
            user.token_balance = self._get_balance_for_tier(user.tier)
            user.token_reset_at = self._get_next_monthly_reset(now)
            changed = True

        # Daily bonus reset check
        if user.daily_bonus_reset_at is None or now >= user.daily_bonus_reset_at:
            user.daily_bonus_used = 0
            user.daily_bonus_reset_at = self._get_next_daily_reset(now)
            changed = True

        if changed:
            self.db.commit()

    def _get_balance_for_tier(self, tier: str) -> int:
        """Get token balance based on user tier (하위 호환)."""
        tier_balances = {
            "free": MONTHLY_TOKEN_BALANCE,
            "premium": 500,  # Future: premium tier
        }
        return tier_balances.get(tier, MONTHLY_TOKEN_BALANCE)

    def _get_balance_for_plan(self, plan_key: str) -> int:
        """Get token balance based on user plan_key."""
        try:
            config = get_plan_config(plan_key)
            return config.limits.get(Limit.MONTHLY_TOKENS, MONTHLY_TOKEN_BALANCE)
        except Exception:
            return MONTHLY_TOKEN_BALANCE

    def _get_daily_bonus_limit(self, user: User) -> int:
        """Get daily bonus limit based on user plan."""
        plan_key = getattr(user, 'plan_key', 'free')
        try:
            config = get_plan_config(plan_key)
            return config.limits.get(Limit.DAILY_FREE, DAILY_BONUS_LIMIT)
        except Exception:
            return DAILY_BONUS_LIMIT

    def _get_next_monthly_reset(self, now: datetime) -> datetime:
        """Calculate next monthly reset (1st of next month at midnight KST)."""
        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1,
                                     hour=0, minute=0, second=0, microsecond=0)
        else:
            next_month = now.replace(month=now.month + 1, day=1,
                                     hour=0, minute=0, second=0, microsecond=0)
        return next_month

    def _get_next_daily_reset(self, now: datetime) -> datetime:
        """Calculate next daily reset (midnight KST)."""
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)

    # ===== 거래 내역 조회 =====

    def get_transaction_history(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        action_type: Optional[str] = None,
    ) -> Tuple[List[TokenTransaction], int]:
        """
        사용자 토큰 거래 내역 조회.

        Args:
            user_id: User ID
            limit: 조회 개수
            offset: 시작 위치
            action_type: 액션 타입 필터

        Returns:
            (거래 목록, 전체 개수)
        """
        action_enum = None
        if action_type:
            try:
                action_enum = ActionType(action_type)
            except ValueError:
                pass

        return self.token_repo.get_user_transactions(
            user_id=user_id,
            limit=limit,
            offset=offset,
            action_type=action_enum,
        )

    def get_usage_summary(self, user_id: UUID, days: int = 30) -> dict:
        """
        사용량 요약 정보 조회.

        Args:
            user_id: User ID
            days: 조회 기간 (일)

        Returns:
            사용량 요약 딕셔너리
        """
        from datetime import datetime
        start_date = datetime.utcnow() - timedelta(days=days)
        return self.token_repo.get_period_usage(user_id, start_date)


def get_token_service(db: Session) -> TokenService:
    """Factory function to create TokenService instance."""
    return TokenService(db)
