"""
테스트 품질 분류기 모듈.

테스트 케이스를 분석하여 ValueType, InputDiversity, TestPurpose를 분류하고
AntiPattern을 감지합니다.
"""
import ast
import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from app.services.test_case_parser import ParsedTestCase, ParseResult

logger = logging.getLogger(__name__)


# =============================================================================
# Enums
# =============================================================================

class ValueType(Enum):
    """값 유형 분류."""
    NORMAL = "normal"           # 정상 값: 5, "hello", [1,2,3]
    BOUNDARY = "boundary"       # 경계값: 0, 1, -1, MAX_INT
    EDGE = "edge"               # 극단 케이스: "", None, []
    NEGATIVE = "negative"       # 음수/유효하지 않은 값: -5, "invalid"
    EXTREME = "extreme"         # 매우 큰/작은 값: 10**18, "a"*10000
    UNKNOWN = "unknown"         # 분류 불가


class InputDiversity(Enum):
    """입력 다양성 분류."""
    SINGLE = "single"           # 단일 요소: [1]
    MULTIPLE = "multiple"       # 다중 요소: [1,2,3,4,5]
    EMPTY = "empty"             # 빈 입력: [], "", {}
    DUPLICATE = "duplicate"     # 중복 포함: [1,1,2,2]
    MIXED_TYPES = "mixed_types" # 혼합 타입: [1, "a", None]
    UNKNOWN = "unknown"         # 분류 불가


class TestPurpose(Enum):
    """테스트 목적 분류."""
    HAPPY_PATH = "happy_path"               # 정상 흐름
    ERROR_HANDLING = "error_handling"       # 에러 처리
    BOUNDARY_CHECK = "boundary_check"       # 경계값 확인
    EQUIVALENCE_PARTITION = "equivalence_partition"  # 동치 분할
    STATE_TRANSITION = "state_transition"   # 상태 전이
    UNKNOWN = "unknown"                     # 분류 불가


class AntiPatternType(Enum):
    """안티패턴 유형."""
    NO_ASSERTION = "no_assertion"                   # assertion 없음
    EXCEPTION_SWALLOWED = "exception_swallowed"     # try/except로 예외 삼킴
    EXTERNAL_DEPENDENCY = "external_dependency"     # 외부 의존
    NON_DETERMINISTIC = "non_deterministic"         # random, time 사용
    EXCESSIVE_NESTING = "excessive_nesting"         # 과도한 중첩
    LOOP_INSTEAD_PARAM = "loop_instead_param"       # loop 대신 parametrize 권장


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class AntiPattern:
    """감지된 안티패턴."""
    pattern_type: AntiPatternType
    penalty: int
    location: str           # 테스트 함수 이름
    line_number: int | None = None
    description: str = ""


@dataclass
class TestCaseClassification:
    """단일 테스트 케이스의 분류 결과."""
    test_name: str
    value_types: set[ValueType] = field(default_factory=set)
    input_diversities: set[InputDiversity] = field(default_factory=set)
    test_purposes: set[TestPurpose] = field(default_factory=set)
    antipatterns: list[AntiPattern] = field(default_factory=list)
    confidence: float = 1.0  # 분류 신뢰도 (0.0 ~ 1.0)


@dataclass
class ClassificationResult:
    """전체 분류 결과."""
    test_classifications: list[TestCaseClassification]
    all_value_types: set[ValueType]
    all_input_diversities: set[InputDiversity]
    all_test_purposes: set[TestPurpose]
    all_antipatterns: list[AntiPattern]
    overall_confidence: float


# =============================================================================
# Classifiers
# =============================================================================

class ValueTypeClassifier:
    """값 유형 분류기."""

    # 경계값으로 인식되는 값들
    BOUNDARY_VALUES = {0, 1, -1, 2, -2}
    BOUNDARY_PATTERNS = [
        r'max_?int', r'min_?int', r'max_?value', r'min_?value',
        r'int_max', r'int_min', r'sys\.maxsize',
    ]

    # 극단적인 큰 값 임계치
    EXTREME_THRESHOLD = 10**9

    # 빈 값들
    EMPTY_VALUES = {'', '""', "''", '[]', '{}', '()', 'None', 'set()'}

    def classify(self, value: Any) -> set[ValueType]:
        """값을 분류합니다."""
        types = set()

        if value is None:
            types.add(ValueType.EDGE)
            return types

        # 문자열 분석
        if isinstance(value, str):
            types.update(self._classify_string(value))

        # 숫자 분석
        elif isinstance(value, (int, float)):
            types.update(self._classify_number(value))

        # 컬렉션 분석
        elif isinstance(value, (list, tuple, set, dict)):
            types.update(self._classify_collection(value))

        # 분류 불가
        if not types:
            types.add(ValueType.UNKNOWN)

        return types

    def _classify_string(self, value: str) -> set[ValueType]:
        """문자열 값을 분류합니다."""
        types = set()

        # 빈 문자열
        if value == '' or value in ('""', "''"):
            types.add(ValueType.EDGE)
            return types

        # 경계값 패턴 검사
        value_lower = value.lower()
        for pattern in self.BOUNDARY_PATTERNS:
            if re.search(pattern, value_lower):
                types.add(ValueType.BOUNDARY)

        # 극단적으로 긴 문자열
        if len(value) > 1000:
            types.add(ValueType.EXTREME)

        # "invalid", "error" 등의 키워드
        if any(kw in value_lower for kw in ['invalid', 'error', 'bad', 'wrong', 'fail']):
            types.add(ValueType.NEGATIVE)

        # 일반 문자열
        if not types:
            types.add(ValueType.NORMAL)

        return types

    def _classify_number(self, value: int | float) -> set[ValueType]:
        """숫자 값을 분류합니다."""
        types = set()

        # 경계값
        if value in self.BOUNDARY_VALUES:
            types.add(ValueType.BOUNDARY)

        # 음수
        if value < 0:
            types.add(ValueType.NEGATIVE)

        # 극단값
        if abs(value) >= self.EXTREME_THRESHOLD:
            types.add(ValueType.EXTREME)

        # 일반 값
        if not types:
            types.add(ValueType.NORMAL)

        return types

    def _classify_collection(self, value: list | tuple | set | dict) -> set[ValueType]:
        """컬렉션 값을 분류합니다."""
        types = set()

        # 빈 컬렉션
        if len(value) == 0:
            types.add(ValueType.EDGE)
            return types

        # 매우 큰 컬렉션
        if len(value) > 1000:
            types.add(ValueType.EXTREME)

        # 내부 요소 분석
        if isinstance(value, dict):
            items = list(value.values())
        elif isinstance(value, set):
            items = list(value)
        else:
            items = list(value)

        for item in items[:10]:  # 처음 10개만 분석
            types.update(self.classify(item))

        # 일반 컬렉션
        if not types:
            types.add(ValueType.NORMAL)

        return types

    def classify_from_code(self, code: str) -> set[ValueType]:
        """코드 문자열에서 값 유형을 추론합니다."""
        types = set()

        # 리터럴 값 추출 시도
        try:
            tree = ast.parse(code, mode='eval')
            value = ast.literal_eval(code)
            return self.classify(value)
        except (SyntaxError, ValueError, TypeError):
            pass

        # 패턴 기반 분석
        code_lower = code.lower()

        # 경계값 패턴
        if re.search(r'\b(0|1|-1|max|min)\b', code_lower):
            types.add(ValueType.BOUNDARY)

        # 빈 값 패턴
        if re.search(r'(\[\]|\{\}|\(\)|""|\'\')|(\bNone\b)', code):
            types.add(ValueType.EDGE)

        # 음수 패턴
        if re.search(r'-\d+', code):
            types.add(ValueType.NEGATIVE)

        # 큰 값 패턴: 10**9 이상 또는 10자리 이상 숫자
        if re.search(r'10\s*\*\*\s*([9]|\d{2,})|\d{10,}', code):
            types.add(ValueType.EXTREME)

        if not types:
            types.add(ValueType.NORMAL)

        return types


class InputDiversityClassifier:
    """입력 다양성 분류기."""

    def classify(self, value: Any) -> set[InputDiversity]:
        """입력 다양성을 분류합니다."""
        types = set()

        if value is None:
            types.add(InputDiversity.EMPTY)
            return types

        # 문자열 분석
        if isinstance(value, str):
            if value == '' or value in ('""', "''"):
                types.add(InputDiversity.EMPTY)
            elif len(value) == 1:
                types.add(InputDiversity.SINGLE)
            else:
                types.add(InputDiversity.MULTIPLE)
            return types

        # 컬렉션 분석
        if isinstance(value, (list, tuple)):
            return self._classify_sequence(value)
        elif isinstance(value, set):
            return self._classify_sequence(list(value))
        elif isinstance(value, dict):
            if len(value) == 0:
                types.add(InputDiversity.EMPTY)
            elif len(value) == 1:
                types.add(InputDiversity.SINGLE)
            else:
                types.add(InputDiversity.MULTIPLE)
            return types

        # 단일 값
        types.add(InputDiversity.SINGLE)
        return types

    def _classify_sequence(self, seq: list | tuple) -> set[InputDiversity]:
        """시퀀스 입력을 분류합니다."""
        types = set()

        # 빈 시퀀스
        if len(seq) == 0:
            types.add(InputDiversity.EMPTY)
            return types

        # 단일 요소
        if len(seq) == 1:
            types.add(InputDiversity.SINGLE)
            return types

        # 다중 요소
        types.add(InputDiversity.MULTIPLE)

        # 중복 검사 (hashable 요소만)
        try:
            hashable_items = [x for x in seq if isinstance(x, (int, float, str, bool, type(None)))]
            if len(hashable_items) != len(set(hashable_items)):
                types.add(InputDiversity.DUPLICATE)
        except TypeError:
            pass

        # 혼합 타입 검사
        type_set = set(type(x).__name__ for x in seq)
        if len(type_set) > 1:
            types.add(InputDiversity.MIXED_TYPES)

        return types

    def classify_from_code(self, code: str) -> set[InputDiversity]:
        """코드 문자열에서 입력 다양성을 추론합니다."""
        types = set()

        # 리터럴 값 추출 시도
        try:
            value = ast.literal_eval(code)
            return self.classify(value)
        except (SyntaxError, ValueError, TypeError):
            pass

        # 패턴 기반 분석
        # 빈 컬렉션
        if re.search(r'(\[\]|\{\}|\(\)|""|\'\')|(^None$)', code):
            types.add(InputDiversity.EMPTY)

        # 단일 요소 컬렉션
        if re.match(r'\[\s*[^,\[\]]+\s*\]$', code):
            types.add(InputDiversity.SINGLE)

        # 다중 요소
        if re.search(r'\[.*,.*\]', code):
            types.add(InputDiversity.MULTIPLE)

        if not types:
            types.add(InputDiversity.UNKNOWN)

        return types


class TestPurposeClassifier:
    """테스트 목적 분류기."""

    # 목적별 키워드
    KEYWORDS = {
        TestPurpose.HAPPY_PATH: [
            'happy', 'normal', 'basic', 'simple', 'success', 'valid',
            'positive', 'standard', 'typical', 'expected'
        ],
        TestPurpose.ERROR_HANDLING: [
            'error', 'exception', 'raise', 'fail', 'invalid', 'wrong',
            'bad', 'negative', 'malformed', 'corrupt'
        ],
        TestPurpose.BOUNDARY_CHECK: [
            'boundary', 'edge', 'limit', 'max', 'min', 'zero', 'one',
            'empty', 'full', 'overflow', 'underflow', 'extreme'
        ],
        TestPurpose.EQUIVALENCE_PARTITION: [
            'partition', 'class', 'category', 'group', 'equivalent',
            'representative'
        ],
        TestPurpose.STATE_TRANSITION: [
            'state', 'transition', 'change', 'status', 'flow', 'sequence',
            'before', 'after', 'initial', 'final'
        ]
    }

    def classify(self, test_case: ParsedTestCase) -> set[TestPurpose]:
        """테스트 목적을 분류합니다."""
        purposes = set()

        # 함수 이름 분석
        purposes.update(self._analyze_name(test_case.name))

        # docstring 분석
        if test_case.docstring:
            purposes.update(self._analyze_text(test_case.docstring))

        # pytest.raises 사용 시 ERROR_HANDLING
        if test_case.uses_pytest_raises:
            purposes.add(TestPurpose.ERROR_HANDLING)

        # parametrize 케이스 분석
        for param_case in test_case.parametrize_cases:
            for value in param_case.param_values:
                purposes.update(self._analyze_value_for_purpose(value))

        # 기본값: HAPPY_PATH
        if not purposes:
            purposes.add(TestPurpose.HAPPY_PATH)

        return purposes

    def _analyze_name(self, name: str) -> set[TestPurpose]:
        """테스트 함수 이름을 분석합니다."""
        purposes = set()
        name_lower = name.lower()

        for purpose, keywords in self.KEYWORDS.items():
            for keyword in keywords:
                if keyword in name_lower:
                    purposes.add(purpose)
                    break

        return purposes

    def _analyze_text(self, text: str) -> set[TestPurpose]:
        """텍스트(docstring 등)를 분석합니다."""
        purposes = set()
        text_lower = text.lower()

        for purpose, keywords in self.KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    purposes.add(purpose)
                    break

        return purposes

    def _analyze_value_for_purpose(self, value: Any) -> set[TestPurpose]:
        """값에서 테스트 목적을 추론합니다."""
        purposes = set()

        if value is None or value == '' or value == [] or value == {}:
            purposes.add(TestPurpose.BOUNDARY_CHECK)

        if isinstance(value, (int, float)):
            if value in (0, 1, -1):
                purposes.add(TestPurpose.BOUNDARY_CHECK)
            elif value < 0:
                purposes.add(TestPurpose.ERROR_HANDLING)

        return purposes


class AntiPatternDetector:
    """안티패턴 감지기."""

    # 안티패턴별 감점
    PENALTIES = {
        AntiPatternType.NO_ASSERTION: -10,
        AntiPatternType.EXCEPTION_SWALLOWED: -15,
        AntiPatternType.EXTERNAL_DEPENDENCY: -5,
        AntiPatternType.NON_DETERMINISTIC: -10,
        AntiPatternType.EXCESSIVE_NESTING: -5,
        AntiPatternType.LOOP_INSTEAD_PARAM: 0,  # 경고만
    }

    # 외부 의존성 모듈
    EXTERNAL_MODULES = {
        'requests', 'urllib', 'urllib3', 'httpx', 'aiohttp',
        'socket', 'ftplib', 'smtplib', 'mysql', 'psycopg2',
        'pymongo', 'redis', 'boto3', 'botocore'
    }

    # 비결정적 모듈/함수
    NON_DETERMINISTIC_PATTERNS = [
        r'\brandom\b', r'\btime\.time\b', r'\bdatetime\.now\b',
        r'\buuid\b', r'\bsecrets\b'
    ]

    def detect(self, test_case: ParsedTestCase) -> list[AntiPattern]:
        """안티패턴을 감지합니다."""
        antipatterns = []

        # NO_ASSERTION 검사
        if not test_case.has_assertion:
            antipatterns.append(AntiPattern(
                pattern_type=AntiPatternType.NO_ASSERTION,
                penalty=self.PENALTIES[AntiPatternType.NO_ASSERTION],
                location=test_case.name,
                line_number=test_case.line_number,
                description="테스트에 assertion이 없습니다."
            ))

        # 코드 분석이 필요한 검사들
        if test_case.raw_code:
            antipatterns.extend(self._analyze_code(test_case))

        return antipatterns

    def _analyze_code(self, test_case: ParsedTestCase) -> list[AntiPattern]:
        """코드를 분석하여 안티패턴을 감지합니다."""
        antipatterns = []
        code = test_case.raw_code

        try:
            tree = ast.parse(code)
        except SyntaxError:
            return antipatterns

        # EXCEPTION_SWALLOWED 검사
        antipatterns.extend(self._check_exception_swallowed(tree, test_case))

        # EXTERNAL_DEPENDENCY 검사
        antipatterns.extend(self._check_external_dependency(code, test_case))

        # NON_DETERMINISTIC 검사
        antipatterns.extend(self._check_non_deterministic(code, test_case))

        # EXCESSIVE_NESTING 검사
        antipatterns.extend(self._check_excessive_nesting(tree, test_case))

        # LOOP_INSTEAD_PARAM 검사
        antipatterns.extend(self._check_loop_instead_param(tree, test_case))

        return antipatterns

    def _check_exception_swallowed(
        self, tree: ast.AST, test_case: ParsedTestCase
    ) -> list[AntiPattern]:
        """예외가 삼켜지는지 검사합니다."""
        antipatterns = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ExceptHandler):
                # except 블록 내에 raise가 없고, pass만 있거나 비어있는 경우
                body = node.body
                has_raise = any(isinstance(n, ast.Raise) for n in ast.walk(node))
                is_pass_only = len(body) == 1 and isinstance(body[0], ast.Pass)
                is_empty = len(body) == 0

                if not has_raise and (is_pass_only or is_empty):
                    antipatterns.append(AntiPattern(
                        pattern_type=AntiPatternType.EXCEPTION_SWALLOWED,
                        penalty=self.PENALTIES[AntiPatternType.EXCEPTION_SWALLOWED],
                        location=test_case.name,
                        line_number=node.lineno,
                        description="예외가 처리되지 않고 삼켜집니다."
                    ))

        return antipatterns

    def _check_external_dependency(
        self, code: str, test_case: ParsedTestCase
    ) -> list[AntiPattern]:
        """외부 의존성을 검사합니다."""
        antipatterns = []

        for module in self.EXTERNAL_MODULES:
            if re.search(rf'\b{module}\b', code):
                antipatterns.append(AntiPattern(
                    pattern_type=AntiPatternType.EXTERNAL_DEPENDENCY,
                    penalty=self.PENALTIES[AntiPatternType.EXTERNAL_DEPENDENCY],
                    location=test_case.name,
                    description=f"외부 모듈 '{module}'에 대한 의존성이 있습니다."
                ))
                break  # 하나만 보고

        return antipatterns

    def _check_non_deterministic(
        self, code: str, test_case: ParsedTestCase
    ) -> list[AntiPattern]:
        """비결정적 요소를 검사합니다."""
        antipatterns = []

        for pattern in self.NON_DETERMINISTIC_PATTERNS:
            if re.search(pattern, code):
                antipatterns.append(AntiPattern(
                    pattern_type=AntiPatternType.NON_DETERMINISTIC,
                    penalty=self.PENALTIES[AntiPatternType.NON_DETERMINISTIC],
                    location=test_case.name,
                    description="비결정적 요소(random, time 등)가 사용됩니다."
                ))
                break

        return antipatterns

    def _check_excessive_nesting(
        self, tree: ast.AST, test_case: ParsedTestCase
    ) -> list[AntiPattern]:
        """과도한 중첩을 검사합니다."""
        antipatterns = []

        max_depth = self._get_max_nesting_depth(tree)
        if max_depth > 3:
            antipatterns.append(AntiPattern(
                pattern_type=AntiPatternType.EXCESSIVE_NESTING,
                penalty=self.PENALTIES[AntiPatternType.EXCESSIVE_NESTING],
                location=test_case.name,
                description=f"중첩 깊이가 {max_depth}입니다. (권장: 3 이하)"
            ))

        return antipatterns

    def _get_max_nesting_depth(self, node: ast.AST, current_depth: int = 0) -> int:
        """최대 중첩 깊이를 계산합니다."""
        max_depth = current_depth

        nesting_types = (ast.If, ast.For, ast.While, ast.With, ast.Try)

        for child in ast.iter_child_nodes(node):
            if isinstance(child, nesting_types):
                child_depth = self._get_max_nesting_depth(child, current_depth + 1)
                max_depth = max(max_depth, child_depth)
            else:
                child_depth = self._get_max_nesting_depth(child, current_depth)
                max_depth = max(max_depth, child_depth)

        return max_depth

    def _check_loop_instead_param(
        self, tree: ast.AST, test_case: ParsedTestCase
    ) -> list[AntiPattern]:
        """parametrize 대신 loop를 사용하는지 검사합니다."""
        antipatterns = []

        # 이미 parametrize를 사용중이면 스킵
        if test_case.is_parametrized:
            return antipatterns

        # 함수 내부에서 for/while과 assert가 함께 있는지 검사
        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                # 루프 내에 assert가 있는지 확인
                for child in ast.walk(node):
                    if isinstance(child, ast.Assert):
                        antipatterns.append(AntiPattern(
                            pattern_type=AntiPatternType.LOOP_INSTEAD_PARAM,
                            penalty=self.PENALTIES[AntiPatternType.LOOP_INSTEAD_PARAM],
                            location=test_case.name,
                            line_number=node.lineno,
                            description="루프 내 assertion 대신 @pytest.mark.parametrize 사용을 권장합니다."
                        ))
                        return antipatterns

        return antipatterns


# =============================================================================
# Main Classifier
# =============================================================================

class TestQualityClassifier:
    """테스트 품질 통합 분류기."""

    def __init__(self):
        """TestQualityClassifier 초기화."""
        self.value_type_classifier = ValueTypeClassifier()
        self.input_diversity_classifier = InputDiversityClassifier()
        self.test_purpose_classifier = TestPurposeClassifier()
        self.antipattern_detector = AntiPatternDetector()

    def classify(self, parse_result: ParseResult) -> ClassificationResult:
        """파싱된 테스트 결과를 분류합니다."""
        test_classifications: list[TestCaseClassification] = []

        all_value_types: set[ValueType] = set()
        all_input_diversities: set[InputDiversity] = set()
        all_test_purposes: set[TestPurpose] = set()
        all_antipatterns: list[AntiPattern] = []

        for test_case in parse_result.test_cases:
            classification = self._classify_test_case(test_case)
            test_classifications.append(classification)

            all_value_types.update(classification.value_types)
            all_input_diversities.update(classification.input_diversities)
            all_test_purposes.update(classification.test_purposes)
            all_antipatterns.extend(classification.antipatterns)

        # 전체 신뢰도 계산
        overall_confidence = self._calculate_overall_confidence(test_classifications)

        return ClassificationResult(
            test_classifications=test_classifications,
            all_value_types=all_value_types,
            all_input_diversities=all_input_diversities,
            all_test_purposes=all_test_purposes,
            all_antipatterns=all_antipatterns,
            overall_confidence=overall_confidence
        )

    def _classify_test_case(self, test_case: ParsedTestCase) -> TestCaseClassification:
        """단일 테스트 케이스를 분류합니다."""
        value_types: set[ValueType] = set()
        input_diversities: set[InputDiversity] = set()

        # parametrize 케이스 분석
        for param_case in test_case.parametrize_cases:
            for value in param_case.param_values:
                # 특수 마커 (<expr>, <call:...> 등) 처리
                if isinstance(value, str) and value.startswith('<') and value.endswith('>'):
                    # raw_code에서 패턴 분석
                    value_types.update(
                        self.value_type_classifier.classify_from_code(test_case.raw_code)
                    )
                else:
                    value_types.update(self.value_type_classifier.classify(value))
                    input_diversities.update(self.input_diversity_classifier.classify(value))

        # assertion 분석
        for assertion in test_case.assertions:
            if assertion.left_value:
                value_types.update(
                    self.value_type_classifier.classify_from_code(assertion.left_value)
                )
            if assertion.right_value:
                value_types.update(
                    self.value_type_classifier.classify_from_code(assertion.right_value)
                )
                input_diversities.update(
                    self.input_diversity_classifier.classify_from_code(assertion.right_value)
                )

        # 테스트 목적 분류
        test_purposes = self.test_purpose_classifier.classify(test_case)

        # 안티패턴 감지
        antipatterns = self.antipattern_detector.detect(test_case)

        # 신뢰도 계산
        confidence = self._calculate_confidence(
            value_types, input_diversities, test_purposes
        )

        return TestCaseClassification(
            test_name=test_case.name,
            value_types=value_types,
            input_diversities=input_diversities,
            test_purposes=test_purposes,
            antipatterns=antipatterns,
            confidence=confidence
        )

    def _calculate_confidence(
        self,
        value_types: set[ValueType],
        input_diversities: set[InputDiversity],
        test_purposes: set[TestPurpose]
    ) -> float:
        """분류 신뢰도를 계산합니다."""
        unknown_count = 0
        total_count = 0

        # UNKNOWN 비율 계산
        if value_types:
            total_count += 1
            if ValueType.UNKNOWN in value_types and len(value_types) == 1:
                unknown_count += 1

        if input_diversities:
            total_count += 1
            if InputDiversity.UNKNOWN in input_diversities and len(input_diversities) == 1:
                unknown_count += 1

        if test_purposes:
            total_count += 1
            if TestPurpose.UNKNOWN in test_purposes and len(test_purposes) == 1:
                unknown_count += 1

        if total_count == 0:
            return 0.5

        return 1.0 - (unknown_count / total_count)

    def _calculate_overall_confidence(
        self,
        classifications: list[TestCaseClassification]
    ) -> float:
        """전체 신뢰도를 계산합니다."""
        if not classifications:
            return 0.0

        return sum(c.confidence for c in classifications) / len(classifications)
