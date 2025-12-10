"""
Standalone Worker Monitor Scheduler.

This script runs independently of Celery workers and monitors their health.
Uses APScheduler to run health checks periodically.
"""

import logging
import sys
import signal
from datetime import datetime
from typing import Set

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
import redis

# Setup path for imports
sys.path.insert(0, "/app")

from app.core.config import settings
from app.services.worker_monitor import WorkerMonitor, WorkerStatus
from app.services.slack_notifier import SlackNotifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
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
        self.redis_client.expire(self.REDIS_KEY, 24 * 60 * 60)

    def mark_recovered(self, worker_name: str) -> None:
        """Worker를 복구됨으로 표시 (알림 상태 제거)."""
        self.redis_client.srem(self.REDIS_KEY, worker_name)


def check_worker_health():
    """Worker 헬스 체크 수행."""
    if not settings.WORKER_MONITOR_ENABLED:
        logger.debug("[MONITOR_DISABLED] Worker monitoring is disabled")
        return

    logger.info("[HEALTH_CHECK_START] Starting worker health check...")

    try:
        monitor = WorkerMonitor()
        notifier = SlackNotifier()
        alert_state = AlertStateManager()

        states = monitor.check_health()
        alerted_workers = alert_state.get_alerted_workers()

        down_workers = []
        recovered_workers = []

        for worker_name, state in states.items():
            is_down = monitor.is_worker_down(state)
            was_alerted = worker_name in alerted_workers

            if is_down and not was_alerted:
                down_workers.append(state)
                alert_state.mark_alerted(worker_name)
                logger.warning(
                    f"[WORKER_DOWN] worker={worker_name} failures={state.consecutive_failures}"
                )
            elif not is_down and was_alerted:
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

        # 모든 Worker Down 알림 (새로 Down된 Worker가 있을 때만)
        if down_workers and states and all(monitor.is_worker_down(s) for s in states.values()):
            try:
                notifier.send_all_workers_down_alert_sync()
            except Exception as e:
                logger.error(f"[ALERT_SEND_ERROR] Failed to send all-down alert: {e}")

        # 복구 알림 전송
        for state in recovered_workers:
            try:
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

    except Exception as e:
        logger.error(f"[HEALTH_CHECK_ERROR] Worker health check failed: {e}")


def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("Worker Monitor Scheduler Starting...")
    logger.info(f"Check interval: {settings.WORKER_MONITOR_INTERVAL_SECONDS} seconds")
    logger.info(f"Down threshold: {settings.WORKER_DOWN_THRESHOLD} consecutive failures")
    logger.info(f"Slack alerts: {'enabled' if settings.SLACK_ALERT_ENABLED else 'disabled'}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info("=" * 60)

    scheduler = BlockingScheduler()

    # Add health check job
    scheduler.add_job(
        check_worker_health,
        trigger=IntervalTrigger(seconds=settings.WORKER_MONITOR_INTERVAL_SECONDS),
        id="check_worker_health",
        name="Check Worker Health",
        replace_existing=True,
        next_run_time=datetime.now(),  # Run immediately on start
    )

    # Graceful shutdown handler
    def shutdown(signum, frame):
        logger.info("Shutting down scheduler...")
        scheduler.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    main()
