"""
TestCaseParser 단위 테스트.

테스트 코드 파싱 기능을 검증합니다.
"""
import pytest
from app.services.test_case_parser import (
    TestCaseParser,
    ParseResult,
    ParsedTestCase,
    AssertionType,
    ParametrizeCase,
)


@pytest.fixture
def parser():
    """TestCaseParser 인스턴스를 생성합니다."""
    return TestCaseParser()


class TestBasicParsing:
    """기본 파싱 기능 테스트."""

    def test_parse_simple_test_function(self, parser):
        """간단한 테스트 함수를 파싱합니다."""
        code = '''
def test_simple():
    assert 1 + 1 == 2
'''
        result = parser.parse(code)

        assert result.total_test_count == 1
        assert result.effective_test_count == 1
        assert len(result.test_cases) == 1
        assert result.test_cases[0].name == 'test_simple'
        assert result.test_cases[0].has_assertion

    def test_parse_multiple_test_functions(self, parser):
        """여러 테스트 함수를 파싱합니다."""
        code = '''
def test_first():
    assert True

def test_second():
    assert 1 == 1

def helper_function():
    """헬퍼 함수 (테스트 아님)"""
    pass

def test_third():
    assert "hello" == "hello"
'''
        result = parser.parse(code)

        assert result.total_test_count == 3
        test_names = [tc.name for tc in result.test_cases]
        assert 'test_first' in test_names
        assert 'test_second' in test_names
        assert 'test_third' in test_names
        assert 'helper_function' not in test_names

    def test_parse_test_with_docstring(self, parser):
        """docstring이 있는 테스트 함수를 파싱합니다."""
        code = '''
def test_with_docstring():
    """이것은 docstring입니다."""
    assert True
'''
        result = parser.parse(code)

        assert result.test_cases[0].docstring == "이것은 docstring입니다."

    def test_parse_syntax_error(self, parser):
        """문법 오류가 있는 코드를 처리합니다."""
        code = '''
def test_broken(
    assert True
'''
        result = parser.parse(code)

        assert result.has_syntax_error
        assert result.syntax_error_message is not None
        assert result.total_test_count == 0


class TestFixtureDetection:
    """Fixture 감지 테스트."""

    def test_detect_single_fixture(self, parser):
        """단일 fixture를 감지합니다."""
        code = '''
def test_with_fixture(tmp_path):
    assert tmp_path.exists()
'''
        result = parser.parse(code)

        assert 'tmp_path' in result.test_cases[0].fixtures
        assert 'tmp_path' in result.fixtures_used

    def test_detect_multiple_fixtures(self, parser):
        """여러 fixture를 감지합니다."""
        code = '''
def test_with_multiple_fixtures(tmp_path, capsys, monkeypatch):
    assert True
'''
        result = parser.parse(code)

        fixtures = result.test_cases[0].fixtures
        assert 'tmp_path' in fixtures
        assert 'capsys' in fixtures
        assert 'monkeypatch' in fixtures

    def test_detect_custom_fixture(self, parser):
        """사용자 정의 fixture를 감지합니다."""
        code = '''
def test_with_custom_fixture(my_custom_fixture, db_session):
    assert my_custom_fixture is not None
'''
        result = parser.parse(code)

        fixtures = result.test_cases[0].fixtures
        assert 'my_custom_fixture' in fixtures
        assert 'db_session' in fixtures


class TestParametrizeSupport:
    """@pytest.mark.parametrize 지원 테스트."""

    def test_parse_simple_parametrize(self, parser):
        """간단한 parametrize를 파싱합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("value", [1, 2, 3])
def test_parametrized(value):
    assert value > 0
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.is_parametrized
        assert len(tc.parametrize_cases) == 3
        assert tc.effective_test_count == 3
        assert result.effective_test_count == 3

    def test_parse_multi_param_parametrize(self, parser):
        """여러 파라미터를 가진 parametrize를 파싱합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("a, b, expected", [
    (1, 2, 3),
    (4, 5, 9),
    (0, 0, 0),
])
def test_add(a, b, expected):
    assert a + b == expected
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.is_parametrized
        assert len(tc.parametrize_cases) == 3

        # 첫 번째 케이스 검증
        first_case = tc.parametrize_cases[0]
        assert first_case.param_names == ['a', 'b', 'expected']
        assert first_case.param_values == [1, 2, 3]

    def test_parse_parametrize_with_string_values(self, parser):
        """문자열 값을 가진 parametrize를 파싱합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("input_str, expected", [
    ("hello", 5),
    ("", 0),
    ("world", 5),
])
def test_string_length(input_str, expected):
    assert len(input_str) == expected
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.is_parametrized
        assert len(tc.parametrize_cases) == 3

        # 빈 문자열 케이스 검증
        empty_case = tc.parametrize_cases[1]
        assert empty_case.param_values == ["", 0]

    def test_parse_parametrize_with_list_values(self, parser):
        """리스트 값을 가진 parametrize를 파싱합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("input_list, expected", [
    ([1, 2, 3], 3),
    ([], 0),
    ([1], 1),
])
def test_list_length(input_list, expected):
    assert len(input_list) == expected
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.is_parametrized
        assert len(tc.parametrize_cases) == 3

    def test_parse_parametrize_tuple_params(self, parser):
        """튜플 형태의 파라미터 이름을 파싱합니다."""
        code = '''
import pytest

@pytest.mark.parametrize(("x", "y"), [(1, 2), (3, 4)])
def test_tuple_params(x, y):
    assert x < y
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.is_parametrized
        first_case = tc.parametrize_cases[0]
        assert first_case.param_names == ['x', 'y']


class TestPytestRaisesDetection:
    """pytest.raises 감지 테스트."""

    def test_detect_pytest_raises_context_manager(self, parser):
        """with pytest.raises() 형태를 감지합니다."""
        code = '''
import pytest

def test_raises_value_error():
    with pytest.raises(ValueError):
        raise ValueError("error")
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.uses_pytest_raises
        assert tc.raises_exception_type == 'ValueError'

    def test_detect_pytest_raises_with_match(self, parser):
        """pytest.raises with match를 감지합니다."""
        code = '''
import pytest

def test_raises_with_match():
    with pytest.raises(TypeError, match="expected"):
        raise TypeError("expected error")
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert tc.uses_pytest_raises
        assert tc.raises_exception_type == 'TypeError'

    def test_detect_multiple_exception_types(self, parser):
        """여러 예외 타입을 감지합니다."""
        code = '''
import pytest

def test_raises_key_error():
    with pytest.raises(KeyError):
        d = {}
        _ = d["missing"]

def test_raises_index_error():
    with pytest.raises(IndexError):
        lst = []
        _ = lst[0]
'''
        result = parser.parse(code)

        assert len(result.test_cases) == 2
        assert result.test_cases[0].raises_exception_type == 'KeyError'
        assert result.test_cases[1].raises_exception_type == 'IndexError'


class TestAssertionAnalysis:
    """Assertion 분석 테스트."""

    def test_detect_assert_equal(self, parser):
        """assert == 를 감지합니다."""
        code = '''
def test_equal():
    assert 1 + 1 == 2
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert len(assertions) == 1
        assert assertions[0].assertion_type == AssertionType.ASSERT_EQUAL

    def test_detect_assert_not_equal(self, parser):
        """assert != 를 감지합니다."""
        code = '''
def test_not_equal():
    assert 1 != 2
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert assertions[0].assertion_type == AssertionType.ASSERT_NOT_EQUAL

    def test_detect_assert_in(self, parser):
        """assert in 을 감지합니다."""
        code = '''
def test_in():
    assert 1 in [1, 2, 3]
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert assertions[0].assertion_type == AssertionType.ASSERT_IN

    def test_detect_assert_true(self, parser):
        """단순 assert를 감지합니다."""
        code = '''
def test_true():
    assert some_function()
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert assertions[0].assertion_type == AssertionType.ASSERT_TRUE

    def test_detect_assert_false(self, parser):
        """assert not을 감지합니다."""
        code = '''
def test_false():
    assert not some_condition
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert assertions[0].assertion_type == AssertionType.ASSERT_FALSE

    def test_detect_multiple_assertions(self, parser):
        """여러 assertion을 감지합니다."""
        code = '''
def test_multiple_assertions():
    assert 1 == 1
    assert 2 != 3
    assert 4 in [1, 2, 3, 4]
    assert True
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert len(assertions) == 4

    def test_no_assertion_detection(self, parser):
        """assertion이 없는 테스트를 감지합니다."""
        code = '''
def test_no_assertion():
    x = 1 + 1
    print(x)
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        assert len(tc.assertions) == 0
        assert not tc.has_assertion


class TestMarkerDetection:
    """pytest marker 감지 테스트."""

    def test_detect_skip_marker(self, parser):
        """@pytest.mark.skip을 감지합니다."""
        code = '''
import pytest

@pytest.mark.skip
def test_skipped():
    assert True
'''
        result = parser.parse(code)

        assert 'skip' in result.test_cases[0].markers

    def test_detect_skip_marker_with_reason(self, parser):
        """@pytest.mark.skip(reason=...)을 감지합니다."""
        code = '''
import pytest

@pytest.mark.skip(reason="not implemented")
def test_skipped():
    assert True
'''
        result = parser.parse(code)

        assert 'skip' in result.test_cases[0].markers

    def test_detect_xfail_marker(self, parser):
        """@pytest.mark.xfail을 감지합니다."""
        code = '''
import pytest

@pytest.mark.xfail
def test_expected_to_fail():
    assert False
'''
        result = parser.parse(code)

        assert 'xfail' in result.test_cases[0].markers

    def test_detect_multiple_markers(self, parser):
        """여러 marker를 감지합니다."""
        code = '''
import pytest

@pytest.mark.slow
@pytest.mark.integration
def test_multiple_markers():
    assert True
'''
        result = parser.parse(code)

        markers = result.test_cases[0].markers
        assert 'slow' in markers
        assert 'integration' in markers


class TestEdgeCases:
    """에지 케이스 테스트."""

    def test_empty_code(self, parser):
        """빈 코드를 처리합니다."""
        code = ''
        result = parser.parse(code)

        assert result.total_test_count == 0
        assert result.effective_test_count == 0

    def test_no_test_functions(self, parser):
        """테스트 함수가 없는 코드를 처리합니다."""
        code = '''
def helper():
    pass

def another_helper():
    return 42
'''
        result = parser.parse(code)

        assert result.total_test_count == 0

    def test_test_suffix_naming(self, parser):
        """_test 접미사를 가진 함수를 감지합니다."""
        code = '''
def my_function_test():
    assert True
'''
        result = parser.parse(code)

        assert result.total_test_count == 1
        assert result.test_cases[0].name == 'my_function_test'

    def test_nested_function(self, parser):
        """중첩 함수가 있는 테스트를 처리합니다."""
        code = '''
def test_with_nested():
    def inner_helper():
        return 42

    assert inner_helper() == 42
'''
        result = parser.parse(code)

        # 중첩 함수는 테스트로 카운트되지 않아야 함
        assert result.total_test_count == 1
        assert result.test_cases[0].name == 'test_with_nested'

    def test_parametrize_with_negative_numbers(self, parser):
        """음수 값을 가진 parametrize를 파싱합니다."""
        code = '''
import pytest

@pytest.mark.parametrize("value", [-1, -100, 0, 1])
def test_negative(value):
    assert isinstance(value, int)
'''
        result = parser.parse(code)

        tc = result.test_cases[0]
        values = [case.param_values[0] for case in tc.parametrize_cases]
        assert -1 in values
        assert -100 in values

    def test_complex_assertion_values(self, parser):
        """복잡한 assertion 값을 추출합니다."""
        code = '''
def test_complex():
    result = some_function()
    assert result["key"] == expected_value
'''
        result = parser.parse(code)

        assertions = result.test_cases[0].assertions
        assert len(assertions) == 1
        assert assertions[0].assertion_type == AssertionType.ASSERT_EQUAL


class TestRealWorldScenarios:
    """실제 사용 시나리오 테스트."""

    def test_comprehensive_test_file(self, parser):
        """종합적인 테스트 파일을 파싱합니다."""
        code = '''
import pytest

class TestCalculator:
    """계산기 테스트 클래스."""

    def test_add(self):
        assert 1 + 1 == 2

    @pytest.mark.parametrize("a, b, expected", [
        (1, 2, 3),
        (0, 0, 0),
        (-1, 1, 0),
    ])
    def test_add_parametrized(self, a, b, expected):
        assert a + b == expected

    def test_divide_by_zero(self):
        with pytest.raises(ZeroDivisionError):
            _ = 1 / 0

    @pytest.mark.skip(reason="not implemented")
    def test_not_ready(self):
        pass


def test_standalone(tmp_path):
    """독립 테스트 함수."""
    assert tmp_path.exists()
'''
        result = parser.parse(code)

        # 총 5개의 테스트 함수
        assert result.total_test_count == 5

        # parametrize로 인해 effective count는 더 높음
        assert result.effective_test_count == 7  # 1 + 3 + 1 + 1 + 1

        # fixture 사용 확인
        assert 'tmp_path' in result.fixtures_used

    def test_mutation_testing_sample(self, parser):
        """mutation testing용 샘플 테스트를 파싱합니다."""
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
])
def test_is_prime_boundary(n, expected):
    """경계값 테스트."""
    assert is_prime(n) == expected

def test_is_prime_negative():
    """음수 입력 테스트."""
    with pytest.raises(ValueError):
        is_prime(-1)
'''
        result = parser.parse(code)

        assert result.total_test_count == 3
        assert result.effective_test_count == 7  # 1 + 5 + 1

        # raises 사용 확인
        negative_test = next(tc for tc in result.test_cases if 'negative' in tc.name)
        assert negative_test.uses_pytest_raises
        assert negative_test.raises_exception_type == 'ValueError'
