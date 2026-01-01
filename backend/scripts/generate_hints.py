#!/usr/bin/env python3
"""
Generate hints for existing problems (M5-5).

Usage:
    python scripts/generate_hints.py [--problem-id ID] [--all] [--force]

Options:
    --problem-id ID    Generate hints for specific problem
    --all              Generate hints for all problems without hints
    --force            Regenerate hints even if they already exist
"""

import argparse
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.db import SessionLocal
from app.models.problem import Problem
from app.services.hint_service import generate_and_save_hints

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def generate_for_problem(db, problem_id: int, force: bool = False) -> bool:
    """Generate hints for a single problem."""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        logger.error(f"Problem {problem_id} not found")
        return False

    if problem.hints and not force:
        logger.info(f"Problem {problem_id} already has hints, skipping (use --force to regenerate)")
        return True

    logger.info(f"Generating hints for problem {problem_id}: {problem.title}")
    hints = generate_and_save_hints(problem, db)

    if hints:
        logger.info(f"Successfully generated hints for problem {problem_id}")
        logger.info(f"  Level 1: {hints['level1'][:50]}...")
        logger.info(f"  Level 2: {hints['level2'][:50]}...")
        logger.info(f"  Level 3: {hints['level3'][:50]}...")
        return True
    else:
        logger.error(f"Failed to generate hints for problem {problem_id}")
        return False


def generate_for_all(db, force: bool = False) -> tuple[int, int]:
    """Generate hints for all problems."""
    if force:
        problems = db.query(Problem).all()
    else:
        problems = db.query(Problem).filter(Problem.hints.is_(None)).all()

    total = len(problems)
    success = 0

    logger.info(f"Found {total} problems to process")

    for i, problem in enumerate(problems, 1):
        logger.info(f"[{i}/{total}] Processing problem {problem.id}")
        if generate_for_problem(db, problem.id, force=True):
            success += 1

    return success, total


def main():
    parser = argparse.ArgumentParser(description="Generate hints for problems")
    parser.add_argument("--problem-id", type=int, help="Specific problem ID")
    parser.add_argument("--all", action="store_true", help="Process all problems")
    parser.add_argument("--force", action="store_true", help="Regenerate existing hints")
    args = parser.parse_args()

    if not args.problem_id and not args.all:
        parser.print_help()
        print("\nError: Specify --problem-id or --all")
        sys.exit(1)

    db = SessionLocal()
    try:
        if args.problem_id:
            success = generate_for_problem(db, args.problem_id, args.force)
            sys.exit(0 if success else 1)
        else:
            success, total = generate_for_all(db, args.force)
            logger.info(f"Completed: {success}/{total} problems processed successfully")
            sys.exit(0 if success == total else 1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
