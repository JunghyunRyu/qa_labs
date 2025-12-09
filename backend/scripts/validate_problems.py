#!/usr/bin/env python3
"""문제 품질 검증 스크립트

생성된 문제 JSON 파일의 품질을 자동으로 검증합니다.

사용법:
    python scripts/validate_problems.py               # 모든 문제 검증
    python scripts/validate_problems.py --only M01    # 특정 문제만 검증
    python scripts/validate_problems.py --only M01 M02 M03  # 여러 문제 검증
"""

import json
import sys
import ast
import re
import tokenize
from io import StringIO
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """검증 결과"""
    valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    checks_passed: int = 0
    checks_total: int = 0

    def add_error(self, message: str):
        """에러 추가"""
        self.errors.append(message)
        self.valid = False

    def add_warning(self, message: str):
        """경고 추가"""
        self.warnings.append(message)

    def add_check(self, passed: bool):
        """체크 카운트 추가"""
        self.checks_total += 1
        if passed:
            self.checks_passed += 1


class ProblemValidator:
    """문제 검증기"""

    # 필수 필드
    REQUIRED_FIELDS = [
        "function_signature",
        "golden_code",
        "buggy_implementations",
        "description_md",
        "initial_test_template",
        "tags",
        "difficulty",
    ]

    # 권장 필드 (없으면 경고)
    RECOMMENDED_FIELDS = ["title"]

    # 유효한 난이도
    VALID_DIFFICULTIES = ["Very Easy", "Easy", "Medium", "Hard"]

    def __init__(self):
        self.results: Dict[str, ValidationResult] = {}

    def validate_file(self, json_path: Path) -> ValidationResult:
        """단일 문제 파일 검증"""
        result = ValidationResult()
        problem_id = json_path.stem

        # 1. JSON 파일 로드
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            result.add_error(f"JSON 파싱 실패: {e}")
            return result
        except Exception as e:
            result.add_error(f"파일 읽기 실패: {e}")
            return result

        # 2. 필수 필드 검증
        for field in self.REQUIRED_FIELDS:
            passed = field in data
            result.add_check(passed)
            if not passed:
                result.add_error(f"필수 필드 누락: {field}")

        if not result.valid:
            return result

        # 2.1. 권장 필드 검증 (경고만 표시)
        for field in self.RECOMMENDED_FIELDS:
            if field not in data:
                result.add_warning(f"권장 필드 누락: {field}")

        # 3. 난이도 검증
        difficulty = data.get("difficulty", "")
        passed = difficulty in self.VALID_DIFFICULTIES
        result.add_check(passed)
        if not passed:
            result.add_error(
                f"유효하지 않은 난이도: {difficulty}. "
                f"허용 값: {', '.join(self.VALID_DIFFICULTIES)}"
            )

        # 4. Golden Code 문법 검증
        golden_code = data.get("golden_code", "")
        passed, error = self._validate_python_syntax(golden_code)
        result.add_check(passed)
        if not passed:
            result.add_error(f"Golden Code 문법 오류: {error}")

        # 5. Golden Code에서 함수 이름 추출
        golden_function_name, golden_name_error = self._extract_function_name(golden_code)
        if not golden_function_name:
            result.add_warning(
                f"Golden Code에서 함수/클래스 이름을 추출할 수 없습니다"
                + (f": {golden_name_error}" if golden_name_error else "")
            )

        # 6. Buggy Implementations 검증
        buggy_impls = data.get("buggy_implementations", [])
        result.add_check(len(buggy_impls) > 0)
        if len(buggy_impls) == 0:
            result.add_error("Buggy implementation이 하나도 없습니다")
        else:
            result.add_check(len(buggy_impls) >= 2)  # 최소 2개 권장
            if len(buggy_impls) < 2:
                result.add_warning("Buggy implementation이 2개 미만입니다")

        for idx, buggy in enumerate(buggy_impls):
            # 6.1. Buggy implementation 필드 검증
            if "buggy_code" not in buggy:
                result.add_error(f"Buggy #{idx+1}: buggy_code 필드 누락")
                continue
            if "bug_description" not in buggy:
                result.add_warning(f"Buggy #{idx+1}: bug_description 필드 누락")

            # 6.2. Buggy code 문법 검증
            buggy_code = buggy["buggy_code"]
            passed, error = self._validate_python_syntax(buggy_code)
            result.add_check(passed)
            if not passed:
                result.add_error(f"Buggy #{idx+1} 문법 오류: {error}")
                continue

            # 6.3. 함수 이름 일치 검증
            buggy_function_name, buggy_name_error = self._extract_function_name(buggy_code)
            if golden_function_name and buggy_function_name:
                passed = golden_function_name == buggy_function_name
                result.add_check(passed)
                if not passed:
                    result.add_error(
                        f"Buggy #{idx+1} 함수 이름 불일치: "
                        f"Golden={golden_function_name}, Buggy={buggy_function_name}"
                    )
            elif buggy_function_name is None and buggy_name_error:
                result.add_warning(
                    f"Buggy #{idx+1}에서 함수/클래스 이름을 추출할 수 없습니다: {buggy_name_error}"
                )

            # 6.4. Golden과 코드가 동일한지 검증 (WARNING)
            if self._normalize_code(golden_code) == self._normalize_code(buggy_code):
                result.add_warning(
                    f"Buggy #{idx+1}가 Golden Code와 완전히 동일합니다"
                )

        # 7. function_signature 검증
        function_signature = data.get("function_signature", "")
        if golden_function_name:
            if golden_function_name not in function_signature:
                result.add_warning(
                    f"function_signature에 함수 이름({golden_function_name})이 없습니다"
                )

        # 8. Initial Test Template 검증
        test_template = data.get("initial_test_template", "")
        passed, error = self._validate_python_syntax(test_template)
        result.add_check(passed)
        if not passed:
            result.add_warning(f"Test template 문법 오류: {error}")

        # 9. Tags 검증
        tags = data.get("tags", [])
        is_list = isinstance(tags, list)
        result.add_check(is_list)
        if not is_list:
            result.add_error("tags는 리스트여야 합니다")
        else:
            result.add_check(len(tags) > 0)
            if len(tags) == 0:
                result.add_warning("tags가 비어 있습니다")

        # 10. Description 검증
        description = data.get("description_md", "")
        if len(description) < 50:
            result.add_warning("description_md가 너무 짧습니다 (50자 미만)")

        return result

    def _validate_python_syntax(self, code: str) -> tuple[bool, Optional[str]]:
        """Python 문법 검증"""
        if not code or not code.strip():
            return False, "코드가 비어 있습니다"

        try:
            ast.parse(code)
            return True, None
        except SyntaxError as e:
            return False, f"Line {e.lineno}: {e.msg}"
        except Exception as e:
            return False, str(e)

    def _extract_function_name(self, code: str) -> tuple[Optional[str], Optional[str]]:
        """코드에서 함수/클래스 이름 추출, 실패 시 이유를 반환"""
        if not code or not code.strip():
            return None, "코드가 비어 있습니다"

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return None, f"문법 오류 (line {e.lineno}): {e.msg}"
        except Exception as e:
            return None, str(e)

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                return node.name, None
            if isinstance(node, ast.ClassDef):
                # 클래스인 경우 클래스 이름 반환
                return node.name, None

        return None, "함수나 클래스 정의가 없습니다"

    def _normalize_code(self, code: str) -> str:
        """코드 정규화 (공백, 주석 제거)"""
        try:
            tokens = []
            for tok in tokenize.generate_tokens(StringIO(code).readline):
                if tok.type in (tokenize.COMMENT, tokenize.NL, tokenize.ENCODING):
                    continue
                tokens.append(tok.string)
            normalized = " ".join(tokens)
        except tokenize.TokenError:
            # 토크나이즈 실패 시 기존 단순 정규화로 폴백
            normalized = re.sub(r'#.*', '', code)
        normalized = re.sub(r'\s+', ' ', normalized)
        return normalized.strip()

    def validate_directory(
        self,
        dir_path: Path,
        only: Optional[List[str]] = None
    ) -> bool:
        """디렉토리의 모든 문제 검증"""
        if not dir_path.exists():
            # ASCII-only marker to avoid Windows console encoding issues
            print(f"[ERROR] 디렉토리가 존재하지 않습니다: {dir_path}")
            return False

        # JSON 파일 목록
        json_files = sorted(dir_path.glob("*.json"))
        if only:
            json_files = [
                f for f in json_files
                if f.stem in only
            ]

        if not json_files:
            # ASCII-only marker to avoid Windows console encoding issues
            print("[ERROR] 검증할 JSON 파일이 없습니다")
            return False

        print("=" * 70)
        print(f"Problem Validation Report")
        print("=" * 70)
        print()

        all_valid = True
        total_passed = 0
        total_warnings = 0
        total_failed = 0

        for json_file in json_files:
            result = self.validate_file(json_file)
            self.results[json_file.stem] = result

            # 결과 출력 (Windows 호환을 위해 ASCII 사용)
            if result.valid and len(result.warnings) == 0:
                status = "PASS"
                message = "All checks passed"
                total_passed += 1
            elif result.valid and len(result.warnings) > 0:
                status = "WARN"
                message = f"{len(result.warnings)} warning(s)"
                total_warnings += 1
            else:
                status = "FAIL"
                message = f"{len(result.errors)} error(s)"
                total_failed += 1
                all_valid = False

            print(f"[{status}] {json_file.stem}.json - {message}")

            # 에러 상세 출력
            if result.errors:
                for error in result.errors:
                    print(f"    ERROR: {error}")

            # 경고 상세 출력 (verbose)
            if result.warnings:
                for warning in result.warnings:
                    print(f"    WARNING: {warning}")

        # 요약
        print()
        print("=" * 70)
        print(f"Summary: {total_passed} passed, {total_warnings} warning(s), {total_failed} failed")
        print("=" * 70)

        return all_valid

    def print_detailed_report(self):
        """상세 보고서 출력"""
        print("\n=== Detailed Validation Report ===\n")

        for problem_id, result in self.results.items():
            print(f"\n{'='*60}")
            print(f"Problem: {problem_id}")
            print(f"{'='*60}")
            print(f"Status: {'VALID' if result.valid else 'INVALID'}")
            print(f"Checks: {result.checks_passed}/{result.checks_total} passed")

            if result.errors:
                print(f"\nErrors ({len(result.errors)}):")
                for error in result.errors:
                    print(f"  - {error}")

            if result.warnings:
                print(f"\nWarnings ({len(result.warnings)}):")
                for warning in result.warnings:
                    print(f"  - {warning}")


def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description="QA-Arena 문제 품질 검증 스크립트"
    )
    parser.add_argument(
        "--only",
        nargs="+",
        metavar="PROBLEM_ID",
        help="특정 문제만 검증 (예: --only M01 M02 M03)",
    )
    parser.add_argument(
        "--detailed",
        action="store_true",
        help="상세 보고서 출력",
    )

    args = parser.parse_args()

    # 문제 디렉토리 경로
    script_dir = Path(__file__).parent.parent
    problems_dir = script_dir / "generated_problems"

    # 검증기 실행
    validator = ProblemValidator()
    success = validator.validate_directory(problems_dir, only=args.only)

    # 상세 보고서
    if args.detailed:
        validator.print_detailed_report()

    # 종료 코드
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
