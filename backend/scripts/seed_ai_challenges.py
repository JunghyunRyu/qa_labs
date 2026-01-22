#!/usr/bin/env python3
"""
AI Verifier Track - Challenge Seed Script

Usage:
    python scripts/seed_ai_challenges.py [--clear]

Options:
    --clear     Clear existing challenges before seeding
"""

import json
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal, engine
from app.models.ai_challenge import AIChallenge, AIVerifierBadge


def load_challenges_from_json() -> list:
    """Load challenge data from JSON file."""
    json_path = Path(__file__).parent.parent / "app" / "data" / "ai_challenges.json"

    if not json_path.exists():
        print(f"Error: JSON file not found at {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_challenges(db: Session, clear: bool = False):
    """Seed AI challenges to database."""
    if clear:
        print("Clearing existing challenges...")
        db.query(AIChallenge).delete()
        db.commit()

    challenges_data = load_challenges_from_json()

    existing_titles = {c.title for c in db.query(AIChallenge.title).all()}

    added_count = 0
    skipped_count = 0

    for ch_data in challenges_data:
        if ch_data["title"] in existing_titles:
            print(f"  Skipped (exists): {ch_data['title']}")
            skipped_count += 1
            continue

        challenge = AIChallenge(
            title=ch_data["title"],
            description=ch_data["description"],
            level=ch_data["level"],
            category=ch_data["category"],
            function_name=ch_data["function_name"],
            bug_type=ch_data["bug_type"],
            buggy_code_template=ch_data["buggy_code_template"],
            correct_code=ch_data["correct_code"],
            input_schema=ch_data["input_schema"],
            expected_output_type=ch_data["expected_output_type"],
            comparison_config=ch_data.get("comparison_config", {}),
            test_cases=ch_data["test_cases"],
            bug_trigger_cases=ch_data["bug_trigger_cases"],
            input_hint=ch_data["input_hint"],
            hints=ch_data.get("hints", []),
            prescripted_responses=ch_data.get("prescripted_responses"),
            bounty_points=ch_data.get("bounty_points", 100),
            difficulty=ch_data.get("difficulty", "beginner"),
            is_active=True,
        )

        db.add(challenge)
        print(f"  Added: {ch_data['title']} (Level {ch_data['level']})")
        added_count += 1

    db.commit()
    print(f"\nSeed complete: {added_count} added, {skipped_count} skipped")


def seed_badges(db: Session, clear: bool = False):
    """Seed AI Verifier badges to database."""
    if clear:
        print("Clearing existing badges...")
        db.query(AIVerifierBadge).delete()
        db.commit()

    badges = [
        {
            "id": "first_bug",
            "name": "First Bug",
            "description": "Found your first bug!",
            "icon": "🐛",
            "condition_type": "bugs_found",
            "condition_value": 1,
        },
        {
            "id": "bug_hunter_10",
            "name": "Bug Hunter",
            "description": "Found 10 bugs",
            "icon": "🔍",
            "condition_type": "bugs_found",
            "condition_value": 10,
        },
        {
            "id": "perfectionist",
            "name": "Perfectionist",
            "description": "Completed a challenge on first try",
            "icon": "⭐",
            "condition_type": "first_try_solve",
            "condition_value": 1,
        },
        {
            "id": "streak_3",
            "name": "On a Roll",
            "description": "3-day solving streak",
            "icon": "🔥",
            "condition_type": "streak",
            "condition_value": 3,
        },
        {
            "id": "streak_7",
            "name": "Weekly Warrior",
            "description": "7-day solving streak",
            "icon": "🌟",
            "condition_type": "streak",
            "condition_value": 7,
        },
        {
            "id": "level_master_1",
            "name": "Level 1 Master",
            "description": "Completed all Level 1 challenges",
            "icon": "🥉",
            "condition_type": "level_complete",
            "condition_value": 1,
        },
        {
            "id": "level_master_3",
            "name": "Level 3 Master",
            "description": "Completed all Level 3 challenges",
            "icon": "🥈",
            "condition_type": "level_complete",
            "condition_value": 3,
        },
        {
            "id": "level_master_5",
            "name": "Level 5 Master",
            "description": "Completed all Level 5 challenges",
            "icon": "🥇",
            "condition_type": "level_complete",
            "condition_value": 5,
        },
    ]

    existing_ids = {b.id for b in db.query(AIVerifierBadge.id).all()}

    added_count = 0
    for badge_data in badges:
        if badge_data["id"] in existing_ids:
            print(f"  Skipped (exists): {badge_data['name']}")
            continue

        badge = AIVerifierBadge(**badge_data)
        db.add(badge)
        print(f"  Added: {badge_data['name']}")
        added_count += 1

    db.commit()
    print(f"\nBadges seed complete: {added_count} added")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Seed AI Verifier challenges")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding")
    args = parser.parse_args()

    print("=" * 50)
    print("AI Verifier Track - Seed Script")
    print("=" * 50)

    db = SessionLocal()

    try:
        print("\n[1/2] Seeding Challenges...")
        seed_challenges(db, clear=args.clear)

        print("\n[2/2] Seeding Badges...")
        seed_badges(db, clear=args.clear)

        print("\n" + "=" * 50)
        print("Seeding completed successfully!")
        print("=" * 50)

    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
