"""AI Coach API endpoints."""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Send a message to AI Coach.

    Supports both guests and authenticated users.
    - Guests: can chat but conversation history is not retrievable later
    - Members: full conversation history available

    Rate limits:
    - Guest: 5/minute, 30/day
    - Member: 10/minute, 200/day

    Args:
        chat_request: Chat request data
        db: Database session
        current_user: Authenticated user (optional)

    Returns:
        AI response with conversation and message IDs

    Raises:
        400: If mode is OFF or anonymous_id missing for guests
        404: If conversation or problem not found
        429: If rate limit exceeded
    """
    # Check if mode is OFF
    if chat_request.mode == AIChatMode.OFF:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI mode is OFF"
        )

    # Identify user/guest
    if current_user:
        user_id = current_user.id
        anonymous_id = None
    else:
        anonymous_id = request.cookies.get("qa_anonymous_id")
        if not anonymous_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anonymous ID cookie required for guest"
            )
        user_id = None

    # Rate limit check
    try:
        check_ai_rate_limit(request, current_user, anonymous_id)
    except AIRateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {e.limit_str}",
            headers={"Retry-After": str(e.retry_after)},
        )

    ai_repo = AIRepository(db)
    problem_repo = ProblemRepository(db)

    # Verify problem exists
    problem = problem_repo.get_by_id(chat_request.problem_id)
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with id {chat_request.problem_id} not found"
        )

    # Get or create conversation
    conversation = None
    if chat_request.conversation_id:
        conversation = ai_repo.get_conversation_by_id(chat_request.conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        # Verify ownership
        if user_id and conversation.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this conversation"
            )
        if anonymous_id and conversation.anonymous_id != anonymous_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this conversation"
            )
    else:
        # Create new conversation
        conversation = AIConversation(
            user_id=user_id,
            anonymous_id=anonymous_id,
            problem_id=chat_request.problem_id,
            mode=chat_request.mode.value,
        )
        conversation = ai_repo.create_conversation(conversation)
        logger.info(
            f"[AI_CHAT_NEW_CONVERSATION] conversation_id={conversation.id} "
            f"problem_id={chat_request.problem_id} "
            f"user_id={user_id} anonymous_id={anonymous_id}"
        )

    # Get conversation history for context
    conversation_messages = ai_repo.get_conversation_messages(
        conversation.id,
        limit=ai_coach_service.MAX_CONTEXT_MESSAGES
    )

    # Save user message
    user_message = AIMessage(
        conversation_id=conversation.id,
        role="user",
        content=chat_request.message,
        token_estimate=ai_coach_service.estimate_tokens(chat_request.message),
    )
    user_message = ai_repo.add_message(user_message)

    # Generate AI response
    ai_response_text, token_estimate = ai_coach_service.generate_response(
        user_message=chat_request.message,
        conversation_messages=conversation_messages,
        problem=problem,
        code_context=chat_request.code_context,
    )

    # Save AI response
    ai_message = AIMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response_text,
        token_estimate=token_estimate,
    )
    ai_message = ai_repo.add_message(ai_message)

    logger.info(
        f"[AI_CHAT] conversation_id={conversation.id} "
        f"problem_id={chat_request.problem_id} "
        f"user_tokens={user_message.token_estimate} "
        f"ai_tokens={token_estimate} "
        f"user_id={user_id} anonymous_id={anonymous_id}"
    )

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
    """
    List user's AI conversations.

    Members only - requires authentication.

    Args:
        problem_id: Optional filter by problem ID
        page: Page number (1-indexed)
        page_size: Number of items per page
        db: Database session
        current_user: Authenticated user

    Returns:
        Paginated list of conversations
    """
    ai_repo = AIRepository(db)

    conversations, total = ai_repo.get_user_conversations(
        user_id=current_user.id,
        problem_id=problem_id,
        page=page,
        page_size=page_size,
    )

    items = []
    for conv in conversations:
        message_count = ai_repo.get_message_count(conv.id)
        items.append(AIConversationListItem(
            id=conv.id,
            problem_id=conv.problem_id,
            problem_title=conv.problem.title if conv.problem else None,
            mode=conv.mode,
            message_count=message_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        ))

    total_pages = (total + page_size - 1) // page_size

    return AIConversationListResponse(
        conversations=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get conversation details with all messages.

    Members only - requires authentication.

    Args:
        conversation_id: Conversation ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Conversation with messages

    Raises:
        403: If not authorized to access conversation
        404: If conversation not found
    """
    ai_repo = AIRepository(db)
    conversation = ai_repo.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )

    messages = ai_repo.get_conversation_messages(conversation_id)

    return AIConversationResponse(
        id=conversation.id,
        problem_id=conversation.problem_id,
        mode=conversation.mode,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            AIMessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
            )
            for msg in messages
        ],
    )
