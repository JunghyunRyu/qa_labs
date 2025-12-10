"""Monitoring tasks for Celery Beat."""

import logging
from datetime import datetime
from typing import Set

import redis

from app.core.celery_app import celery_app
from app.core.config import settings
from app.services.worker_monitor import WorkerMonitor, WorkerStatus
from app.services.slack_notifier import SlackNotifier

logger = logging.getLogger(__name__)


class AlertStateManager:
    """Alert 상태 관리 (중복 방지)."""

    REDIS_KEY = "worker_monitor:alert_state"

    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)

    def get_alerted_workers(self) -> Set[str]:
        """이미 알림이 전송된 Worker 목록."""
        members = self.redis_client.smembers(self.REDIS_KEY)
        return {m.decode() if isinstance(m, bytes) else m for m in members}

    def mark_alerted(self, worker_name: str) -> None:
        """Worker를 알림 전송됨으로 표시."""
        self.redis_client.sadd(self.REDIS_KEY, worker_name)
        # TTL 설정 (1일)
        self.redis_client.expire(self.REDIS_KEY, 24 * 60 * 60)

    def mark_recovered(self, worker_name: str) -> None:
        """Worker를 복구됨으로 표시 (알림 상태 제거)."""
        self.redis_client.srem(self.REDIS_KEY, worker_name)

    def clear_all(self) -> None:
        """모든 알림 상태 초기화 (테스트용)."""
        self.redis_client.delete(self.REDIS_KEY)


@celery_app.task(
    name="app.workers.monitoring_tasks.check_worker_health",
    bind=True,
    max_retries=0,
    ignore_result=True,
)
def check_worker_health(self):
    """
    Worker 헬스 체크 및 알림 전송.

    Celery Beat에 의해 주기적으로 실행됨.
    """
    if not settings.WORKER_MONITOR_ENABLED:
        logger.debug("[MONITOR_DISABLED] Worker monitoring is disabled")
        return {"status": "disabled"}

    logger.info("[HEALTH_CHECK_START] Starting worker health check...")

    monitor = WorkerMonitor()
    notifier = SlackNotifier()
    alert_state = AlertStateManager()

    try:
        states = monitor.check_health()
        alerted_workers = alert_state.get_alerted_workers()

        down_workers = []
        recovered_workers = []

        for worker_name, state in states.items():
            is_down = monitor.is_worker_down(state)
            was_alerted = worker_name in alerted_workers

            if is_down and not was_alerted:
                # 새로 Down된 Worker
                down_workers.append(state)
                alert_state.mark_alerted(worker_name)
                logger.warning(
                    f"[WORKER_DOWN] worker={worker_name} failures={state.consecutive_failures}"
                )
            elif not is_down and was_alerted:
                # 복구된 Worker
                recovered_workers.append(state)
                alert_state.mark_recovered(worker_name)
                logger.info(f"[WORKER_RECOVERED] worker={worker_name}")

        # Down 알림 전송
        for state in down_workers:
            try:
                notifier.send_worker_down_alert_sync(
                    worker_name=state.name,
                    last_seen=state.last_seen,
                    consecutive_failures=state.consecutive_failures,
                )
            except Exception as e:
                logger.error(f"[ALERT_SEND_ERROR] Failed to send down alert: {e}")

        # 모든 Worker Down 알림
        if states and all(monitor.is_worker_down(s) for s in states.values()):
            try:
                notifier.send_all_workers_down_alert_sync()
            except Exception as e:
                logger.error(f"[ALERT_SEND_ERROR] Failed to send all-down alert: {e}")

        # 복구 알림 전송
        for state in recovered_workers:
            try:
                # Downtime 계산
                downtime_minutes = None
                if state.last_seen:
                    downtime = datetime.utcnow() - state.last_seen
                    downtime_minutes = int(downtime.total_seconds() / 60)

                notifier.send_worker_recovery_alert_sync(
                    worker_name=state.name,
                    downtime_minutes=downtime_minutes,
                )
            except Exception as e:
                logger.error(f"[ALERT_SEND_ERROR] Failed to send recovery alert: {e}")

        # 상태 요약 로그
        online = sum(1 for s in states.values() if s.status == WorkerStatus.ONLINE)
        offline = sum(1 for s in states.values() if s.status == WorkerStatus.OFFLINE)
        logger.info(
            f"[HEALTH_CHECK_COMPLETE] online={online} offline={offline} "
            f"new_down={len(down_workers)} recovered={len(recovered_workers)}"
        )

        return {
            "status": "completed",
            "online": online,
            "offline": offline,
            "new_down": len(down_workers),
            "recovered": len(recovered_workers),
        }

    except Exception as e:
        logger.error(f"[HEALTH_CHECK_ERROR] Worker health check failed: {e}")
        return {"status": "error", "error": str(e)}
