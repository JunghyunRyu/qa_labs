#!/usr/bin/env python
"""
Problem Quality Validator - Safeguards & Validation
====================================================

파이프라인 안전장치 및 검증 유틸리티

Features:
- Diff 크기 제한 (50% 이상 변경 금지)
- 원본 복원 기능
- 정책 질문 에스컬레이션
- 일괄 검증
"""

import difflib
import json
import re
from pathlib import Path
from typing import Any

PROBLEMS_DIR = Path(__file__).parent.parent / "generated_problems"
BACKUP_DIR = Path(__file__).parent.parent / "problem_backups"

# 정책 질문 패턴 (자동 수정 불가, 에스컬레이션 필요)
POLICY_QUESTIONS = [
    {
        "pattern": r"bool.*허용|bool.*TypeError",
        "question": "bool 입력 처리 정책: TypeError vs 허용?",
        "options": ["TypeError 발생 (엄격)", "int로 취급하여 허용 (관대)"],
    },
    {
        "pattern": r"빈\s*문자열.*허용|empty.*string",
        "question": "빈 문자열 처리 정책?",
        "options": ["ValueError 발생", "빈 결과 반환"],
    },
    {
        "pattern": r"None.*허용|None.*처리",
        "question": "None 입력 처리 정책?",
        "options": ["TypeError 발생", "기본값 사용"],
    },
]


class SafetyGuard:
    """파이프라인 안전장치"""

    @staticmethod
    def check_diff_limit(
        original: str, modified: str, limit: float = 0.5
    ) -> tuple[bool, float]:
        """
        Diff 크기 제한 검사

        Args:
            original: 원본 텍스트
            modified: 수정된 텍스트
            limit: 최대 변경 비율 (기본 50%)

        Returns:
            (통과 여부, 실제 변경 비율)
        """
        if not original:
            return True, 0.0

        # 유사도 계산
        similarity = difflib.SequenceMatcher(None, original, modified).ratio()
        change_ratio = 1.0 - similarity

        return change_ratio <= limit, change_ratio

    @staticmethod
    def detect_policy_questions(description: str) -> list[dict]:
        """정책 질문 감지 (자동 결정 불가 항목)"""
        questions = []
        for pq in POLICY_QUESTIONS:
            if re.search(pq["pattern"], description, re.IGNORECASE):
                questions.append({
                    "question": pq["question"],
                    "options": pq["options"],
                })
        return questions

    @staticmethod
    def validate_golden_unchanged(
        original_problem: dict, modified_problem: dict
    ) -> bool:
        """golden_code 무변경 확인"""
        return original_problem.get("golden_code") == modified_problem.get("golden_code")

    @staticmethod
    def validate_mutants_preserved(
        original_problem: dict, modified_problem: dict
    ) -> bool:
        """뮤턴트 삭제 없음 확인 (추가/수정만 허용)"""
        original_ids = {
            b.get("id") or b.get("name")
            for b in original_problem.get("buggy_implementations", [])
        }
        modified_ids = {
            b.get("id") or b.get("name")
            for b in modified_problem.get("buggy_implementations", [])
        }
        # 원본의 모든 ID가 수정본에도 있어야 함
        return original_ids.issubset(modified_ids)

    @staticmethod
    def validate_difficulty_unchanged(
        original_problem: dict, modified_problem: dict
    ) -> bool:
        """난이도 무변경 확인 (변경 시 별도 검토 필요)"""
        return original_problem.get("difficulty") == modified_problem.get("difficulty")


class ProblemValidator:
    """문제 품질 검증기"""

    def __init__(self, problem_id: str):
        self.problem_id = problem_id
        self.problem_path = PROBLEMS_DIR / f"{problem_id}.json"
        self.problem: dict | None = None

    def load(self) -> bool:
        """문제 로드"""
        if not self.problem_path.exists():
            return False
        with open(self.problem_path, encoding="utf-8") as f:
            self.problem = json.load(f)
        return True

    def validate_structure(self) -> list[str]:
        """구조 검증"""
        errors = []
        required_fields = [
            "title", "function_signature", "golden_code",
            "buggy_implementations", "description_md", "difficulty"
        ]

        for field in required_fields:
            if field not in self.problem:
                errors.append(f"Missing required field: {field}")

        if "buggy_implementations" in self.problem:
            for i, buggy in enumerate(self.problem["buggy_implementations"]):
                if "buggy_code" not in buggy:
                    errors.append(f"buggy_implementations[{i}]: missing 'buggy_code'")
                if "weight" not in buggy:
                    errors.append(f"buggy_implementations[{i}]: missing 'weight'")

        return errors

    def validate_content(self) -> dict:
        """내용 검증"""
        result = {
            "critical": [],
            "warnings": [],
            "info": [],
        }

        desc = self.problem.get("description_md", "")
        golden = self.problem.get("golden_code", "")
        difficulty = self.problem.get("difficulty", "Easy")

        # Critical 검사
        if not desc.strip():
            result["critical"].append("description_md is empty")

        if not golden.strip():
            result["critical"].append("golden_code is empty")

        # 예외 명세 검사
        if "raise " in golden:
            if "예외" not in desc.lower() and "exception" not in desc.lower():
                result["critical"].append("Exception handling not documented")

        # 마크다운 검사
        if desc.count("```") % 2 != 0:
            result["critical"].append("Unclosed code block in description")

        # Warning 검사
        line_count = desc.count("\n") + 1
        limits = {
            "Very Easy": (15, 25),
            "Easy": (25, 40),
            "Medium": (40, 70),
            "Hard": (70, 100),
        }
        if difficulty in limits:
            min_l, max_l = limits[difficulty]
            if line_count < min_l:
                result["warnings"].append(f"Description too short: {line_count} < {min_l}")
            elif line_count > max_l:
                result["warnings"].append(f"Description too long: {line_count} > {max_l}")

        # Info
        buggy_count = len(self.problem.get("buggy_implementations", []))
        total_weight = sum(
            b.get("weight", 0) for b in self.problem.get("buggy_implementations", [])
        )
        result["info"].append(f"Mutants: {buggy_count}, Total weight: {total_weight}")

        return result

    def full_validation(self) -> dict:
        """전체 검증"""
        if not self.load():
            return {"error": f"Problem not found: {self.problem_id}"}

        structure_errors = self.validate_structure()
        content_result = self.validate_content()
        policy_questions = SafetyGuard.detect_policy_questions(
            self.problem.get("description_md", "")
        )

        return {
            "problem_id": self.problem_id,
            "structure_errors": structure_errors,
            "content": content_result,
            "policy_questions": policy_questions,
            "verdict": "PASS" if not structure_errors and not content_result["critical"] else "FAIL",
        }


def restore_from_backup(problem_id: str, backup_file: str | None = None) -> bool:
    """
    백업에서 복원

    Args:
        problem_id: 문제 ID
        backup_file: 백업 파일명 (None이면 가장 최근)

    Returns:
        성공 여부
    """
    problem_path = PROBLEMS_DIR / f"{problem_id}.json"

    if backup_file:
        backup_path = BACKUP_DIR / backup_file
    else:
        # 가장 최근 백업 찾기
        backups = sorted(BACKUP_DIR.glob(f"{problem_id}_*.json"), reverse=True)
        if not backups:
            print(f"No backup found for {problem_id}")
            return False
        backup_path = backups[0]

    if not backup_path.exists():
        print(f"Backup not found: {backup_path}")
        return False

    import shutil
    shutil.copy(backup_path, problem_path)
    print(f"Restored {problem_id} from {backup_path}")
    return True


def batch_validate(problem_ids: list[str] | None = None) -> dict:
    """
    일괄 검증

    Args:
        problem_ids: 검증할 문제 ID 목록 (None이면 전체)

    Returns:
        검증 결과
    """
    if problem_ids is None:
        problem_ids = [p.stem for p in PROBLEMS_DIR.glob("*.json")]

    results = {}
    pass_count = 0
    fail_count = 0

    for pid in problem_ids:
        validator = ProblemValidator(pid)
        result = validator.full_validation()
        results[pid] = result
        if result.get("verdict") == "PASS":
            pass_count += 1
        else:
            fail_count += 1

    return {
        "total": len(problem_ids),
        "pass": pass_count,
        "fail": fail_count,
        "results": results,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Problem Quality Validator")
    parser.add_argument("command", choices=["validate", "restore", "batch"])
    parser.add_argument("--problem-id", help="Problem ID")
    parser.add_argument("--backup-file", help="Backup file name for restore")
    args = parser.parse_args()

    if args.command == "validate":
        if not args.problem_id:
            print("--problem-id required for validate")
        else:
            validator = ProblemValidator(args.problem_id)
            result = validator.full_validation()
            print(json.dumps(result, ensure_ascii=False, indent=2))

    elif args.command == "restore":
        if not args.problem_id:
            print("--problem-id required for restore")
        else:
            restore_from_backup(args.problem_id, args.backup_file)

    elif args.command == "batch":
        result = batch_validate()
        print(f"\nTotal: {result['total']}, Pass: {result['pass']}, Fail: {result['fail']}")
        for pid, r in result["results"].items():
            icon = "[PASS]" if r.get("verdict") == "PASS" else "[FAIL]"
            print(f"  {icon} {pid}")
