"""AI Verifier Track - Challenge and Attempt models."""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text

from app.models.db import Base


class BugType(str, enum.Enum):
    """Bug type classification for AI challenges."""
    LOGIC = "logic"
    BOUNDARY = "boundary"
    TYPE = "type"
    STATE = "state"
    SECURITY = "security"


class ErrorType(str, enum.Enum):
    """Error type classification for challenge attempts."""
    E_SYNTAX = "E_SYNTAX"
    E_RUNTIME = "E_RUNTIME"
    E_TIMEOUT = "E_TIMEOUT"
    E_MEMORY = "E_MEMORY"
    E_FORBIDDEN = "E_FORBIDDEN"
    E_INPUT = "E_INPUT"


class Difficulty(str, enum.Enum):
    """Difficulty level for AI challenges."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class AIChallenge(Base):
    """AI Verifier Track challenge model.

    Stores challenges where users find bugs in AI-generated code
    by providing test inputs (not writing test code).
    """
    __tablename__ = "ai_challenges"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()")
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    level = Column(Integer, nullable=False, default=1)
    category = Column(String(50), nullable=False)

    # Function definition (required)
    function_name = Column(String(100), nullable=False)
    bug_type = Column(String(50), nullable=False)

    # Code templates
    buggy_code_template = Column(Text, nullable=False)
    correct_code = Column(Text, nullable=False)

    # Input/Output schema (required - spec.md section 3)
    input_schema = Column(JSONB, nullable=False)
    # Example: {"type": "single", "args": [{"name": "n", "type": "int", "example": 5}]}
    expected_output_type = Column(String(20), nullable=False, default="any")
    # bool, int, float, str, none, list, set, dict, any
    comparison_config = Column(JSONB, default={})
    # Example: {"float_epsilon": 1e-6, "list_order_matters": true}

    # Test cases
    test_cases = Column(JSONB, nullable=False)
    bug_trigger_cases = Column(JSONB, nullable=False)  # At least 1 required

    # UX
    input_hint = Column(String(255), nullable=False)
    hints = Column(JSONB, default=[])

    # AI response control
    ai_system_prompt = Column(Text)
    prescripted_responses = Column(JSONB)

    # Gamification
    bounty_points = Column(Integer, default=100)
    difficulty = Column(String(20), default="beginner")

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now()
    )

    # Relationships
    attempts = relationship("AIChallengeAttempt", back_populates="challenge")


class AIChallengeAttempt(Base):
    """AI Verifier Track attempt model.

    Records each user attempt to find bugs in AI-generated code.
    Includes error classification for debugging and analytics.
    """
    __tablename__ = "ai_challenge_attempts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()")
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True  # Allow anonymous attempts
    )
    challenge_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_challenges.id", ondelete="CASCADE"),
        nullable=False
    )

    # Attempt info
    user_input = Column(Text, nullable=False)
    parsed_input = Column(JSONB)  # Parsed input value

    # Results
    result = Column(String(20), nullable=False)  # 'success', 'fail', 'error'
    bug_found = Column(Boolean, default=False)
    actual_output = Column(Text)
    expected_output = Column(Text)

    # Error info (spec.md section 5.5)
    error_type = Column(String(20))  # E_SYNTAX, E_RUNTIME, E_TIMEOUT, E_MEMORY, E_FORBIDDEN, E_INPUT
    error_message = Column(Text)

    # Gamification
    points_earned = Column(Integer, default=0)
    is_first_solve = Column(Boolean, default=False)
    hints_used = Column(Integer, default=0)

    # Metadata
    execution_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    # Relationships
    challenge = relationship("AIChallenge", back_populates="attempts")
    user = relationship("User", backref="ai_challenge_attempts")


class AIVerifierStats(Base):
    """AI Verifier Track user statistics.

    Tracks user progress, scores, and achievements in AI Verifier Track.
    """
    __tablename__ = "ai_verifier_stats"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    total_score = Column(Integer, default=0)
    bugs_found = Column(Integer, default=0)
    challenges_completed = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    highest_streak = Column(Integer, default=0)
    rank = Column(String(50), default="Rookie")
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now()
    )

    # Relationships
    user = relationship("User", backref="ai_verifier_stats")


class AIVerifierBadge(Base):
    """AI Verifier Track badge definitions."""
    __tablename__ = "ai_verifier_badges"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(10))
    condition_type = Column(String(50))
    condition_value = Column(Integer)


class UserAIVerifierBadge(Base):
    """User earned badges for AI Verifier Track."""
    __tablename__ = "user_ai_verifier_badges"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    badge_id = Column(
        String(50),
        ForeignKey("ai_verifier_badges.id", ondelete="CASCADE"),
        primary_key=True
    )
    earned_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    # Relationships
    user = relationship("User", backref="ai_verifier_badges")
    badge = relationship("AIVerifierBadge")
