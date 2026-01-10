"""Cleanup tasks for expired data (Celery Beat)."""

import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.models.db import SessionLocal
from app.models.withdrawal_log import WithdrawalLog

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.workers.cleanup_tasks.cleanup_expired_withdrawal_logs",
    bind=True,
    max_retries=1,
    ignore_result=True,
)
def cleanup_expired_withdrawal_logs(self):
    """
    Delete expired withdrawal_logs (1년 경과).

    개인정보보호법 준수를 위해 보관 기간이 만료된 탈퇴 기록을 삭제합니다.
    - 실행 주기: 매일 1회 (Celery Beat)
    - 삭제 대상: expire_at < 현재 시간
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # Count before deletion for logging
        expired_count = db.query(WithdrawalLog).filter(
            WithdrawalLog.expire_at < now
        ).count()

        if expired_count == 0:
            logger.info("[CLEANUP] No expired withdrawal_logs to delete")
            return {"deleted": 0}

        # Delete expired records
        deleted = db.query(WithdrawalLog).filter(
            WithdrawalLog.expire_at < now
        ).delete()

        db.commit()

        logger.info(
            f"[CLEANUP_SUCCESS] Deleted {deleted} expired withdrawal_logs "
            f"(expire_at < {now.isoformat()})"
        )

        return {"deleted": deleted}

    except Exception as e:
        db.rollback()
        logger.error(f"[CLEANUP_ERROR] Failed to delete expired withdrawal_logs: {e}")
        raise

    finally:
        db.close()
