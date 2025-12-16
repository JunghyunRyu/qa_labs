"""Update skills field in database from JSON files."""

import sys
import json
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem


def create_slug_from_id(problem_id: str) -> str:
    """Create slug from problem ID."""
    return f"problem-{problem_id.lower()}"


def update_skills_from_json():
    """Update skills for all problems from JSON files."""
    script_dir = Path(__file__).parent.parent
    generated_dir = script_dir / "generated_problems"

    if not generated_dir.exists():
        print(f"디렉토리를 찾을 수 없습니다: {generated_dir}")
        return

    json_files = sorted(generated_dir.glob("*.json"))

    if not json_files:
        print(f"JSON 파일을 찾을 수 없습니다: {generated_dir}")
        return

    print(f"{len(json_files)}개의 JSON 파일 발견")
    print("=" * 60)

    db: Session = SessionLocal()
    try:
        updated_count = 0
        not_found_count = 0

        for json_file in json_files:
            problem_id = json_file.stem  # E01, VE01, etc.
            slug = create_slug_from_id(problem_id)

            # Read JSON file
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            new_skills = data.get('tags', [])

            # Find problem in database
            problem = db.query(Problem).filter(Problem.slug == slug).first()

            if not problem:
                print(f"[NOT FOUND] {problem_id} ({slug})")
                not_found_count += 1
                continue

            old_skills = problem.skills or []
            problem.skills = new_skills

            print(f"[UPDATED] {problem_id}: {old_skills[:2]}... -> {new_skills[:2]}...")
            updated_count += 1

        db.commit()

        print("=" * 60)
        print(f"완료! (업데이트: {updated_count}, 미발견: {not_found_count})")

    except Exception as e:
        db.rollback()
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        update_skills_from_json()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
