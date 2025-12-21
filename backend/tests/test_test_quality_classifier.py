"""
TestQualityClassifier 단위 테스트.

테스트 품질 분류 기능을 검증합니다.
"""
import pytest
from app.services.test_case_parser import TestCaseParser
from app.services.test_quality_classifier import (
    TestQualityClassifier,
    ValueTypeClassifier,
    InputDiversityClassifier,
    TestPurposeClassifier,
    AntiPatternDetector,
    ValueType,
    InputDiversity,
    TestPurpose,
    AntiPatternType,
)


@pytest.fixture
def value_classifier():
    """ValueTypeClassifier 인스턴스를 생성합니다."""
    return ValueTypeClassifier()


@pytest.fixture
def diversity_classifier():
    """InputDiversityClassifier 인스턴스를 생성합니다."""
    return InputDiversityClassifier()


@pytest.fixture
def purpose_classifier():
    """TestPurposeClassifier 인스턴스를 생성합니다."""
    return TestPurposeClassifier()


@pytest.fixture
def antipattern_detector():
    """AntiPatternDetector 인스턴스를 생성합니다."""
    return AntiPatternDetector()


@pytest.fixture
def parser():
    """TestCaseParser 인스턴스를 생성합니다."""
    return TestCaseParser()


@pytest.fixture
def classifier():
    """TestQualityClassifier 인스턴스를 생성합니다."""
    return TestQualityClassifier()


class TestValueTypeClassifier:
    """ValueType 분류 테스트."""

    def test_classify_normal_integer(self, value_classifier):
        """정상 정수를 분류합니다."""
        result = value_classifier.classify(5)
        assert ValueType.NORMAL in result

    def test_classify_boundary_zero(self, value_classifier):
        """경계값 0을 분류합니다."""
        result = value_classifier.classify(0)
        assert ValueType.BOUNDARY in result

    def test_classify_boundary_one(self, value_classifier):
        """경계값 1을 분류합니다."""
        result = value_classifier.classify(1)
        assert ValueType.BOUNDARY in result

    def test_classify_boundary_minus_one(self, value_classifier):
        """경계값 -1을 분류합니다."""
        result = value_classifier.classify(-1)
        assert ValueType.BOUNDARY in result
        assert ValueType.NEGATIVE in result

    def test_classify_negative_number(self, value_classifier):
        """음수를 분류합니다."""
        result = value_classifier.classify(-5)
        assert ValueType.NEGATIVE in result

    def test_classify_extreme_large_number(self, value_classifier):
        """극단적으로 큰 수를 분류합니다."""
        result = value_classifier.classify(10**18)
        assert ValueType.EXTREME in result

    def test_classify_empty_string(self, value_classifier):
        """빈 문자열을 분류합니다."""
        result = value_classifier.classify('')
        assert ValueType.EDGE in result

    def test_classify_none(self, value_classifier):
        """None을 분류합니다."""
        result = value_classifier.classify(None)
        assert ValueType.EDGE in result

    def test_classify_empty_list(self, value_classifier):
        """빈 리스트를 분류합니다."""
        result = value_classifier.classify([])
        assert ValueType.EDGE in result

    def test_classify_empty_dict(self, value_classifier):
        """빈 딕셔너리를 분류합니다."""
        result = value_classifier.classify({})
        assert ValueType.EDGE in result

    def test_classify_normal_string(self, value_classifier):
        """정상 문자열을 분류합니다."""
        result = value_classifier.classify("hello")
        assert ValueType.NORMAL in result

    def test_classify_invalid_string(self, value_classifier):
        """invalid 키워드가 포함된 문자열을 분류합니다."""
        result = value_classifier.classify("invalid_input")
        assert ValueType.NEGATIVE in result

    def test_classify_normal_list(self, value_classifier):
        """정상 리스트를 분류합니다."""
        result = value_classifier.classify([1, 2, 3])
        assert ValueType.NORMAL in result

    def test_classify_from_code_boundary(self, value_classifier):
        """코드에서 경계값을 분류합니다."""
        result = value_classifier.classify_from_code("0")
        assert ValueType.BOUNDARY in result

    def test_classify_from_code_empty_list(self, value_classifier):
        """코드에서 빈 리스트를 분류합니다."""
        result = value_classifier.classify_from_code("[]")
        assert ValueType.EDGE in result


class TestInputDiversityClassifier:
    """InputDiversity 분류 테스트."""

    def test_classify_single_element_list(self, diversity_classifier):
        """단일 요소 리스트를 분류합니다."""
        result = diversity_classifier.classify([1])
        assert InputDiversity.SINGLE in result

    def test_classify_multiple_elements_list(self, diversity_classifier):
        """다중 요소 리스트를 분류합니다."""
        result = diversity_classifier.classify([1, 2, 3, 4, 5])
        assert InputDiversity.MULTIPLE in result

    def test_classify_empty_list(self, diversity_classifier):
        """빈 리스트를 분류합니다."""
        result = diversity_classifier.classify([])
        assert InputDiversity.EMPTY in result

    def test_classify_duplicate_elements(self, diversity_classifier):
        """중복 요소가 있는 리스트를 분류합니다."""
        result = diversity_classifier.classify([1, 1, 2, 2])
        assert InputDiversity.DUPLICATE in result
        assert InputDiversity.MULTIPLE in result

    def test_classify_mixed_types(self, diversity_classifier):
        """혼합 타입 리스트를 분류합니다."""
        result = diversity_classifier.classify([1, "a", None])
        assert InputDiversity.MIXED_TYPES in result

    def test_classify_empty_string(self, diversity_classifier):
        """빈 문자열을 분류합니다."""
        result = diversity_classifier.classify("")
        assert InputDiversity.EMPTY in result

    def test_classify_single_char_string(self, diversity_classifier):
        """단일 문자 문자열을 분류합니다."""
        result = diversity_classifier.classify("a")
        assert InputDiversity.SINGLE in result

    def test_classify_multi_char_string(self, diversity_classifier):
        """여러 문자 문자열을 분류합니다."""
        result = diversity_classifier.classify("hello")
        assert InputDiversity.MULTIPLE in result

    def test_classify_none(self, diversity_classifier):
        """None을 분류합니다."""
        result = diversity_classifier.classify(None)
        assert InputDiversity.EMPTY in result

    def test_classify_empty_dict(self, diversity_classifier):
        """빈 딕셔너리를 분류합니다."""
        result = diversity_classifier.classify({})
        assert InputDiversity.EMPTY in result

    def test_classify_single_key_dict(self, diversity_classifier):
        """단일 키 딕셔너리를 분류합니다."""
        result = diversity_classifier.classify({"a": 1})
        assert InputDiversity.SINGLE in result

    def test_classify_from_code_empty(self, diversity_classifier):
        """코드에서 빈 리스트를 분류합니다."""
        result = diversity_classifier.classify_from_code("[]")
        assert InputDiversity.EMPTY in result


class TestTestPurposeClassifier:
    """TestPurpose 분류 테스트."""

    def test_classify_happy_path_by_name(self, parser, purpose_classifier):
        """함수 이름에서 happy path를 감지합니다."""
        code = '''
def test_normal_case():
    assert True
'''
        result = parser.parse(code)
        purposes = purpose_classifier.classify(result.test_cases[0])
        assert TestPurpose.HAPPY_PATH in purposes

    def test_classify_error_handling_by_name(self, parser, purpose_classifier):
        """함수 이름에서 error handling을 감지합니다."""
        code = '''
def test_error_case():
    assert True
'''
        result = parser.parse(code)
        purposes = purpose_classifier.classify(result.test_cases[0])
        assert TestPurpose.ERROR_HANDLING in purposes

    def test_classify_error_handling_by_raises(self, parser, purpose_classifier):
        """pytest.raises 사용에서 error handling을 감지합니다."""
        code = '''
import pytest

def test_something():
    with pytest.raises(ValueError):
        raise ValueError()
'''
        result = parser.parse(code)
        purposes = purpose_classifier.classify(result.test_cases[0])
        assert TestPurpose.ERROR_HANDLING in purposes

    def test_classify_boundary_check_by_name(self, parser, purpose_classifier):
        """함수 이름에서 boundary check를 감지합니다."""
        code = '''
def test_boundary_value():
    assert True
'''
        result = parser.parse(code)
        purposes = purpose_classifier.classify(result.test_cases[0])
        assert TestPurpose.BOUNDARY_CHECK in purposes

    def test_classify_boundary_by_edge_keyword(self, parser, purpose_classifier):
        """edge 키워드에서 boundary check를 감지합니다."""
        code = '''
def test_edge_case():
    assert True
'''
        result = parser.parse(code)
        purposes = purpose_classifier.classify(result.test_cases[0])
        assert TestPurpose.BOUNDARY_CHECK in purposes

    def test_classify_default_happy_path(self, parser, purpose_classifier):
        """분류 불가 시 happy path로 기본 설정합니다."""
        code = '''
def test_something():
    assert 1 == 1
'''
        result = parser.parse(code)
        purposes = purpose_classifier.classify(result.test_cases[0])
        assert TestPurpose.HAPPY_PATH in purposes


class TestAntiPatternDetector:
    """AntiPattern 감지 테스트."""

    def test_detect_no_assertion(self, parser, antipattern_detector):
        """assertion이 없는 테스트를 감지합니다."""
        code = '''
def test_no_assert():
    x = 1 + 1
    print(x)
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        assert len(antipatterns) == 1
        assert antipatterns[0].pattern_type == AntiPatternType.NO_ASSERTION
        assert antipatterns[0].penalty == -10

    def test_no_detect_when_has_assertion(self, parser, antipattern_detector):
        """assertion이 있으면 NO_ASSERTION을 감지하지 않습니다."""
        code = '''
def test_with_assert():
    assert True
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        no_assertion_patterns = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.NO_ASSERTION
        ]
        assert len(no_assertion_patterns) == 0

    def test_detect_exception_swallowed(self, parser, antipattern_detector):
        """예외가 삼켜지는 패턴을 감지합니다."""
        code = '''
def test_swallow():
    try:
        risky_operation()
    except Exception:
        pass
    assert True
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        swallowed = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.EXCEPTION_SWALLOWED
        ]
        assert len(swallowed) == 1
        assert swallowed[0].penalty == -15

    def test_detect_external_dependency(self, parser, antipattern_detector):
        """외부 의존성을 감지합니다."""
        code = '''
def test_external():
    import requests
    response = requests.get("http://example.com")
    assert response.status_code == 200
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        external = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.EXTERNAL_DEPENDENCY
        ]
        assert len(external) == 1
        assert external[0].penalty == -5

    def test_detect_non_deterministic(self, parser, antipattern_detector):
        """비결정적 요소를 감지합니다."""
        code = '''
def test_random():
    import random
    value = random.randint(1, 10)
    assert value > 0
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        non_det = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.NON_DETERMINISTIC
        ]
        assert len(non_det) == 1
        assert non_det[0].penalty == -10

    def test_detect_excessive_nesting(self, parser, antipattern_detector):
        """과도한 중첩을 감지합니다."""
        code = '''
def test_nested():
    if True:
        if True:
            if True:
                if True:
                    assert True
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        nesting = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.EXCESSIVE_NESTING
        ]
        assert len(nesting) == 1
        assert nesting[0].penalty == -5

    def test_detect_loop_instead_param(self, parser, antipattern_detector):
        """루프 대신 parametrize 사용을 권장합니다."""
        code = '''
def test_with_loop():
    for i in range(5):
        assert i >= 0
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        loop = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.LOOP_INSTEAD_PARAM
        ]
        assert len(loop) == 1
        assert loop[0].penalty == 0  # 경고만

    def test_no_detect_loop_when_parametrized(self, parser, antipattern_detector):
        """parametrize 사용 시 루프 경고를 표시하지 않습니다."""
        code = '''
import pytest

@pytest.mark.parametrize("value", [1, 2, 3])
def test_with_param(value):
    for item in [value]:
        assert item > 0
'''
        result = parser.parse(code)
        antipatterns = antipattern_detector.detect(result.test_cases[0])

        loop = [
            ap for ap in antipatterns
            if ap.pattern_type == AntiPatternType.LOOP_INSTEAD_PARAM
        ]
        assert len(loop) == 0


class TestTestQualityClassifier:
    """통합 분류기 테스트."""

    def test_classify_simple_test(self, parser, classifier):
        """간단한 테스트를 분류합니다."""
        code = '''
def test_simple():
    assert 1 + 1 == 2
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        assert len(result.test_classifications) == 1
        assert result.overall_confidence > 0

    def test_classify_parametrized_test(self, parser, classifier):
        """parametrize 테스트를 분류합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("value, expected", [
    (0, True),
    (1, True),
    (-1, False),
    (100, True),
])
def test_boundary(value, expected):
    assert is_valid(value) == expected
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        tc = result.test_classifications[0]

        # 경계값이 감지되어야 함
        assert ValueType.BOUNDARY in tc.value_types

        # 음수가 감지되어야 함
        assert ValueType.NEGATIVE in tc.value_types

    def test_classify_error_handling_test(self, parser, classifier):
        """에러 처리 테스트를 분류합니다."""
        code = '''
import pytest

def test_raises_value_error():
    with pytest.raises(ValueError):
        raise ValueError("error")
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        tc = result.test_classifications[0]
        assert TestPurpose.ERROR_HANDLING in tc.test_purposes

    def test_classify_comprehensive(self, parser, classifier):
        """종합적인 테스트 파일을 분류합니다."""
        code = '''
import pytest

def test_normal_case():
    """정상 케이스 테스트."""
    assert func(5) == 10

@pytest.mark.parametrize("input_val, expected", [
    (0, 0),
    (1, 1),
    (-1, -1),
    ([], None),
])
def test_boundary_cases(input_val, expected):
    """경계값 테스트."""
    assert func(input_val) == expected

def test_error_handling():
    """에러 처리 테스트."""
    with pytest.raises(ValueError):
        func("invalid")

def test_no_assertion():
    x = 1 + 1
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        # 4개의 테스트 함수
        assert len(result.test_classifications) == 4

        # 전체 분류 결과 확인
        assert ValueType.BOUNDARY in result.all_value_types
        assert ValueType.EDGE in result.all_value_types  # []
        assert InputDiversity.EMPTY in result.all_input_diversities
        assert TestPurpose.ERROR_HANDLING in result.all_test_purposes

        # 안티패턴 감지
        no_assertion = [
            ap for ap in result.all_antipatterns
            if ap.pattern_type == AntiPatternType.NO_ASSERTION
        ]
        assert len(no_assertion) == 1

    def test_confidence_calculation(self, parser, classifier):
        """신뢰도 계산을 테스트합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("value", [1, 2, 3])
def test_with_values(value):
    assert value > 0
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        # 구체적인 값이 있으므로 신뢰도가 높아야 함
        assert result.overall_confidence >= 0.5

    def test_empty_test_file(self, parser, classifier):
        """빈 테스트 파일을 처리합니다."""
        code = '''
def helper():
    pass
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        assert len(result.test_classifications) == 0
        assert result.overall_confidence == 0.0


class TestRealWorldScenarios:
    """실제 사용 시나리오 테스트."""

    def test_mutation_testing_sample(self, parser, classifier):
        """mutation testing용 샘플을 분류합니다."""
        code = '''
import pytest

def test_is_prime_basic():
    """기본 소수 테스트."""
    assert is_prime(2) == True
    assert is_prime(3) == True
    assert is_prime(4) == False

@pytest.mark.parametrize("n, expected", [
    (0, False),
    (1, False),
    (2, True),
    (97, True),
    (100, False),
    (10**9, False),
])
def test_is_prime_comprehensive(n, expected):
    """종합 테스트."""
    assert is_prime(n) == expected

def test_is_prime_negative():
    """음수 입력 테스트."""
    with pytest.raises(ValueError):
        is_prime(-1)

def test_is_prime_empty():
    """None 입력 테스트."""
    with pytest.raises(TypeError):
        is_prime(None)
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        # 값 유형 확인
        assert ValueType.BOUNDARY in result.all_value_types  # 0, 1, 2
        assert ValueType.NORMAL in result.all_value_types    # 97, 100
        assert ValueType.EXTREME in result.all_value_types   # 10**9

        # 테스트 목적 확인
        assert TestPurpose.ERROR_HANDLING in result.all_test_purposes
        assert TestPurpose.BOUNDARY_CHECK in result.all_test_purposes

        # 입력 다양성 확인
        assert InputDiversity.SINGLE in result.all_input_diversities

    def test_calculator_test_suite(self, parser, classifier):
        """계산기 테스트 스위트를 분류합니다."""
        code = '''
import pytest

class TestCalculator:
    def test_add_normal(self):
        """정상 덧셈 테스트."""
        assert add(2, 3) == 5

    @pytest.mark.parametrize("a, b, expected", [
        (0, 0, 0),
        (0, 1, 1),
        (1, 0, 1),
        (-1, 1, 0),
        (1000000, 1000000, 2000000),
    ])
    def test_add_boundary(self, a, b, expected):
        """경계값 테스트."""
        assert add(a, b) == expected

    def test_divide_by_zero(self):
        """0으로 나누기 테스트."""
        with pytest.raises(ZeroDivisionError):
            divide(1, 0)

    def test_divide_normal(self):
        assert divide(10, 2) == 5
'''
        parse_result = parser.parse(code)
        result = classifier.classify(parse_result)

        # 4개의 테스트
        assert len(result.test_classifications) == 4

        # 분류 확인
        assert ValueType.BOUNDARY in result.all_value_types
        assert ValueType.NEGATIVE in result.all_value_types
        assert TestPurpose.ERROR_HANDLING in result.all_test_purposes
