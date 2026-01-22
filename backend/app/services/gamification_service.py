"""
AI Verifier Track - Gamification Service

Handles point awarding, rank calculation, and badge checking
with duplicate prevention.
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import insert

from app.models.ai_challenge import (
    AIChallenge,
    AIChallengeAttempt,
    AIVerifierStats,
    AIVerifierBadge,
    UserAIVerifierBadge,
)


# Rank definitions
RANKS = [
    {"min_score": 0, "name": "Rookie", "icon": "🔰"},
    {"min_score": 500, "name": "Bug Hunter", "icon": "🔍"},
    {"min_score": 1500, "name": "Code Detective", "icon": "🕵️"},
    {"min_score": 3000, "name": "Senior Verifier", "icon": "🛡️"},
    {"min_score": 5000, "name": "Master Auditor", "icon": "👑"},
]


def calculate_rank(score: int) -> dict:
    """Get rank info based on score."""
    for rank in reversed(RANKS):
        if score >= rank["min_score"]:
            return rank
    return RANKS[0]


def get_or_create_stats(db: Session, user_id: UUID) -> AIVerifierStats:
    """Get or create user stats."""
    stats = db.query(AIVerifierStats).filter(
        AIVerifierStats.user_id == user_id
    ).first()

    if not stats:
        stats = AIVerifierStats(user_id=user_id)
        db.add(stats)
        db.flush()

    return stats


def check_first_solve(
    db: Session,
    user_id: UUID,
    challenge_id: UUID
) -> bool:
    """Check if this is the user's first successful solve for this challenge."""
    existing = db.query(AIChallengeAttempt).filter(
        AIChallengeAttempt.user_id == user_id,
        AIChallengeAttempt.challenge_id == challenge_id,
        AIChallengeAttempt.bug_found == True,
        AIChallengeAttempt.is_first_solve == True
    ).first()

    return existing is None


def award_points(
    db: Session,
    user_id: UUID,
    challenge_id: UUID,
    points: int,
    bug_found: bool,
    category: str
) -> dict:
    """
    Award points for bug discovery (with duplicate prevention).

    Returns:
        {
            "points_awarded": int,
            "is_first_solve": bool,
            "total_score": int,
            "new_rank": dict | None,
            "newly_awarded_badges": list
        }
    """
    if not bug_found or not user_id:
        return {
            "points_awarded": 0,
            "is_first_solve": False,
            "total_score": 0,
            "new_rank": None,
            "newly_awarded_badges": [],
        }

    # Check if already solved (duplicate prevention)
    is_first = check_first_solve(db, user_id, challenge_id)

    if not is_first:
        # Already solved - no points
        stats = get_or_create_stats(db, user_id)
        return {
            "points_awarded": 0,
            "is_first_solve": False,
            "total_score": stats.total_score,
            "new_rank": None,
            "newly_awarded_badges": [],
        }

    try:
        # Update user stats
        stats = get_or_create_stats(db, user_id)
        old_rank = calculate_rank(stats.total_score)

        stats.total_score += points
        stats.bugs_found += 1
        stats.challenges_completed += 1

        # Update streak
        stats.current_streak = update_streak(db, user_id, stats.current_streak)
        if stats.current_streak > stats.highest_streak:
            stats.highest_streak = stats.current_streak

        new_rank = calculate_rank(stats.total_score)
        stats.rank = new_rank["name"]
        stats.updated_at = datetime.utcnow()

        db.flush()

        # Check for new badges
        newly_awarded_badges = check_and_award_badges(
            db,
            user_id,
            stats=stats,
            category=category
        )

        db.commit()

        return {
            "points_awarded": points,
            "is_first_solve": True,
            "total_score": stats.total_score,
            "new_rank": new_rank if new_rank["name"] != old_rank["name"] else None,
            "newly_awarded_badges": newly_awarded_badges,
        }

    except IntegrityError:
        # Concurrent request - rollback
        db.rollback()
        stats = get_or_create_stats(db, user_id)
        return {
            "points_awarded": 0,
            "is_first_solve": False,
            "total_score": stats.total_score,
            "new_rank": None,
            "newly_awarded_badges": [],
        }


def update_streak(db: Session, user_id: UUID, current_streak: int) -> int:
    """Update and return the user's current streak."""
    today = date.today()

    # Find the most recent successful attempt
    last_attempt = db.query(AIChallengeAttempt).filter(
        AIChallengeAttempt.user_id == user_id,
        AIChallengeAttempt.bug_found == True,
    ).order_by(AIChallengeAttempt.created_at.desc()).first()

    if not last_attempt:
        return 1  # First solve

    last_date = last_attempt.created_at.date()

    if last_date == today:
        # Same day - maintain streak
        return current_streak
    elif (today - last_date).days == 1:
        # Consecutive day - increase streak
        return current_streak + 1
    else:
        # Streak broken - reset
        return 1


def check_and_award_badges(
    db: Session,
    user_id: UUID,
    stats: AIVerifierStats,
    category: str
) -> list:
    """
    Check badge conditions and award new badges.

    Returns list of newly awarded badges.
    """
    badges_to_check = []

    # First bug badge
    if stats.bugs_found == 1:
        badges_to_check.append("first_bug")

    # Bug count badges
    if stats.bugs_found >= 10:
        badges_to_check.append("bug_hunter_10")

    # Streak badges
    if stats.current_streak >= 3:
        badges_to_check.append("streak_3")
    if stats.current_streak >= 7:
        badges_to_check.append("streak_7")

    # Level completion badges (check highest level completed)
    highest_level = get_highest_completed_level(db, user_id)
    if highest_level >= 1:
        badges_to_check.append("level_master_1")
    if highest_level >= 3:
        badges_to_check.append("level_master_3")
    if highest_level >= 5:
        badges_to_check.append("level_master_5")

    # Filter out already owned badges
    existing_badges = set(
        ub.badge_id for ub in
        db.query(UserAIVerifierBadge).filter(
            UserAIVerifierBadge.user_id == user_id,
            UserAIVerifierBadge.badge_id.in_(badges_to_check)
        ).all()
    )

    new_badges = [b for b in badges_to_check if b not in existing_badges]

    # Award new badges
    newly_awarded = []
    for badge_id in new_badges:
        result = award_badge_safe(db, user_id, badge_id)
        if result:
            newly_awarded.append(result)

    return newly_awarded


def award_badge_safe(
    db: Session,
    user_id: UUID,
    badge_id: str
) -> Optional[dict]:
    """
    Award a badge safely (with duplicate prevention using ON CONFLICT DO NOTHING).
    """
    # Get badge info
    badge = db.query(AIVerifierBadge).filter(
        AIVerifierBadge.id == badge_id
    ).first()

    if not badge:
        return None

    # Check if already has badge
    existing = db.query(UserAIVerifierBadge).filter(
        UserAIVerifierBadge.user_id == user_id,
        UserAIVerifierBadge.badge_id == badge_id
    ).first()

    if existing:
        return None

    # Award badge
    try:
        user_badge = UserAIVerifierBadge(
            user_id=user_id,
            badge_id=badge_id,
            earned_at=datetime.utcnow()
        )
        db.add(user_badge)
        db.flush()

        return {
            "id": badge.id,
            "name": badge.name,
            "icon": badge.icon,
            "description": badge.description,
            "earned_at": user_badge.earned_at.isoformat(),
        }
    except IntegrityError:
        # Already has badge (concurrent request)
        return None


def get_highest_completed_level(db: Session, user_id: UUID) -> int:
    """Get the highest level the user has completed."""
    # Get all challenges the user has successfully solved
    completed = db.query(AIChallenge.level).join(
        AIChallengeAttempt,
        AIChallengeAttempt.challenge_id == AIChallenge.id
    ).filter(
        AIChallengeAttempt.user_id == user_id,
        AIChallengeAttempt.bug_found == True,
        AIChallengeAttempt.is_first_solve == True,
    ).distinct().all()

    if not completed:
        return 0

    # Find the highest level where ALL challenges are completed
    levels_completed = {c.level for c in completed}

    # For each level, check if all challenges are done
    for level in sorted(levels_completed, reverse=True):
        total_in_level = db.query(AIChallenge).filter(
            AIChallenge.level == level,
            AIChallenge.is_active == True,
        ).count()

        completed_in_level = db.query(AIChallengeAttempt).join(
            AIChallenge,
            AIChallenge.id == AIChallengeAttempt.challenge_id
        ).filter(
            AIChallengeAttempt.user_id == user_id,
            AIChallengeAttempt.bug_found == True,
            AIChallengeAttempt.is_first_solve == True,
            AIChallenge.level == level,
        ).count()

        if completed_in_level >= total_in_level:
            return level

    return 0
