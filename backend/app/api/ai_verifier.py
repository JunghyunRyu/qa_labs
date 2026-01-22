"""AI Verifier Track API endpoints."""

import json
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.config import settings
from app.models.db import get_db
from app.models.user import User
from app.models.ai_challenge import (
    AIChallenge,
    AIChallengeAttempt,
    AIVerifierStats,
    AIVerifierBadge,
    UserAIVerifierBadge,
)
from app.schemas.ai_verifier import (
    AIChallengeListResponse,
    AIChallengePublicResponse,
    AttemptCreate,
    AttemptResult,
    AttemptResponse,
    AttemptHistoryResponse,
    AIVerifierStatsResponse,
    BadgeResponse,
    UserBadgesResponse,
    LeaderboardResponse,
    LeaderboardEntry,
    HintRequest,
    HintResponse,
    AIChatRequest,
    ChatMessage,
    JudgeCodeResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Rank definitions
RANKS = [
    {"min_score": 0, "name": "Rookie", "icon": "🔰"},
    {"min_score": 500, "name": "Bug Hunter", "icon": "🔍"},
    {"min_score": 1500, "name": "Code Detective", "icon": "🕵️"},
    {"min_score": 3000, "name": "Senior Verifier", "icon": "🛡️"},
    {"min_score": 5000, "name": "Master Auditor", "icon": "👑"},
]


def get_rank_info(score: int) -> dict:
    """Get rank info based on score."""
    for rank in reversed(RANKS):
        if score >= rank["min_score"]:
            return rank
    return RANKS[0]


# ============================================================
# Challenge Endpoints
# ============================================================

@router.get("/challenges", response_model=dict)
async def get_challenges(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    level: Optional[int] = Query(None, ge=1, le=10, description="Filter by level"),
    category: Optional[str] = Query(None, description="Filter by category"),
    bug_type: Optional[str] = Query(None, description="Filter by bug type"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get paginated list of AI Verifier challenges.

    Returns challenges with completion status for authenticated users.
    """
    query = db.query(AIChallenge).filter(AIChallenge.is_active == True)

    # Apply filters
    if level:
        query = query.filter(AIChallenge.level == level)
    if category:
        query = query.filter(AIChallenge.category == category)
    if bug_type:
        query = query.filter(AIChallenge.bug_type == bug_type)
    if difficulty:
        query = query.filter(AIChallenge.difficulty == difficulty)

    # Count total
    total = query.count()

    # Pagination
    offset = (page - 1) * page_size
    challenges = query.order_by(AIChallenge.level, AIChallenge.created_at).offset(offset).limit(page_size).all()

    # Get completed challenge IDs for current user
    completed_ids = set()
    if current_user:
        completed_attempts = db.query(AIChallengeAttempt.challenge_id).filter(
            AIChallengeAttempt.user_id == current_user.id,
            AIChallengeAttempt.bug_found == True,
            AIChallengeAttempt.is_first_solve == True,
        ).all()
        completed_ids = {str(a.challenge_id) for a in completed_attempts}

    # Build response
    challenge_list = []
    for ch in challenges:
        challenge_list.append({
            "id": str(ch.id),
            "title": ch.title,
            "description": ch.description,
            "level": ch.level,
            "category": ch.category,
            "bug_type": ch.bug_type,
            "input_hint": ch.input_hint,
            "bounty_points": ch.bounty_points,
            "difficulty": ch.difficulty,
            "is_completed": str(ch.id) in completed_ids,
        })

    total_pages = (total + page_size - 1) // page_size

    return {
        "challenges": challenge_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/challenges/{challenge_id}", response_model=AIChallengePublicResponse)
async def get_challenge(
    challenge_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Get a specific AI Verifier challenge.

    Returns challenge details without the correct_code (for security).
    """
    challenge = db.query(AIChallenge).filter(
        AIChallenge.id == challenge_id,
        AIChallenge.is_active == True,
    ).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    return challenge


@router.get("/challenges/{challenge_id}/judge-code", response_model=JudgeCodeResponse)
async def get_judge_code(
    challenge_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Get correct_code for client-side judge execution.

    This endpoint provides the correct code needed for Pyodide-based
    client-side judging. The correct code is used to compare results
    against the buggy code.

    Note: In a production environment, consider implementing
    server-side judging for enhanced security.
    """
    challenge = db.query(AIChallenge).filter(
        AIChallenge.id == challenge_id,
        AIChallenge.is_active == True,
    ).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    return JudgeCodeResponse(
        correct_code=challenge.correct_code,
        comparison_config=challenge.comparison_config,
    )


# ============================================================
# Attempt Endpoints
# ============================================================

@router.post("/challenges/{challenge_id}/attempt", response_model=AttemptResult)
async def submit_attempt(
    challenge_id: UUID,
    attempt: AttemptCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Submit an attempt to find a bug in the challenge.

    This endpoint receives the user's test input and returns the judge result.
    The actual judge execution happens on the client-side (Pyodide).
    This endpoint is for recording attempts and awarding points.
    """
    # Get challenge
    challenge = db.query(AIChallenge).filter(
        AIChallenge.id == challenge_id,
        AIChallenge.is_active == True,
    ).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    # For now, return a placeholder response
    # The actual judge logic will be implemented in M4
    return AttemptResult(
        success=True,
        bug_found=False,
        user_input=attempt.user_input,
        parsed_input=None,
        actual_output=None,
        expected_output=None,
        error_type=None,
        error_message=None,
        user_friendly_message="Judge engine not yet implemented",
        execution_time_ms=0,
        points_earned=0,
        is_first_solve=False,
    )


@router.get("/challenges/{challenge_id}/attempts", response_model=AttemptHistoryResponse)
async def get_attempt_history(
    challenge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user's attempt history for a specific challenge.
    """
    attempts = db.query(AIChallengeAttempt).filter(
        AIChallengeAttempt.challenge_id == challenge_id,
        AIChallengeAttempt.user_id == current_user.id,
    ).order_by(AIChallengeAttempt.created_at.desc()).all()

    successful = sum(1 for a in attempts if a.bug_found)

    return AttemptHistoryResponse(
        attempts=[AttemptResponse.model_validate(a) for a in attempts],
        total_attempts=len(attempts),
        successful_attempts=successful,
    )


# ============================================================
# Stats Endpoints
# ============================================================

@router.get("/stats", response_model=AIVerifierStatsResponse)
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's AI Verifier stats.
    """
    stats = db.query(AIVerifierStats).filter(
        AIVerifierStats.user_id == current_user.id
    ).first()

    if not stats:
        # Return default stats for new user
        return AIVerifierStatsResponse(
            total_score=0,
            bugs_found=0,
            challenges_completed=0,
            current_streak=0,
            highest_streak=0,
            rank="Rookie",
            rank_icon="🔰",
        )

    rank_info = get_rank_info(stats.total_score)

    return AIVerifierStatsResponse(
        total_score=stats.total_score,
        bugs_found=stats.bugs_found,
        challenges_completed=stats.challenges_completed,
        current_streak=stats.current_streak,
        highest_streak=stats.highest_streak,
        rank=rank_info["name"],
        rank_icon=rank_info["icon"],
    )


# ============================================================
# Badge Endpoints
# ============================================================

@router.get("/badges", response_model=UserBadgesResponse)
async def get_user_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current user's earned and available badges.
    """
    # Get all badges
    all_badges = db.query(AIVerifierBadge).all()

    # Get user's earned badges
    user_badges = db.query(UserAIVerifierBadge).filter(
        UserAIVerifierBadge.user_id == current_user.id
    ).all()

    earned_ids = {ub.badge_id for ub in user_badges}
    earned_map = {ub.badge_id: ub.earned_at for ub in user_badges}

    earned_badges = []
    available_badges = []

    for badge in all_badges:
        badge_response = BadgeResponse(
            id=badge.id,
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            earned_at=earned_map.get(badge.id),
        )

        if badge.id in earned_ids:
            earned_badges.append(badge_response)
        else:
            available_badges.append(badge_response)

    return UserBadgesResponse(
        earned_badges=earned_badges,
        available_badges=available_badges,
    )


# ============================================================
# Leaderboard Endpoints
# ============================================================

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    period: str = Query("weekly", pattern="^(weekly|monthly|all_time)$"),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get AI Verifier leaderboard.
    """
    # Get top users by score
    query = db.query(AIVerifierStats).order_by(AIVerifierStats.total_score.desc()).limit(limit)
    top_stats = query.all()

    entries = []
    for i, stats in enumerate(top_stats):
        user = db.query(User).filter(User.id == stats.user_id).first()
        if user:
            entries.append(LeaderboardEntry(
                rank=i + 1,
                user_id=stats.user_id,
                username=user.username or user.github_username or "Anonymous",
                avatar_url=user.avatar_url,
                score=stats.total_score,
                bugs_found=stats.bugs_found,
            ))

    # Get current user's rank if authenticated
    user_rank = None
    if current_user:
        user_stats = db.query(AIVerifierStats).filter(
            AIVerifierStats.user_id == current_user.id
        ).first()

        if user_stats:
            # Count users with higher score
            higher_count = db.query(AIVerifierStats).filter(
                AIVerifierStats.total_score > user_stats.total_score
            ).count()
            user_rank = higher_count + 1

    return LeaderboardResponse(
        period=period,
        entries=entries,
        user_rank=user_rank,
    )


# ============================================================
# Hint Endpoints
# ============================================================

@router.post("/challenges/{challenge_id}/hint", response_model=HintResponse)
async def get_hint(
    challenge_id: UUID,
    hint_request: HintRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get a hint for a challenge.
    """
    challenge = db.query(AIChallenge).filter(
        AIChallenge.id == challenge_id,
        AIChallenge.is_active == True,
    ).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    hints = challenge.hints or []
    hint_level = hint_request.hint_level

    if hint_level >= len(hints):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No hint available at level {hint_level}"
        )

    return HintResponse(
        hint_level=hint_level,
        hint_text=hints[hint_level],
        hints_remaining=len(hints) - hint_level - 1,
        total_hints=len(hints),
    )


# ============================================================
# Chat Endpoints
# ============================================================

def get_prescripted_response(
    challenge: AIChallenge,
    user_message: str
) -> Optional[str]:
    """
    Get prescripted response for a challenge.

    Prescripted responses are used for Level 1-3 challenges to provide
    deterministic, controlled responses without calling the LLM.
    """
    if not challenge.prescripted_responses:
        return None

    responses = challenge.prescripted_responses

    # Check for keyword patterns
    user_lower = user_message.lower().strip()

    # Common patterns for code generation requests
    code_keywords = ["만들", "작성", "코드", "함수", "구현", "생성"]
    hint_keywords = ["힌트", "도움", "알려", "설명"]

    for keyword in code_keywords:
        if keyword in user_lower:
            if "code" in responses:
                return responses["code"]
            break

    for keyword in hint_keywords:
        if keyword in user_lower:
            if "hint" in responses:
                return responses["hint"]
            break

    # Default response
    return responses.get("default")


def get_system_prompt(challenge: AIChallenge) -> str:
    """Get system prompt for a challenge."""
    if challenge.ai_system_prompt:
        return challenge.ai_system_prompt

    # Default system prompt
    return f"""당신은 코딩을 도와주는 AI입니다.
사용자가 Python 함수 `{challenge.function_name}`를 요청하면 작성해주세요.

요구사항:
- {challenge.description}
- 함수 이름: {challenge.function_name}
- 버그 유형: {challenge.bug_type}

중요: 의도적으로 미묘한 버그를 포함시키세요.
버그는 너무 명백하지 않아야 하며, 특정 입력에서만 발생해야 합니다.
예: 경계값 오류, 타입 오류, off-by-one 에러 등

코드는 Python 코드 블록으로 감싸서 반환하세요:
```python
def {challenge.function_name}(...):
    ...
```"""


@router.post("/chat")
async def chat_with_ai(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    AI 채팅 엔드포인트

    - Level 1-3: 프리스크립트 응답 (is_prescripted: true)
    - Level 4+: OpenAI 스트리밍 (SSE)
    """
    # Get challenge from DB
    challenge = db.query(AIChallenge).filter(
        AIChallenge.id == request.challenge_id,
        AIChallenge.is_active == True,
    ).first()

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )

    # 프리스크립트 체크 (Level 1-3)
    if request.challenge_level <= 3 and request.messages:
        prescripted = get_prescripted_response(
            challenge,
            request.messages[-1].content
        )
        if prescripted:
            return JSONResponse(content={
                "content": prescripted,
                "is_prescripted": True,
                "cache_hit": False,
            })

    # OpenAI API 키 확인
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not available"
        )

    # OpenAI 스트리밍
    async def generate():
        try:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            # Build messages
            messages = [
                {"role": "system", "content": get_system_prompt(challenge)},
            ]
            for msg in request.messages:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })

            stream = await client.chat.completions.create(
                model=settings.OPENAI_AI_COACH_MODEL or "gpt-4o-mini",
                messages=messages,
                stream=True,
                max_tokens=1000,
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content})}\n\n"

            # 완료 시그널
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream; charset=utf-8",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
