"""Tests for TokenService - token-policy.md compliance."""

import pytest
import sys
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
from zoneinfo import ZoneInfo

# Mock database modules before importing TokenService
sys.modules['app.models.db'] = MagicMock()
sys.modules['app.models.user'] = MagicMock()

from app.services.token_service import (
    TokenService,
    MONTHLY_TOKEN_BALANCE,
    DAILY_BONUS_LIMIT,
    KST,
)


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = MagicMock()
    db.commit = MagicMock()
    return db


@pytest.fixture
def mock_user():
    """Create a mock user with default token values."""
    user = MagicMock()
    user.id = "test-user-id"
    user.token_balance = MONTHLY_TOKEN_BALANCE  # 100
    user.token_used = 0
    user.daily_bonus_used = 0
    user.tier = "free"
    user.token_reset_at = datetime.now(KST) + timedelta(days=30)
    user.daily_bonus_reset_at = datetime.now(KST) + timedelta(days=1)
    return user


class TestTokenServiceConsumptionPriority:
    """
    token-policy.md §4.3 차감 우선순위 테스트:
    1) Daily Free에서 먼저 차감
    2) Daily Free 소진 시 Monthly에서 차감
    """

    def test_can_use_daily_free_first(self, mock_db, mock_user):
        """Daily Free가 남아있으면 daily_free를 반환해야 함."""
        mock_user.daily_bonus_used = 0  # Daily Free 남아있음
        mock_user.token_used = 0  # Monthly도 남아있음

        service = TokenService(mock_db)
        can_use, reason = service.can_use_ai_feature(mock_user, cost=1)

        assert can_use is True
        assert reason == "daily_free"  # Daily Free 먼저!

    def test_can_use_monthly_when_daily_exhausted(self, mock_db, mock_user):
        """Daily Free가 소진되면 monthly를 반환해야 함."""
        mock_user.daily_bonus_used = DAILY_BONUS_LIMIT  # Daily Free 소진
        mock_user.token_used = 0  # Monthly 남아있음

        service = TokenService(mock_db)
        can_use, reason = service.can_use_ai_feature(mock_user, cost=1)

        assert can_use is True
        assert reason == "monthly"  # Monthly 차감

    def test_exhausted_when_both_empty(self, mock_db, mock_user):
        """둘 다 소진되면 exhausted를 반환해야 함."""
        mock_user.daily_bonus_used = DAILY_BONUS_LIMIT  # Daily Free 소진
        mock_user.token_used = MONTHLY_TOKEN_BALANCE  # Monthly 소진

        service = TokenService(mock_db)
        can_use, reason = service.can_use_ai_feature(mock_user, cost=1)

        assert can_use is False
        assert reason == "exhausted"

    def test_deduct_daily_free_first(self, mock_db, mock_user):
        """차감 시 Daily Free가 먼저 차감되어야 함."""
        mock_user.daily_bonus_used = 0
        mock_user.token_used = 0

        service = TokenService(mock_db)
        success, deduction_type = service.deduct_token(mock_user, cost=1)

        assert success is True
        assert deduction_type == "daily_free"
        assert mock_user.daily_bonus_used == 1  # Daily 증가
        assert mock_user.token_used == 0  # Monthly 변경 없음

    def test_deduct_monthly_when_daily_exhausted(self, mock_db, mock_user):
        """Daily Free 소진 시 Monthly에서 차감되어야 함."""
        mock_user.daily_bonus_used = DAILY_BONUS_LIMIT
        mock_user.token_used = 0

        service = TokenService(mock_db)
        success, deduction_type = service.deduct_token(mock_user, cost=1)

        assert success is True
        assert deduction_type == "monthly"
        assert mock_user.token_used == 1  # Monthly 증가

    def test_deduct_fails_when_both_exhausted(self, mock_db, mock_user):
        """둘 다 소진되면 차감 실패해야 함."""
        mock_user.daily_bonus_used = DAILY_BONUS_LIMIT
        mock_user.token_used = MONTHLY_TOKEN_BALANCE

        service = TokenService(mock_db)
        success, deduction_type = service.deduct_token(mock_user, cost=1)

        assert success is False
        assert deduction_type == "failed"


class TestTokenServiceReset:
    """token-policy.md §4.2 리셋 기준 테스트."""

    def test_monthly_reset(self, mock_db, mock_user):
        """월간 리셋이 제대로 동작해야 함."""
        # 리셋 시간이 지난 상태
        mock_user.token_reset_at = datetime.now(KST) - timedelta(days=1)
        mock_user.token_used = 50

        service = TokenService(mock_db)
        service._check_and_reset_if_needed(mock_user)

        assert mock_user.token_used == 0  # 리셋됨
        assert mock_user.token_balance == MONTHLY_TOKEN_BALANCE

    def test_daily_reset(self, mock_db, mock_user):
        """일일 리셋이 제대로 동작해야 함."""
        # 리셋 시간이 지난 상태
        mock_user.daily_bonus_reset_at = datetime.now(KST) - timedelta(hours=1)
        mock_user.daily_bonus_used = 2

        service = TokenService(mock_db)
        service._check_and_reset_if_needed(mock_user)

        assert mock_user.daily_bonus_used == 0  # 리셋됨


class TestTokenStatus:
    """토큰 상태 조회 테스트."""

    def test_get_token_status(self, mock_db, mock_user):
        """토큰 상태 조회가 정확한 값을 반환해야 함."""
        mock_user.token_balance = 100
        mock_user.token_used = 30
        mock_user.daily_bonus_used = 1

        service = TokenService(mock_db)
        status = service.get_token_status(mock_user)

        assert status["token_balance"] == 100
        assert status["token_used"] == 30
        assert status["tokens_remaining"] == 70
        assert status["daily_bonus_remaining"] == 2  # 3 - 1
        assert status["daily_bonus_limit"] == DAILY_BONUS_LIMIT
