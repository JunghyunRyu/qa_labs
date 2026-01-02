"""
Feedback API endpoints for PR4: 심화/성공 분석 및 재생성

비동기 피드백 생성을 지원하며, 쿨다운 및 Plan 기반 접근 제어를 적용합니다.
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    require_quota,
    QuotaContext,
    require_feedback_deep_quota,
    require_success_analysis_quota,
)
from app.core.plan_config import ActionType, Feature
from app.models.db import get_db
from app.models.user import User
from app.models.feedback import Feedback, FeedbackType, FeedbackStatus
from app.models.submission import Submission
from app.schemas.feedback import (
    DeepFeedbackRequest,
    RegenerateFeedbackRequest,
    FeedbackResponse,
    FeedbackStatusResponse,
    FeedbackListResponse,
    FeedbackAvailability,
    FeedbackAcceptedResponse,
    CooldownStatus,
)
from app.services.deep_feedback_service import DeepFeedbackService
from app.services.success_analysis_service import SuccessAnalysisService
from app.services.plan_service import PlanService
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/deep/{submission_id}",
    response_model=FeedbackAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_deep_feedback(
    submission_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    quota_ctx: QuotaContext = Depends(require_feedback_deep_quota()),
):
    """
    심화 분석 요청 (비동기)

    - Lite/Pro 플랜 필요
    - 60초 쿨다운
    - 토큰 비용: 2

    Returns:
        202 Accepted + 폴링 URL
    """
    user = quota_ctx.user
    deep_service = DeepFeedbackService(db)

    # 쿨다운 확인
    is_available, remaining_seconds = deep_service.check_cooldown(user.id)
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "COOLDOWN_ACTIVE",
                    "message": f"쿨다운 중입니다. {remaining_seconds}초 후에 다시 시도해주세요.",
                    "remaining_seconds": remaining_seconds,
                }
            },
            headers={"Retry-After": str(remaining_seconds)},
        )

    # Submission 확인
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="제출을 찾을 수 없습니다.",
        )

    # 본인 제출인지 확인
    if submission.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인의 제출에 대해서만 심화 분석을 요청할 수 있습니다.",
        )

    # 이미 생성 중이거나 완료된 피드백 확인
    existing = deep_service.get_existing_deep_feedback(submission_id, user.id)
    if existing:
        if existing.status == FeedbackStatus.COMPLETED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "ALREADY_EXISTS",
                        "message": "이미 심화 분석이 완료되었습니다.",
                        "feedback_id": str(existing.id),
                    }
                },
            )
        elif existing.status in [FeedbackStatus.PENDING.value, FeedbackStatus.GENERATING.value]:
            return FeedbackAcceptedResponse(
                feedback_id=existing.id,
                status=existing.status,
                message="피드백 생성이 진행 중입니다.",
                poll_url=f"/api/v1/feedback/{existing.id}/status",
            )

    # 토큰 차감
    success, deduction_type = quota_ctx.consume(submission_id=submission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="토큰 차감에 실패했습니다.",
        )

    # 쿨다운 설정
    deep_service.set_cooldown(user.id)

    # 피드백 생성 (비동기)
    feedback = deep_service.create_pending_feedback(submission, user)

    # Celery 태스크 트리거
    from app.workers.feedback_tasks import generate_deep_feedback_task
    generate_deep_feedback_task.delay(str(feedback.id))

    logger.info(
        f"[DEEP_FEEDBACK_REQUESTED] feedback_id={feedback.id} "
        f"submission_id={submission_id} user_id={user.id}"
    )

    return FeedbackAcceptedResponse(
        feedback_id=feedback.id,
        status=FeedbackStatus.PENDING.value,
        message="심화 분석이 시작되었습니다.",
        poll_url=f"/api/v1/feedback/{feedback.id}/status",
        estimated_seconds=30,
    )


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """피드백 상세 조회"""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="피드백을 찾을 수 없습니다.",
        )

    # 본인 피드백인지 확인
    if feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인의 피드백만 조회할 수 있습니다.",
        )

    return FeedbackResponse.model_validate(feedback)


@router.get("/{feedback_id}/status", response_model=FeedbackStatusResponse)
async def get_feedback_status(
    feedback_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    피드백 생성 상태 조회 (폴링용)

    생성 중인 피드백의 상태를 확인합니다.
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="피드백을 찾을 수 없습니다.",
        )

    if feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인의 피드백만 조회할 수 있습니다.",
        )

    # 진행률 계산 (간단한 추정)
    progress = None
    estimated_seconds = None

    if feedback.status == FeedbackStatus.PENDING.value:
        progress = 0
        estimated_seconds = 30
    elif feedback.status == FeedbackStatus.GENERATING.value:
        progress = 50
        estimated_seconds = 15
    elif feedback.status == FeedbackStatus.COMPLETED.value:
        progress = 100
        estimated_seconds = 0

    return FeedbackStatusResponse(
        id=feedback.id,
        status=feedback.status,
        progress=progress,
        estimated_seconds=estimated_seconds,
    )


@router.get("/submission/{submission_id}", response_model=FeedbackListResponse)
async def list_submission_feedbacks(
    submission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """제출에 대한 모든 피드백 목록 조회"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="제출을 찾을 수 없습니다.",
        )

    if submission.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인의 제출만 조회할 수 있습니다.",
        )

    feedbacks = db.query(Feedback).filter(
        Feedback.submission_id == submission_id,
    ).order_by(Feedback.created_at.desc()).all()

    return FeedbackListResponse(
        feedbacks=[FeedbackResponse.model_validate(f) for f in feedbacks],
        total=len(feedbacks),
    )


@router.get("/availability/{submission_id}/{feedback_type}")
async def check_feedback_availability(
    submission_id: UUID,
    feedback_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FeedbackAvailability:
    """
    피드백 요청 가능 여부 확인

    쿨다운, 토큰 잔액, Plan 권한 등을 확인합니다.
    """
    plan_service = PlanService(db)
    token_service = TokenService(db)

    # Submission 확인
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission or submission.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="제출을 찾을 수 없습니다.",
        )

    # 토큰 비용 및 Feature 확인
    if feedback_type == FeedbackType.DEEP.value:
        token_cost = 2
        feature = Feature.FEEDBACK_DEEP
        cooldown_seconds = 60
    elif feedback_type == FeedbackType.SUCCESS.value:
        token_cost = 1
        feature = Feature.SUCCESS_ANALYSIS
        cooldown_seconds = 0
    else:
        token_cost = 1
        feature = Feature.FEEDBACK_REGENERATE
        cooldown_seconds = 30

    # Feature 권한 확인
    has_feature = plan_service.has_feature(current_user, feature)
    if not has_feature:
        return FeedbackAvailability(
            can_request=False,
            feedback_type=feedback_type,
            reason="이 기능은 유료 플랜에서 사용할 수 있습니다.",
            token_cost=token_cost,
            token_balance=token_service.get_token_status(current_user)["tokens_remaining"],
        )

    # 토큰 잔액 확인
    can_use, reason = token_service.can_use_ai_feature(current_user, token_cost)
    token_balance = token_service.get_token_status(current_user)["tokens_remaining"]

    if not can_use:
        return FeedbackAvailability(
            can_request=False,
            feedback_type=feedback_type,
            reason="토큰이 부족합니다.",
            token_cost=token_cost,
            token_balance=token_balance,
        )

    # 쿨다운 확인
    cooldown_status = None
    if feedback_type == FeedbackType.DEEP.value:
        deep_service = DeepFeedbackService(db)
        is_available, remaining = deep_service.check_cooldown(current_user.id)
        if not is_available:
            cooldown_status = CooldownStatus(
                is_available=False,
                remaining_seconds=remaining,
            )
            return FeedbackAvailability(
                can_request=False,
                feedback_type=feedback_type,
                reason=f"쿨다운 중입니다. {remaining}초 후에 다시 시도해주세요.",
                cooldown=cooldown_status,
                token_cost=token_cost,
                token_balance=token_balance,
            )

    return FeedbackAvailability(
        can_request=True,
        feedback_type=feedback_type,
        cooldown=CooldownStatus(is_available=True, remaining_seconds=0),
        token_cost=token_cost,
        token_balance=token_balance,
    )
