"""Load generated problems from JSON files into database."""

import sys
import json
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem
from app.models.buggy_implementation import BuggyImplementation


def get_description_md(problem_id: str, json_data: dict) -> str:
    """
    description_md 내용을 반환 (MD 파일 우선, JSON fallback).

    우선순위:
    1. backend/descriptions/{problem_id}.md 파일
    2. JSON의 description_md 필드
    """
    script_dir = Path(__file__).parent.parent
    md_file_path = script_dir / "descriptions" / f"{problem_id}.md"

    if md_file_path.exists():
        with open(md_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"  📄 {problem_id}.md 파일에서 description 로드")
        return content

    return json_data.get('description_md', '')


def extract_title_from_description(description_md: str, function_signature: str) -> str:
    """Extract title from description or use function name."""
    # Try to extract from description (first line after ## 문제 설명)
    lines = description_md.split('\n')
    for i, line in enumerate(lines):
        if '문제 설명' in line or '##' in line:
            # Look for next non-empty line
            for j in range(i + 1, min(i + 5, len(lines))):
                if lines[j].strip() and not lines[j].strip().startswith('#'):
                    title = lines[j].strip()
                    # Remove markdown formatting
                    title = title.replace('**', '').replace('*', '').strip()
                    if title and len(title) < 200:
                        return title
    
    # Fallback: use function name
    if 'def ' in function_signature:
        func_name = function_signature.split('def ')[1].split('(')[0].strip()
        return f"{func_name} 함수 테스트"
    
    return "문제"


def create_slug_from_id(problem_id: str) -> str:
    """Create slug from problem ID."""
    # E01 -> problem-e01, M01 -> problem-m01, etc.
    return f"problem-{problem_id.lower()}"


def load_problem_from_json(json_path: str, problem_id: str, db: Session, force_update: bool = False):
    """Load a single problem from JSON file into database."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # description_md 가져오기 (MD 파일 우선, JSON fallback)
    description_md = get_description_md(problem_id, data)

    slug = create_slug_from_id(problem_id)

    # Check if problem already exists
    existing = db.query(Problem).filter(Problem.slug == slug).first()
    if existing:
        if force_update:
            # Update existing problem
            existing.description_md = description_md
            existing.summary = data.get('summary', existing.summary)
            existing.short_description = data.get('short_description', existing.short_description)
            existing.title = data.get('title', existing.title)
            existing.skills = data.get('tags', existing.skills or [])
            existing.domain = data.get('domain', existing.domain or 'common')
            print(f"🔄 {problem_id} ({slug}) - 업데이트 완료")
            return "updated"
        else:
            print(f"⏭️  {problem_id} ({slug}) - 이미 존재함, 건너뜀")
            return False
    
    # Extract title - use JSON title field if available, otherwise extract from description
    title = data.get('title')
    if not title:
        title = extract_title_from_description(
            description_md,
            data.get('function_signature', '')
        )

    # Create problem
    from datetime import datetime, timezone
    problem = Problem(
        slug=slug,
        title=title,
        description_md=description_md,
        function_signature=data.get('function_signature', ''),
        golden_code=data.get('golden_code', ''),
        difficulty=data.get('difficulty', 'Easy'),
        domain=data.get('domain', 'common'),  # Load domain from JSON
        skills=data.get('tags', []),  # Use tags as skills
        summary=data.get('summary'),  # Load summary from JSON
        short_description=data.get('short_description'),  # Load short_description from JSON
        is_visible=True,  # 로드 시 바로 공개
        published_at=datetime.now(timezone.utc),  # 현재 시간으로 공개
    )
    
    db.add(problem)
    db.flush()
    
    # Create buggy implementations
    buggy_impls = data.get('buggy_implementations', [])
    for buggy_data in buggy_impls:
        buggy_impl = BuggyImplementation(
            problem_id=problem.id,
            buggy_code=buggy_data.get('buggy_code', ''),
            bug_description=buggy_data.get('bug_description', ''),
            weight=buggy_data.get('weight', 1),
        )
        db.add(buggy_impl)
    
    print(f"✅ {problem_id} ({slug}) - '{title}' 로드 완료 ({len(buggy_impls)}개 buggy 구현)")
    return True


def load_all_generated_problems(force_update: bool = False):
    """Load all generated problems from JSON files."""
    script_dir = Path(__file__).parent.parent
    generated_dir = script_dir / "generated_problems"

    if not generated_dir.exists():
        print(f"❌ 디렉토리를 찾을 수 없습니다: {generated_dir}")
        return

    json_files = sorted(generated_dir.glob("*.json"))

    if not json_files:
        print(f"❌ JSON 파일을 찾을 수 없습니다: {generated_dir}")
        return

    print(f"📁 {len(json_files)}개의 JSON 파일 발견")
    if force_update:
        print("🔄 강제 업데이트 모드: 기존 문제도 업데이트합니다")
    print("=" * 60)

    db: Session = SessionLocal()
    try:
        loaded_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0

        for json_file in json_files:
            problem_id = json_file.stem  # E01, E02, etc.
            try:
                result = load_problem_from_json(str(json_file), problem_id, db, force_update)
                if result == "updated":
                    updated_count += 1
                elif result:
                    loaded_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                print(f"❌ {problem_id} 로드 실패: {e}")
                import traceback
                traceback.print_exc()
                error_count += 1

        db.commit()

        print("=" * 60)
        print(f"✅ 완료! (로드: {loaded_count}, 업데이트: {updated_count}, 건너뜀: {skipped_count}, 실패: {error_count})")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Load generated problems into database")
    parser.add_argument("--force", "-f", action="store_true",
                        help="Force update existing problems with new data")
    args = parser.parse_args()

    try:
        load_all_generated_problems(force_update=args.force)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

