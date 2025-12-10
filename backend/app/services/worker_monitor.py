"""Worker monitoring service using Celery Inspect API."""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

import redis

from app.core.config import settings
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


class WorkerStatus(str, Enum):
    """Worker 상태 열거형."""

    ONLINE = "online"
    OFFLINE = "offline"
    UNKNOWN = "unknown"


@dataclass
class WorkerState:
    """Worker 상태 정보."""

    name: str
    status: WorkerStatus
    last_seen: Optional[datetime]
    consecutive_failures: int
    active_tasks: int
    processed_tasks: int

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환."""
        return {
            "name": self.name,
            "status": self.status.value,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "consecutive_failures": self.consecutive_failures,
            "active_tasks": self.active_tasks,
            "processed_tasks": self.processed_tasks,
        }


class WorkerMonitor:
    """Celery Worker 상태 모니터링 클래스."""

    REDIS_KEY_PREFIX = "worker_monitor:"

    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.inspect = celery_app.control.inspect(
            timeout=settings.WORKER_HEARTBEAT_TIMEOUT
        )

    def _get_state_key(self, worker_name: str) -> str:
        """Worker 상태 저장 키 생성."""
        return f"{self.REDIS_KEY_PREFIX}state:{worker_name}"

    def _get_global_key(self, key: str) -> str:
        """전역 키 생성."""
        return f"{self.REDIS_KEY_PREFIX}{key}"

    def ping_workers(self) -> Dict[str, bool]:
        """모든 Worker에 ping 전송."""
        try:
            result = self.inspect.ping()
            if result is None:
                logger.warning("No workers responded to ping")
                return {}
            return {name: True for name in result.keys()}
        except Exception as e:
            logger.error(f"Failed to ping workers: {e}")
            return {}

    def get_active_workers(self) -> List[str]:
        """활성 Worker 목록 조회."""
        try:
            result = self.inspect.active()
            if result is None:
                return []
            return list(result.keys())
        except Exception as e:
            logger.error(f"Failed to get active workers: {e}")
            return []

    def get_worker_stats(self) -> Dict[str, Dict]:
        """Worker 통계 정보 조회."""
        try:
            result = self.inspect.stats()
            return result if result else {}
        except Exception as e:
            logger.error(f"Failed to get worker stats: {e}")
            return {}

    def check_health(self) -> Dict[str, WorkerState]:
        """전체 Worker 헬스 체크 수행."""
        ping_results = self.ping_workers()
        stats = self.get_worker_stats()

        current_time = datetime.utcnow()
        worker_states: Dict[str, WorkerState] = {}

        # 이전 상태 로드
        previous_states = self._load_all_states()

        # 현재 응답한 Worker 처리
        for worker_name in ping_results.keys():
            worker_stats = stats.get(worker_name, {})

            # 활성 태스크 수 계산
            active_count = 0
            try:
                active_result = self.inspect.active()
                if active_result and worker_name in active_result:
                    active_count = len(active_result[worker_name])
            except Exception:
                pass

            # 처리된 태스크 수
            processed_count = 0
            if worker_stats:
                total_stats = worker_stats.get("total", {})
                if isinstance(total_stats, dict):
                    # Celery 5.x 형식
                    for task_type, count in total_stats.items():
                        if isinstance(count, int):
                            processed_count += count

            state = WorkerState(
                name=worker_name,
                status=WorkerStatus.ONLINE,
                last_seen=current_time,
                consecutive_failures=0,
                active_tasks=active_count,
                processed_tasks=processed_count,
            )
            worker_states[worker_name] = state
            self._save_state(state)

        # 이전에 알려진 Worker 중 응답하지 않은 Worker 처리
        for worker_name, prev_state in previous_states.items():
            if worker_name not in worker_states:
                failures = prev_state.get("consecutive_failures", 0) + 1
                last_seen = None
                if prev_state.get("last_seen"):
                    try:
                        last_seen = datetime.fromisoformat(prev_state["last_seen"])
                    except (ValueError, TypeError):
                        pass

                state = WorkerState(
                    name=worker_name,
                    status=WorkerStatus.OFFLINE,
                    last_seen=last_seen,
                    consecutive_failures=failures,
                    active_tasks=0,
                    processed_tasks=prev_state.get("processed_tasks", 0),
                )
                worker_states[worker_name] = state
                self._save_state(state)

        return worker_states

    def _save_state(self, state: WorkerState) -> None:
        """Worker 상태를 Redis에 저장."""
        key = self._get_state_key(state.name)
        self.redis_client.hset(
            key,
            mapping={
                "name": state.name,
                "status": state.status.value,
                "last_seen": state.last_seen.isoformat() if state.last_seen else "",
                "consecutive_failures": str(state.consecutive_failures),
                "active_tasks": str(state.active_tasks),
                "processed_tasks": str(state.processed_tasks),
            },
        )
        # TTL 설정 (7일)
        self.redis_client.expire(key, 7 * 24 * 60 * 60)

    def _load_all_states(self) -> Dict[str, Dict]:
        """Redis에서 모든 Worker 상태 로드."""
        states = {}
        pattern = f"{self.REDIS_KEY_PREFIX}state:*"
        for key in self.redis_client.scan_iter(match=pattern):
            data = self.redis_client.hgetall(key)
            if data:
                # bytes to string
                decoded = {
                    k.decode() if isinstance(k, bytes) else k: v.decode()
                    if isinstance(v, bytes)
                    else v
                    for k, v in data.items()
                }
                worker_name = decoded.get("name", "")
                if worker_name:
                    states[worker_name] = {
                        "last_seen": decoded.get("last_seen") or None,
                        "consecutive_failures": int(
                            decoded.get("consecutive_failures", 0)
                        ),
                        "processed_tasks": int(decoded.get("processed_tasks", 0)),
                    }
        return states

    def is_worker_down(self, state: WorkerState) -> bool:
        """Worker가 Down 상태인지 판단."""
        return (
            state.status == WorkerStatus.OFFLINE
            and state.consecutive_failures >= settings.WORKER_DOWN_THRESHOLD
        )

    def get_summary(self) -> Dict[str, Any]:
        """전체 Worker 상태 요약."""
        states = self.check_health()

        online = sum(1 for s in states.values() if s.status == WorkerStatus.ONLINE)
        offline = sum(1 for s in states.values() if s.status == WorkerStatus.OFFLINE)

        return {
            "total_workers": len(states),
            "online": online,
            "offline": offline,
            "workers": [s.to_dict() for s in states.values()],
            "checked_at": datetime.utcnow().isoformat(),
        }

    def clear_worker_state(self, worker_name: str) -> None:
        """특정 Worker 상태 삭제 (테스트용)."""
        key = self._get_state_key(worker_name)
        self.redis_client.delete(key)

    def clear_all_states(self) -> None:
        """모든 Worker 상태 삭제 (테스트용)."""
        pattern = f"{self.REDIS_KEY_PREFIX}state:*"
        for key in self.redis_client.scan_iter(match=pattern):
            self.redis_client.delete(key)
