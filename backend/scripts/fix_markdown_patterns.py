"""Fix markdown rendering issues in problem descriptions.

This script fixes patterns that cause markdown rendering issues:
- **text(parentheses)** → **text**(parentheses)
- *text(parentheses)* → *text*(parentheses)
"""

import sys
import re
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem
from app.services.ai_problem_designer import sanitize_markdown


def find_problematic_patterns(text: str) -> list[tuple[str, str]]:
    """Find problematic markdown patterns in text.

    Returns:
        List of (pattern, suggested_fix) tuples
    """
    issues = []

    # Pattern: **text(something)**
    bold_pattern = re.compile(r'\*\*([^*\(\)]+)\(([^)]+)\)\*\*')
    for match in bold_pattern.finditer(text):
        original = match.group(0)
        fixed = f"**{match.group(1)}**({match.group(2)})"
        issues.append((original, fixed))

    # Pattern: *text(something)* (but not **)
    italic_pattern = re.compile(r'(?<!\*)\*([^*\(\)]+)\(([^)]+)\)\*(?!\*)')
    for match in italic_pattern.finditer(text):
        original = match.group(0)
        fixed = f"*{match.group(1)}*({match.group(2)})"
        issues.append((original, fixed))

    return issues


def fix_problem_descriptions(dry_run: bool = True):
    """Fix markdown patterns in all problem descriptions.

    Args:
        dry_run: If True, only show what would be changed without making changes.
    """
    print("=" * 70)
    print("마크다운 렌더링 문제 패턴 수정 스크립트")
    print(f"모드: {'DRY RUN (변경사항 미적용)' if dry_run else 'LIVE (변경사항 적용)'}")
    print("=" * 70)
    print()

    db: Session = SessionLocal()
    try:
        problems = db.query(Problem).order_by(Problem.id).all()
        print(f"총 {len(problems)}개의 문제 검사 중...")
        print()

        fixed_count = 0
        issue_count = 0

        for problem in problems:
            # Find problematic patterns
            issues = find_problematic_patterns(problem.description_md)

            if issues:
                issue_count += len(issues)
                print(f"📋 문제 #{problem.id}: {problem.slug}")
                print(f"   제목: {problem.title[:50]}...")

                for original, fixed in issues:
                    print(f"   ❌ 발견: {original}")
                    print(f"   ✅ 수정: {fixed}")

                # Apply fix using sanitize_markdown
                if not dry_run:
                    original_md = problem.description_md
                    problem.description_md = sanitize_markdown(original_md)

                    if original_md != problem.description_md:
                        fixed_count += 1
                        print(f"   ✓ 수정 완료")
                else:
                    # In dry run, simulate the fix
                    fixed_md = sanitize_markdown(problem.description_md)
                    if fixed_md != problem.description_md:
                        fixed_count += 1
                        print(f"   → 수정 예정")

                print()

        if not dry_run:
            db.commit()

        print("=" * 70)
        print(f"검사 완료!")
        print(f"  - 검사한 문제: {len(problems)}개")
        print(f"  - 발견된 이슈: {issue_count}개")
        print(f"  - 수정된 문제: {fixed_count}개")

        if dry_run and fixed_count > 0:
            print()
            print("💡 실제 수정을 적용하려면 --apply 옵션을 사용하세요:")
            print("   python scripts/fix_markdown_patterns.py --apply")

    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Fix markdown rendering issues in problem descriptions"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually apply the fixes (default is dry-run mode)"
    )

    args = parser.parse_args()

    fix_problem_descriptions(dry_run=not args.apply)


if __name__ == "__main__":
    main()
