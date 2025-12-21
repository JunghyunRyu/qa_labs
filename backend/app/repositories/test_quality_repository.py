"""
Test Quality Repository.

Phase 1: 테스트 품질 분석 데이터 액세스 레이어.
"""

import hashlib
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.problem import Problem
from app.models.submission import Submission
from app.models.test_quality import AnalysisRun


class TestQualityRepository:
    """테스트 품질 분석 Repository."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    # ========================================================================
    # AnalysisRun CRUD
    # ========================================================================

    def create_analysis_run(
        self,
        scope: str,
        parser_version: str,
        scoring_version: str,
        source_code: str,
        submission_id: Optional[UUID] = None,
        problem_id: Optional[int] = None,
    ) -> AnalysisRun:
        """분석 실행 생성."""
        source_hash = hashlib.md5(source_code.encode()).hexdigest()

        run = AnalysisRun(
            scope=scope,
            submission_id=submission_id,
            problem_id=problem_id,
            parser_version=parser_version,
            scoring_version=scoring_version,
            source_hash=source_hash,
            status="PENDING",
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_analysis_run(self, run_id: int) -> Optional[AnalysisRun]:
        """ID로 분석 실행 조회."""
        return self.db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()

    def get_latest_analysis_run(
        self,
        submission_id: Optional[UUID] = None,
        problem_id: Optional[int] = None,
    ) -> Optional[AnalysisRun]:
        """최신 분석 실행 조회."""
        query = self.db.query(AnalysisRun)

        if submission_id:
            query = query.filter(AnalysisRun.submission_id == submission_id)
        elif problem_id:
            query = query.filter(AnalysisRun.problem_id == problem_id)
        else:
            return None

        return query.order_by(AnalysisRun.created_at.desc()).first()

    def update_analysis_run_status(
        self,
        run_id: int,
        status: str,
        confidence_score: Optional[float] = None,
        result: Optional[dict] = None,
        error_message: Optional[str] = None,
    ) -> Optional[AnalysisRun]:
        """분석 실행 상태 업데이트."""
        run = self.get_analysis_run(run_id)
        if not run:
            return None

        run.status = status
        if confidence_score is not None:
            run.confidence_score = confidence_score
        if result is not None:
            run.result = result
        if error_message is not None:
            run.error_message = error_message

        self.db.commit()
        self.db.refresh(run)
        return run

    def check_duplicate_analysis(
        self,
        source_hash: str,
        parser_version: str,
        scoring_version: str,
        submission_id: Optional[UUID] = None,
        problem_id: Optional[int] = None,
    ) -> Optional[AnalysisRun]:
        """중복 분석 체크 (동일 소스 해시 + 버전)."""
        query = self.db.query(AnalysisRun).filter(
            AnalysisRun.source_hash == source_hash,
            AnalysisRun.parser_version == parser_version,
            AnalysisRun.scoring_version == scoring_version,
            AnalysisRun.status == "SUCCESS",
        )

        if submission_id:
            query = query.filter(AnalysisRun.submission_id == submission_id)
        elif problem_id:
            query = query.filter(AnalysisRun.problem_id == problem_id)

        return query.first()

    # ========================================================================
    # Submission Quality 업데이트
    # ========================================================================

    def update_submission_quality(
        self,
        submission_id: UUID,
        score: float,
        grade: str,
        analysis: dict[str, Any],
    ) -> Optional[Submission]:
        """제출 품질 정보 업데이트."""
        submission = (
            self.db.query(Submission).filter(Submission.id == submission_id).first()
        )

        if not submission:
            return None

        submission.test_quality_score = score
        submission.test_quality_grade = grade
        submission.test_quality_analysis = analysis

        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_submission_quality(self, submission_id: UUID) -> Optional[dict[str, Any]]:
        """제출 품질 정보 조회."""
        submission = (
            self.db.query(Submission).filter(Submission.id == submission_id).first()
        )

        if not submission:
            return None

        return {
            "submission_id": submission.id,
            "test_quality_score": submission.test_quality_score,
            "test_quality_grade": submission.test_quality_grade,
            "test_quality_analysis": submission.test_quality_analysis,
        }

    # ========================================================================
    # Problem Rubric 업데이트
    # ========================================================================

    def update_problem_rubric(
        self,
        problem_id: int,
        score: float,
        analysis: dict[str, Any],
    ) -> Optional[Problem]:
        """문제 루브릭 정보 업데이트."""
        problem = self.db.query(Problem).filter(Problem.id == problem_id).first()

        if not problem:
            return None

        problem.rubric_score = score
        problem.rubric_analysis = analysis

        self.db.commit()
        self.db.refresh(problem)
        return problem

    def get_problem_rubric(self, problem_id: int) -> Optional[dict[str, Any]]:
        """문제 루브릭 정보 조회."""
        problem = self.db.query(Problem).filter(Problem.id == problem_id).first()

        if not problem:
            return None

        return {
            "problem_id": problem.id,
            "rubric_score": problem.rubric_score,
            "rubric_analysis": problem.rubric_analysis,
        }

    # ========================================================================
    # 통계 조회
    # ========================================================================

    def get_quality_statistics(self) -> dict[str, Any]:
        """전체 품질 통계 조회."""
        # 등급별 분포
        grade_stats = (
            self.db.query(
                Submission.test_quality_grade,
                func.count(Submission.id).label("count"),
            )
            .filter(Submission.test_quality_grade.isnot(None))
            .group_by(Submission.test_quality_grade)
            .all()
        )

        # 평균 점수
        avg_score = (
            self.db.query(func.avg(Submission.test_quality_score))
            .filter(Submission.test_quality_score.isnot(None))
            .scalar()
            or 0.0
        )

        # 분석 완료 수
        analyzed_count = (
            self.db.query(func.count(Submission.id))
            .filter(Submission.test_quality_score.isnot(None))
            .scalar()
            or 0
        )

        return {
            "grade_distribution": {
                row.test_quality_grade: row.count for row in grade_stats
            },
            "average_score": round(float(avg_score), 2),
            "analyzed_submissions": analyzed_count,
        }

    def get_analysis_runs_by_status(
        self, status: str, limit: int = 100
    ) -> list[AnalysisRun]:
        """상태별 분석 실행 목록 조회."""
        return (
            self.db.query(AnalysisRun)
            .filter(AnalysisRun.status == status)
            .order_by(AnalysisRun.created_at.desc())
            .limit(limit)
            .all()
        )
