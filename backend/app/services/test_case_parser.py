"""
테스트 코드 파서 모듈.

사용자가 제출한 pytest 테스트 코드를 AST로 파싱하여
테스트 케이스, parametrize, fixture, assertion 등을 추출합니다.
"""
import ast
import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class AssertionType(Enum):
    """Assertion 유형."""
    ASSERT_EQUAL = "assert_equal"           # assert a == b
    ASSERT_NOT_EQUAL = "assert_not_equal"   # assert a != b
    ASSERT_TRUE = "assert_true"             # assert expr
    ASSERT_FALSE = "assert_false"           # assert not expr
    ASSERT_IN = "assert_in"                 # assert a in b
    ASSERT_NOT_IN = "assert_not_in"         # assert a not in b
    ASSERT_IS = "assert_is"                 # assert a is b
    ASSERT_IS_NOT = "assert_is_not"         # assert a is not b
    ASSERT_RAISES = "assert_raises"         # pytest.raises
    ASSERT_APPROX = "assert_approx"         # pytest.approx
    ASSERT_OTHER = "assert_other"           # 기타


@dataclass
class ParametrizeCase:
    """parametrize로 생성된 개별 케이스."""
    param_names: list[str]
    param_values: list[Any]
    index: int  # parametrize 내 인덱스

    def __post_init__(self):
        """값을 문자열로 변환하여 해시 가능하게 만듦."""
        self.param_values = [
            str(v) if not isinstance(v, (str, int, float, bool, type(None)))
            else v
            for v in self.param_values
        ]


@dataclass
class AssertionInfo:
    """Assertion 정보."""
    assertion_type: AssertionType
    line_number: int
    raw_code: str  # assertion 원본 코드
    left_value: str | None = None   # 비교문 왼쪽 (가능한 경우)
    right_value: str | None = None  # 비교문 오른쪽 (가능한 경우)


@dataclass
class ParsedTestCase:
    """파싱된 테스트 케이스."""
    name: str                                    # 함수 이름
    line_number: int                             # 시작 라인
    end_line_number: int                         # 종료 라인
    docstring: str | None = None                 # docstring
    fixtures: list[str] = field(default_factory=list)  # 사용된 fixture
    assertions: list[AssertionInfo] = field(default_factory=list)  # assertion 목록
    uses_pytest_raises: bool = False             # pytest.raises 사용 여부
    raises_exception_type: str | None = None    # raises에서 기대하는 예외 타입
    parametrize_cases: list[ParametrizeCase] = field(default_factory=list)  # parametrize 케이스
    is_parametrized: bool = False                # parametrize 여부
    markers: list[str] = field(default_factory=list)  # pytest markers
    raw_code: str = ""                           # 원본 코드

    @property
    def effective_test_count(self) -> int:
        """실제 테스트 케이스 수 (parametrize 고려)."""
        if self.parametrize_cases:
            return len(self.parametrize_cases)
        return 1

    @property
    def has_assertion(self) -> bool:
        """assertion이 있는지 확인."""
        return len(self.assertions) > 0 or self.uses_pytest_raises


@dataclass
class ParseResult:
    """파싱 결과."""
    test_cases: list[ParsedTestCase]
    total_test_count: int           # 총 테스트 함수 수
    effective_test_count: int       # parametrize 포함 실제 케이스 수
    parse_errors: list[str]         # 파싱 에러
    fixtures_used: set[str]         # 전체에서 사용된 fixture
    has_syntax_error: bool = False  # 문법 오류 여부
    syntax_error_message: str | None = None  # 문법 오류 메시지


class TestCaseParser:
    """pytest 테스트 코드 파서."""

    # 일반적인 pytest fixture 이름들
    COMMON_FIXTURES = {
        'tmp_path', 'tmp_path_factory', 'tmpdir', 'tmpdir_factory',
        'capsys', 'capfd', 'capsysbinary', 'capfdbinary', 'caplog',
        'monkeypatch', 'request', 'cache', 'pytestconfig', 'record_property',
        'record_testsuite_property', 'recwarn', 'doctest_namespace'
    }

    def __init__(self):
        """TestCaseParser 초기화."""
        self._source_lines: list[str] = []

    def parse(self, code: str) -> ParseResult:
        """
        테스트 코드를 파싱합니다.

        Args:
            code: 파싱할 pytest 테스트 코드

        Returns:
            ParseResult: 파싱 결과
        """
        self._source_lines = code.split('\n')
        test_cases: list[ParsedTestCase] = []
        parse_errors: list[str] = []
        fixtures_used: set[str] = set()

        # AST 파싱 시도
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            logger.warning(f"Syntax error in test code: {e}")
            return ParseResult(
                test_cases=[],
                total_test_count=0,
                effective_test_count=0,
                parse_errors=[str(e)],
                fixtures_used=set(),
                has_syntax_error=True,
                syntax_error_message=str(e)
            )

        # 테스트 함수들을 찾아 파싱
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                if self._is_test_function(node):
                    try:
                        parsed = self._parse_test_function(node, code)
                        test_cases.append(parsed)
                        fixtures_used.update(parsed.fixtures)
                    except Exception as e:
                        logger.warning(f"Error parsing test function {node.name}: {e}")
                        parse_errors.append(f"Error parsing {node.name}: {e}")

        # 총 케이스 수 계산
        total_test_count = len(test_cases)
        effective_test_count = sum(tc.effective_test_count for tc in test_cases)

        return ParseResult(
            test_cases=test_cases,
            total_test_count=total_test_count,
            effective_test_count=effective_test_count,
            parse_errors=parse_errors,
            fixtures_used=fixtures_used
        )

    def _is_test_function(self, node: ast.FunctionDef) -> bool:
        """테스트 함수인지 확인합니다."""
        return node.name.startswith('test_') or node.name.endswith('_test')

    def _parse_test_function(self, node: ast.FunctionDef, code: str) -> ParsedTestCase:
        """테스트 함수를 파싱합니다."""
        # 기본 정보
        name = node.name
        line_number = node.lineno
        end_line_number = node.end_lineno or node.lineno

        # 원본 코드 추출
        raw_code = self._extract_function_code(node)

        # Docstring 추출
        docstring = ast.get_docstring(node)

        # Fixture 감지 (함수 파라미터에서)
        fixtures = self._detect_fixtures(node)

        # Decorator 분석 (parametrize, markers)
        parametrize_cases, markers = self._parse_decorators(node)
        is_parametrized = len(parametrize_cases) > 0

        # Assertion 분석
        assertions = self._extract_assertions(node)

        # pytest.raises 감지
        uses_pytest_raises, raises_exception_type = self._detect_pytest_raises(node)

        return ParsedTestCase(
            name=name,
            line_number=line_number,
            end_line_number=end_line_number,
            docstring=docstring,
            fixtures=fixtures,
            assertions=assertions,
            uses_pytest_raises=uses_pytest_raises,
            raises_exception_type=raises_exception_type,
            parametrize_cases=parametrize_cases,
            is_parametrized=is_parametrized,
            markers=markers,
            raw_code=raw_code
        )

    def _extract_function_code(self, node: ast.FunctionDef) -> str:
        """함수의 원본 코드를 추출합니다."""
        start_line = node.lineno - 1  # 0-indexed
        end_line = node.end_lineno or node.lineno

        # decorator도 포함
        if node.decorator_list:
            first_decorator = node.decorator_list[0]
            start_line = first_decorator.lineno - 1

        if start_line < 0:
            start_line = 0
        if end_line > len(self._source_lines):
            end_line = len(self._source_lines)

        return '\n'.join(self._source_lines[start_line:end_line])

    def _detect_fixtures(self, node: ast.FunctionDef) -> list[str]:
        """함수 파라미터에서 fixture를 감지합니다."""
        fixtures = []
        for arg in node.args.args:
            arg_name = arg.arg
            # 'self'는 제외
            if arg_name != 'self':
                fixtures.append(arg_name)
        return fixtures

    def _parse_decorators(
        self, node: ast.FunctionDef
    ) -> tuple[list[ParametrizeCase], list[str]]:
        """decorator를 분석하여 parametrize 케이스와 marker를 추출합니다."""
        parametrize_cases: list[ParametrizeCase] = []
        markers: list[str] = []

        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Call):
                # @pytest.mark.parametrize(...) 형태
                decorator_name = self._get_decorator_name(decorator.func)

                if decorator_name == 'pytest.mark.parametrize':
                    cases = self._parse_parametrize(decorator)
                    parametrize_cases.extend(cases)
                elif decorator_name and decorator_name.startswith('pytest.mark.'):
                    marker_name = decorator_name.replace('pytest.mark.', '')
                    markers.append(marker_name)
            elif isinstance(decorator, ast.Attribute):
                # @pytest.mark.skip 같은 형태 (호출 없이)
                decorator_name = self._get_decorator_name(decorator)
                if decorator_name and decorator_name.startswith('pytest.mark.'):
                    marker_name = decorator_name.replace('pytest.mark.', '')
                    markers.append(marker_name)

        return parametrize_cases, markers

    def _get_decorator_name(self, node: ast.expr) -> str | None:
        """decorator의 전체 이름을 가져옵니다."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            base = self._get_decorator_name(node.value)
            if base:
                return f"{base}.{node.attr}"
            return node.attr
        return None

    def _parse_parametrize(self, decorator: ast.Call) -> list[ParametrizeCase]:
        """@pytest.mark.parametrize 데코레이터를 파싱합니다."""
        cases: list[ParametrizeCase] = []

        if len(decorator.args) < 2:
            return cases

        # 첫 번째 인자: 파라미터 이름들
        param_names_arg = decorator.args[0]
        param_names = self._extract_param_names(param_names_arg)

        # 두 번째 인자: 값들의 리스트
        values_arg = decorator.args[1]
        param_values_list = self._extract_param_values(values_arg)

        # 케이스 생성
        for idx, values in enumerate(param_values_list):
            # 단일 값인 경우 리스트로 변환
            if not isinstance(values, list):
                values = [values]

            cases.append(ParametrizeCase(
                param_names=param_names,
                param_values=values,
                index=idx
            ))

        return cases

    def _extract_param_names(self, node: ast.expr) -> list[str]:
        """parametrize의 파라미터 이름을 추출합니다."""
        if isinstance(node, ast.Constant):
            # "param1, param2" 형태
            if isinstance(node.value, str):
                return [p.strip() for p in node.value.split(',')]
        elif isinstance(node, ast.List) or isinstance(node, ast.Tuple):
            # ["param1", "param2"] 또는 ("param1", "param2") 형태
            names = []
            for elt in node.elts:
                if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                    names.append(elt.value)
            return names
        return []

    def _extract_param_values(self, node: ast.expr) -> list[list[Any]]:
        """parametrize의 값 리스트를 추출합니다."""
        values_list: list[list[Any]] = []

        if isinstance(node, ast.List) or isinstance(node, ast.Tuple):
            for elt in node.elts:
                if isinstance(elt, ast.Tuple) or isinstance(elt, ast.List):
                    # 여러 파라미터: (val1, val2)
                    values = [self._extract_literal_value(v) for v in elt.elts]
                    values_list.append(values)
                else:
                    # 단일 파라미터
                    values_list.append([self._extract_literal_value(elt)])

        return values_list

    def _extract_literal_value(self, node: ast.expr) -> Any:
        """AST 노드에서 리터럴 값을 추출합니다."""
        if isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.Name):
            return f"<{node.id}>"  # 변수 참조
        elif isinstance(node, ast.List):
            return [self._extract_literal_value(elt) for elt in node.elts]
        elif isinstance(node, ast.Tuple):
            return tuple(self._extract_literal_value(elt) for elt in node.elts)
        elif isinstance(node, ast.Dict):
            return {
                self._extract_literal_value(k): self._extract_literal_value(v)
                for k, v in zip(node.keys, node.values)
                if k is not None
            }
        elif isinstance(node, ast.Set):
            return {self._extract_literal_value(elt) for elt in node.elts}
        elif isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            # 음수 처리
            val = self._extract_literal_value(node.operand)
            if isinstance(val, (int, float)):
                return -val
        elif isinstance(node, ast.Call):
            # 함수 호출 (pytest.param 등)
            func_name = self._get_decorator_name(node.func)
            return f"<call:{func_name}>"
        elif isinstance(node, ast.BinOp):
            # 이항 연산 (예: 10**18)
            return f"<expr>"

        return f"<unknown:{type(node).__name__}>"

    def _extract_assertions(self, node: ast.FunctionDef) -> list[AssertionInfo]:
        """함수 내의 모든 assertion을 추출합니다."""
        assertions: list[AssertionInfo] = []

        for child in ast.walk(node):
            if isinstance(child, ast.Assert):
                assertion_info = self._analyze_assertion(child)
                assertions.append(assertion_info)

        return assertions

    def _analyze_assertion(self, node: ast.Assert) -> AssertionInfo:
        """assertion 문을 분석합니다."""
        test = node.test
        line_number = node.lineno
        raw_code = self._get_line(line_number)

        # 비교 연산 분석
        if isinstance(test, ast.Compare):
            return self._analyze_compare_assertion(test, line_number, raw_code)
        elif isinstance(test, ast.UnaryOp) and isinstance(test.op, ast.Not):
            # assert not expr
            return AssertionInfo(
                assertion_type=AssertionType.ASSERT_FALSE,
                line_number=line_number,
                raw_code=raw_code
            )
        elif isinstance(test, ast.Call):
            # assert func(...) - pytest.approx 등
            func_name = self._get_decorator_name(test.func)
            if func_name and 'approx' in func_name:
                return AssertionInfo(
                    assertion_type=AssertionType.ASSERT_APPROX,
                    line_number=line_number,
                    raw_code=raw_code
                )

        # 기본: assert expr (truthy 체크)
        return AssertionInfo(
            assertion_type=AssertionType.ASSERT_TRUE,
            line_number=line_number,
            raw_code=raw_code
        )

    def _analyze_compare_assertion(
        self,
        node: ast.Compare,
        line_number: int,
        raw_code: str
    ) -> AssertionInfo:
        """비교 assertion을 분석합니다."""
        if len(node.ops) != 1:
            return AssertionInfo(
                assertion_type=AssertionType.ASSERT_OTHER,
                line_number=line_number,
                raw_code=raw_code
            )

        op = node.ops[0]
        left = ast.unparse(node.left) if hasattr(ast, 'unparse') else None
        right = ast.unparse(node.comparators[0]) if hasattr(ast, 'unparse') else None

        # 연산자에 따른 분류
        assertion_type = AssertionType.ASSERT_OTHER
        if isinstance(op, ast.Eq):
            assertion_type = AssertionType.ASSERT_EQUAL
        elif isinstance(op, ast.NotEq):
            assertion_type = AssertionType.ASSERT_NOT_EQUAL
        elif isinstance(op, ast.In):
            assertion_type = AssertionType.ASSERT_IN
        elif isinstance(op, ast.NotIn):
            assertion_type = AssertionType.ASSERT_NOT_IN
        elif isinstance(op, ast.Is):
            assertion_type = AssertionType.ASSERT_IS
        elif isinstance(op, ast.IsNot):
            assertion_type = AssertionType.ASSERT_IS_NOT

        return AssertionInfo(
            assertion_type=assertion_type,
            line_number=line_number,
            raw_code=raw_code,
            left_value=left,
            right_value=right
        )

    def _detect_pytest_raises(self, node: ast.FunctionDef) -> tuple[bool, str | None]:
        """pytest.raises 사용 여부와 예외 타입을 감지합니다."""
        for child in ast.walk(node):
            # with pytest.raises(ExceptionType): 형태
            if isinstance(child, ast.With):
                for item in child.items:
                    if isinstance(item.context_expr, ast.Call):
                        func_name = self._get_decorator_name(item.context_expr.func)
                        if func_name == 'pytest.raises':
                            exception_type = None
                            if item.context_expr.args:
                                first_arg = item.context_expr.args[0]
                                if isinstance(first_arg, ast.Name):
                                    exception_type = first_arg.id
                                elif isinstance(first_arg, ast.Attribute):
                                    exception_type = self._get_decorator_name(first_arg)
                            return True, exception_type

            # pytest.raises(...) 단독 호출 형태
            if isinstance(child, ast.Call):
                func_name = self._get_decorator_name(child.func)
                if func_name == 'pytest.raises':
                    exception_type = None
                    if child.args:
                        first_arg = child.args[0]
                        if isinstance(first_arg, ast.Name):
                            exception_type = first_arg.id
                    return True, exception_type

        return False, None

    def _get_line(self, line_number: int) -> str:
        """특정 라인의 코드를 가져옵니다."""
        if 0 < line_number <= len(self._source_lines):
            return self._source_lines[line_number - 1].strip()
        return ""
