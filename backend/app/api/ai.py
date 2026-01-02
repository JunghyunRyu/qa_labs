"""AI Coach API endpoints."""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    require_ai_access,
    AIAccessResult,
)
# PR3: New quota-based dependencies (from decorators to avoid circular import)
from app.core.decorators import (
    require_quota,
    QuotaContext,
    require_ai_coach_quota,
)
from app.core.plan_config import ActionType
from app.core.rate_limiter import check_ai_rate_limit, AIRateLimitExceeded
from app.models.db import get_db
from app.models.user import User
from app.models.ai_conversation import AIConversation, AIMessage
from app.repositories.ai_repository import AIRepository
from app.repositories.problem_repository import ProblemRepository
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIChatMode,
    AIMessageResponse,
    AIConversationResponse,
    AIConversationListItem,
    AIConversationListResponse,
)
from app.services import ai_coach_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_201_CREATED)
async def chat(
    request: Request,
    chat_request: AIChatRequest,
    db: Session = Depends(get_db),
    ai_access: AIAccessResult = Depends(require_ai_access),
):
    """
    Send a message to AI Coach. Requires auth + AI tokens.

    Note: 이 엔드포인트는 require_ai_access를 사용합니다.
    새 엔드포인트에서는 require_quota(ActionType.AI_COACH)를 사용하세요:

    ```python
    @router.post("/chat/v2")
    async def chat_v2(
        chat_request: AIChatRequest,
        quota_ctx: QuotaContext = Depends(require_quota(ActionType.AI_COACH)),
    ):
        # ... AI 처리 ...
        quota_ctx.consume()  # 성공 시 토큰 차감
        return result
    ```
    """
    if chat_request.mode == AIChatMode.OFF:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI mode is OFF")

    user_id = ai_access.user.id

    try:
        check_ai_rate_limit(request, ai_access.user, None)
    except AIRateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {e.limit_str}",
            headers={"Retry-After": str(e.retry_after)},
        )

    ai_repo = AIRepository(db)
    problem_repo = ProblemRepository(db)

    problem = problem_repo.get_by_id(chat_request.problem_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Problem with id {chat_request.problem_id} not found")

    conversation = None
    if chat_request.conversation_id:
        conversation = ai_repo.get_conversation_by_id(chat_request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        if conversation.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this conversation")
    else:
        conversation = AIConversation(user_id=user_id, problem_id=chat_request.problem_id, mode=chat_request.mode.value)
        conversation = ai_repo.create_conversation(conversation)
        logger.info(f"[AI_CHAT_NEW_CONVERSATION] conversation_id={conversation.id} problem_id={chat_request.problem_id} user_id={user_id}")

    conversation_messages = ai_repo.get_conversation_messages(conversation.id, limit=ai_coach_service.MAX_CONTEXT_MESSAGES)

    user_message = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content=chat_request.message,
        token_estimate=ai_coach_service.estimate_tokens(chat_request.message),
    )
    user_message = ai_repo.add_message(user_message)

    ai_response_text, token_estimate = ai_coach_service.generate_response(
        user_message=chat_request.message,
        conversation_messages=conversation_messages,
        problem=problem,
        code_context=chat_request.code_context,
    )

    ai_message = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response_text,
        token_estimate=token_estimate,
    )
    ai_message = ai_repo.add_message(ai_message)

    # Deduct AI token after successful operation
    ai_access.deduct(cost=1)

    logger.info(f"[AI_CHAT] conversation_id={conversation.id} problem_id={chat_request.problem_id} user_tokens={user_message.token_estimate} ai_tokens={token_estimate} user_id={user_id}")

    return AIChatResponse(
        reply=ai_response_text,
        conversation_id=conversation.id,
        message_id=ai_message.id,
        token_estimate=token_estimate,
    )


@router.get("/conversations", response_model=AIConversationListResponse)
async def list_conversations(
    problem_id: Optional[int] = Query(None, description="Filter by problem ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user AI conversations. No token cost."""
    ai_repo = AIRepository(db)
    conversations, total = ai_repo.get_user_conversations(user_id=current_user.id, problem_id=problem_id, page=page, page_size=page_size)

    items = []
    for conv in conversations:
        message_count = ai_repo.get_message_count(conv.id)
        preview = ai_repo.get_first_user_message_preview(conv.id, max_length=50)
        items.append(AIConversationListItem(
            id=conv.id, problem_id=conv.problem_id,
            problem_title=conv.problem.title if conv.problem else None,
            mode=conv.mode, message_count=message_count, preview=preview,
            created_at=conv.created_at, updated_at=conv.updated_at,
        ))

    total_pages = (total + page_size - 1) // page_size
    return AIConversationListResponse(conversations=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation details. No token cost."""
    ai_repo = AIRepository(db)
    conversation = ai_repo.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this conversation")

    messages = ai_repo.get_conversation_messages(conversation_id)

    return AIConversationResponse(
        id=conversation.id,
        problem_id=conversation.problem_id,
        mode=conversation.mode,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[AIMessageResponse(id=msg.id, role=msg.role, content=msg.content, created_at=msg.created_at) for msg in messages],
    )
