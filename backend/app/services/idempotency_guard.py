"""
Idempotency Guard for preventing duplicate token deductions.

token-policy.md §6.2 중복 차감 방지:
- 더블 클릭/네트워크 재시도 시 중복 차감 방지
- (user_id, action_type, time_window) 기준으로 중복 체크
"""

import threading
from datetime import datetime, timedelta
from typing import Dict, Tuple
from uuid import UUID
from zoneinfo import ZoneInfo

# Constants
IDEMPOTENCY_WINDOW_SECONDS = 5  # 중복 요청 방지 시간 창
KST = ZoneInfo("Asia/Seoul")


class IdempotencyGuard:
    """
    Singleton guard that prevents duplicate token deductions within a time window.
    Thread-safe implementation using locks.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._recent_operations: Dict[str, datetime] = {}
        return cls._instance

    def check_and_mark(self, user_id: UUID, action_type: str) -> Tuple[bool, str]:
        """
        Check if operation is duplicate and mark it if not.

        Args:
            user_id: User ID
            action_type: Type of action (e.g., "AI_CHAT_COACH", "AI_HINT")

        Returns:
            Tuple of (is_allowed: bool, reason: str)
            - (True, "ok"): Not duplicate, operation allowed
            - (False, "duplicate"): Duplicate within time window
        """
        key = f"{user_id}:{action_type}"
        now = datetime.now(KST)

        with self._lock:
            # Cleanup old entries
            self._cleanup_expired(now)

            # Check for duplicate
            if key in self._recent_operations:
                last_time = self._recent_operations[key]
                if (now - last_time).total_seconds() < IDEMPOTENCY_WINDOW_SECONDS:
                    return False, "duplicate"

            # Mark this operation
            self._recent_operations[key] = now
            return True, "ok"

    def _cleanup_expired(self, now: datetime) -> None:
        """Remove expired entries from the cache."""
        expired_keys = [
            key for key, time in self._recent_operations.items()
            if (now - time).total_seconds() >= IDEMPOTENCY_WINDOW_SECONDS * 2
        ]
        for key in expired_keys:
            del self._recent_operations[key]


# Global singleton instance
idempotency_guard = IdempotencyGuard()
