"""Delete test problems from database."""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.db import SessionLocal
from app.models.problem import Problem
from app.models.buggy_implementation import BuggyImplementation
from app.models.submission import Submission


def delete_test_problems():
    """Delete problems with titles starting with 'Test Problem'."""
    db: Session = SessionLocal()
    try:
        # Find all problems with titles starting with "Test Problem"
        test_problems = db.query(Problem).filter(
            Problem.title.like("Test Problem%")
        ).all()
        
        if not test_problems:
            print("❌ 'Test Problem'으로 시작하는 문제를 찾을 수 없습니다.")
            return
        
        print(f"📋 발견된 테스트 문제: {len(test_problems)}개")
        print("=" * 60)
        
        for problem in test_problems:
            # Count related data
            buggy_count = db.query(BuggyImplementation).filter(
                BuggyImplementation.problem_id == problem.id
            ).count()
            
            submission_count = db.query(Submission).filter(
                Submission.problem_id == problem.id
            ).count()
            
            print(f"  - ID: {problem.id}, 제목: '{problem.title}'")
            print(f"    Slug: {problem.slug}")
            print(f"    Buggy 구현: {buggy_count}개, 제출: {submission_count}개")
        
        print("=" * 60)
        
        # Ask for confirmation (in production, you might want to add actual confirmation)
        # For now, we'll proceed with deletion
        
        # Delete submissions first (if any)
        for problem in test_problems:
            db.query(Submission).filter(
                Submission.problem_id == problem.id
            ).delete()
        
        # Delete problems (cascade will delete buggy_implementations)
        deleted_count = 0
        for problem in test_problems:
            db.delete(problem)
            deleted_count += 1
        
        db.commit()
        
        print(f"✅ {deleted_count}개의 테스트 문제가 삭제되었습니다.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        delete_test_problems()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

