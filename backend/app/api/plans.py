"""
Plan API Endpoints

플랜 정보 조회 및 비교 API를 제공합니다.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.db import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.plan_config import Feature, Limit, PLAN_CONFIGS
from app.services.plan_service import PlanService, get_all_plans
from app.schemas.plan import (
    UserPlanResponse,
    PlanCompareResponse,
    FeatureCheckRequest,
    FeatureCheckResponse,
    LimitCheckResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/me", response_model=UserPlanResponse)
async def get_my_plan(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 Plan 정보 조회

    Returns:
        UserPlanResponse: 플랜 정보 (기능, 제한, 시작/만료일)
    """
    plan_service = PlanService(db)
    plan = plan_service.get_user_plan(user)

    return UserPlanResponse(
        plan_key=plan.plan_key.value,
        display_name=plan.display_name,
        features=[f.value for f in plan.features],
        limits={k.value: v for k, v in plan.limits.items()},
        started_at=getattr(user, 'plan_started_at', None),
        expires_at=getattr(user, 'plan_expires_at', None),
    )


@router.get("/compare", response_model=List[PlanCompareResponse])
async def compare_plans():
    """
    모든 Plan 비교 정보 (Pricing 페이지용)

    인증 없이 접근 가능합니다.

    Returns:
        List[PlanCompareResponse]: 모든 플랜 비교 정보
    """
    plans = get_all_plans()
    return [
        PlanCompareResponse(
            plan_key=config.plan_key.value,
            display_name=config.display_name,
            description=config.description,
            price_monthly=config.price_monthly,
            features=[f.value for f in config.features],
            limits={k.value: v for k, v in config.limits.items()},
        )
        for config in plans
    ]


@router.post("/check-feature", response_model=FeatureCheckResponse)
async def check_feature(
    request: FeatureCheckRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 기능 사용 가능 여부 확인

    Args:
        request: 확인할 기능 정보

    Returns:
        FeatureCheckResponse: 기능 사용 가능 여부
    """
    plan_service = PlanService(db)

    # Feature enum 변환
    try:
        feature = Feature(request.feature)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown feature: {request.feature}"
        )

    available = plan_service.has_feature(user, feature)

    # 필요한 최소 플랜 찾기
    plan_required = None
    if not available:
        for plan_key, config in PLAN_CONFIGS.items():
            if feature in config.features:
                plan_required = plan_key.value
                break

    return FeatureCheckResponse(
        feature=request.feature,
        available=available,
        plan_required=plan_required,
    )


@router.get("/limits/{limit_key}", response_model=LimitCheckResponse)
async def get_limit(
    limit_key: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 제한 값 조회

    Args:
        limit_key: 제한 키 (monthly_tokens, daily_free, 등)

    Returns:
        LimitCheckResponse: 제한 값
    """
    plan_service = PlanService(db)

    # Limit enum 변환
    try:
        limit = Limit(limit_key)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown limit: {limit_key}"
        )

    value = plan_service.get_limit(user, limit)

    return LimitCheckResponse(
        limit=limit_key,
        value=value,
        usage=None,  # TODO: 실제 사용량 조회 추가
    )


@router.get("/{plan_key}", response_model=PlanCompareResponse)
async def get_plan_by_key(plan_key: str):
    """
    특정 플랜 정보 조회

    인증 없이 접근 가능합니다.

    Args:
        plan_key: 플랜 키 (free/lite/pro)

    Returns:
        PlanCompareResponse: 플랜 정보
    """
    from app.core.plan_config import get_plan_config, PlanKey

    # 유효한 플랜 키인지 확인
    try:
        PlanKey(plan_key)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan not found: {plan_key}"
        )

    config = get_plan_config(plan_key)

    return PlanCompareResponse(
        plan_key=config.plan_key.value,
        display_name=config.display_name,
        description=config.description,
        price_monthly=config.price_monthly,
        features=[f.value for f in config.features],
        limits={k.value: v for k, v in config.limits.items()},
    )
