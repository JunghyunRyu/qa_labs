"""Progress dashboard schemas."""

from typing import List, Optional
from pydantic import BaseModel, Field


class DifficultyStats(BaseModel):
    """Statistics for a specific difficulty level."""

    difficulty: str = Field(..., description="Difficulty level (Very Easy, Easy, Medium, Hard)")
    submission_count: int = Field(..., description="Total submissions for this difficulty")
    avg_score: float = Field(..., description="Average score (0-100)")
    success_rate: float = Field(..., description="Success rate (0.0-1.0)")


class DomainStats(BaseModel):
    """Statistics for a specific domain."""

    domain: str = Field(..., description="Domain name")
    submission_count: int = Field(..., description="Total submissions for this domain")
    avg_score: float = Field(..., description="Average score (0-100)")


class SkillStats(BaseModel):
    """Statistics for a specific skill/tag."""

    skill: str = Field(..., description="Skill/tag name")
    submission_count: int = Field(..., description="Total submissions for this skill")
    avg_score: float = Field(..., description="Average score (0-100)")


class ProgressSummaryResponse(BaseModel):
    """User progress summary response."""

    total_submissions: int = Field(..., description="Total number of submissions")
    success_submissions: int = Field(..., description="Number of successful submissions")
    avg_score: float = Field(..., description="Average score across all submissions")
    avg_kill_ratio: float = Field(..., description="Average mutation kill ratio (0.0-1.0)")
    best_score: int = Field(..., description="Highest score achieved")
    recent_avg_score: float = Field(..., description="Average score of recent 10 submissions")
    difficulty_stats: List[DifficultyStats] = Field(
        default_factory=list, description="Statistics by difficulty level"
    )
    domain_stats: List[DomainStats] = Field(
        default_factory=list, description="Statistics by domain"
    )
    skill_stats: List[SkillStats] = Field(
        default_factory=list, description="Statistics by skill/tag"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "total_submissions": 42,
                "success_submissions": 35,
                "avg_score": 78.5,
                "avg_kill_ratio": 0.72,
                "best_score": 100,
                "recent_avg_score": 82.3,
                "difficulty_stats": [
                    {
                        "difficulty": "Easy",
                        "submission_count": 15,
                        "avg_score": 85.2,
                        "success_rate": 0.93,
                    }
                ],
                "domain_stats": [
                    {"domain": "common", "submission_count": 20, "avg_score": 80.1}
                ],
                "skill_stats": [
                    {"skill": "array", "submission_count": 12, "avg_score": 80.1}
                ],
            }
        }


class TimelineEntry(BaseModel):
    """Single entry in the progress timeline."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    submission_count: int = Field(..., description="Number of submissions on this date")
    avg_score: float = Field(..., description="Average score on this date")
    avg_kill_ratio: float = Field(..., description="Average kill ratio on this date")


class ProgressTimelineResponse(BaseModel):
    """Progress timeline response."""

    entries: List[TimelineEntry] = Field(
        default_factory=list, description="Timeline entries"
    )
    range: str = Field(..., description="Time range (7d, 30d, 90d, all)")
    total_submissions: int = Field(..., description="Total submissions in this range")

    class Config:
        json_schema_extra = {
            "example": {
                "entries": [
                    {
                        "date": "2025-01-01",
                        "submission_count": 3,
                        "avg_score": 75.0,
                        "avg_kill_ratio": 0.68,
                    },
                    {
                        "date": "2025-01-02",
                        "submission_count": 5,
                        "avg_score": 82.4,
                        "avg_kill_ratio": 0.75,
                    },
                ],
                "range": "30d",
                "total_submissions": 42,
            }
        }


class ProgressEmptyResponse(BaseModel):
    """Response when user has no submission history."""

    message: str = Field(
        default="아직 제출 기록이 없습니다. 첫 문제를 풀어보세요!",
        description="Empty state message",
    )
    has_data: bool = Field(default=False, description="Whether user has any data")
