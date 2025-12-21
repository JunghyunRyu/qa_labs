"""
Coverage Spike Script - Phase 0 검증용

테스트 품질 분석 시스템의 정확도를 검증하는 스파이크 스크립트.
DB에서 실제 제출 데이터를 가져오거나, 샘플 테스트 코드로 검증합니다.

완료 기준:
- parametrize 케이스가 올바르게 파싱됨
- confidence 0.7 이상인 샘플이 70% 이상
- 카테고리 분류 결과가 직관적으로 맞음

사용법:
    python backend/scripts/coverage_spike.py [--db] [--sample] [--output report.json]
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.test_case_parser import TestCaseParser, ParseResult
from app.services.test_quality_classifier import (
    TestQualityClassifier,
    ClassificationResult,
    ValueType,
    InputDiversity,
    TestPurpose,
    AntiPatternType,
)


# ============================================================================
# 샘플 테스트 코드 (DB 데이터가 없을 때 사용)
# ============================================================================

SAMPLE_TEST_CODES = [
    # 샘플 1: 기본 테스트 (NORMAL, HAPPY_PATH)
    {
        "id": "sample_001",
        "name": "기본 테스트 - 정상값만",
        "code": '''
import pytest
from target import sum_list

def test_sum_positive():
    """정상적인 양수 리스트 합계"""
    assert sum_list([1, 2, 3]) == 6

def test_sum_single():
    """단일 요소"""
    assert sum_list([5]) == 5
''',
        "expected_purposes": ["HAPPY_PATH"],
        "expected_value_types": ["NORMAL"],
    },

    # 샘플 2: 경계값 테스트 (BOUNDARY, EDGE)
    {
        "id": "sample_002",
        "name": "경계값 테스트",
        "code": '''
import pytest
from target import sum_list

def test_boundary_zero():
    """경계값: 0 포함"""
    assert sum_list([0, 1, 2]) == 3

def test_boundary_negative_one():
    """경계값: -1"""
    assert sum_list([-1, 0, 1]) == 0

def test_edge_empty():
    """극단: 빈 리스트"""
    assert sum_list([]) == 0

def test_edge_none_element():
    """극단: None (예외 예상)"""
    with pytest.raises(TypeError):
        sum_list([None])
''',
        "expected_purposes": ["BOUNDARY_CHECK", "ERROR_HANDLING"],
        "expected_value_types": ["BOUNDARY", "EDGE"],
    },

    # 샘플 3: parametrize 사용
    {
        "id": "sample_003",
        "name": "Parametrize 테스트",
        "code": '''
import pytest
from target import is_prime

@pytest.mark.parametrize("n, expected", [
    (2, True),
    (3, True),
    (4, False),
    (5, True),
    (0, False),
    (1, False),
    (-1, False),
])
def test_is_prime(n, expected):
    assert is_prime(n) == expected

@pytest.mark.parametrize("n", [10**9, 10**12])
def test_large_numbers(n):
    """큰 수 테스트"""
    result = is_prime(n)
    assert isinstance(result, bool)
''',
        "expected_purposes": ["HAPPY_PATH", "BOUNDARY_CHECK"],
        "expected_value_types": ["NORMAL", "BOUNDARY", "NEGATIVE", "EXTREME"],
    },

    # 샘플 4: 에러 핸들링
    {
        "id": "sample_004",
        "name": "에러 핸들링 테스트",
        "code": '''
import pytest
from target import divide

def test_divide_normal():
    assert divide(10, 2) == 5

def test_divide_by_zero():
    """0으로 나누기 에러"""
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

def test_divide_invalid_type():
    """잘못된 타입 에러"""
    with pytest.raises(TypeError):
        divide("10", 2)
''',
        "expected_purposes": ["HAPPY_PATH", "ERROR_HANDLING"],
        "expected_value_types": ["NORMAL"],
    },

    # 샘플 5: 안티패턴 포함
    {
        "id": "sample_005",
        "name": "안티패턴 테스트 (경고)",
        "code": '''
import pytest
import random
from target import process

def test_no_assertion():
    """안티패턴: assertion 없음"""
    process([1, 2, 3])

def test_exception_swallowed():
    """안티패턴: 예외 삼킴"""
    try:
        process(None)
    except:
        pass

def test_random_data():
    """안티패턴: 비결정적"""
    data = [random.randint(1, 100) for _ in range(10)]
    result = process(data)
    assert result is not None
''',
        "expected_antipatterns": ["NO_ASSERTION", "EXCEPTION_SWALLOWED", "NON_DETERMINISTIC"],
    },

    # 샘플 6: 다양한 입력 (InputDiversity)
    {
        "id": "sample_006",
        "name": "입력 다양성 테스트",
        "code": '''
import pytest
from target import find_duplicates

def test_empty_list():
    """빈 리스트"""
    assert find_duplicates([]) == []

def test_single_element():
    """단일 요소"""
    assert find_duplicates([1]) == []

def test_no_duplicates():
    """중복 없음"""
    assert find_duplicates([1, 2, 3]) == []

def test_with_duplicates():
    """중복 있음"""
    assert find_duplicates([1, 1, 2, 2, 3]) == [1, 2]

def test_mixed_types():
    """혼합 타입"""
    assert find_duplicates([1, "a", 1, "a"]) == [1, "a"]
''',
        "expected_diversity": ["EMPTY", "SINGLE", "MULTIPLE", "DUPLICATE", "MIXED_TYPES"],
    },

    # 샘플 7: 복합 테스트 (고품질)
    {
        "id": "sample_007",
        "name": "고품질 복합 테스트",
        "code": '''
import pytest
from target import validate_email

class TestValidateEmail:
    """이메일 검증 테스트"""

    # 정상 케이스
    def test_valid_email(self):
        assert validate_email("user@example.com") is True

    def test_valid_with_subdomain(self):
        assert validate_email("user@mail.example.com") is True

    # 경계값
    def test_empty_string(self):
        assert validate_email("") is False

    def test_min_length(self):
        assert validate_email("a@b.c") is False  # 너무 짧음

    # 에러 케이스
    def test_missing_at(self):
        assert validate_email("userexample.com") is False

    def test_invalid_type(self):
        with pytest.raises(TypeError):
            validate_email(None)

    # 극단 케이스
    @pytest.mark.parametrize("email", [
        "a" * 1000 + "@example.com",
        "user@" + "x" * 1000 + ".com",
    ])
    def test_extreme_length(self, email):
        assert validate_email(email) is False
''',
        "expected_purposes": ["HAPPY_PATH", "BOUNDARY_CHECK", "ERROR_HANDLING"],
        "expected_value_types": ["NORMAL", "BOUNDARY", "EDGE", "EXTREME"],
    },

    # 샘플 8: fixture 사용
    {
        "id": "sample_008",
        "name": "Fixture 사용 테스트",
        "code": '''
import pytest
from target import UserRepository

@pytest.fixture
def db_session():
    """데이터베이스 세션 픽스처"""
    session = {"connected": True}
    yield session
    session["connected"] = False

@pytest.fixture
def user_repo(db_session):
    return UserRepository(db_session)

def test_create_user(user_repo):
    """사용자 생성"""
    user = user_repo.create({"name": "John", "email": "john@example.com"})
    assert user["id"] is not None

def test_find_user(user_repo):
    """사용자 조회"""
    user = user_repo.find_by_id(1)
    assert user is not None
''',
        "expected_fixtures": ["db_session", "user_repo"],
    },

    # 샘플 9: 극단값 테스트
    {
        "id": "sample_009",
        "name": "극단값 집중 테스트",
        "code": '''
import pytest
from target import process_number

def test_max_int():
    """최대 정수값"""
    result = process_number(2**31 - 1)
    assert result >= 0

def test_min_int():
    """최소 정수값"""
    result = process_number(-2**31)
    assert result >= 0

def test_very_large_float():
    """매우 큰 실수"""
    result = process_number(1e308)
    assert result is not None

def test_zero():
    """제로"""
    assert process_number(0) == 0
''',
        "expected_value_types": ["EXTREME", "BOUNDARY"],
    },

    # 샘플 10: 문자열 처리 테스트
    {
        "id": "sample_010",
        "name": "문자열 처리 테스트",
        "code": '''
import pytest
from target import reverse_string

def test_normal_string():
    assert reverse_string("hello") == "olleh"

def test_empty_string():
    assert reverse_string("") == ""

def test_single_char():
    assert reverse_string("a") == "a"

def test_unicode():
    assert reverse_string("한글") == "글한"

def test_whitespace():
    assert reverse_string("  ") == "  "
''',
    },

    # 샘플 11: 리스트 처리 테스트
    {
        "id": "sample_011",
        "name": "리스트 심화 테스트",
        "code": '''
import pytest
from target import sort_and_dedupe

def test_sorted_list():
    assert sort_and_dedupe([3, 1, 2]) == [1, 2, 3]

def test_empty_list():
    assert sort_and_dedupe([]) == []

def test_single_element():
    assert sort_and_dedupe([42]) == [42]

def test_duplicates():
    assert sort_and_dedupe([1, 1, 2, 2, 3]) == [1, 2, 3]

def test_already_sorted():
    assert sort_and_dedupe([1, 2, 3]) == [1, 2, 3]

def test_reverse_sorted():
    assert sort_and_dedupe([3, 2, 1]) == [1, 2, 3]
''',
    },

    # 샘플 12: 딕셔너리 테스트
    {
        "id": "sample_012",
        "name": "딕셔너리 처리 테스트",
        "code": '''
import pytest
from target import merge_dicts

def test_merge_two_dicts():
    result = merge_dicts({"a": 1}, {"b": 2})
    assert result == {"a": 1, "b": 2}

def test_merge_overlapping():
    result = merge_dicts({"a": 1}, {"a": 2})
    assert result["a"] == 2

def test_merge_with_empty():
    assert merge_dicts({}, {"a": 1}) == {"a": 1}
    assert merge_dicts({"a": 1}, {}) == {"a": 1}

def test_merge_both_empty():
    assert merge_dicts({}, {}) == {}

def test_nested_dicts():
    result = merge_dicts({"a": {"x": 1}}, {"b": {"y": 2}})
    assert "a" in result and "b" in result
''',
    },

    # 샘플 13: 예외 집중 테스트
    {
        "id": "sample_013",
        "name": "예외 처리 집중 테스트",
        "code": '''
import pytest
from target import divide, open_file

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

def test_divide_type_error():
    with pytest.raises(TypeError):
        divide("10", 2)

def test_file_not_found():
    with pytest.raises(FileNotFoundError):
        open_file("nonexistent.txt")

def test_permission_error():
    with pytest.raises(PermissionError):
        open_file("/root/secret.txt")

def test_value_error():
    with pytest.raises(ValueError):
        divide(-1, 2)  # 음수 불가
''',
    },

    # 샘플 14: parametrize 고급
    {
        "id": "sample_014",
        "name": "Parametrize 고급 사용",
        "code": '''
import pytest
from target import calculate

@pytest.mark.parametrize("a,b,op,expected", [
    (1, 2, "+", 3),
    (5, 3, "-", 2),
    (4, 3, "*", 12),
    (10, 2, "/", 5),
    (0, 5, "+", 5),
    (-1, -1, "+", -2),
    (100, 0, "+", 100),
])
def test_basic_operations(a, b, op, expected):
    assert calculate(a, b, op) == expected

@pytest.mark.parametrize("op", ["+", "-", "*", "/"])
@pytest.mark.parametrize("value", [0, 1, -1, 100])
def test_identity_operations(op, value):
    if op == "/" and value == 0:
        pytest.skip("Division by zero")
    result = calculate(value, value, op)
    assert result is not None
''',
    },

    # 샘플 15: skip/xfail 마커
    {
        "id": "sample_015",
        "name": "Skip/Xfail 마커 테스트",
        "code": '''
import pytest
from target import feature_x, legacy_api

@pytest.mark.skip(reason="Feature not implemented yet")
def test_future_feature():
    assert feature_x() == True

@pytest.mark.skipif(True, reason="Only on Linux")
def test_linux_only():
    pass

@pytest.mark.xfail(reason="Known bug #123")
def test_known_bug():
    assert legacy_api() == "fixed"

def test_normal_case():
    assert True

@pytest.mark.xfail(strict=True)
def test_expected_fail():
    assert False
''',
    },

    # 샘플 16: class 기반 테스트
    {
        "id": "sample_016",
        "name": "클래스 기반 테스트",
        "code": '''
import pytest
from target import Calculator

class TestCalculator:
    @pytest.fixture
    def calc(self):
        return Calculator()

    def test_add(self, calc):
        assert calc.add(2, 3) == 5

    def test_subtract(self, calc):
        assert calc.subtract(5, 3) == 2

    def test_multiply(self, calc):
        assert calc.multiply(4, 3) == 12

    def test_divide(self, calc):
        assert calc.divide(10, 2) == 5

    def test_divide_by_zero(self, calc):
        with pytest.raises(ZeroDivisionError):
            calc.divide(1, 0)

class TestCalculatorMemory:
    def test_memory_store(self):
        calc = Calculator()
        calc.store(42)
        assert calc.recall() == 42

    def test_memory_clear(self):
        calc = Calculator()
        calc.store(42)
        calc.clear()
        assert calc.recall() == 0
''',
    },

    # 샘플 17: assertion 없는 테스트 (안티패턴)
    {
        "id": "sample_017",
        "name": "Assertion 없는 테스트들",
        "code": '''
import pytest
from target import process

def test_no_assertion_1():
    """assertion이 없음"""
    result = process("data")
    print(result)

def test_no_assertion_2():
    """assertion이 없음"""
    process("more data")

def test_with_assertion():
    """정상 테스트"""
    assert process("ok") == "ok_processed"
''',
    },

    # 샘플 18: 외부 의존성 테스트 (안티패턴)
    {
        "id": "sample_018",
        "name": "외부 의존성 테스트",
        "code": '''
import pytest
import requests
import time
from target import fetch_data

def test_fetch_external_api():
    """외부 API 호출"""
    response = requests.get("https://api.example.com/data")
    assert response.status_code == 200

def test_time_dependent():
    """시간 의존적 테스트"""
    start = time.time()
    result = fetch_data()
    elapsed = time.time() - start
    assert elapsed < 1.0

def test_pure_function():
    """순수 함수 테스트"""
    assert fetch_data("local") == "data"
''',
    },

    # 샘플 19: 중첩 테스트
    {
        "id": "sample_019",
        "name": "중첩 구조 테스트",
        "code": '''
import pytest
from target import nested_func

def test_deeply_nested():
    """깊이 중첩된 테스트"""
    data = {"a": {"b": {"c": {"d": {"e": 1}}}}}
    if data:
        if data.get("a"):
            if data["a"].get("b"):
                if data["a"]["b"].get("c"):
                    result = nested_func(data)
                    assert result == 1

def test_normal():
    """정상 테스트"""
    assert nested_func({"value": 1}) == 1

def test_flat():
    """평탄한 테스트"""
    result = nested_func({"x": 10})
    assert result == 10
''',
    },

    # 샘플 20: 상태 전이 테스트
    {
        "id": "sample_020",
        "name": "상태 전이 테스트",
        "code": '''
import pytest
from target import StateMachine

def test_initial_state():
    """초기 상태"""
    sm = StateMachine()
    assert sm.state == "IDLE"

def test_start_transition():
    """시작 전이"""
    sm = StateMachine()
    sm.start()
    assert sm.state == "RUNNING"

def test_stop_transition():
    """정지 전이"""
    sm = StateMachine()
    sm.start()
    sm.stop()
    assert sm.state == "STOPPED"

def test_invalid_transition():
    """잘못된 전이"""
    sm = StateMachine()
    with pytest.raises(ValueError):
        sm.stop()  # IDLE에서 STOP 불가

def test_full_cycle():
    """전체 사이클"""
    sm = StateMachine()
    sm.start()
    sm.pause()
    sm.resume()
    sm.stop()
    assert sm.state == "STOPPED"
''',
    },

    # 샘플 21: 동치 분할 테스트
    {
        "id": "sample_021",
        "name": "동치 분할 테스트",
        "code": '''
import pytest
from target import grade_score

# 동치 분할: A(90-100), B(80-89), C(70-79), D(60-69), F(0-59)

def test_grade_a_partition():
    """A 등급 파티션"""
    assert grade_score(95) == "A"
    assert grade_score(90) == "A"
    assert grade_score(100) == "A"

def test_grade_b_partition():
    """B 등급 파티션"""
    assert grade_score(85) == "B"
    assert grade_score(80) == "B"
    assert grade_score(89) == "B"

def test_grade_f_partition():
    """F 등급 파티션"""
    assert grade_score(30) == "F"
    assert grade_score(0) == "F"
    assert grade_score(59) == "F"

def test_boundary_between_grades():
    """등급 경계"""
    assert grade_score(89) == "B"
    assert grade_score(90) == "A"
''',
    },

    # 샘플 22: 데이터 주도 테스트
    {
        "id": "sample_022",
        "name": "데이터 주도 테스트",
        "code": '''
import pytest
from target import parse_date

TEST_DATA = [
    ("2024-01-01", (2024, 1, 1)),
    ("2024-12-31", (2024, 12, 31)),
    ("2000-06-15", (2000, 6, 15)),
    ("1999-01-01", (1999, 1, 1)),
]

@pytest.mark.parametrize("input_str,expected", TEST_DATA)
def test_parse_date_valid(input_str, expected):
    assert parse_date(input_str) == expected

INVALID_DATA = [
    "not-a-date",
    "2024/01/01",
    "01-01-2024",
    "",
    None,
]

@pytest.mark.parametrize("invalid_input", INVALID_DATA)
def test_parse_date_invalid(invalid_input):
    with pytest.raises((ValueError, TypeError)):
        parse_date(invalid_input)
''',
    },

    # 샘플 23: 빈 테스트 파일 (엣지케이스)
    {
        "id": "sample_023",
        "name": "빈 테스트 파일",
        "code": '''
import pytest
# 테스트가 없는 파일
''',
    },

    # 샘플 24: 구문 오류 (엣지케이스)
    {
        "id": "sample_024",
        "name": "구문 오류 테스트",
        "code": '''
import pytest

def test_syntax_error(
    # 괄호가 닫히지 않음
''',
    },

    # 샘플 25: 복잡한 픽스처 체인
    {
        "id": "sample_025",
        "name": "복잡한 픽스처 체인",
        "code": '''
import pytest
from target import Database, Cache, Service

@pytest.fixture
def config():
    return {"host": "localhost", "port": 5432}

@pytest.fixture
def database(config):
    db = Database(config)
    db.connect()
    yield db
    db.disconnect()

@pytest.fixture
def cache(config):
    return Cache(config)

@pytest.fixture
def service(database, cache):
    return Service(database, cache)

def test_service_query(service):
    result = service.query("SELECT 1")
    assert result is not None

def test_service_cached(service, cache):
    service.query("SELECT 1")
    assert cache.hit_count > 0

def test_database_direct(database):
    assert database.is_connected()
''',
    },
]


# ============================================================================
# 분석 함수
# ============================================================================

def analyze_code(code: str, parser: TestCaseParser, classifier: TestQualityClassifier) -> dict:
    """단일 테스트 코드를 분석하고 결과 반환"""

    # 파싱
    parse_result = parser.parse(code)

    # 파싱 실패 체크 (문법 오류 또는 테스트 없음)
    if parse_result.has_syntax_error:
        return {
            "success": False,
            "error": parse_result.syntax_error_message or "Syntax error",
            "test_count": 0,
        }

    if not parse_result.test_cases:
        return {
            "success": False,
            "error": "No test cases found",
            "test_count": 0,
        }

    # 분류
    classification = classifier.classify(parse_result)

    # 결과 정리
    return {
        "success": True,
        "test_count": len(parse_result.test_cases),
        "effective_test_count": parse_result.effective_test_count,
        "parametrize_count": sum(
            len(tc.parametrize_cases) for tc in parse_result.test_cases
        ),
        "fixture_count": sum(
            len(tc.fixtures) for tc in parse_result.test_cases
        ),
        "pytest_raises_count": sum(
            1 for tc in parse_result.test_cases if tc.uses_pytest_raises
        ),
        "value_types": [vt.name for vt in classification.all_value_types],
        "input_diversity": [id_.name for id_ in classification.all_input_diversities],
        "test_purposes": [tp.name for tp in classification.all_test_purposes],
        "antipatterns": [
            {"type": ap.pattern_type.name, "penalty": ap.penalty, "location": ap.location}
            for ap in classification.all_antipatterns
        ],
        "confidence": classification.overall_confidence,
        "per_test_details": [
            {
                "name": tc.test_name,
                "value_types": [vt.name for vt in tc.value_types],
                "input_diversity": [id_.name for id_ in tc.input_diversities],
                "test_purposes": [tp.name for tp in tc.test_purposes],
                "confidence": tc.confidence,
            }
            for tc in classification.test_classifications
        ],
    }


def load_db_submissions(limit: int = 30) -> list[dict]:
    """DB에서 제출 데이터 로드"""
    try:
        from app.models.db import SessionLocal
        from app.models.submission import Submission
        from app.models.problem import Problem

        db = SessionLocal()
        try:
            submissions = (
                db.query(Submission)
                .filter(Submission.status == "SUCCESS")
                .filter(Submission.code.isnot(None))
                .order_by(Submission.created_at.desc())
                .limit(limit)
                .all()
            )

            results = []
            for sub in submissions:
                problem = db.query(Problem).filter(Problem.id == sub.problem_id).first()
                results.append({
                    "id": str(sub.id),
                    "name": f"Submission for {problem.title if problem else 'Unknown'}",
                    "code": sub.code,
                    "score": sub.score,
                    "problem_id": sub.problem_id,
                })
            return results
        finally:
            db.close()
    except Exception as e:
        print(f"[경고] DB 로드 실패: {e}")
        return []


def generate_report(results: list[dict], output_path: str | None = None) -> dict:
    """분석 결과로부터 리포트 생성"""

    total = len(results)
    if total == 0:
        return {"error": "분석할 데이터가 없습니다."}

    # 통계 계산
    success_count = sum(1 for r in results if r["analysis"]["success"])
    confidence_values = [
        r["analysis"]["confidence"]
        for r in results
        if r["analysis"]["success"]
    ]
    high_confidence_count = sum(1 for c in confidence_values if c >= 0.7)

    # 카테고리별 분포
    value_type_dist = defaultdict(int)
    diversity_dist = defaultdict(int)
    purpose_dist = defaultdict(int)
    antipattern_dist = defaultdict(int)

    for r in results:
        if not r["analysis"]["success"]:
            continue
        analysis = r["analysis"]
        for vt in analysis["value_types"]:
            value_type_dist[vt] += 1
        for id_ in analysis["input_diversity"]:
            diversity_dist[id_] += 1
        for tp in analysis["test_purposes"]:
            purpose_dist[tp] += 1
        for ap in analysis["antipatterns"]:
            antipattern_dist[ap["type"]] += 1

    # 완료 기준 체크
    criteria = {
        "parametrize_parsed": all(
            r["analysis"]["parametrize_count"] >= 0
            for r in results if r["analysis"]["success"]
        ),
        "high_confidence_ratio": (
            high_confidence_count / success_count * 100 if success_count > 0 else 0
        ),
        "high_confidence_met": (
            high_confidence_count / success_count >= 0.7 if success_count > 0 else False
        ),
    }

    report = {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_samples": total,
            "success_count": success_count,
            "failure_count": total - success_count,
            "success_rate": success_count / total * 100,
        },
        "confidence": {
            "values": confidence_values,
            "average": sum(confidence_values) / len(confidence_values) if confidence_values else 0,
            "min": min(confidence_values) if confidence_values else 0,
            "max": max(confidence_values) if confidence_values else 0,
            "high_confidence_count": high_confidence_count,
            "high_confidence_ratio": criteria["high_confidence_ratio"],
        },
        "distributions": {
            "value_types": dict(value_type_dist),
            "input_diversity": dict(diversity_dist),
            "test_purposes": dict(purpose_dist),
            "antipatterns": dict(antipattern_dist),
        },
        "completion_criteria": criteria,
        "details": results,
    }

    # 파일 저장
    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"[저장] 리포트 저장 완료: {output_path}")

    return report


def print_report_summary(report: dict):
    """리포트 요약 출력"""

    print("\n" + "=" * 60)
    print("테스트 품질 분석 스파이크 리포트")
    print("=" * 60)

    summary = report["summary"]
    print(f"\n[분석 요약]")
    print(f"  - 총 샘플 수: {summary['total_samples']}")
    print(f"  - 성공: {summary['success_count']} ({summary['success_rate']:.1f}%)")
    print(f"  - 실패: {summary['failure_count']}")

    conf = report["confidence"]
    print(f"\n[신뢰도 (Confidence)]")
    print(f"  - 평균: {conf['average']:.2f}")
    print(f"  - 최소: {conf['min']:.2f}")
    print(f"  - 최대: {conf['max']:.2f}")
    print(f"  - 0.7 이상: {conf['high_confidence_count']}개 ({conf['high_confidence_ratio']:.1f}%)")

    dist = report["distributions"]
    print(f"\n[ValueType 분포]")
    for vt, count in sorted(dist["value_types"].items(), key=lambda x: -x[1]):
        print(f"  - {vt}: {count}")

    print(f"\n[InputDiversity 분포]")
    for id_, count in sorted(dist["input_diversity"].items(), key=lambda x: -x[1]):
        print(f"  - {id_}: {count}")

    print(f"\n[TestPurpose 분포]")
    for tp, count in sorted(dist["test_purposes"].items(), key=lambda x: -x[1]):
        print(f"  - {tp}: {count}")

    if dist["antipatterns"]:
        print(f"\n[AntiPattern 분포]")
        for ap, count in sorted(dist["antipatterns"].items(), key=lambda x: -x[1]):
            print(f"  - {ap}: {count}")

    criteria = report["completion_criteria"]
    print(f"\n[완료 기준 체크]")
    print(f"  - parametrize 파싱: {'[PASS]' if criteria['parametrize_parsed'] else '[FAIL]'}")
    print(f"  - confidence 0.7+ 비율: {criteria['high_confidence_ratio']:.1f}%")
    print(f"  - 70% 이상 충족: {'[PASS]' if criteria['high_confidence_met'] else '[FAIL]'}")

    print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="테스트 품질 분석 시스템 스파이크 검증"
    )
    parser.add_argument(
        "--db", action="store_true",
        help="DB에서 실제 제출 데이터 사용"
    )
    parser.add_argument(
        "--sample", action="store_true", default=True,
        help="샘플 테스트 코드 사용 (기본값)"
    )
    parser.add_argument(
        "--limit", type=int, default=30,
        help="DB에서 가져올 제출 수 (기본값: 30)"
    )
    parser.add_argument(
        "--output", "-o", type=str,
        help="리포트 출력 파일 경로 (JSON)"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="상세 출력"
    )

    args = parser.parse_args()

    # 파서 및 분류기 초기화
    test_parser = TestCaseParser()
    classifier = TestQualityClassifier()

    # 데이터 로드
    samples = []

    if args.db:
        print("[정보] DB에서 제출 데이터 로드 중...")
        db_samples = load_db_submissions(args.limit)
        samples.extend(db_samples)
        print(f"[정보] DB에서 {len(db_samples)}개 로드됨")

    if not samples or args.sample:
        print("[정보] 샘플 테스트 코드 사용")
        samples.extend(SAMPLE_TEST_CODES)

    if not samples:
        print("[오류] 분석할 데이터가 없습니다.")
        sys.exit(1)

    print(f"\n[정보] 총 {len(samples)}개 샘플 분석 시작...")

    # 분석 수행
    results = []
    for i, sample in enumerate(samples, 1):
        sample_id = sample.get("id", f"sample_{i}")
        sample_name = sample.get("name", f"Sample {i}")
        code = sample["code"]

        if args.verbose:
            print(f"\n[{i}/{len(samples)}] {sample_name}")

        analysis = analyze_code(code, test_parser, classifier)

        result = {
            "id": sample_id,
            "name": sample_name,
            "analysis": analysis,
        }

        # 기대값과 비교 (샘플에 기대값이 있는 경우)
        if "expected_purposes" in sample:
            result["expected"] = {
                "purposes": sample.get("expected_purposes", []),
                "value_types": sample.get("expected_value_types", []),
                "diversity": sample.get("expected_diversity", []),
                "antipatterns": sample.get("expected_antipatterns", []),
            }

        results.append(result)

        if args.verbose:
            if analysis["success"]:
                print(f"  - 테스트 수: {analysis['test_count']}")
                print(f"  - parametrize: {analysis['parametrize_count']}")
                print(f"  - confidence: {analysis['confidence']:.2f}")
                print(f"  - ValueTypes: {analysis['value_types']}")
                print(f"  - Purposes: {analysis['test_purposes']}")
            else:
                print(f"  - 오류: {analysis['error']}")

    # 리포트 생성
    output_path = args.output
    if not output_path:
        output_path = Path(__file__).parent / "spike_report.json"

    report = generate_report(results, str(output_path))
    print_report_summary(report)


if __name__ == "__main__":
    main()
