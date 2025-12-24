"""Token service for AI feature rate limiting."""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.user import User

# Constants
MONTHLY_TOKEN_BALANCE = 100  # Default monthly tokens for free tier
DAILY_BONUS_LIMIT = 3  # Max bonus uses per day when tokens exhausted
KST = ZoneInfo("Asia/Seoul")


class TokenService:
    """Service for managing user tokens for AI features."""

    def __init__(self, db: Session):
        self.db = db

    def get_token_status(self, user: User) -> dict:
        """
        Get current token status for a user.

        Returns:
            dict with token_balance, token_used, tokens_remaining,
            daily_bonus_remaining, next_reset
        """
        self._check_and_reset_if_needed(user)

        tokens_remaining = user.token_balance - user.token_used
        daily_bonus_remaining = DAILY_BONUS_LIMIT - user.daily_bonus_used

        return {
            "token_balance": user.token_balance,
            "token_used": user.token_used,
            "tokens_remaining": max(0, tokens_remaining),
            "daily_bonus_remaining": max(0, daily_bonus_remaining),
            "daily_bonus_limit": DAILY_BONUS_LIMIT,
            "next_reset": user.token_reset_at.isoformat() if user.token_reset_at else None,
            "tier": user.tier,
        }

    def can_use_ai_feature(self, user: User, cost: int = 1) -> Tuple[bool, str]:
        """
        Check if user can use an AI feature.

        Args:
            user: User instance
            cost: Token cost for the feature (default 1)

        Returns:
            Tuple of (can_use: bool, reason: str)
        """
        self._check_and_reset_if_needed(user)

        tokens_remaining = user.token_balance - user.token_used

        # Has enough tokens
        if tokens_remaining >= cost:
            return True, "ok"

        # Check daily bonus
        if user.daily_bonus_used < DAILY_BONUS_LIMIT:
            return True, "bonus"

        return False, "exhausted"

    def deduct_token(self, user: User, cost: int = 1) -> Tuple[bool, str]:
        """
        Deduct token(s) from user's balance.

        Args:
            user: User instance
            cost: Number of tokens to deduct

        Returns:
            Tuple of (success: bool, deduction_type: str)
            deduction_type: "token" | "bonus" | "failed"
        """
        self._check_and_reset_if_needed(user)

        tokens_remaining = user.token_balance - user.token_used

        # Deduct from regular tokens
        if tokens_remaining >= cost:
            user.token_used += cost
            self.db.commit()
            return True, "token"

        # Use daily bonus
        if user.daily_bonus_used < DAILY_BONUS_LIMIT:
            user.daily_bonus_used += 1
            self.db.commit()
            return True, "bonus"

        return False, "failed"

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
        """Get token balance based on user tier."""
        tier_balances = {
            "free": MONTHLY_TOKEN_BALANCE,
            "premium": 500,  # Future: premium tier
        }
        return tier_balances.get(tier, MONTHLY_TOKEN_BALANCE)

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


def get_token_service(db: Session) -> TokenService:
    """Factory function to create TokenService instance."""
    return TokenService(db)
