"""
Feedback schemas for PR4: 심화/성공 분석 및 재생성
"""

from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.feedback import FeedbackType, FeedbackStatus


# === Content Schemas (피드백 내용) ===

class FeedbackStrength(BaseModel):
    """강점 항목"""
    title: str
    description: str


class FeedbackWeakness(BaseModel):
    """약점 항목"""
    title: str
    description: str
    suggestion: Optional[str] = None


class FeedbackSuggestion(BaseModel):
    """개선 제안"""
    priority: int = Field(ge=1, le=3, description="우선순위 (1=높음, 3=낮음)")
    title: str
    description: str
    code_example: Optional[str] = None


class BaseFeedbackContent(BaseModel):
    """기본 피드백 내용 (schema_version=1)"""
    summary: str = Field(description="전체 요약")
    strengths: List[FeedbackStrength] = Field(default_factory=list)
    weaknesses: List[FeedbackWeakness] = Field(default_factory=list)
    suggestions: List[FeedbackSuggestion] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list, description="다음 학습 단계")


class DeepFeedbackContent(BaseFeedbackContent):
    """심화 분석 피드백 내용"""
    code_quality: Optional[dict] = Field(default=None, description="코드 품질 분석")
    test_coverage: Optional[dict] = Field(default=None, description="테스트 커버리지 분석")
    edge_cases: List[str] = Field(default_factory=list, description="놓친 엣지 케이스")
    mutation_analysis: Optional[dict] = Field(default=None, description="뮤테이션 분석")


class SuccessFeedbackContent(BaseFeedbackContent):
    """성공 분석 피드백 내용"""
    achievement_highlights: List[str] = Field(default_factory=list, description="성취 하이라이트")
    advanced_techniques: List[str] = Field(default_factory=list, description="사용된 고급 기법")
    learning_path: List[str] = Field(default_factory=list, description="다음 도전 추천")


# === API Request/Response Schemas ===

class FeedbackRequest(BaseModel):
    """피드백 생성 요청"""
    submission_id: UUID


class DeepFeedbackRequest(FeedbackRequest):
    """심화 분석 요청"""
    focus_areas: Optional[List[str]] = Field(
        default=None,
        description="집중 분석할 영역 (예: edge_cases, performance, readability)"
    )


class RegenerateFeedbackRequest(FeedbackRequest):
    """피드백 재생성 요청"""
    previous_feedback_id: Optional[UUID] = Field(
        default=None,
        description="이전 피드백 ID (개선 참고용)"
    )


class FeedbackResponse(BaseModel):
    """피드백 응답"""
    id: UUID
    submission_id: UUID
    feedback_type: str
    status: str
    content: Optional[dict] = None
    schema_version: int
    token_cost: int
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeedbackStatusResponse(BaseModel):
    """피드백 상태 응답 (폴링용)"""
    id: UUID
    status: str
    progress: Optional[int] = Field(default=None, description="진행률 (0-100)")
    estimated_seconds: Optional[int] = Field(default=None, description="예상 남은 시간")

    class Config:
        from_attributes = True


class FeedbackListResponse(BaseModel):
    """피드백 목록 응답"""
    feedbacks: List[FeedbackResponse]
    total: int


# === 쿨다운 관련 ===

class CooldownStatus(BaseModel):
    """쿨다운 상태"""
    is_available: bool
    remaining_seconds: int = 0
    next_available_at: Optional[datetime] = None


class FeedbackAvailability(BaseModel):
    """피드백 가용성 체크 응답"""
    can_request: bool
    feedback_type: str
    reason: Optional[str] = None
    cooldown: Optional[CooldownStatus] = None
    token_cost: int
    token_balance: int


# === 비동기 생성 응답 ===

class FeedbackAcceptedResponse(BaseModel):
    """비동기 피드백 생성 수락 응답 (202 Accepted)"""
    feedback_id: UUID
    status: str = FeedbackStatus.PENDING.value
    message: str = "피드백 생성이 시작되었습니다."
    poll_url: str = Field(description="상태 확인 URL")
    estimated_seconds: int = Field(default=30, description="예상 소요 시간")
