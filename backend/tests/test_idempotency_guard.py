"""Tests for IdempotencyGuard - token-policy.md §6.2 compliance."""

import pytest
import time
from uuid import uuid4
from unittest.mock import patch
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.services.idempotency_guard import (
    IdempotencyGuard,
    IDEMPOTENCY_WINDOW_SECONDS,
    KST,
)


@pytest.fixture
def fresh_guard():
    """Create a fresh IdempotencyGuard instance for testing.

    Note: Since IdempotencyGuard is a singleton, we need to reset its state.
    """
    guard = IdempotencyGuard()
    # Clear previous operations
    guard._recent_operations.clear()
    return guard


class TestIdempotencyGuardDuplicatePrevention:
    """
    token-policy.md §6.2 중복 차감 방지 테스트:
    - 더블 클릭/네트워크 재시도 시 중복 차감 방지
    """

    def test_first_request_allowed(self, fresh_guard):
        """첫 번째 요청은 허용되어야 함."""
        user_id = uuid4()
        action_type = "AI_CHAT"

        is_allowed, reason = fresh_guard.check_and_mark(user_id, action_type)

        assert is_allowed is True
        assert reason == "ok"

    def test_duplicate_request_within_window_blocked(self, fresh_guard):
        """시간 창 내 중복 요청은 차단되어야 함."""
        user_id = uuid4()
        action_type = "AI_CHAT"

        # 첫 번째 요청
        fresh_guard.check_and_mark(user_id, action_type)

        # 즉시 두 번째 요청 (중복)
        is_allowed, reason = fresh_guard.check_and_mark(user_id, action_type)

        assert is_allowed is False
        assert reason == "duplicate"

    def test_different_user_allowed(self, fresh_guard):
        """다른 사용자의 요청은 허용되어야 함."""
        user1 = uuid4()
        user2 = uuid4()
        action_type = "AI_CHAT"

        fresh_guard.check_and_mark(user1, action_type)
        is_allowed, reason = fresh_guard.check_and_mark(user2, action_type)

        assert is_allowed is True
        assert reason == "ok"

    def test_different_action_allowed(self, fresh_guard):
        """같은 사용자의 다른 액션은 허용되어야 함."""
        user_id = uuid4()

        fresh_guard.check_and_mark(user_id, "AI_CHAT")
        is_allowed, reason = fresh_guard.check_and_mark(user_id, "AI_HINT")

        assert is_allowed is True
        assert reason == "ok"

    def test_request_allowed_after_window_expires(self, fresh_guard):
        """시간 창이 지나면 같은 요청도 허용되어야 함."""
        user_id = uuid4()
        action_type = "AI_CHAT"

        # 첫 번째 요청
        fresh_guard.check_and_mark(user_id, action_type)

        # 시간을 시뮬레이션하여 창이 지나게 함
        past_time = datetime.now(KST) - timedelta(seconds=IDEMPOTENCY_WINDOW_SECONDS + 1)
        fresh_guard._recent_operations[f"{user_id}:{action_type}"] = past_time

        # 창이 지난 후 요청
        is_allowed, reason = fresh_guard.check_and_mark(user_id, action_type)

        assert is_allowed is True
        assert reason == "ok"


class TestIdempotencyGuardCleanup:
    """캐시 정리 테스트."""

    def test_expired_entries_cleaned_up(self, fresh_guard):
        """만료된 항목이 정리되어야 함."""
        user_id = uuid4()

        # 오래된 항목 추가
        old_time = datetime.now(KST) - timedelta(seconds=IDEMPOTENCY_WINDOW_SECONDS * 3)
        fresh_guard._recent_operations[f"{user_id}:OLD_ACTION"] = old_time

        # 새 요청으로 cleanup 트리거
        fresh_guard.check_and_mark(uuid4(), "NEW_ACTION")

        # 오래된 항목이 정리되었는지 확인
        assert f"{user_id}:OLD_ACTION" not in fresh_guard._recent_operations


class TestIdempotencyGuardSingleton:
    """싱글톤 패턴 테스트."""

    def test_singleton_instance(self):
        """동일한 인스턴스를 반환해야 함."""
        guard1 = IdempotencyGuard()
        guard2 = IdempotencyGuard()

        assert guard1 is guard2


class TestIdempotencyWindowConstant:
    """시간 창 상수 테스트."""

    def test_window_is_reasonable(self):
        """시간 창이 합리적인 값이어야 함 (1~30초)."""
        assert 1 <= IDEMPOTENCY_WINDOW_SECONDS <= 30
