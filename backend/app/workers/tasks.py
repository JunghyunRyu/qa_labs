"""Celery tasks for processing submissions."""

from uuid import UUID
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.sentry import init_sentry, capture_exception_with_context
from app.models.db import SessionLocal
from app.services.submission_service import SubmissionService
from app.services.ai_feedback_engine import generate_feedback
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.problem_repository import ProblemRepository
from app.middleware.request_context import set_correlation_id

logger = logging.getLogger(__name__)

# Celery Worker에서도 Sentry 초기화
init_sentry()


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,  # 기본 재시도 지연 시간 (초) - retry_backoff와 함께 사용
    retry_backoff=True,  # 지수 백오프 활성화
    retry_backoff_max=600,  # 최대 재시도 간격 (10분)
    retry_jitter=True,  # 재시도 시간 랜덤화 (thundering herd 문제 방지)
)
def process_submission_task(self, submission_id: str, correlation_id: Optional[str] = None) -> None:
    """
    Celery task to process a submission.

    Args:
        submission_id: Submission ID as string (UUID)
        correlation_id: Request ID from the original API call (for tracing)
    """
    submission_uuid = UUID(submission_id)
    # Correlation ID 설정 (하위 로깅에서 사용)
    if correlation_id:
        set_correlation_id(correlation_id)
    log_prefix = f"[{correlation_id or '-'}]" if correlation_id else ""
    logger.info(f"{log_prefix} [TASK_START] submission={submission_uuid} task_id={self.request.id}")

    # 데이터베이스 세션 생성
    db: Session = SessionLocal()
    try:
        service = SubmissionService(db)
        service.process_submission(submission_uuid)
        logger.info(f"{log_prefix} [TASK_COMPLETE] submission={submission_uuid} status=success")
    except Exception as e:
        # Sentry에 에러 보고 (컨텍스트 포함)
        capture_exception_with_context(
            e,
            context={
                "celery_task": {
                    "task_id": self.request.id,
                    "task_name": self.name,
                    "submission_id": str(submission_uuid),
                    "correlation_id": correlation_id,
                    "retries": self.request.retries,
                    "max_retries": self.max_retries,
                }
            },
            tags={
                "task_name": "process_submission_task",
                "submission_id": str(submission_uuid),
                "correlation_id": correlation_id or "-",
                "retry_count": str(self.request.retries),
            }
        )

        logger.error(
            f"{log_prefix} [TASK_ERROR] submission={submission_uuid} error={e}",
            exc_info=True,
        )
        # 재시도 로직
        # retry_backoff=True로 인해 Celery가 자동으로 지수 백오프 계산
        # retry_jitter=True로 인해 재시도 시간에 랜덤 요소 추가
        if self.request.retries < self.max_retries:
            logger.info(
                f"{log_prefix} [TASK_RETRY] submission={submission_uuid} "
                f"attempt={self.request.retries + 1}/{self.max_retries}"
            )
            raise self.retry(exc=e)
        else:
            logger.error(
                f"{log_prefix} [TASK_MAX_RETRIES] submission={submission_uuid} "
                f"max_retries={self.max_retries}"
            )
            # 최종 실패 시 에러 상태로 업데이트
            try:
                from app.repositories.submission_repository import SubmissionRepository
                submission_repo = SubmissionRepository(db)
                submission = submission_repo.get_by_id(submission_uuid)
                if submission:
                    submission.status = "ERROR"
                    submission.execution_log = {
                        "error": f"Task failed after {self.max_retries} retries: {str(e)}",
                        "correlation_id": correlation_id,
                    }
                    submission_repo.update(submission)
            except Exception as update_error:
                logger.error(
                    f"{log_prefix} [TASK_STATUS_UPDATE_ERROR] submission={submission_uuid} error={update_error}",
                    exc_info=True,
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
def generate_feedback_task(self, submission_id: str) -> None:
    """
    AI 피드백만 생성하는 독립 Celery task.

    클라이언트 사이드 실행(Pyodide) 후 호출되어 AI 피드백을 비동기로 생성합니다.
    채점 결과는 이미 저장되어 있으므로, 피드백 생성 실패해도 채점 결과는 유지됩니다.

    Args:
        submission_id: Submission ID as string (UUID)
    """
    submission_uuid = UUID(submission_id)
    logger.info(f"[AI_FEEDBACK_TASK_START] submission_id={submission_uuid}")

    db: Session = SessionLocal()
    try:
        submission_repo = SubmissionRepository(db)
        problem_repo = ProblemRepository(db)

        # 1. Submission 조회
        submission = submission_repo.get_by_id(submission_uuid)
        if not submission:
            logger.error(f"[AI_FEEDBACK_TASK_ERROR] submission_id={submission_uuid} reason=submission_not_found")
            return

        # 2. 이미 피드백이 있으면 스킵
        if submission.feedback_json:
            logger.info(f"[AI_FEEDBACK_TASK_SKIP] submission_id={submission_uuid} reason=feedback_already_exists")
            return

        # 3. 회원만 피드백 생성 (게스트 제외)
        if not submission.user_id:
            logger.info(f"[AI_FEEDBACK_TASK_SKIP] submission_id={submission_uuid} reason=guest_user")
            return

        # 4. Problem 조회
        problem = problem_repo.get_by_id(submission.problem_id)
        if not problem:
            logger.error(f"[AI_FEEDBACK_TASK_ERROR] submission_id={submission_uuid} reason=problem_not_found")
            return

        # 5. kill_ratio 계산
        total_mutants = submission.total_mutants or 1
        killed_mutants = submission.killed_mutants or 0
        kill_ratio = killed_mutants / total_mutants if total_mutants > 0 else 0.0

        # 6. AI 피드백 생성
        logger.info(f"[AI_FEEDBACK_GENERATING] submission_id={submission_uuid} score={submission.score}")
        feedback = generate_feedback(
            problem_title=problem.title,
            problem_description=problem.description_md,
            problem_skills=problem.skills or [],
            test_code=submission.code,
            score=submission.score or 0,
            killed_mutants=killed_mutants,
            total_mutants=total_mutants,
            kill_ratio=kill_ratio,
            execution_log=submission.execution_log or {},
        )

        # 7. DB 업데이트
        submission.feedback_json = feedback
        submission_repo.update(submission)

        logger.info(f"[AI_FEEDBACK_TASK_SUCCESS] submission_id={submission_uuid}")

    except Exception as e:
        # Sentry에 에러 보고
        capture_exception_with_context(
            e,
            context={
                "celery_task": {
                    "task_id": self.request.id,
                    "task_name": self.name,
                    "submission_id": str(submission_uuid),
                    "retries": self.request.retries,
                    "max_retries": self.max_retries,
                }
            },
            tags={
                "task_name": "generate_feedback_task",
                "submission_id": str(submission_uuid),
                "retry_count": str(self.request.retries),
            }
        )

        logger.error(
            f"[AI_FEEDBACK_TASK_ERROR] submission_id={submission_uuid} "
            f"error_type={type(e).__name__} error_message={str(e)}",
            exc_info=True,
        )

        # 재시도
        if self.request.retries < self.max_retries:
            logger.info(
                f"[AI_FEEDBACK_TASK_RETRY] submission_id={submission_uuid} "
                f"attempt={self.request.retries + 1}/{self.max_retries}"
            )
            raise self.retry(exc=e)
        else:
            # 최종 실패 - execution_log에 에러 기록 (채점 결과는 유지)
            logger.error(
                f"[AI_FEEDBACK_TASK_FAILED] submission_id={submission_uuid} "
                f"reason=max_retries_reached"
            )
            try:
                submission = submission_repo.get_by_id(submission_uuid)
                if submission and submission.execution_log:
                    execution_log = dict(submission.execution_log)
                    execution_log["feedback_error"] = f"AI 피드백 생성 실패: {str(e)}"
                    submission.execution_log = execution_log
                    submission_repo.update(submission)
            except Exception as update_error:
                logger.error(
                    f"[AI_FEEDBACK_TASK_UPDATE_ERROR] submission_id={submission_uuid} "
                    f"error={update_error}",
                    exc_info=True,
                )
    finally:
        db.close()
