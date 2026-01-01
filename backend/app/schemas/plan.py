"""
Plan Schemas

Plan/Entitlement API 요청/응답 스키마를 정의합니다.
"""

from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class PlanLimitsResponse(BaseModel):
    """플랜 제한 정보"""
    monthly_tokens: int = Field(..., description="월간 토큰 수")
    daily_free: int = Field(..., description="일일 무료 토큰 수")
    daily_ai_cap: int = Field(..., description="일일 AI 호출 상한")
    max_code_length: int = Field(..., description="최대 코드 길이 (문자)")
    max_context_messages: int = Field(..., description="AI 대화 컨텍스트 메시지 수")


class PlanResponse(BaseModel):
    """플랜 기본 정보"""
    plan_key: str = Field(..., description="플랜 키 (free/lite/pro)")
    display_name: str = Field(..., description="표시 이름")
    features: List[str] = Field(..., description="활성화된 기능 목록")
    limits: Dict[str, int] = Field(..., description="수량 제한")


class UserPlanResponse(PlanResponse):
    """사용자 플랜 정보 (시작/만료일 포함)"""
    started_at: Optional[datetime] = Field(None, description="플랜 시작일")
    expires_at: Optional[datetime] = Field(None, description="플랜 만료일 (None = 영구)")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class PlanCompareResponse(PlanResponse):
    """플랜 비교 정보 (Pricing 페이지용)"""
    description: str = Field(..., description="플랜 설명")
    price_monthly: int = Field(..., description="월간 가격 (KRW, 0 = 무료)")


class FeatureCheckRequest(BaseModel):
    """기능 권한 확인 요청"""
    feature: str = Field(..., description="확인할 기능 키")


class FeatureCheckResponse(BaseModel):
    """기능 권한 확인 응답"""
    feature: str = Field(..., description="기능 키")
    available: bool = Field(..., description="사용 가능 여부")
    plan_required: Optional[str] = Field(None, description="필요한 최소 플랜")


class LimitCheckResponse(BaseModel):
    """제한 확인 응답"""
    limit: str = Field(..., description="제한 키")
    value: int = Field(..., description="현재 플랜의 제한 값")
    usage: Optional[int] = Field(None, description="현재 사용량 (해당하는 경우)")
