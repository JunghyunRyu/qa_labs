"""AI Conversation and Message repository."""

from typing import Optional, Tuple, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ai_conversation import AIConversation, AIMessage


class AIRepository:
    """Repository for AI Conversation and Message models."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    # ===== Conversation methods =====

    def create_conversation(self, conversation: AIConversation) -> AIConversation:
        """
        Create a new conversation.

        Args:
            conversation: AIConversation instance to create

        Returns:
            Created conversation
        """
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation_by_id(self, conversation_id: UUID) -> Optional[AIConversation]:
        """
        Get conversation by ID.

        Args:
            conversation_id: Conversation ID

        Returns:
            Conversation if found, None otherwise
        """
        return self.db.query(AIConversation).filter(
            AIConversation.id == conversation_id
        ).first()

    def get_user_conversations(
        self,
        user_id: UUID,
        problem_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[AIConversation], int]:
        """
        Get conversations for a user with pagination.

        Args:
            user_id: User ID
            problem_id: Optional filter by problem ID
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (conversations list, total count)
        """
        query = self.db.query(AIConversation).filter(
            AIConversation.user_id == user_id
        )

        if problem_id is not None:
            query = query.filter(AIConversation.problem_id == problem_id)

        total = query.count()

        conversations = query.order_by(
            AIConversation.updated_at.desc()
        ).offset((page - 1) * page_size).limit(page_size).all()

        return conversations, total

    def get_active_conversation(
        self,
        user_id: Optional[UUID] = None,
        anonymous_id: Optional[str] = None,
        problem_id: int = None,
    ) -> Optional[AIConversation]:
        """
        Get the most recent active conversation for a user/guest on a problem.

        Args:
            user_id: User ID (for members)
            anonymous_id: Anonymous ID (for guests)
            problem_id: Problem ID

        Returns:
            Most recent conversation if found, None otherwise
        """
        query = self.db.query(AIConversation).filter(
            AIConversation.problem_id == problem_id
        )

        if user_id:
            query = query.filter(AIConversation.user_id == user_id)
        elif anonymous_id:
            query = query.filter(AIConversation.anonymous_id == anonymous_id)
        else:
            return None

        return query.order_by(AIConversation.updated_at.desc()).first()

    def update_conversation(self, conversation: AIConversation) -> AIConversation:
        """
        Update an existing conversation.

        Args:
            conversation: AIConversation instance to update

        Returns:
            Updated conversation
        """
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    # ===== Message methods =====

    def add_message(self, message: AIMessage) -> AIMessage:
        """
        Add a message to conversation.

        Args:
            message: AIMessage instance to add

        Returns:
            Created message
        """
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)

        # Update conversation's updated_at
        conversation = self.get_conversation_by_id(message.conversation_id)
        if conversation:
            conversation.updated_at = func.now()
            self.db.commit()
            self.db.refresh(conversation)

        return message

    def get_conversation_messages(
        self,
        conversation_id: UUID,
        limit: Optional[int] = None,
    ) -> List[AIMessage]:
        """
        Get messages for a conversation.

        Args:
            conversation_id: Conversation ID
            limit: Optional limit to get only recent N messages

        Returns:
            List of messages in chronological order
        """
        query = self.db.query(AIMessage).filter(
            AIMessage.conversation_id == conversation_id
        )

        if limit:
            # Get the last N messages (most recent first, then reverse)
            messages = query.order_by(
                AIMessage.created_at.desc()
            ).limit(limit).all()
            messages.reverse()  # Restore chronological order
            return messages

        return query.order_by(AIMessage.created_at.asc()).all()

    def get_message_count(self, conversation_id: UUID) -> int:
        """
        Get message count for a conversation.

        Args:
            conversation_id: Conversation ID

        Returns:
            Number of messages
        """
        return self.db.query(func.count(AIMessage.id)).filter(
            AIMessage.conversation_id == conversation_id
        ).scalar() or 0
