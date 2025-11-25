"""Submission service for processing submissions."""

from uuid import UUID
from typing import Dict, Any
import logging

from sqlalchemy.orm import Session

from app.models.submission import Submission
from app.models.problem import Problem
from app.repositories.submission_repository import SubmissionRepository
from app.repositories.problem_repository import ProblemRepository
from app.repositories.buggy_implementation_repository import BuggyImplementationRepository
from app.services.judge_service import JudgeService
from app.services.ai_feedback_engine import generate_feedback

logger = logging.getLogger(__name__)


class SubmissionService:
    """Service for processing submissions."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.problem_repo = ProblemRepository(db)
        self.buggy_repo = BuggyImplementationRepository(db)
        self.judge_service = JudgeService()

    def process_submission(self, submission_id: UUID) -> None:
        """
        Process a submission: run tests against golden code and mutants.

        Args:
            submission_id: Submission ID to process
        """
        logger.info(f"Processing submission: {submission_id}")

        # 1. Submission 조회
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            logger.error(f"Submission not found: {submission_id}")
            return

        # 상태를 RUNNING으로 변경
        submission.status = "RUNNING"
        self.submission_repo.update(submission)

        try:
            # 2. Problem 및 BuggyImplementations 조회
            problem = self.problem_repo.get_by_id(submission.problem_id)
            if not problem:
                logger.error(f"Problem not found: {submission.problem_id}")
                submission.status = "ERROR"
                submission.execution_log = {"error": "Problem not found"}
                self.submission_repo.update(submission)
                return

            mutants = self.buggy_repo.get_by_problem_id(problem.id)

            # 3. Golden Code로 pytest 실행
            logger.info(f"Running tests against golden code for submission {submission_id}")
            golden_result = self.judge_service.test_golden_code(
                golden_code=problem.golden_code,
                user_test_code=submission.code,
            )

            # 4. 실패 시 FAILURE 상태로 저장 및 종료
            if not golden_result.get("all_tests_passed", False):
                logger.warning(
                    f"Golden code tests failed for submission {submission_id}. "
                    f"Exit code: {golden_result.get('exit_code')}"
                )
                submission.status = "FAILURE"
                submission.score = 0
                submission.execution_log = {"golden": golden_result}
                self.submission_repo.update(submission)
                return

            # 5. 성공 시 각 Mutant에 대해 pytest 실행
            logger.info(f"Running tests against {len(mutants)} mutants for submission {submission_id}")
            killed = 0
            mutant_logs = []

            for mutant in mutants:
                mutant_result = self.judge_service.test_buggy_code(
                    buggy_code=mutant.buggy_code,
                    user_test_code=submission.code,
                )
                mutant_logs.append(
                    {
                        "mutant_id": mutant.id,
                        "bug_description": mutant.bug_description,
                        "weight": mutant.weight,
                        "result": mutant_result,
                    }
                )

                # 테스트가 실패하면 mutant를 kill한 것
                if mutant_result.get("any_test_failed", False):
                    killed += mutant.weight
                    logger.debug(
                        f"Mutant {mutant.id} killed (weight: {mutant.weight})"
                    )

            # 6. Kill ratio 계산
            total_weight = sum(m.weight for m in mutants) if mutants else 1
            kill_ratio = killed / total_weight if total_weight > 0 else 0.0

            # 7. 점수 계산 (base_score + kill_ratio * 70)
            base_score = 30
            score = base_score + int(kill_ratio * 70)

            logger.info(
                f"Submission {submission_id} processed: "
                f"killed={killed}/{total_weight}, kill_ratio={kill_ratio:.2f}, score={score}"
            )

            # 8. AI 피드백 생성
            logger.info(f"Generating AI feedback for submission {submission_id}")
            try:
                feedback = generate_feedback(
                    problem_title=problem.title,
                    problem_description=problem.description_md,
                    problem_skills=problem.skills or [],
                    test_code=submission.code,
                    score=score,
                    killed_mutants=killed,
                    total_mutants=total_weight,
                    kill_ratio=kill_ratio,
                    execution_log={
                        "golden": golden_result,
                        "mutants": mutant_logs,
                    },
                )
                logger.info(f"AI feedback generated successfully for submission {submission_id}")
            except Exception as e:
                logger.error(f"Failed to generate AI feedback for submission {submission_id}: {e}", exc_info=True)
                # 피드백 생성 실패해도 채점은 완료된 것으로 처리
                feedback = None

            # 9. 결과 DB 저장
            submission.status = "SUCCESS"
            submission.score = score
            submission.killed_mutants = killed
            submission.total_mutants = total_weight
            submission.execution_log = {
                "golden": golden_result,
                "mutants": mutant_logs,
            }
            submission.feedback_json = feedback

            self.submission_repo.update(submission)

        except Exception as e:
            logger.error(f"Error processing submission {submission_id}: {e}", exc_info=True)
            submission.status = "ERROR"
            submission.execution_log = {"error": str(e)}
            self.submission_repo.update(submission)

