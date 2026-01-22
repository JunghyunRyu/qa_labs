"""AI Verifier Track schemas."""

from datetime import datetime
from typing import Any, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ============================================================
# Input/Output Schema Types
# ============================================================

class InputArgSchema(BaseModel):
    """Schema for a single input argument."""
    name: str
    type: Literal["int", "float", "str", "bool", "list", "dict", "none", "any"]
    description: Optional[str] = None
    example: Optional[Any] = None


class InputSchema(BaseModel):
    """Schema for input format definition."""
    type: Literal["single", "multiple"]
    args: List[InputArgSchema] = Field(..., min_length=1)


class ComparisonConfig(BaseModel):
    """Configuration for result comparison."""
    float_epsilon: float = 1e-6
    list_order_matters: bool = True
    case_sensitive: bool = True


# ============================================================
# Test Case Types
# ============================================================

class TestCase(BaseModel):
    """A test case for validation."""
    input: List[Any]
    expected: Any


class BugTriggerCase(BaseModel):
    """A test case that triggers the bug."""
    input: List[Any]
    expected: Any
    description: Optional[str] = None


# ============================================================
# Challenge Schemas
# ============================================================

class AIChallengeBase(BaseModel):
    """Base schema for AI Challenge."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=10)
    level: int = Field(..., ge=1, le=10)
    category: str
    function_name: str = Field(..., pattern=r"^[a-z_][a-z0-9_]*$")
    bug_type: Literal["logic", "boundary", "type", "state", "security"]
    buggy_code_template: str
    correct_code: str
    input_schema: InputSchema
    expected_output_type: Literal["bool", "int", "float", "str", "list", "dict", "set", "none", "any"] = "any"
    comparison_config: Optional[ComparisonConfig] = None
    test_cases: List[TestCase] = Field(..., min_length=1)
    bug_trigger_cases: List[BugTriggerCase] = Field(..., min_length=1)
    input_hint: str
    hints: List[str] = []
    bounty_points: int = Field(default=100, ge=0)
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"

    @field_validator('buggy_code_template', 'correct_code')
    @classmethod
    def validate_code_has_function(cls, v: str, info) -> str:
        """Validate that code contains the function definition."""
        # Note: function_name validation happens after all fields are set
        return v


class AIChallengeCreate(AIChallengeBase):
    """Schema for creating an AI Challenge."""
    ai_system_prompt: Optional[str] = None
    prescripted_responses: Optional[dict] = None


class AIChallengeResponse(AIChallengeBase):
    """Schema for AI Challenge response."""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIChallengeListResponse(BaseModel):
    """Schema for AI Challenge list response."""
    id: UUID
    title: str
    description: str
    level: int
    category: str
    bug_type: str
    input_hint: str
    bounty_points: int
    difficulty: str
    is_completed: bool = False  # Whether current user has solved it

    model_config = {"from_attributes": True}


class AIChallengeDetailResponse(AIChallengeResponse):
    """Schema for detailed AI Challenge response (for solving)."""
    # Code is included for solving
    buggy_code_template: str
    correct_code: str  # Only for judge, not exposed to frontend

    # AI response control (for prescripted mode)
    ai_system_prompt: Optional[str] = None
    prescripted_responses: Optional[dict] = None


class AIChallengePublicResponse(BaseModel):
    """Schema for public AI Challenge response (no correct_code)."""
    id: UUID
    title: str
    description: str
    level: int
    category: str
    function_name: str
    bug_type: str
    buggy_code_template: str
    input_schema: InputSchema
    expected_output_type: str
    input_hint: str
    hints: List[str]
    bounty_points: int
    difficulty: str

    model_config = {"from_attributes": True}


# ============================================================
# Attempt Schemas
# ============================================================

class AttemptCreate(BaseModel):
    """Schema for creating an attempt."""
    user_input: str = Field(..., min_length=1)
    bug_found: bool = False  # Result from client-side judge


class NewBadge(BaseModel):
    """Schema for newly earned badge."""
    id: str
    name: str
    icon: str
    description: Optional[str] = None


class NewRank(BaseModel):
    """Schema for new rank after level up."""
    name: str
    icon: str


class AttemptResult(BaseModel):
    """Schema for attempt result (returned from judge)."""
    success: bool
    bug_found: bool
    user_input: str
    parsed_input: Optional[Any] = None
    actual_output: Optional[str] = None
    expected_output: Optional[str] = None
    error_type: Optional[Literal["E_SYNTAX", "E_RUNTIME", "E_TIMEOUT", "E_MEMORY", "E_FORBIDDEN", "E_INPUT"]] = None
    error_message: Optional[str] = None
    user_friendly_message: Optional[str] = None
    execution_time_ms: Optional[int] = None
    points_earned: int = 0
    is_first_solve: bool = False
    total_score: int = 0
    new_rank: Optional[NewRank] = None
    newly_awarded_badges: List[NewBadge] = []


class AttemptResponse(BaseModel):
    """Schema for attempt response."""
    id: UUID
    challenge_id: UUID
    user_input: str
    result: str
    bug_found: bool
    actual_output: Optional[str] = None
    expected_output: Optional[str] = None
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    points_earned: int
    is_first_solve: bool
    hints_used: int
    execution_time_ms: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AttemptHistoryResponse(BaseModel):
    """Schema for attempt history response."""
    attempts: List[AttemptResponse]
    total_attempts: int
    successful_attempts: int


# ============================================================
# Stats Schemas
# ============================================================

class AIVerifierStatsResponse(BaseModel):
    """Schema for user stats response."""
    total_score: int
    bugs_found: int
    challenges_completed: int
    current_streak: int
    highest_streak: int
    rank: str
    rank_icon: str  # Computed from rank

    model_config = {"from_attributes": True}


class BadgeResponse(BaseModel):
    """Schema for badge response."""
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    earned_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserBadgesResponse(BaseModel):
    """Schema for user badges response."""
    earned_badges: List[BadgeResponse]
    available_badges: List[BadgeResponse]


# ============================================================
# Leaderboard Schemas
# ============================================================

class LeaderboardEntry(BaseModel):
    """Schema for leaderboard entry."""
    rank: int
    user_id: UUID
    username: str
    avatar_url: Optional[str] = None
    score: int
    bugs_found: int


class LeaderboardResponse(BaseModel):
    """Schema for leaderboard response."""
    period: Literal["weekly", "monthly", "all_time"]
    entries: List[LeaderboardEntry]
    user_rank: Optional[int] = None  # Current user's rank


# ============================================================
# Hint Schemas
# ============================================================

class HintRequest(BaseModel):
    """Schema for requesting a hint."""
    hint_level: int = Field(..., ge=0, le=2)  # 0, 1, 2


class HintResponse(BaseModel):
    """Schema for hint response."""
    hint_level: int
    hint_text: str
    hints_remaining: int
    total_hints: int


# ============================================================
# Chat Schemas
# ============================================================

class ChatMessage(BaseModel):
    """Schema for a chat message."""
    role: Literal["user", "assistant"]
    content: str


class AIChatRequest(BaseModel):
    """Schema for AI chat request."""
    challenge_id: str
    challenge_level: int = Field(..., ge=1, le=10)
    messages: List[ChatMessage]


class PrescriptedResponse(BaseModel):
    """Schema for prescripted response."""
    content: str
    is_prescripted: bool = True
    cache_hit: bool = False


class StreamingChunk(BaseModel):
    """Schema for streaming chunk."""
    content: Optional[str] = None
    error: Optional[str] = None


# ============================================================
# Judge Schemas (for client-side execution)
# ============================================================

class JudgeCodeResponse(BaseModel):
    """Schema for judge code response (correct_code for client-side judging)."""
    correct_code: str
    comparison_config: Optional[ComparisonConfig] = None
