#!/usr/bin/env python3
"""Fix truncated summaries by regenerating from buggy_implementations.

Usage:
    python scripts/fix_truncated_summaries.py          # Fix JSON files
    python scripts/fix_truncated_summaries.py --db     # Also update DB
"""

import json
import glob
import argparse
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, Set, List, Tuple

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Test technique keywords mapping
TECHNIQUE_KEYWORDS = {
    "boundary": {
        "keywords": [
            "빈", "empty", "길이 0", "길이가 0", "빈 문자열", "빈 리스트", "빈 배열",
            "off-by-one", "마지막", "첫 번째", "끝", "시작", "경계",
            "최대", "최소", "max", "min", "1개", "단일", "하나",
            "길이 1", "길이가 1", "0개", "한 개"
        ],
        "icon": "📏",
        "name": "경계값 분석"
    },
    "equivalence": {
        "keywords": [
            "case", "대소문자", "소문자", "대문자",
            "공백", "whitespace", "특수문자", "특수 문자",
            "파티션", "partition", "분할", "분류",
            "양수", "음수", "0", "정수", "실수", "float",
            "플래그", "flag", "옵션", "모드"
        ],
        "icon": "🔀",
        "name": "동등 분할"
    },
    "exception": {
        "keywords": [
            "TypeError", "ValueError", "예외", "exception", "error",
            "raise", "에러", "오류", "잘못된 타입", "invalid",
            "None", "null", "NaN"
        ],
        "icon": "⚠️",
        "name": "예외 처리"
    },
    "logic": {
        "keywords": [
            "조건", "condition", "로직", "logic", "무시",
            "잘못된 결과", "반환", "return", "계산", "연산",
            "누락", "missing", "건너뜀", "skip"
        ],
        "icon": "🧠",
        "name": "로직 검증"
    }
}


def classify_bug(bug_description: str) -> Tuple[str, str]:
    """Classify bug description into a test technique."""
    desc_lower = bug_description.lower()
    technique_order = ["boundary", "equivalence", "exception", "logic"]

    for technique_key in technique_order:
        config = TECHNIQUE_KEYWORDS[technique_key]
        for keyword in config["keywords"]:
            if keyword.lower() in desc_lower:
                return (technique_key, bug_description.strip())

    return ("logic", bug_description.strip())


def generate_summary(buggy_implementations: List[Dict]) -> str:
    """Generate summary from buggy implementations."""
    techniques: Dict[str, Set[str]] = defaultdict(set)

    for buggy in buggy_implementations:
        bug_desc = buggy.get("bug_description", "")
        if not bug_desc:
            continue
        technique_key, desc = classify_bug(bug_desc)
        # Replace ~ with - for consistent rendering
        desc = desc.replace('~', '-')
        techniques[technique_key].add(desc)

    lines = ["🎯 **이 문제에서 검증할 테스트 포인트**", ""]
    technique_order = ["boundary", "equivalence", "exception", "logic"]

    has_content = False
    for tech_key in technique_order:
        if tech_key not in techniques or not techniques[tech_key]:
            continue

        config = TECHNIQUE_KEYWORDS[tech_key]
        lines.append(f"{config['icon']} **{config['name']}**")
        for point in sorted(techniques[tech_key]):
            lines.append(f"  • {point}")
        lines.append("")
        has_content = True

    if not has_content:
        return ""

    return "\n".join(lines).strip()


def fix_json_files():
    """Fix all JSON files with truncated summaries."""
    script_dir = Path(__file__).parent.parent
    generated_dir = script_dir / "generated_problems"

    fixed = 0
    for json_path in sorted(generated_dir.glob("*.json")):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            buggy_impls = data.get("buggy_implementations", [])
            if not buggy_impls:
                continue

            old_summary = data.get("summary", "")
            new_summary = generate_summary(buggy_impls)

            if not new_summary:
                continue

            # Check if needs update (truncated or different)
            if "..." in old_summary or old_summary != new_summary:
                data["summary"] = new_summary
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                fixed += 1
                print(f"Fixed: {json_path.name}")

        except Exception as e:
            print(f"Error processing {json_path.name}: {e}")

    return fixed


def update_db():
    """Update DB summaries."""
    from sqlalchemy.orm import Session
    from app.models.db import SessionLocal
    from app.models.problem import Problem

    db: Session = SessionLocal()
    try:
        problems = db.query(Problem).all()
        updated = 0

        for problem in problems:
            buggy_impls = [
                {"bug_description": b.bug_description}
                for b in problem.buggy_implementations
                if b.bug_description
            ]

            if not buggy_impls:
                continue

            new_summary = generate_summary(buggy_impls)
            if new_summary and (not problem.summary or "..." in problem.summary or problem.summary != new_summary):
                problem.summary = new_summary
                updated += 1
                print(f"DB Updated: {problem.slug}")

        db.commit()
        print(f"\nTotal DB updates: {updated}")

    except Exception as e:
        db.rollback()
        print(f"DB Error: {e}")
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", action="store_true", help="Also update DB")
    args = parser.parse_args()

    print("Fixing JSON files...")
    fixed = fix_json_files()
    print(f"\nFixed {fixed} JSON files")

    if args.db:
        print("\nUpdating DB...")
        update_db()


if __name__ == "__main__":
    main()
