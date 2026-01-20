#!/usr/bin/env python
"""
Problem Quality Pipeline - Auto-Healing System
===============================================

Problem Curator Agent + pytest-problem-reviewer 연동 자동 품질 개선 시스템

Usage:
    python problem_quality_pipeline.py FT-E01
    python problem_quality_pipeline.py FT-E01 --max-iterations 5
    python problem_quality_pipeline.py FT-E01,M01,H01  # 여러 문제
"""

import argparse
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# Constants
PROBLEMS_DIR = Path(__file__).parent.parent / "generated_problems"
BACKUP_DIR = Path(__file__).parent.parent / "problem_backups"
REPORTS_DIR = Path(__file__).parent.parent / "quality_reports"

DIFFICULTY_LINE_LIMITS = {
    "Very Easy": (15, 25),
    "Easy": (25, 40),
    "Medium": (40, 70),
    "Hard": (70, 100),
}

DOMAIN_SERVICE_EXAMPLES = {
    "fintech": ["토스", "카카오뱅크", "네이버페이"],
    "commerce": ["쿠팡", "마켓컬리", "네이버 스마트스토어"],
    "platform": ["GitHub", "AWS", "Slack"],
    "saas": ["Notion", "Figma", "Salesforce"],
    "common": ["데이터 파이프라인", "백엔드 서비스", "API 서버"],
}

FORBIDDEN_IMPL_PATTERNS = [
    (r"먼저\s+.*검증.*그\s*다음", "검증 조건들"),
    (r"순서대로\s+처리", "처리"),
    (r"for\s+루프로\s+순회", "순회하여"),
    (r"정렬한\s+후\s+처리", "정렬된 순서로"),
]


class ProblemQualityPipeline:
    """문제 품질 자동 개선 파이프라인"""

    def __init__(self, problem_id: str, max_iterations: int = 3):
        self.problem_id = problem_id
        self.max_iterations = max_iterations
        self.problem_path = PROBLEMS_DIR / f"{problem_id}.json"
        self.iteration_history: list[dict] = []
        self.problem: dict | None = None

    def run(self) -> dict:
        """파이프라인 실행"""
        print(f"\n{'=' * 60}")
        print(f"Problem Quality Pipeline - {self.problem_id}")
        print(f"{'=' * 60}")

        # 1. 문제 로드
        if not self.load_problem():
            return {"status": "ERROR", "message": f"Problem not found: {self.problem_id}"}

        # 2. 백업 생성
        self.create_backup()

        # 3. 초기 상태 기록
        initial_state = self.capture_state()
        print(f"\n[Initial] {initial_state['difficulty']}, {initial_state['domain']}")
        print(f"          {initial_state['line_count']} lines, {initial_state['buggy_count']} mutants")

        # 4. 파이프라인 루프
        iteration = 0
        best_version = self.problem.copy()
        best_score = 0

        while iteration < self.max_iterations:
            iteration += 1
            print(f"\n--- Iteration {iteration}/{self.max_iterations} ---")

            # 4a. 큐레이션 (자동 수정)
            print("[Curator] Analyzing and fixing...")
            curator_changes = self.curate()

            # 4b. 검증
            print("[Reviewer] Validating...")
            review_result = self.review()

            # 4c. 이력 기록
            self.iteration_history.append({
                "iteration": iteration,
                "curator_changes": curator_changes,
                "review_result": review_result,
                "timestamp": datetime.now().isoformat(),
            })

            # 4d. 점수 계산 및 최선 버전 저장
            score = self.calculate_score(review_result)
            if score > best_score:
                best_score = score
                best_version = self.problem.copy()

            # 4e. 통과 확인
            if review_result["verdict"] == "PASS":
                print(f"\n[PASS] Quality check passed at iteration {iteration}")
                self.save_problem()
                return self.generate_report("PASS", iteration)

            # 4f. 순환 감지
            if self.detect_cycle():
                print("\n[WARN] Cycle detected - stopping")
                break

            print(f"       Critical: {len(review_result['critical'])}, Warnings: {len(review_result['warnings'])}")

        # 5. 최대 반복 도달
        print(f"\n[FAIL] Max iterations reached")
        self.problem = best_version
        self.save_problem()
        return self.generate_report("MAX_ITERATIONS", iteration)

    def load_problem(self) -> bool:
        """문제 파일 로드"""
        if not self.problem_path.exists():
            return False
        with open(self.problem_path, encoding="utf-8") as f:
            self.problem = json.load(f)
        return True

    def save_problem(self):
        """문제 파일 저장"""
        with open(self.problem_path, "w", encoding="utf-8") as f:
            json.dump(self.problem, f, ensure_ascii=False, indent=2)
        print(f"[Saved] {self.problem_path}")

    def create_backup(self):
        """백업 생성"""
        BACKUP_DIR.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = BACKUP_DIR / f"{self.problem_id}_{timestamp}.json"
        shutil.copy(self.problem_path, backup_path)
        print(f"[Backup] {backup_path}")

    def capture_state(self) -> dict:
        """현재 상태 스냅샷"""
        desc = self.problem.get("description_md", "")
        return {
            "description_md": desc,
            "line_count": desc.count("\n") + 1,
            "buggy_count": len(self.problem.get("buggy_implementations", [])),
            "difficulty": self.problem.get("difficulty", "Unknown"),
            "domain": self.problem.get("domain", "Unknown"),
        }

    def curate(self) -> list[str]:
        """자동 큐레이션 (수정 적용)"""
        changes = []
        desc = self.problem.get("description_md", "")
        golden = self.problem.get("golden_code", "")
        difficulty = self.problem.get("difficulty", "Easy")
        domain = self.problem.get("domain", "common")

        # 1. 구현 순서 강제 표현 제거
        for pattern, replacement in FORBIDDEN_IMPL_PATTERNS:
            if re.search(pattern, desc):
                desc = re.sub(pattern, replacement, desc)
                changes.append(f"Removed implementation forcing: {pattern}")

        # 2. 마크다운 수정
        desc, md_changes = self.fix_markdown(desc)
        changes.extend(md_changes)

        # 3. 예외 섹션 보강 (golden_code 기반)
        if "raise " in golden and "### 예외" not in desc:
            exception_section = self.generate_exception_section(golden)
            if exception_section:
                desc = self.insert_section(desc, exception_section)
                changes.append("Added exception handling section")

        # 4. 입력 계약 보강
        if "### 입력" not in desc and "### Input" not in desc:
            input_section = self.generate_input_contract(golden)
            if input_section:
                desc = self.insert_section(desc, input_section)
                changes.append("Added input contract section")

        # 5. 시나리오 구체화
        desc, scenario_changes = self.enhance_scenario(desc, domain)
        changes.extend(scenario_changes)

        # 6. 길이 조정
        line_count = desc.count("\n") + 1
        limits = DIFFICULTY_LINE_LIMITS.get(difficulty, (25, 70))
        if line_count > limits[1]:
            desc = self.compress_description(desc, limits[1])
            changes.append(f"Compressed to {limits[1]} lines")

        self.problem["description_md"] = desc
        return changes

    def fix_markdown(self, desc: str) -> tuple[str, list[str]]:
        """마크다운 오류 수정"""
        changes = []

        # 코드 블록 쌍 검증
        code_blocks = desc.count("```")
        if code_blocks % 2 != 0:
            desc += "\n```"
            changes.append("Fixed unclosed code block")

        # 테이블 구조 검증 (간단한 수정)
        lines = desc.split("\n")
        fixed_lines = []
        in_table = False
        for line in lines:
            if "|" in line and not line.strip().startswith("|"):
                line = "| " + line
            fixed_lines.append(line)
        desc = "\n".join(fixed_lines)

        return desc, changes

    def generate_exception_section(self, golden: str) -> str:
        """golden_code에서 예외 섹션 생성"""
        exceptions = []

        # TypeError 탐지
        if "TypeError" in golden:
            exceptions.append(("타입 오류", "TypeError", "입력 타입이 올바르지 않을 때"))

        # ValueError 탐지
        if "ValueError" in golden:
            exceptions.append(("값 오류", "ValueError", "값이 유효 범위를 벗어날 때"))

        if not exceptions:
            return ""

        section = "### 예외 처리\n\n"
        section += "| 조건 | 예외 타입 | 설명 |\n"
        section += "|------|----------|------|\n"
        for condition, exc_type, desc in exceptions:
            section += f"| {condition} | `{exc_type}` | {desc} |\n"

        return section

    def generate_input_contract(self, golden: str) -> str:
        """입력 계약 섹션 생성"""
        # 함수 시그니처에서 파라미터 추출 시도
        sig = self.problem.get("function_signature", "")
        if not sig:
            return ""

        # 간단한 파라미터 파싱
        match = re.search(r"\((.*?)\)", sig)
        if not match:
            return ""

        params_str = match.group(1)
        if not params_str.strip():
            return ""

        section = "### 입력 계약\n\n"
        section += "| 파라미터 | 설명 |\n"
        section += "|---------|------|\n"

        for param in params_str.split(","):
            param = param.strip()
            if ":" in param:
                name, type_hint = param.split(":", 1)
                section += f"| `{name.strip()}` | {type_hint.strip()} |\n"
            elif param:
                section += f"| `{param}` | - |\n"

        return section

    def enhance_scenario(self, desc: str, domain: str) -> tuple[str, list[str]]:
        """시나리오 구체화"""
        changes = []
        services = DOMAIN_SERVICE_EXAMPLES.get(domain, [])

        if not services:
            return desc, changes

        # 추상적 표현 대체
        replacements = [
            (r"금융\s*앱", f"**{services[0]}**"),
            (r"이커머스\s*플랫폼", f"**{services[0]}**"),
            (r"SaaS\s*서비스", f"**{services[0]}**"),
            (r"플랫폼\s*서비스", f"**{services[0]}**"),
        ]

        for pattern, replacement in replacements:
            if re.search(pattern, desc):
                desc = re.sub(pattern, replacement, desc)
                changes.append(f"Enhanced scenario: {pattern} → {replacement}")

        return desc, changes

    def compress_description(self, desc: str, target_lines: int) -> str:
        """설명 압축"""
        lines = desc.split("\n")
        if len(lines) <= target_lines:
            return desc

        # 중복 빈 줄 제거
        compressed = []
        prev_empty = False
        for line in lines:
            is_empty = not line.strip()
            if is_empty and prev_empty:
                continue
            compressed.append(line)
            prev_empty = is_empty

        return "\n".join(compressed[:target_lines])

    def insert_section(self, desc: str, section: str) -> str:
        """섹션 삽입 (적절한 위치에)"""
        # "## " 헤더 이전에 삽입
        lines = desc.split("\n")
        insert_idx = len(lines)

        for i, line in enumerate(lines):
            if line.startswith("## ") and i > 5:
                insert_idx = i
                break

        lines.insert(insert_idx, "\n" + section)
        return "\n".join(lines)

    def review(self) -> dict:
        """문제 검증 (pytest-problem-reviewer 로직)"""
        result = {
            "verdict": "PASS",
            "critical": [],
            "warnings": [],
            "policy_questions": [],
        }

        desc = self.problem.get("description_md", "")
        golden = self.problem.get("golden_code", "")
        difficulty = self.problem.get("difficulty", "Easy")

        # Critical 검사

        # 1. 예외 타입 명시 확인
        if "raise " in golden and "### 예외" not in desc and "예외" not in desc.lower():
            result["critical"].append({
                "type": "EXCEPTION_UNDEFINED",
                "message": "예외 타입이 명시되지 않음",
            })

        # 2. 입력 범위 명시 확인
        sig = self.problem.get("function_signature", "")
        if sig and ("int" in sig or "str" in sig):
            if "### 입력" not in desc and "허용" not in desc and "범위" not in desc:
                result["critical"].append({
                    "type": "INPUT_RANGE_AMBIGUOUS",
                    "message": "입력 허용/금지 범위가 명시되지 않음",
                })

        # 3. 마크다운 검증
        if desc.count("```") % 2 != 0:
            result["critical"].append({
                "type": "MARKDOWN_ERROR",
                "message": "코드 블록이 닫히지 않음",
            })

        # 4. 구현 순서 강제 검사
        for pattern, _ in FORBIDDEN_IMPL_PATTERNS:
            if re.search(pattern, desc):
                result["critical"].append({
                    "type": "IMPLEMENTATION_FORCING",
                    "message": f"구현 순서 강제 표현: {pattern}",
                })

        # Warning 검사

        # 1. 길이 검사
        line_count = desc.count("\n") + 1
        limits = DIFFICULTY_LINE_LIMITS.get(difficulty, (25, 70))
        if line_count > limits[1]:
            result["warnings"].append({
                "type": "TOO_LONG",
                "current": line_count,
                "recommended": limits[1],
            })

        # 2. 힌트 검사 (Easy는 힌트 필수)
        if difficulty in ["Easy", "Very Easy"]:
            if "힌트" not in desc and "Hint" not in desc and "💡" not in desc:
                result["warnings"].append({
                    "type": "INSUFFICIENT_HINTS",
                    "message": "테스트 힌트가 부족함",
                })

        # 3. 시나리오 구체성 검사
        abstract_terms = ["금융 앱", "이커머스", "SaaS 서비스", "플랫폼 서비스"]
        for term in abstract_terms:
            if term in desc:
                result["warnings"].append({
                    "type": "ABSTRACT_SCENARIO",
                    "message": f"추상적 표현: {term}",
                })

        # Verdict 결정
        if result["critical"]:
            result["verdict"] = "FAIL"

        return result

    def calculate_score(self, review_result: dict) -> int:
        """점수 계산 (낮을수록 이슈 많음)"""
        score = 100
        score -= len(review_result["critical"]) * 20
        score -= len(review_result["warnings"]) * 5
        return max(0, score)

    def detect_cycle(self) -> bool:
        """순환 감지 (동일 이슈 반복)"""
        if len(self.iteration_history) < 2:
            return False

        current = self.iteration_history[-1]["review_result"]
        previous = self.iteration_history[-2]["review_result"]

        current_issues = {i["type"] for i in current.get("critical", [])}
        previous_issues = {i["type"] for i in previous.get("critical", [])}

        return current_issues == previous_issues and len(current_issues) > 0

    def generate_report(self, status: str, iterations: int) -> dict:
        """리포트 생성"""
        REPORTS_DIR.mkdir(exist_ok=True)

        report = {
            "problem_id": self.problem_id,
            "title": self.problem.get("title", ""),
            "difficulty": self.problem.get("difficulty", ""),
            "domain": self.problem.get("domain", ""),
            "status": status,
            "iterations": iterations,
            "timestamp": datetime.now().isoformat(),
            "iteration_history": self.iteration_history,
        }

        # 파일 저장
        report_path = REPORTS_DIR / f"{self.problem_id}_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        # 콘솔 출력
        print(f"\n{'=' * 60}")
        print(f"Pipeline Report - {self.problem_id}")
        print(f"{'=' * 60}")
        print(f"Status: {status}")
        print(f"Iterations: {iterations}")
        print(f"Report saved: {report_path}")

        return report


def main():
    parser = argparse.ArgumentParser(description="Problem Quality Pipeline")
    parser.add_argument("problem_ids", help="Problem ID(s) separated by comma")
    parser.add_argument("--max-iterations", type=int, default=3, help="Max iterations")
    args = parser.parse_args()

    problem_ids = [p.strip() for p in args.problem_ids.split(",")]

    results = []
    for problem_id in problem_ids:
        pipeline = ProblemQualityPipeline(problem_id, args.max_iterations)
        result = pipeline.run()
        results.append(result)

    # 요약
    print(f"\n{'=' * 60}")
    print("Summary")
    print(f"{'=' * 60}")
    for r in results:
        status_icon = "[PASS]" if r["status"] == "PASS" else "[FAIL]"
        print(f"{status_icon} {r.get('problem_id', 'Unknown')}: {r['status']}")


if __name__ == "__main__":
    main()
