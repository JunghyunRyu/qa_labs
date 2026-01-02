"""
Success Analysis Service for PR4: 성공 분석 (100점 달성 시)

100점을 달성한 제출에 대해 성취 하이라이트, 사용된 고급 기법,
다음 도전 추천 등을 제공합니다.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.feedback import Feedback, FeedbackType, FeedbackStatus, CURRENT_SCHEMA_VERSION
from app.models.submission import Submission
from app.models.user import User
from app.services.ai_feedback_engine import generate_feedback

logger = logging.getLogger(__name__)

KST = ZoneInfo("Asia/Seoul")


class SuccessAnalysisService:
    """
    성공 분석 서비스

    기능:
    - 100점 달성 시 자동 생성 (Lite/Pro)
    - 성취 하이라이트
    - 사용된 고급 테스트 기법 분석
    - 다음 도전 추천

    제한:
    - Lite/Pro 플랜만 사용 가능
    - 100점 달성 시에만 생성
    - 토큰 비용: 1
    """

    TOKEN_COST = 1
    REQUIRED_SCORE = 100

    def __init__(self, db: Session):
        self.db = db

    def is_eligible(self, submission: Submission) -> bool:
        """성공 분석 대상 여부 확인"""
        return submission.score == self.REQUIRED_SCORE

    def create_pending_feedback(
        self,
        submission: Submission,
        user: User,
    ) -> Feedback:
        """
        대기 중인 성공 분석 피드백 생성

        Args:
            submission: 제출 객체
            user: 사용자 객체

        Returns:
            생성된 Feedback 객체
        """
        feedback = Feedback(
            submission_id=submission.id,
            user_id=user.id,
            feedback_type=FeedbackType.SUCCESS.value,
            status=FeedbackStatus.PENDING.value,
            schema_version=CURRENT_SCHEMA_VERSION,
            token_cost=self.TOKEN_COST,
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)

        logger.info(
            f"[SUCCESS_ANALYSIS_CREATED] feedback_id={feedback.id} "
            f"submission_id={submission.id} user_id={user.id}"
        )

        return feedback

    def generate_success_analysis(
        self,
        feedback_id: UUID,
    ) -> Dict[str, Any]:
        """
        성공 분석 피드백 생성 (Celery task에서 호출)

        Args:
            feedback_id: 피드백 ID

        Returns:
            생성된 피드백 내용
        """
        feedback = self.db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            raise ValueError(f"Feedback not found: {feedback_id}")

        # 상태를 GENERATING으로 변경
        feedback.mark_generating()
        self.db.commit()

        try:
            submission = self.db.query(Submission).filter(
                Submission.id == feedback.submission_id
            ).first()

            if not submission:
                raise ValueError(f"Submission not found: {feedback.submission_id}")

            problem = submission.problem

            # 기본 피드백 생성 (verbosity=low - 성공이므로 간결하게)
            base_content = generate_feedback(
                problem_title=problem.title,
                problem_description=problem.description_md,
                problem_skills=problem.skills or [],
                test_code=submission.code,
                score=submission.score or 0,
                killed_mutants=submission.killed_mutants or 0,
                total_mutants=submission.total_mutants or 1,
                kill_ratio=1.0,  # 100점이므로 kill_ratio = 1.0
                execution_log=submission.execution_log or {},
                verbosity="low",
            )

            # 성공 분석 추가
            success_content = self._enhance_with_success_analysis(
                base_content=base_content,
                submission=submission,
                problem=problem,
            )

            # 완료 처리
            feedback.mark_completed(success_content)
            self.db.commit()

            logger.info(f"[SUCCESS_ANALYSIS_COMPLETED] feedback_id={feedback_id}")

            return success_content

        except Exception as e:
            logger.error(
                f"[SUCCESS_ANALYSIS_ERROR] feedback_id={feedback_id} error={e}",
                exc_info=True,
            )
            feedback.mark_failed(str(e))
            self.db.commit()
            raise

    def _enhance_with_success_analysis(
        self,
        base_content: Dict[str, Any],
        submission: Submission,
        problem: Any,
    ) -> Dict[str, Any]:
        """
        기본 피드백에 성공 분석 추가

        Args:
            base_content: 기본 피드백 내용
            submission: 제출 객체
            problem: 문제 객체

        Returns:
            성공 분석이 추가된 피드백
        """
        success_content = dict(base_content)

        # 성취 하이라이트
        success_content["achievement_highlights"] = self._generate_achievement_highlights(
            submission, problem
        )

        # 사용된 고급 기법
        success_content["advanced_techniques"] = self._identify_advanced_techniques(
            submission.code
        )

        # 다음 도전 추천
        success_content["learning_path"] = self._suggest_next_challenges(
            problem, submission
        )

        return success_content

    def _generate_achievement_highlights(
        self,
        submission: Submission,
        problem: Any,
    ) -> List[str]:
        """성취 하이라이트 생성"""
        highlights = []

        # 100점 달성
        highlights.append("모든 뮤턴트를 성공적으로 제거했습니다!")

        # 테스트 수 기반 성취
        test_count = submission.code.count("def test_")
        if test_count >= 5:
            highlights.append(f"{test_count}개의 테스트 케이스를 작성했습니다.")
        elif test_count >= 3:
            highlights.append("효율적인 테스트 케이스 구성을 보여주었습니다.")

        # 어설션 수 기반 성취
        assertion_count = submission.code.count("assert")
        if assertion_count >= 10:
            highlights.append("다양한 검증 포인트를 구현했습니다.")

        # 문제 난이도 기반 성취
        difficulty = getattr(problem, "difficulty", None)
        if difficulty == "hard":
            highlights.append("어려운 난이도의 문제를 완벽하게 해결했습니다!")
        elif difficulty == "medium":
            highlights.append("중급 난이도의 문제를 완벽하게 해결했습니다!")

        return highlights

    def _identify_advanced_techniques(self, code: str) -> List[str]:
        """사용된 고급 기법 식별"""
        techniques = []

        if "@pytest.mark.parametrize" in code:
            techniques.append("파라미터화 테스트 (Parametrized Testing)")

        if "@pytest.fixture" in code:
            techniques.append("Pytest Fixtures 활용")

        if "pytest.raises" in code:
            techniques.append("예외 테스트 (Exception Testing)")

        if "mock" in code.lower() or "Mock" in code:
            techniques.append("모킹 (Mocking)")

        if "boundary" in code.lower() or "edge" in code.lower():
            techniques.append("경계값 테스트 (Boundary Testing)")

        if "== 0" in code or "== []" in code or "== ''" in code or '== ""' in code:
            techniques.append("빈 값/제로 케이스 테스트")

        if "negative" in code.lower() or "invalid" in code.lower():
            techniques.append("음성 테스트 (Negative Testing)")

        if not techniques:
            techniques.append("기본 단위 테스트")

        return techniques

    def _suggest_next_challenges(
        self,
        problem: Any,
        submission: Submission,
    ) -> List[str]:
        """다음 도전 추천"""
        suggestions = []

        # 문제 스킬 기반 추천
        skills = getattr(problem, "skills", None) or []

        if "string" in skills or "string manipulation" in skills:
            suggestions.append("더 복잡한 문자열 처리 문제에 도전해보세요.")

        if "array" in skills or "list" in skills:
            suggestions.append("배열/리스트 알고리즘 문제를 풀어보세요.")

        if "recursion" in skills:
            suggestions.append("동적 프로그래밍 문제로 확장해보세요.")

        # 일반적인 추천
        suggestions.append("테스트 커버리지 도구(pytest-cov)를 사용해보세요.")
        suggestions.append("프로퍼티 기반 테스트(Hypothesis)를 학습해보세요.")

        return suggestions[:4]

    def get_existing_success_analysis(
        self,
        submission_id: UUID,
        user_id: UUID,
    ) -> Optional[Feedback]:
        """
        기존 성공 분석 피드백 조회

        Args:
            submission_id: 제출 ID
            user_id: 사용자 ID

        Returns:
            기존 피드백 또는 None
        """
        return self.db.query(Feedback).filter(
            Feedback.submission_id == submission_id,
            Feedback.user_id == user_id,
            Feedback.feedback_type == FeedbackType.SUCCESS.value,
            Feedback.status.in_([
                FeedbackStatus.COMPLETED.value,
                FeedbackStatus.GENERATING.value,
                FeedbackStatus.PENDING.value,
            ]),
        ).order_by(Feedback.created_at.desc()).first()

    def auto_trigger_for_perfect_score(
        self,
        submission: Submission,
        user: User,
    ) -> Optional[Feedback]:
        """
        100점 달성 시 자동으로 성공 분석 트리거

        Args:
            submission: 제출 객체
            user: 사용자 객체

        Returns:
            생성된 Feedback 또는 None (조건 미충족)
        """
        if not self.is_eligible(submission):
            return None

        # 이미 성공 분석이 있으면 스킵
        existing = self.get_existing_success_analysis(submission.id, user.id)
        if existing:
            logger.info(
                f"[SUCCESS_ANALYSIS_SKIP] existing feedback found for "
                f"submission_id={submission.id}"
            )
            return existing

        return self.create_pending_feedback(submission, user)
