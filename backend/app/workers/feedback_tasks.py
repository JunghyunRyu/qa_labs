"""
Celery tasks for PR4: 심화/성공 분석 피드백 비동기 생성

Celery를 사용하여 피드백 생성을 비동기로 처리합니다.
"""

import logging
from uuid import UUID

from celery import current_app as celery_app
from sqlalchemy.orm import Session
from sentry_sdk import capture_exception

from app.models.db import SessionLocal
from app.services.deep_feedback_service import DeepFeedbackService
from app.services.success_analysis_service import SuccessAnalysisService

logger = logging.getLogger(__name__)


def capture_exception_with_context(e, context=None, tags=None):
    """Sentry에 예외 보고 (선택적)"""
    try:
        if context:
            from sentry_sdk import set_context
            for key, value in context.items():
                set_context(key, value)
        if tags:
            from sentry_sdk import set_tag
            for key, value in tags.items():
                set_tag(key, value)
        capture_exception(e)
    except Exception:
        pass  # Sentry 오류는 무시


@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def generate_deep_feedback_task(self, feedback_id: str) -> None:
    """
    심화 분석 피드백 생성 Celery task

    Args:
        feedback_id: Feedback ID as string (UUID)
    """
    feedback_uuid = UUID(feedback_id)
    logger.info(f"[DEEP_FEEDBACK_TASK_START] feedback_id={feedback_uuid}")

    db: Session = SessionLocal()
    try:
        deep_service = DeepFeedbackService(db)
        deep_service.generate_deep_feedback(feedback_uuid)

        logger.info(f"[DEEP_FEEDBACK_TASK_SUCCESS] feedback_id={feedback_uuid}")

    except Exception as e:
        capture_exception_with_context(
            e,
            context={
                "celery_task": {
                    "task_id": self.request.id,
                    "task_name": self.name,
                    "feedback_id": str(feedback_uuid),
                    "retries": self.request.retries,
                    "max_retries": self.max_retries,
                }
            },
            tags={
                "task_name": "generate_deep_feedback_task",
                "feedback_id": str(feedback_uuid),
                "retry_count": str(self.request.retries),
            }
        )

        logger.error(
            f"[DEEP_FEEDBACK_TASK_ERROR] feedback_id={feedback_uuid} "
            f"error_type={type(e).__name__} error_message={str(e)}",
            exc_info=True,
        )

        # 재시도
        if self.request.retries < self.max_retries:
            logger.info(
                f"[DEEP_FEEDBACK_TASK_RETRY] feedback_id={feedback_uuid} "
                f"attempt={self.request.retries + 1}/{self.max_retries}"
            )
            raise self.retry(exc=e)
        else:
            logger.error(
                f"[DEEP_FEEDBACK_TASK_FAILED] feedback_id={feedback_uuid} "
                f"reason=max_retries_reached"
            )

    finally:
        db.close()


@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def generate_success_analysis_task(self, feedback_id: str) -> None:
    """
    성공 분석 피드백 생성 Celery task

    Args:
        feedback_id: Feedback ID as string (UUID)
    """
    feedback_uuid = UUID(feedback_id)
    logger.info(f"[SUCCESS_ANALYSIS_TASK_START] feedback_id={feedback_uuid}")

    db: Session = SessionLocal()
    try:
        success_service = SuccessAnalysisService(db)
        success_service.generate_success_analysis(feedback_uuid)

        logger.info(f"[SUCCESS_ANALYSIS_TASK_SUCCESS] feedback_id={feedback_uuid}")

    except Exception as e:
        capture_exception_with_context(
            e,
            context={
                "celery_task": {
                    "task_id": self.request.id,
                    "task_name": self.name,
                    "feedback_id": str(feedback_uuid),
                    "retries": self.request.retries,
                    "max_retries": self.max_retries,
                }
            },
            tags={
                "task_name": "generate_success_analysis_task",
                "feedback_id": str(feedback_uuid),
                "retry_count": str(self.request.retries),
            }
        )

        logger.error(
            f"[SUCCESS_ANALYSIS_TASK_ERROR] feedback_id={feedback_uuid} "
            f"error_type={type(e).__name__} error_message={str(e)}",
            exc_info=True,
        )

        # 재시도
        if self.request.retries < self.max_retries:
            logger.info(
                f"[SUCCESS_ANALYSIS_TASK_RETRY] feedback_id={feedback_uuid} "
                f"attempt={self.request.retries + 1}/{self.max_retries}"
            )
            raise self.retry(exc=e)
        else:
            logger.error(
                f"[SUCCESS_ANALYSIS_TASK_FAILED] feedback_id={feedback_uuid} "
                f"reason=max_retries_reached"
            )

    finally:
        db.close()


@celery_app.task(
    bind=True,
    max_retries=1,
    default_retry_delay=10,
)
def auto_trigger_success_analysis_task(self, submission_id: str, user_id: str) -> None:
    """
    100점 달성 시 자동 성공 분석 트리거 task

    채점 완료 후 호출되어 100점인 경우 성공 분석을 자동 생성합니다.

    Args:
        submission_id: Submission ID as string (UUID)
        user_id: User ID as string (UUID)
    """
    submission_uuid = UUID(submission_id)
    user_uuid = UUID(user_id)

    logger.info(
        f"[AUTO_SUCCESS_ANALYSIS_CHECK] submission_id={submission_uuid} "
        f"user_id={user_uuid}"
    )

    db: Session = SessionLocal()
    try:
        from app.models.submission import Submission
        from app.models.user import User
        from app.services.plan_service import PlanService
        from app.core.plan_config import Feature

        submission = db.query(Submission).filter(Submission.id == submission_uuid).first()
        if not submission:
            logger.warning(f"[AUTO_SUCCESS_ANALYSIS_SKIP] submission not found: {submission_uuid}")
            return

        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            logger.warning(f"[AUTO_SUCCESS_ANALYSIS_SKIP] user not found: {user_uuid}")
            return

        # Plan 확인 (Lite/Pro만 성공 분석 지원)
        plan_service = PlanService(db)
        if not plan_service.has_feature(user, Feature.SUCCESS_ANALYSIS):
            logger.info(
                f"[AUTO_SUCCESS_ANALYSIS_SKIP] user {user_uuid} does not have "
                f"SUCCESS_ANALYSIS feature"
            )
            return

        # 성공 분석 트리거
        success_service = SuccessAnalysisService(db)
        feedback = success_service.auto_trigger_for_perfect_score(submission, user)

        if feedback and feedback.status == "pending":
            # 새로 생성된 경우 생성 태스크 호출
            generate_success_analysis_task.delay(str(feedback.id))
            logger.info(
                f"[AUTO_SUCCESS_ANALYSIS_TRIGGERED] feedback_id={feedback.id} "
                f"submission_id={submission_uuid}"
            )
        elif feedback:
            logger.info(
                f"[AUTO_SUCCESS_ANALYSIS_EXISTS] feedback_id={feedback.id} "
                f"status={feedback.status}"
            )
        else:
            logger.info(
                f"[AUTO_SUCCESS_ANALYSIS_NOT_ELIGIBLE] submission_id={submission_uuid} "
                f"score={submission.score}"
            )

    except Exception as e:
        logger.error(
            f"[AUTO_SUCCESS_ANALYSIS_ERROR] submission_id={submission_uuid} "
            f"error={e}",
            exc_info=True,
        )
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)

    finally:
        db.close()
