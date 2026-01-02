"""
Deep Feedback Service for PR4: 심화 분석 (유료 기능)

심화 분석은 기본 피드백보다 더 상세한 코드 품질, 테스트 커버리지,
엣지 케이스 분석을 제공합니다.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.feedback import Feedback, FeedbackType, FeedbackStatus, CURRENT_SCHEMA_VERSION
from app.models.submission import Submission
from app.models.user import User
from app.services.redis_cache import RedisCache
from app.services.ai_feedback_engine import generate_feedback

logger = logging.getLogger(__name__)

KST = ZoneInfo("Asia/Seoul")


# 쿨다운 설정 (token-policy.md §7.1)
DEEP_FEEDBACK_COOLDOWN_SECONDS = 60
COOLDOWN_KEY_PREFIX = "cooldown:deep_feedback"


class DeepFeedbackService:
    """
    심화 분석 서비스

    기능:
    - 상세 코드 품질 분석
    - 테스트 커버리지 분석
    - 놓친 엣지 케이스 식별
    - 뮤테이션 분석

    제한:
    - Lite/Pro 플랜만 사용 가능
    - 60초 쿨다운
    - 토큰 비용: 2
    """

    TOKEN_COST = 2

    def __init__(self, db: Session):
        self.db = db
        self.cache = RedisCache.get_instance()

    def check_cooldown(self, user_id: UUID) -> tuple[bool, int]:
        """
        쿨다운 상태 확인

        Args:
            user_id: 사용자 ID

        Returns:
            (is_available, remaining_seconds)
        """
        key = f"{COOLDOWN_KEY_PREFIX}:{user_id}"
        ttl = self.cache.ttl(key)

        if ttl is None or ttl <= 0:
            return True, 0
        return False, ttl

    def set_cooldown(self, user_id: UUID) -> None:
        """쿨다운 설정"""
        key = f"{COOLDOWN_KEY_PREFIX}:{user_id}"
        self.cache.set(key, "1", ttl=DEEP_FEEDBACK_COOLDOWN_SECONDS)

    def create_pending_feedback(
        self,
        submission: Submission,
        user: User,
    ) -> Feedback:
        """
        대기 중인 심화 분석 피드백 생성

        Args:
            submission: 제출 객체
            user: 사용자 객체

        Returns:
            생성된 Feedback 객체
        """
        feedback = Feedback(
            submission_id=submission.id,
            user_id=user.id,
            feedback_type=FeedbackType.DEEP.value,
            status=FeedbackStatus.PENDING.value,
            schema_version=CURRENT_SCHEMA_VERSION,
            token_cost=self.TOKEN_COST,
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)

        logger.info(
            f"[DEEP_FEEDBACK_CREATED] feedback_id={feedback.id} "
            f"submission_id={submission.id} user_id={user.id}"
        )

        return feedback

    def generate_deep_feedback(
        self,
        feedback_id: UUID,
        focus_areas: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        심화 분석 피드백 생성 (Celery task에서 호출)

        Args:
            feedback_id: 피드백 ID
            focus_areas: 집중 분석할 영역

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

            # 기본 피드백 생성 (verbosity=high)
            base_content = generate_feedback(
                problem_title=problem.title,
                problem_description=problem.description_md,
                problem_skills=problem.skills or [],
                test_code=submission.code,
                score=submission.score or 0,
                killed_mutants=submission.killed_mutants or 0,
                total_mutants=submission.total_mutants or 1,
                kill_ratio=(submission.killed_mutants or 0) / max(submission.total_mutants or 1, 1),
                execution_log=submission.execution_log or {},
                verbosity="high",
            )

            # 심화 분석 추가
            deep_content = self._enhance_with_deep_analysis(
                base_content=base_content,
                submission=submission,
                focus_areas=focus_areas,
            )

            # 완료 처리
            feedback.mark_completed(deep_content)
            self.db.commit()

            logger.info(f"[DEEP_FEEDBACK_COMPLETED] feedback_id={feedback_id}")

            return deep_content

        except Exception as e:
            logger.error(
                f"[DEEP_FEEDBACK_ERROR] feedback_id={feedback_id} error={e}",
                exc_info=True,
            )
            feedback.mark_failed(str(e))
            self.db.commit()
            raise

    def _enhance_with_deep_analysis(
        self,
        base_content: Dict[str, Any],
        submission: Submission,
        focus_areas: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        기본 피드백에 심화 분석 추가

        Args:
            base_content: 기본 피드백 내용
            submission: 제출 객체
            focus_areas: 집중 분석할 영역

        Returns:
            심화 분석이 추가된 피드백
        """
        deep_content = dict(base_content)

        # 코드 품질 분석
        deep_content["code_quality"] = self._analyze_code_quality(submission.code)

        # 테스트 커버리지 분석
        deep_content["test_coverage"] = self._analyze_test_coverage(submission)

        # 엣지 케이스 분석
        deep_content["edge_cases"] = self._identify_edge_cases(submission)

        # 뮤테이션 분석
        if submission.execution_log:
            deep_content["mutation_analysis"] = self._analyze_mutations(
                submission.execution_log
            )

        return deep_content

    def _analyze_code_quality(self, code: str) -> Dict[str, Any]:
        """코드 품질 분석"""
        lines = code.split("\n")
        non_empty_lines = [l for l in lines if l.strip()]

        return {
            "total_lines": len(lines),
            "non_empty_lines": len(non_empty_lines),
            "assertion_count": code.count("assert"),
            "test_function_count": code.count("def test_"),
            "has_docstrings": '"""' in code or "'''" in code,
            "uses_fixtures": "@pytest.fixture" in code or "fixture" in code,
            "uses_parametrize": "@pytest.mark.parametrize" in code,
        }

    def _analyze_test_coverage(self, submission: Submission) -> Dict[str, Any]:
        """테스트 커버리지 분석"""
        total = submission.total_mutants or 1
        killed = submission.killed_mutants or 0

        return {
            "mutation_score": round(killed / total * 100, 1) if total > 0 else 0,
            "killed_mutants": killed,
            "total_mutants": total,
            "survived_mutants": total - killed,
            "coverage_level": self._get_coverage_level(killed, total),
        }

    def _get_coverage_level(self, killed: int, total: int) -> str:
        """커버리지 레벨 판정"""
        if total == 0:
            return "unknown"
        ratio = killed / total
        if ratio >= 0.9:
            return "excellent"
        elif ratio >= 0.7:
            return "good"
        elif ratio >= 0.5:
            return "moderate"
        else:
            return "needs_improvement"

    def _identify_edge_cases(self, submission: Submission) -> List[str]:
        """놓친 엣지 케이스 식별"""
        edge_cases = []

        # execution_log에서 survived mutants 분석
        if submission.execution_log and "buggy_results" in submission.execution_log:
            for result in submission.execution_log["buggy_results"]:
                if result.get("passed", False):  # 테스트가 통과했다면 뮤턴트 생존
                    bug_type = result.get("bug_type", "unknown")
                    edge_cases.append(f"버그 유형 '{bug_type}'를 감지하지 못함")

        return edge_cases[:5]  # 최대 5개

    def _analyze_mutations(self, execution_log: Dict[str, Any]) -> Dict[str, Any]:
        """뮤테이션 분석"""
        buggy_results = execution_log.get("buggy_results", [])

        survived = [r for r in buggy_results if r.get("passed", False)]
        killed = [r for r in buggy_results if not r.get("passed", False)]

        survived_types = {}
        for r in survived:
            bug_type = r.get("bug_type", "unknown")
            survived_types[bug_type] = survived_types.get(bug_type, 0) + 1

        return {
            "total_mutations": len(buggy_results),
            "killed_count": len(killed),
            "survived_count": len(survived),
            "survived_by_type": survived_types,
        }

    def get_existing_deep_feedback(
        self,
        submission_id: UUID,
        user_id: UUID,
    ) -> Optional[Feedback]:
        """
        기존 심화 분석 피드백 조회

        Args:
            submission_id: 제출 ID
            user_id: 사용자 ID

        Returns:
            기존 피드백 또는 None
        """
        return self.db.query(Feedback).filter(
            Feedback.submission_id == submission_id,
            Feedback.user_id == user_id,
            Feedback.feedback_type == FeedbackType.DEEP.value,
            Feedback.status.in_([
                FeedbackStatus.COMPLETED.value,
                FeedbackStatus.GENERATING.value,
                FeedbackStatus.PENDING.value,
            ]),
        ).order_by(Feedback.created_at.desc()).first()
