"""
Test Quality Evaluation Schemas.

Phase 1: 테스트 품질 평가 시스템을 위한 Pydantic 스키마 정의.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================================================
# Enum 정의 (DB CHECK constraint와 일치해야 함)
# ============================================================================


class AnalysisScope(str, Enum):
    """분석 범위."""

    SUBMISSION = "submission"
    PROBLEM_RUBRIC = "problem_rubric"


class AnalysisStatus(str, Enum):
    """분석 상태."""

    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"


class QualityGrade(str, Enum):
    """품질 등급."""

    A = "A"
    B = "B"
    C = "C"
    D = "D"
    F = "F"


# ============================================================================
# AntiPattern 관련 스키마
# ============================================================================


class AntiPatternDetail(BaseModel):
    """감지된 안티패턴 상세."""

    type: str = Field(..., description="안티패턴 유형")
    penalty: int = Field(..., description="감점")
    location: str = Field(..., description="테스트 함수명")
    line: Optional[int] = Field(None, description="라인 번호")
    description: Optional[str] = Field(None, description="설명")


# ============================================================================
# Per-Test 분류 결과
# ============================================================================


class TestCaseAnalysis(BaseModel):
    """단일 테스트 케이스 분석 결과."""

    name: str = Field(..., description="테스트 함수명")
    value_types: list[str] = Field(default_factory=list, description="값 유형 목록")
    input_diversities: list[str] = Field(
        default_factory=list, description="입력 다양성 목록"
    )
    test_purposes: list[str] = Field(default_factory=list, description="테스트 목적 목록")
    antipatterns: list[AntiPatternDetail] = Field(
        default_factory=list, description="안티패턴 목록"
    )
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="분류 신뢰도")


# ============================================================================
# 점수 세부 내역
# ============================================================================


class ScoringBreakdown(BaseModel):
    """점수 계산 세부 내역."""

    value_type_score: float = Field(0.0, description="값 유형 점수")
    input_diversity_score: float = Field(0.0, description="입력 다양성 점수")
    test_purpose_score: float = Field(0.0, description="테스트 목적 점수")
    antipattern_penalty: float = Field(0.0, description="안티패턴 감점")
    final_score: float = Field(..., description="최종 점수")


# ============================================================================
# 제출 분석 결과 (test_quality_analysis JSONB)
# ============================================================================


class TestQualityAnalysis(BaseModel):
    """테스트 품질 분석 결과 (JSONB 저장용)."""

    parser_version: str = Field(..., description="파서 버전")
    scoring_version: str = Field(..., description="점수 모델 버전")
    test_count: int = Field(..., ge=0, description="테스트 함수 수")
    effective_test_count: int = Field(
        ..., ge=0, description="유효 테스트 케이스 수 (parametrize 확장)"
    )
    value_types: list[str] = Field(default_factory=list, description="전체 값 유형")
    input_diversities: list[str] = Field(
        default_factory=list, description="전체 입력 다양성"
    )
    test_purposes: list[str] = Field(default_factory=list, description="전체 테스트 목적")
    antipatterns: list[AntiPatternDetail] = Field(
        default_factory=list, description="감지된 안티패턴"
    )
    per_test: list[TestCaseAnalysis] = Field(
        default_factory=list, description="테스트별 상세"
    )
    scoring_breakdown: Optional[ScoringBreakdown] = Field(None, description="점수 세부")
    overall_confidence: float = Field(1.0, ge=0.0, le=1.0, description="전체 신뢰도")

    model_config = {"from_attributes": True}


# ============================================================================
# 문제 루브릭 분석 결과 (rubric_analysis JSONB)
# ============================================================================


class ExpectedCategories(BaseModel):
    """기대되는 카테고리."""

    value_types: list[str] = Field(default_factory=list)
    input_diversities: list[str] = Field(default_factory=list)
    test_purposes: list[str] = Field(default_factory=list)


class RubricWeights(BaseModel):
    """루브릭 가중치."""

    value_type_coverage: float = Field(0.35, ge=0.0, le=1.0)
    diversity_coverage: float = Field(0.30, ge=0.0, le=1.0)
    purpose_coverage: float = Field(0.35, ge=0.0, le=1.0)


class RubricAnalysis(BaseModel):
    """문제 루브릭 분석 결과 (JSONB 저장용)."""

    parser_version: str = Field(...)
    scoring_version: str = Field(...)
    expected_categories: ExpectedCategories = Field(...)
    weights: RubricWeights = Field(default_factory=RubricWeights)
    difficulty_factor: float = Field(1.0, ge=0.5, le=2.0)

    model_config = {"from_attributes": True}


# ============================================================================
# AnalysisRun 스키마
# ============================================================================


class AnalysisRunBase(BaseModel):
    """분석 실행 기본 스키마."""

    scope: AnalysisScope
    parser_version: str = Field(..., max_length=10)
    scoring_version: str = Field(..., max_length=10)
    source_hash: str = Field(..., max_length=32, description="소스 코드 MD5 해시")


class AnalysisRunCreate(AnalysisRunBase):
    """분석 실행 생성 스키마."""

    submission_id: Optional[UUID] = None
    problem_id: Optional[int] = None


class AnalysisRunResponse(AnalysisRunBase):
    """분석 실행 응답 스키마."""

    id: int
    submission_id: Optional[UUID] = None
    problem_id: Optional[int] = None
    status: AnalysisStatus
    confidence_score: Optional[float] = None
    result: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 제출 품질 응답 확장
# ============================================================================


class SubmissionQualityResponse(BaseModel):
    """제출 품질 평가 응답."""

    submission_id: UUID
    test_quality_score: Optional[float] = None
    test_quality_grade: Optional[QualityGrade] = None
    test_quality_analysis: Optional[TestQualityAnalysis] = None
    analysis_run: Optional[AnalysisRunResponse] = None

    model_config = {"from_attributes": True}


# ============================================================================
# 문제 루브릭 응답
# ============================================================================


class ProblemRubricResponse(BaseModel):
    """문제 루브릭 평가 응답."""

    problem_id: int
    rubric_score: Optional[float] = None
    rubric_analysis: Optional[RubricAnalysis] = None
    analysis_run: Optional[AnalysisRunResponse] = None

    model_config = {"from_attributes": True}


# ============================================================================
# 통계 응답
# ============================================================================


class QualityStatisticsResponse(BaseModel):
    """품질 통계 응답."""

    grade_distribution: dict[str, int] = Field(
        default_factory=dict, description="등급별 분포"
    )
    average_score: float = Field(0.0, description="평균 점수")
    analyzed_submissions: int = Field(0, description="분석 완료 제출 수")

    model_config = {"from_attributes": True}
