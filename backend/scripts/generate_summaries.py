"""Generate test point summaries from bug descriptions.

이 스크립트는 각 문제의 buggy_implementations에서 bug_description을 분석하여
일관된 형식의 summary를 자동 생성합니다.

Usage:
    python scripts/generate_summaries.py              # JSON 파일에 summary 추가
    python scripts/generate_summaries.py --preview    # 미리보기만 (파일 수정 안 함)
    python scripts/generate_summaries.py --db         # DB의 기존 문제도 업데이트
"""

import sys
import json
import re
import argparse
import io
from pathlib import Path
from typing import List, Dict, Set, Tuple
from collections import defaultdict

# Windows 환경에서 UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))


# ============================================================
# 테스트 기법 분류 규칙
# ============================================================

# 키워드 → 테스트 기법 매핑
TECHNIQUE_KEYWORDS = {
    "boundary": {
        "keywords": [
            "빈", "empty", "길이 0", "길이가 0", "빈 문자열", "빈 리스트", "빈 배열",
            "off-by-one", "마지막", "첫 번째", "끝", "시작", "경계",
            "최대", "최소", "max", "min", "1개", "단일", "하나",
            "길이 1", "길이가 1", "0개", "한 개"
        ],
        "icon": "📏",
        "name": "경계값 분석",
        "name_en": "Boundary Value Analysis"
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
        "name": "동등 분할",
        "name_en": "Equivalence Partitioning"
    },
    "exception": {
        "keywords": [
            "TypeError", "ValueError", "예외", "exception", "error",
            "raise", "에러", "오류", "잘못된 타입", "invalid",
            "None", "null", "NaN"
        ],
        "icon": "⚠️",
        "name": "예외 처리",
        "name_en": "Exception Handling"
    },
    "logic": {
        "keywords": [
            "조건", "condition", "로직", "logic", "무시",
            "잘못된 결과", "반환", "return", "계산", "연산",
            "누락", "missing", "건너뜀", "skip"
        ],
        "icon": "🧠",
        "name": "로직 검증",
        "name_en": "Logic Verification"
    }
}


def classify_bug(bug_description: str) -> Tuple[str, str]:
    """버그 설명을 분석하여 가장 적합한 테스트 기법과 요약을 반환합니다.

    각 버그는 하나의 기법에만 분류됩니다 (우선순위: boundary > equivalence > exception > logic)

    Returns:
        (technique_key, simplified_description) tuple
    """
    desc_lower = bug_description.lower()

    # 우선순위대로 확인 (boundary가 가장 높음)
    technique_order = ["boundary", "equivalence", "exception", "logic"]

    for technique_key in technique_order:
        config = TECHNIQUE_KEYWORDS[technique_key]
        for keyword in config["keywords"]:
            if keyword.lower() in desc_lower:
                simplified = simplify_bug_description(bug_description, technique_key)
                return (technique_key, simplified)

    # 매칭된 기법이 없으면 logic으로 분류
    simplified = simplify_bug_description(bug_description, "logic")
    return ("logic", simplified)


def simplify_bug_description(description: str, technique: str) -> str:
    """버그 설명을 간단한 핵심 포인트로 변환합니다."""
    # 불필요한 접두사 제거
    description = re.sub(r'^(buggy:|버그:)\s*', '', description, flags=re.IGNORECASE)

    # 너무 긴 설명 줄이기
    if len(description) > 60:
        # 첫 번째 문장만 사용
        first_sentence = description.split('.')[0].split(',')[0]
        if len(first_sentence) > 50:
            first_sentence = first_sentence[:47] + "..."
        return first_sentence

    return description


def generate_summary_from_bugs(buggy_implementations: List[Dict]) -> str:
    """버그 구현 목록에서 summary를 생성합니다.

    Args:
        buggy_implementations: List of {bug_description, buggy_code, weight} dicts

    Returns:
        Markdown formatted summary string
    """
    # 기법별로 버그 분류
    techniques: Dict[str, Set[str]] = defaultdict(set)

    for buggy in buggy_implementations:
        bug_desc = buggy.get("bug_description", "")
        if not bug_desc:
            continue

        technique_key, simplified = classify_bug(bug_desc)
        techniques[technique_key].add(simplified)

    # Summary 생성
    lines = ["🎯 **이 문제에서 검증할 테스트 포인트**", ""]

    # 기법 순서 정의 (중요도순)
    technique_order = ["boundary", "equivalence", "exception", "logic"]

    has_content = False
    for tech_key in technique_order:
        if tech_key not in techniques or not techniques[tech_key]:
            continue

        config = TECHNIQUE_KEYWORDS[tech_key]
        icon = config["icon"]
        name = config["name"]

        lines.append(f"{icon} **{name}**")
        for point in sorted(techniques[tech_key]):
            lines.append(f"  • {point}")
        lines.append("")
        has_content = True

    if not has_content:
        return ""

    return "\n".join(lines).strip()


def process_json_file(json_path: Path, preview: bool = False) -> Tuple[bool, str]:
    """JSON 파일을 처리하여 summary를 추가합니다.

    Returns:
        (modified, summary) tuple
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    buggy_impls = data.get("buggy_implementations", [])
    if not buggy_impls:
        return False, ""

    summary = generate_summary_from_bugs(buggy_impls)
    if not summary:
        return False, ""

    # 이미 summary가 있고 동일하면 건너뜀
    if data.get("summary") == summary:
        return False, summary

    if not preview:
        data["summary"] = summary
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return True, summary


def update_db_summaries():
    """DB에 있는 문제들의 summary도 업데이트합니다."""
    from sqlalchemy.orm import Session
    from app.models.db import SessionLocal
    from app.models.problem import Problem
    from app.models.buggy_implementation import BuggyImplementation

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

            summary = generate_summary_from_bugs(buggy_impls)
            if summary and problem.summary != summary:
                problem.summary = summary
                updated += 1
                print(f"✅ {problem.slug}: summary 업데이트됨")

        db.commit()
        print(f"\n총 {updated}개 문제 업데이트 완료")

    except Exception as e:
        db.rollback()
        print(f"❌ DB 업데이트 실패: {e}")
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Generate test point summaries")
    parser.add_argument("--preview", action="store_true", help="Preview only, don't modify files")
    parser.add_argument("--db", action="store_true", help="Also update DB summaries")
    args = parser.parse_args()

    script_dir = Path(__file__).parent.parent
    generated_dir = script_dir / "generated_problems"

    if not generated_dir.exists():
        print(f"❌ 디렉토리를 찾을 수 없습니다: {generated_dir}")
        return 1

    json_files = sorted(generated_dir.glob("*.json"))
    if not json_files:
        print("❌ JSON 파일을 찾을 수 없습니다.")
        return 1

    print(f"📁 {len(json_files)}개의 JSON 파일 처리 중...")
    if args.preview:
        print("   (미리보기 모드 - 파일 수정 안 함)")
    print("=" * 60)

    modified_count = 0
    skipped_count = 0

    for json_file in json_files:
        problem_id = json_file.stem
        try:
            modified, summary = process_json_file(json_file, preview=args.preview)

            if modified:
                modified_count += 1
                print(f"✅ {problem_id}: summary 생성됨")
                if args.preview:
                    print(f"   {summary[:100]}..." if len(summary) > 100 else f"   {summary}")
            else:
                skipped_count += 1

        except Exception as e:
            print(f"❌ {problem_id}: 처리 실패 - {e}")

    print("=" * 60)
    print(f"완료! (수정: {modified_count}, 건너뜀: {skipped_count})")

    if args.db and not args.preview:
        print("\n📊 DB 업데이트 중...")
        update_db_summaries()

    return 0


if __name__ == "__main__":
    sys.exit(main())
