"""
Problem DSL 검증기

생성된 코드의 구문 및 동작을 검증합니다.
"""

import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class ValidationResult:
    """검증 결과"""

    is_valid: bool
    errors: List[str]
    warnings: List[str]

    @classmethod
    def success(cls, warnings: Optional[List[str]] = None) -> "ValidationResult":
        return cls(is_valid=True, errors=[], warnings=warnings or [])

    @classmethod
    def failure(cls, errors: List[str], warnings: Optional[List[str]] = None) -> "ValidationResult":
        return cls(is_valid=False, errors=errors, warnings=warnings or [])


class ProblemValidator:
    """생성된 문제 검증"""

    def validate_syntax(self, code: str) -> ValidationResult:
        """Python 구문 검사

        Args:
            code: Python 코드 문자열

        Returns:
            검증 결과
        """
        try:
            compile(code, "<string>", "exec")
            return ValidationResult.success()
        except SyntaxError as e:
            return ValidationResult.failure([f"SyntaxError: {e.msg} at line {e.lineno}"])

    def extract_function_name(self, code: str) -> Optional[str]:
        """코드에서 함수명 추출

        Args:
            code: Python 함수 코드

        Returns:
            함수명 또는 None
        """
        match = re.search(r"def\s+(\w+)\s*\(", code)
        return match.group(1) if match else None

    def execute_function(
        self, code: str, func_name: str, kwargs: Dict[str, Any]
    ) -> Tuple[bool, Any]:
        """함수 실행

        Args:
            code: Python 함수 코드
            func_name: 함수명
            kwargs: 함수 인자

        Returns:
            (성공 여부, 결과 또는 에러 메시지)
        """
        try:
            namespace = {}
            exec(code, namespace)
            func = namespace[func_name]
            result = func(**kwargs)
            return True, result
        except Exception as e:
            return False, f"{type(e).__name__}: {str(e)}"

    def validate_buggy_differs(
        self,
        golden_code: str,
        buggy_code: str,
        detecting_inputs: List[Dict[str, Any]],
    ) -> ValidationResult:
        """Golden과 Buggy가 특정 입력에서 다른 결과를 반환하는지 확인

        Args:
            golden_code: 정답 코드
            buggy_code: 버그 코드
            detecting_inputs: 버그 발견용 테스트 입력 목록

        Returns:
            검증 결과
        """
        errors = []
        warnings = []

        # 함수명 추출
        func_name = self.extract_function_name(golden_code)
        if not func_name:
            return ValidationResult.failure(["함수명을 추출할 수 없습니다."])

        # 구문 검사
        golden_syntax = self.validate_syntax(golden_code)
        if not golden_syntax.is_valid:
            return ValidationResult.failure(
                [f"Golden code 구문 오류: {golden_syntax.errors}"]
            )

        buggy_syntax = self.validate_syntax(buggy_code)
        if not buggy_syntax.is_valid:
            return ValidationResult.failure(
                [f"Buggy code 구문 오류: {buggy_syntax.errors}"]
            )

        # detecting_inputs가 없으면 경고
        if not detecting_inputs:
            return ValidationResult.success(
                warnings=["detecting_inputs가 없습니다. 버그 발견 검증을 건너뜁니다."]
            )

        # 각 입력에 대해 실행
        found_difference = False

        for i, inp in enumerate(detecting_inputs):
            # expected와 note는 별도 처리
            inp_copy = inp.copy()
            expected = inp_copy.pop("expected", None)
            note = inp_copy.pop("note", None)

            # 표현식 평가 (예: "0.1 + 0.2" -> 0.30000000000000004)
            evaluated_inp = {}
            for key, value in inp_copy.items():
                if isinstance(value, str) and not value.startswith('"'):
                    try:
                        evaluated_inp[key] = eval(value)
                    except:
                        evaluated_inp[key] = value
                else:
                    evaluated_inp[key] = value

            # 예외를 기대하는 케이스인지 확인
            expects_exception = isinstance(expected, str) and expected in (
                "ValueError", "TypeError", "KeyError", "IndexError", "Exception"
            )

            # Golden 실행
            golden_ok, golden_result = self.execute_function(
                golden_code, func_name, evaluated_inp
            )

            # Buggy 실행
            buggy_ok, buggy_result = self.execute_function(
                buggy_code, func_name, evaluated_inp
            )

            # 예외를 기대하는 경우
            if expects_exception:
                # Golden은 예외를 발생시켜야 하고, Buggy는 다르게 동작해야 함
                if golden_ok:
                    errors.append(f"입력 {i}: Golden이 {expected} 예외를 발생시키지 않음")
                    continue
                # Golden은 예외 발생, Buggy는 정상 실행 = 차이 발견
                if golden_ok != buggy_ok:
                    found_difference = True
                    continue
                # 둘 다 예외를 발생시키면 결과가 같음
                continue

            # 일반 케이스
            if not golden_ok:
                errors.append(f"입력 {i}: Golden 실행 실패 - {golden_result}")
                continue

            if not buggy_ok:
                # Buggy가 예외를 발생시키는 것도 "차이"로 볼 수 있음
                found_difference = True
                continue

            # 결과 비교
            if golden_result != buggy_result:
                found_difference = True

        if not found_difference:
            return ValidationResult.failure(
                ["모든 detecting_inputs에서 Golden과 Buggy의 결과가 동일합니다. "
                 "버그를 발견할 수 없는 테스트 케이스입니다."]
            )

        return ValidationResult.success(warnings=warnings)

    def validate_problem(self, problem_json: Dict[str, Any]) -> ValidationResult:
        """전체 문제 검증

        Args:
            problem_json: 문제 JSON

        Returns:
            검증 결과
        """
        errors = []
        warnings = []

        # Golden code 구문 검사
        golden_code = problem_json.get("golden_code", "")
        golden_result = self.validate_syntax(golden_code)
        if not golden_result.is_valid:
            errors.extend(
                [f"Golden code: {e}" for e in golden_result.errors]
            )

        # 각 Buggy code 검증
        for i, buggy in enumerate(problem_json.get("buggy_implementations", [])):
            buggy_code = buggy.get("buggy_code", "")
            detecting_inputs = buggy.get("detecting_inputs", [])
            skip_validation = buggy.get("skip_auto_validation", False)

            # 구문 검사
            buggy_syntax = self.validate_syntax(buggy_code)
            if not buggy_syntax.is_valid:
                errors.extend(
                    [f"Buggy {i}: {e}" for e in buggy_syntax.errors]
                )
                continue

            # 자동 검증 건너뛰기 (연속 호출 필요 버그 등)
            if skip_validation:
                warnings.append(
                    f"Buggy {i} ({buggy.get('bug_description', '')}): "
                    "skip_auto_validation 설정됨 - 수동 검증 필요"
                )
                continue

            # 버그 발견 가능 검증
            diff_result = self.validate_buggy_differs(
                golden_code, buggy_code, detecting_inputs
            )
            if not diff_result.is_valid:
                errors.extend(
                    [f"Buggy {i} ({buggy.get('bug_description', '')}): {e}"
                     for e in diff_result.errors]
                )
            warnings.extend(diff_result.warnings)

        if errors:
            return ValidationResult.failure(errors, warnings)

        return ValidationResult.success(warnings)
