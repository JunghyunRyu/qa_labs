"""Celery tasks for processing submissions."""

from uuid import UUID
import logging

from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.models.db import SessionLocal
from app.services.submission_service import SubmissionService

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 기본 재시도 지연 시간 (초) - retry_backoff와 함께 사용
    retry_backoff=True,  # 지수 백오프 활성화
    retry_backoff_max=600,  # 최대 재시도 간격 (10분)
    retry_jitter=True,  # 재시도 시간 랜덤화 (thundering herd 문제 방지)
)
def process_submission_task(self, submission_id: str) -> None:
    """
    Celery task to process a submission.

    Args:
        submission_id: Submission ID as string (UUID)
    """
    submission_uuid = UUID(submission_id)
    logger.info(f"Starting Celery task for submission: {submission_uuid}")

    # 데이터베이스 세션 생성
    db: Session = SessionLocal()
    try:
        service = SubmissionService(db)
        service.process_submission(submission_uuid)
        logger.info(f"Successfully processed submission: {submission_uuid}")
    except Exception as e:
        logger.error(
            f"Error in Celery task for submission {submission_uuid}: {e}",
            exc_info=True,
        )
        # 재시도 로직
        # retry_backoff=True로 인해 Celery가 자동으로 지수 백오프 계산
        # retry_jitter=True로 인해 재시도 시간에 랜덤 요소 추가
        if self.request.retries < self.max_retries:
            logger.info(
                f"Retrying task for submission {submission_uuid} "
                f"(attempt {self.request.retries + 1}/{self.max_retries})"
            )
            raise self.retry(exc=e)
        else:
            logger.error(
                f"Max retries reached for submission {submission_uuid}. "
                f"Marking as ERROR."
            )
            # 최종 실패 시 에러 상태로 업데이트
            try:
                from app.repositories.submission_repository import SubmissionRepository
                submission_repo = SubmissionRepository(db)
                submission = submission_repo.get_by_id(submission_uuid)
                if submission:
                    submission.status = "ERROR"
                    submission.execution_log = {
                        "error": f"Task failed after {self.max_retries} retries: {str(e)}"
                    }
                    submission_repo.update(submission)
            except Exception as update_error:
                logger.error(
                    f"Failed to update submission status: {update_error}",
                    exc_info=True,
                )
    finally:
        db.close()

