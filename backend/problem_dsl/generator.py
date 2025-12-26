"""
Problem DSL 코드 생성기

YAML 템플릿을 읽어서 JSON 문제 파일을 생성합니다.
"""

import json
import re
import textwrap
from pathlib import Path
from typing import Any, Dict, List

import yaml

from .schema import BugTypeDSL, BuggyVariant, FunctionDef, ProblemDef


class ProblemGenerator:
    """YAML DSL로부터 문제 JSON 생성"""

    def __init__(self, template_dir: Path):
        """
        Args:
            template_dir: YAML 템플릿 파일들이 있는 디렉토리
        """
        self.template_dir = Path(template_dir)

    def load_template(self, filename: str) -> BugTypeDSL:
        """YAML 파일 로드 및 검증

        Args:
            filename: 템플릿 파일명 (예: floating_point.yaml)

        Returns:
            검증된 BugTypeDSL 객체
        """
        filepath = self.template_dir / filename
        with open(filepath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return BugTypeDSL(**data)

    def load_all_templates(self) -> List[BugTypeDSL]:
        """모든 YAML 템플릿 로드

        Returns:
            BugTypeDSL 객체 리스트
        """
        templates = []
        for filepath in self.template_dir.glob("*.yaml"):
            templates.append(self.load_template(filepath.name))
        return templates

    def _format_code(self, code: str, indent: int = 4) -> str:
        """코드 포맷팅 (상대적 들여쓰기 보존)

        YAML의 리터럴 블록(|)에서 가져온 코드의 공통 들여쓰기를 제거하고,
        지정된 indent 레벨로 다시 들여쓰기합니다.
        내부 들여쓰기 구조(if/else, for 등)는 보존됩니다.
        """
        # textwrap.dedent로 공통 들여쓰기 제거
        dedented = textwrap.dedent(code).strip()

        # 빈 코드 처리
        if not dedented:
            return ""

        # 각 줄 앞에 지정된 들여쓰기 추가 (상대적 들여쓰기 보존)
        lines = dedented.split("\n")
        formatted_lines = []
        for line in lines:
            if line:  # 내용이 있는 줄
                formatted_lines.append(" " * indent + line)
            else:  # 빈 줄은 그대로
                formatted_lines.append("")
        return "\n".join(formatted_lines)

    def generate_golden_code(self, func: FunctionDef) -> str:
        """Golden 코드 생성

        Args:
            func: 함수 정의

        Returns:
            완전한 Python 함수 코드
        """
        # docstring 포맷팅
        docstring_lines = func.docstring.strip().split("\n")
        if len(docstring_lines) == 1:
            formatted_docstring = f'    """{docstring_lines[0]}"""'
        else:
            formatted_docstring = '    """' + docstring_lines[0]
            for line in docstring_lines[1:]:
                formatted_docstring += "\n    " + line
            formatted_docstring += '\n    """'

        # 로직 포맷팅
        formatted_logic = self._format_code(func.golden_logic, indent=4)

        return f"""{func.signature}
{formatted_docstring}
{formatted_logic}
"""

    def generate_buggy_code(self, func: FunctionDef, variant: BuggyVariant) -> str:
        """Buggy 코드 생성

        Args:
            func: 함수 정의
            variant: 버그 변형

        Returns:
            버그가 있는 Python 함수 코드
        """
        # 시그니처 (오버라이드 가능)
        signature = variant.signature if variant.signature else func.signature

        # 버그 설명을 docstring으로
        formatted_docstring = f'    """Buggy: {variant.description}"""'

        # 로직 포맷팅
        formatted_logic = self._format_code(variant.logic, indent=4)

        return f"""{signature}
{formatted_docstring}
{formatted_logic}
"""

    def generate_problem_json(self, problem: ProblemDef, bug_type: str) -> Dict[str, Any]:
        """최종 JSON 형식 생성

        Args:
            problem: 문제 정의
            bug_type: 버그 유형 식별자

        Returns:
            JSON으로 저장할 딕셔너리
        """
        golden_code = self.generate_golden_code(problem.function)

        buggy_implementations = []
        for variant in problem.buggy_variants:
            buggy_code = self.generate_buggy_code(problem.function, variant)
            buggy_impl = {
                "bug_description": variant.description,
                "buggy_code": buggy_code,
                "bug_type": bug_type,
                "weight": variant.weight,
                "detecting_inputs": variant.detecting_inputs,
            }
            if variant.skip_auto_validation:
                buggy_impl["skip_auto_validation"] = True
            buggy_implementations.append(buggy_impl)

        return {
            "problem_id": problem.id,
            "title": problem.title,
            "difficulty": problem.difficulty,
            "domain": problem.domain,
            "tags": problem.tags,
            "function_signature": problem.function.signature,
            "golden_code": golden_code,
            "buggy_implementations": buggy_implementations,
            "description_md": problem.description_md.strip(),
            "initial_test_template": problem.test_template.strip(),
        }

    def generate_all(self, output_dir: Path) -> List[str]:
        """모든 템플릿에서 문제 생성

        Args:
            output_dir: 출력 디렉토리

        Returns:
            생성된 파일 경로 목록
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        generated_files = []

        for template in self.load_all_templates():
            for problem in template.problems:
                problem_json = self.generate_problem_json(problem, template.bug_type)

                # 파일 저장
                filename = f"{problem.id}.json"
                filepath = output_dir / filename

                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(problem_json, f, indent=2, ensure_ascii=False)

                generated_files.append(str(filepath))
                print(f"Generated: {filepath}")

        return generated_files

    def generate_from_template(
        self, template_filename: str, output_dir: Path
    ) -> List[str]:
        """특정 템플릿에서 문제 생성

        Args:
            template_filename: 템플릿 파일명
            output_dir: 출력 디렉토리

        Returns:
            생성된 파일 경로 목록
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        template = self.load_template(template_filename)
        generated_files = []

        for problem in template.problems:
            problem_json = self.generate_problem_json(problem, template.bug_type)

            # 파일 저장
            filename = f"{problem.id}.json"
            filepath = output_dir / filename

            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(problem_json, f, indent=2, ensure_ascii=False)

            generated_files.append(str(filepath))
            print(f"Generated: {filepath}")

        return generated_files
