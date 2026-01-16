"""Daily Bounty schemas."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DailyBountyProblem(BaseModel):
    """일일 현상금 문제 정보"""
    id: int
    slug: str
    title: str
    difficulty: str
    domain: str
    short_description: Optional[str] = None


class DailyBountyRewards(BaseModel):
    """보상 정보"""
    base_reward: int = Field(5, description="기본 보상 토큰")
    streak_bonus: int = Field(50, description="연속 보너스 토큰")
    streak_threshold: int = Field(3, description="보너스 지급 연속 일수")


class DailyBountyCompletion(BaseModel):
    """완료 상태"""
    base_reward_granted: bool = False
    streak_bonus_granted: bool = False


class DailyBountyStatusResponse(BaseModel):
    """일일 현상금 상태 응답"""
    date: str = Field(..., description="날짜 (YYYY-MM-DD)")
    problem: Optional[DailyBountyProblem] = Field(None, description="오늘의 문제")
    is_completed: bool = Field(False, description="오늘 완료 여부")
    user_streak: int = Field(0, description="현재 연속 일수")
    streak_progress: int = Field(0, description="보너스까지 남은 일수 (0-2)")
    time_remaining_seconds: int = Field(0, description="자정까지 남은 초")
    rewards: DailyBountyRewards = Field(default_factory=DailyBountyRewards)
    completion: Optional[DailyBountyCompletion] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class DailyBountyHistoryItem(BaseModel):
    """완료 기록 아이템"""
    date: str
    problem_id: Optional[int]
    streak_count: int
    base_reward_granted: bool
    streak_bonus_granted: bool


class DailyBountyHistoryResponse(BaseModel):
    """완료 기록 응답"""
    completions: List[DailyBountyHistoryItem]
    current_streak: int
    total_completions: int
