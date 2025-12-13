"""AI Conversation and Message models."""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.models.db import Base


class AIConversation(Base):
    """AI Conversation model for storing AI coach conversations."""

    __tablename__ = "ai_conversations"
    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR anonymous_id IS NOT NULL",
            name='chk_ai_conv_owner'
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    anonymous_id = Column(String(36), nullable=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    mode = Column(String(10), nullable=False, default="COACH")  # OFF, COACH
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    problem = relationship("Problem")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")

    def __repr__(self):
        return (
            f"<AIConversation(id={self.id}, user_id={self.user_id}, "
            f"problem_id={self.problem_id}, mode={self.mode})>"
        )


class AIMessage(Base):
    """AI Message model for storing conversation messages."""

    __tablename__ = "ai_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant')",
            name='chk_ai_msg_role'
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(10), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    token_estimate = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")

    def __repr__(self):
        return (
            f"<AIMessage(id={self.id}, conversation_id={self.conversation_id}, "
            f"role={self.role}, content={self.content[:50]}...)>"
        )
