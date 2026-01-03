"""
테스트 품질 분석기 모듈.

테스트 코드를 파싱하고 분류하여 최종 품질 점수를 계산합니다.
"""

import hashlib
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

from app.schemas.test_quality import (
    AntiPatternDetail,
    QualityGrade,
    ScoringBreakdown,
    TestCaseAnalysis,
    TestQualityAnalysis,
)
from app.services.test_case_parser import ParseResult, TestCaseParser
from app.services.test_quality_classifier import (
    AntiPattern,
    ClassificationResult,
    InputDiversity,
    TestCaseClassification,
    TestPurpose,
    TestQualityClassifier,
    ValueType,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Constants
# =============================================================================

PARSER_VERSION = "1.0.0"
SCORING_VERSION = "1.0.0"

# 가중치 (테크 스펙 기준)
WEIGHTS = {
    "value_type": 0.35,
    "input_diversity": 0.30,
    "test_purpose": 0.35,
}

# 등급 경계값
GRADE_THRESHOLDS = {
    "A": 90,
    "B": 75,
    "C": 60,
    "D": 40,
    "F": 0,
}

# 포화 함수 매핑 (테크 스펙 기준)
SATURATION_MAP = {0: 0, 1: 40, 2: 70, 3: 85, 4: 95, 5: 100}

# 카테고리 인정을 위한 최소 고유 테스트 수
MIN_UNIQUE_TESTS_FOR_CATEGORY = 2

# 품질 등급별 보너스 점수
QUALITY_BONUS = {
    "A": 15,
    "B": 10,
    "C": 5,
    "D": 2,
    "F": 0,
}


def calculate_quality_bonus(quality_grade: str) -> int:
    """
    품질 등급에 따른 보너스 점수를 반환합니다.

    Args:
        quality_grade: 품질 등급 (A/B/C/D/F)

    Returns:
        int: 보너스 점수 (0-15)
    """
    return QUALITY_BONUS.get(quality_grade.upper(), 0)


# =============================================================================
# Data Classes
# =============================================================================


@dataclass
class AnalysisResult:
    """분석 결과."""

    score: float
    grade: QualityGrade
    analysis: TestQualityAnalysis
    source_hash: str


# =============================================================================
# TestQualityAnalyzer
# =============================================================================


class TestQualityAnalyzer:
    """테스트 품질 분석기."""

    def __init__(self):
        """TestQualityAnalyzer 초기화."""
        self.parser = TestCaseParser()
        self.classifier = TestQualityClassifier()

    def analyze(self, code: str) -> AnalysisResult:
        """
        테스트 코드를 분석하여 품질 점수를 계산합니다.

        Args:
            code: 분석할 테스트 코드

        Returns:
            AnalysisResult: 분석 결과
        """
        # 소스 해시 계산
        source_hash = hashlib.md5(code.encode()).hexdigest()

        # 파싱
        parse_result = self.parser.parse(code)

        # 파싱 실패 시
        if parse_result.has_syntax_error:
            return self._create_error_result(
                source_hash,
                error_message=parse_result.syntax_error_message or "Syntax error",
            )

        # 테스트 케이스가 없는 경우
        if not parse_result.test_cases:
            return self._create_error_result(
                source_hash,
                error_message="No test cases found",
            )

        # 분류
        classification = self.classifier.classify(parse_result)

        # 점수 계산
        score, breakdown = self._calculate_score(classification)

        # 등급 결정
        grade = self._determine_grade(score)

        # 분석 결과 생성
        analysis = self._create_analysis(
            parse_result, classification, breakdown, score
        )

        return AnalysisResult(
            score=score,
            grade=grade,
            analysis=analysis,
            source_hash=source_hash,
        )

    def _calculate_score(
        self, classification: ClassificationResult
    ) -> tuple[float, ScoringBreakdown]:
        """점수를 계산합니다."""
        # 축별 점수 계산 (포화 함수 + 중복 가산 방지)
        value_type_score = self._calculate_axis_score(
            classification.test_classifications,
            axis_type="value_type",
        )
        input_diversity_score = self._calculate_axis_score(
            classification.test_classifications,
            axis_type="input_diversity",
        )
        test_purpose_score = self._calculate_axis_score(
            classification.test_classifications,
            axis_type="test_purpose",
        )

        # 기본 점수 (가중 평균)
        base_score = (
            value_type_score * WEIGHTS["value_type"]
            + input_diversity_score * WEIGHTS["input_diversity"]
            + test_purpose_score * WEIGHTS["test_purpose"]
        )

        # 안티패턴 감점
        antipattern_penalty = sum(
            ap.penalty for ap in classification.all_antipatterns
        )

        # 최종 점수 (0 이상)
        final_score = max(0, base_score + antipattern_penalty)

        breakdown = ScoringBreakdown(
            value_type_score=round(value_type_score * WEIGHTS["value_type"], 2),
            input_diversity_score=round(
                input_diversity_score * WEIGHTS["input_diversity"], 2
            ),
            test_purpose_score=round(test_purpose_score * WEIGHTS["test_purpose"], 2),
            antipattern_penalty=round(antipattern_penalty, 2),
            final_score=round(final_score, 2),
        )

        return round(final_score, 2), breakdown

    def _calculate_axis_score(
        self,
        classifications: list[TestCaseClassification],
        axis_type: str,
    ) -> float:
        """
        축별 점수를 계산합니다.

        중복 가산 방지: 각 카테고리가 인정되려면 최소 2개 이상의 고유 테스트가 커버해야 함
        포화 함수: 초반 카테고리가 더 가치 있음
        """
        # 카테고리별 테스트 수 집계
        category_tests: dict[str, set[str]] = defaultdict(set)

        for tc in classifications:
            if axis_type == "value_type":
                categories = tc.value_types
            elif axis_type == "input_diversity":
                categories = tc.input_diversities
            else:  # test_purpose
                categories = tc.test_purposes

            for cat in categories:
                # UNKNOWN은 제외
                if hasattr(cat, "value") and cat.value != "unknown":
                    category_tests[cat.value].add(tc.test_name)

        # 유효한 카테고리 수 (최소 2개 이상의 테스트가 커버)
        valid_categories = {
            cat
            for cat, tests in category_tests.items()
            if len(tests) >= MIN_UNIQUE_TESTS_FOR_CATEGORY
        }

        # 포화 함수 적용
        return self._saturation_score(len(valid_categories))

    def _saturation_score(self, covered_count: int) -> float:
        """포화 점수를 계산합니다."""
        return SATURATION_MAP.get(min(covered_count, 5), 100)

    def _determine_grade(self, score: float) -> QualityGrade:
        """점수에 따른 등급을 결정합니다."""
        if score >= GRADE_THRESHOLDS["A"]:
            return QualityGrade.A
        elif score >= GRADE_THRESHOLDS["B"]:
            return QualityGrade.B
        elif score >= GRADE_THRESHOLDS["C"]:
            return QualityGrade.C
        elif score >= GRADE_THRESHOLDS["D"]:
            return QualityGrade.D
        else:
            return QualityGrade.F

    def _create_analysis(
        self,
        parse_result: ParseResult,
        classification: ClassificationResult,
        breakdown: ScoringBreakdown,
        score: float,
    ) -> TestQualityAnalysis:
        """분석 결과를 생성합니다."""
        # 안티패턴 변환
        antipatterns = [
            AntiPatternDetail(
                type=ap.pattern_type.value,
                penalty=ap.penalty,
                location=ap.location,
                line=ap.line_number,
                description=ap.description,
            )
            for ap in classification.all_antipatterns
        ]

        # 테스트별 분석 결과
        per_test = [
            TestCaseAnalysis(
                name=tc.test_name,
                value_types=[vt.value for vt in tc.value_types],
                input_diversities=[id.value for id in tc.input_diversities],
                test_purposes=[tp.value for tp in tc.test_purposes],
                antipatterns=[
                    AntiPatternDetail(
                        type=ap.pattern_type.value,
                        penalty=ap.penalty,
                        location=ap.location,
                        line=ap.line_number,
                        description=ap.description,
                    )
                    for ap in tc.antipatterns
                ],
                confidence=tc.confidence,
            )
            for tc in classification.test_classifications
        ]

        return TestQualityAnalysis(
            parser_version=PARSER_VERSION,
            scoring_version=SCORING_VERSION,
            test_count=parse_result.total_test_count,
            effective_test_count=parse_result.effective_test_count,
            value_types=[vt.value for vt in classification.all_value_types],
            input_diversities=[id.value for id in classification.all_input_diversities],
            test_purposes=[tp.value for tp in classification.all_test_purposes],
            antipatterns=antipatterns,
            per_test=per_test,
            scoring_breakdown=breakdown,
            overall_confidence=classification.overall_confidence,
        )

    def _create_error_result(
        self, source_hash: str, error_message: str
    ) -> AnalysisResult:
        """에러 결과를 생성합니다."""
        return AnalysisResult(
            score=0.0,
            grade=QualityGrade.F,
            analysis=TestQualityAnalysis(
                parser_version=PARSER_VERSION,
                scoring_version=SCORING_VERSION,
                test_count=0,
                effective_test_count=0,
                value_types=[],
                input_diversities=[],
                test_purposes=[],
                antipatterns=[],
                per_test=[],
                scoring_breakdown=ScoringBreakdown(
                    value_type_score=0,
                    input_diversity_score=0,
                    test_purpose_score=0,
                    antipattern_penalty=0,
                    final_score=0,
                ),
                overall_confidence=0.0,
            ),
            source_hash=source_hash,
        )


# =============================================================================
# Convenience Functions
# =============================================================================


def analyze_test_code(code: str) -> AnalysisResult:
    """테스트 코드를 분석합니다."""
    analyzer = TestQualityAnalyzer()
    return analyzer.analyze(code)


def get_quality_grade(score: float) -> QualityGrade:
    """점수에 따른 등급을 반환합니다."""
    if score >= GRADE_THRESHOLDS["A"]:
        return QualityGrade.A
    elif score >= GRADE_THRESHOLDS["B"]:
        return QualityGrade.B
    elif score >= GRADE_THRESHOLDS["C"]:
        return QualityGrade.C
    elif score >= GRADE_THRESHOLDS["D"]:
        return QualityGrade.D
    else:
        return QualityGrade.F
