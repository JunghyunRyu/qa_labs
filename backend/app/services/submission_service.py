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

    # Golden Code 자체 오류를 나타내는 키워드들
    GOLDEN_CODE_ERROR_KEYWORDS = [
        "ImportError",
        "ModuleNotFoundError",
        "SyntaxError",
        "IndentationError",
        "NameError",
        "AttributeError",
        "TypeError: ",  # 공백 포함하여 일반 assert와 구분
        "cannot import name",
        "No module named",
        "invalid syntax",
        "unexpected indent",
        "expected an indented block",
    ]

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.problem_repo = ProblemRepository(db)
        self.buggy_repo = BuggyImplementationRepository(db)
        self.judge_service = JudgeService()

    def _is_golden_code_error(self, logs: str) -> bool:
        """
        로그에서 Golden Code 자체의 오류인지 판단합니다.
        
        Golden Code 오류: ImportError, SyntaxError 등 코드 자체가 실행 불가한 경우
        사용자 테스트 실패: AssertionError 등 테스트 로직 실패
        
        Args:
            logs: pytest 실행 로그
            
        Returns:
            Golden Code 자체 오류이면 True, 아니면 False
        """
        if not logs:
            return False
        
        # Golden Code 오류 키워드 검사
        for keyword in self.GOLDEN_CODE_ERROR_KEYWORDS:
            if keyword in logs:
                # target.py (Golden Code 파일)에서 발생한 오류인지 확인
                # test_user.py에서 발생한 것은 사용자 테스트 문제
                if "target.py" in logs and keyword in logs:
                    logger.debug(f"Golden Code 오류 감지: {keyword}")
                    return True
        
        return False

    def process_submission(self, submission_id: UUID) -> None:
        """
        Process a submission: run tests against golden code and mutants.

        Args:
            submission_id: Submission ID to process
        """
        logger.info(f"[GRADING_START] submission_id={submission_id}")

        # 1. Submission 조회
        submission = self.submission_repo.get_by_id(submission_id)
        if not submission:
            logger.error(f"[GRADING_ERROR] submission_id={submission_id} reason=submission_not_found")
            return

        # 상태를 RUNNING으로 변경
        submission.status = "RUNNING"
        submission.progress = {
            "step": "initializing",
            "message": "채점 준비 중...",
            "percent": 10
        }
        self.submission_repo.update(submission)
        logger.info(f"[STATUS_CHANGE] submission_id={submission_id} status=PENDING->RUNNING")

        try:
            # 2. Problem 및 BuggyImplementations 조회
            problem = self.problem_repo.get_by_id(submission.problem_id)
            if not problem:
                logger.error(
                    f"[GRADING_ERROR] submission_id={submission_id} "
                    f"problem_id={submission.problem_id} reason=problem_not_found"
                )
                submission.status = "ERROR"
                submission.execution_log = {"error": "Problem not found"}
                self.submission_repo.update(submission)
                logger.info(f"[STATUS_CHANGE] submission_id={submission_id} status=RUNNING->ERROR")
                return

            mutants = self.buggy_repo.get_by_problem_id(problem.id)

            # 3. Golden Code로 pytest 실행
            submission.progress = {
                "step": "testing_golden",
                "message": "정답 코드 테스트 중...",
                "percent": 20
            }
            self.submission_repo.update(submission)
            logger.info(
                f"[GOLDEN_TEST_START] submission_id={submission_id} "
                f"problem_id={problem.id} problem_title={problem.title}"
            )
            golden_result = self.judge_service.test_golden_code(
                golden_code=problem.golden_code,
                user_test_code=submission.code,
            )

            # 4. 실패 시 처리 (ERROR vs FAILURE 구분)
            if not golden_result.get("all_tests_passed", False):
                exit_code = golden_result.get("exit_code", -1)
                execution_time = golden_result.get("execution_time", 0)
                logs = golden_result.get("logs", "") or golden_result.get("stdout", "") or ""
                
                # ERROR 조건 판단:
                # 1. 타임아웃 (exit_code == -1, execution_time >= 4.5초)
                # 2. Golden Code 자체 실행 불가 (ImportError, SyntaxError 등)
                # 3. Docker/시스템 오류 (exit_code == -1)
                is_timeout = exit_code == -1 and execution_time >= 4.5
                is_golden_code_error = self._is_golden_code_error(logs)
                is_system_error = exit_code == -1 and not is_timeout
                
                if is_timeout or is_golden_code_error or is_system_error:
                    # ERROR: 시스템 오류 또는 Golden Code 자체 문제
                    if is_timeout:
                        logger.warning(
                            f"[GOLDEN_TEST_TIMEOUT] submission_id={submission_id} "
                            f"execution_time={execution_time:.2f}s reason=execution_timeout"
                        )
                        golden_result["error_type"] = "timeout"
                        golden_result["error_message"] = (
                            f"테스트 실행 시간 초과 ({execution_time:.2f}초). "
                            f"무한 루프나 과도한 연산이 있는지 확인하세요."
                        )
                    elif is_golden_code_error:
                        logger.error(
                            f"[GOLDEN_CODE_ERROR] submission_id={submission_id} "
                            f"reason=golden_code_execution_failed"
                        )
                        golden_result["error_type"] = "golden_code_error"
                        golden_result["error_message"] = (
                            "Golden Code 실행 중 오류가 발생했습니다. "
                            "문제 정의를 확인해주세요."
                        )
                    else:
                        logger.error(
                            f"[SYSTEM_ERROR] submission_id={submission_id} "
                            f"exit_code={exit_code} reason=system_error"
                        )
                        golden_result["error_type"] = "system_error"
                        golden_result["error_message"] = "시스템 오류가 발생했습니다."
                    
                    submission.status = "ERROR"
                    submission.score = 0
                    submission.execution_log = {"golden": golden_result}
                    self.submission_repo.update(submission)
                    logger.info(f"[STATUS_CHANGE] submission_id={submission_id} status=RUNNING->ERROR")
                    logger.info(f"[GRADING_COMPLETE] submission_id={submission_id} status=ERROR")
                else:
                    # FAILURE: 사용자 테스트가 Golden Code에서 실패
                    logger.warning(
                        f"[GOLDEN_TEST_FAILED] submission_id={submission_id} "
                        f"exit_code={exit_code} reason=user_test_failed_on_golden"
                    )
                    golden_result["error_type"] = "test_failure"
                    golden_result["error_message"] = (
                        "사용자 테스트가 Golden Code(정답 코드)에서 실패했습니다. "
                        "테스트 로직을 확인해주세요."
                    )
                    
                    submission.status = "FAILURE"
                    submission.score = 0
                    submission.execution_log = {"golden": golden_result}
                    self.submission_repo.update(submission)
                    logger.info(f"[STATUS_CHANGE] submission_id={submission_id} status=RUNNING->FAILURE")
                    logger.info(f"[GRADING_COMPLETE] submission_id={submission_id} status=FAILURE score=0")
                return

            # 5. 성공 시 각 Mutant에 대해 pytest 실행
            logger.info(
                f"[MUTANT_TEST_START] submission_id={submission_id} "
                f"total_mutants={len(mutants)}"
            )
            killed = 0
            mutant_logs = []

            for idx, mutant in enumerate(mutants):
                submission.progress = {
                    "step": "testing_buggy",
                    "current": idx + 1,
                    "total": len(mutants),
                    "message": f"버그 구현 {idx+1}/{len(mutants)} 테스트 중...",
                    "percent": 20 + (70 * (idx + 1) // len(mutants))
                }
                self.submission_repo.update(submission)

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
                        f"[MUTANT_KILLED] submission_id={submission_id} "
                        f"mutant_id={mutant.id} weight={mutant.weight}"
                    )

            # 6. Kill ratio 계산
            total_weight = sum(m.weight for m in mutants) if mutants else 1
            kill_ratio = killed / total_weight if total_weight > 0 else 0.0

            # 7. 점수 계산 (base_score + kill_ratio * 70)
            base_score = 30
            score = base_score + int(kill_ratio * 70)

            logger.info(
                f"[SCORE_CALCULATED] submission_id={submission_id} "
                f"killed={killed} total={total_weight} kill_ratio={kill_ratio:.2f} score={score}"
            )

            # 8. AI 피드백 생성
            submission.progress = {
                "step": "generating_feedback",
                "message": "AI 피드백 생성 중...",
                "percent": 95
            }
            self.submission_repo.update(submission)
            logger.info(f"[AI_FEEDBACK_START] submission_id={submission_id}")
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
                logger.info(f"[AI_FEEDBACK_SUCCESS] submission_id={submission_id}")
            except Exception as e:
                logger.error(
                    f"[AI_FEEDBACK_ERROR] submission_id={submission_id} "
                    f"error={type(e).__name__}: {str(e)}",
                    exc_info=True
                )
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
            logger.info(f"[STATUS_CHANGE] submission_id={submission_id} status=RUNNING->SUCCESS")
            logger.info(
                f"[GRADING_COMPLETE] submission_id={submission_id} status=SUCCESS "
                f"score={score} killed={killed}/{total_weight}"
            )

        except Exception as e:
            logger.error(
                f"[GRADING_ERROR] submission_id={submission_id} "
                f"error_type={type(e).__name__} error_message={str(e)}",
                exc_info=True
            )
            submission.status = "ERROR"
            submission.execution_log = {"error": str(e)}
            self.submission_repo.update(submission)
            logger.info(f"[STATUS_CHANGE] submission_id={submission_id} status=RUNNING->ERROR")
            logger.info(f"[GRADING_COMPLETE] submission_id={submission_id} status=ERROR")

