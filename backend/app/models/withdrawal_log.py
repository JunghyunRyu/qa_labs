"""Withdrawal log model for abuse prevention."""

import uuid
from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.db import Base


class WithdrawalLog(Base):
    """
    회원 탈퇴 기록 (부정 이용 방지용).

    개인정보보호법 준수를 위해 원본 데이터 대신 해시값만 저장합니다.
    - 저장 기간: 탈퇴일로부터 1년
    - 용도: 재가입 시 토큰 어뷰징 방지
    """

    __tablename__ = "withdrawal_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 식별자 해시 (SHA-256, 64자)
    github_id_hash = Column(String(64), nullable=True, index=True)
    google_id_hash = Column(String(64), nullable=True, index=True)
    email_hash = Column(String(64), nullable=False, index=True)

    # 탈퇴 정보
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expire_at = Column(DateTime(timezone=True), nullable=False)  # 삭제일 + 1년

    # 탈퇴 사유 (선택)
    reason = Column(String(50), nullable=True)  # USER_REQUEST, POLICY_VIOLATION, etc.

    # 복합 인덱스 (만료 데이터 정리용)
    __table_args__ = (
        Index("idx_withdrawal_expire_at", "expire_at"),
    )

    def __repr__(self):
        return f"<WithdrawalLog(id={self.id}, email_hash={self.email_hash[:8]}..., expire_at={self.expire_at})>"
