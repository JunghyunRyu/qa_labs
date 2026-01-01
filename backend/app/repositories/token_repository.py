"""
Token Repository (PR2: 원장 레이어)

토큰 거래 및 잔액 관리를 위한 Repository.
동시성 제어를 위해 비관적 잠금(Pessimistic Locking)을 사용합니다.
"""

import logging
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from app.models.user import User
from app.models.token_transaction import (
    TokenTransaction,
    ActionType,
    SourceType,
)

logger = logging.getLogger(__name__)


class TokenRepository:
    """
    토큰 거래 Repository

    동시성 제어:
    - 잔액 변경 시 SELECT ... FOR UPDATE 사용
    - 트랜잭션 내에서 원자적 처리 보장

    차감 우선순위:
    1. Daily Bonus (소멸성)
    2. Monthly (기간제)
    3. Top-up (영구)
    """

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    # ===== 잔액 조회 =====

    def get_user_with_lock(self, user_id: UUID) -> Optional[User]:
        """
        사용자 조회 (비관적 잠금)

        SELECT ... FOR UPDATE로 행 잠금을 획득합니다.
        동시 트랜잭션은 이 잠금이 해제될 때까지 대기합니다.

        Args:
            user_id: 사용자 ID

        Returns:
            잠금이 걸린 User 객체 (없으면 None)
        """
        return self.db.query(User).filter(
            User.id == user_id
        ).with_for_update().first()

    def get_balance(self, user: User) -> int:
        """
        현재 토큰 잔액 조회

        Args:
            user: User 객체

        Returns:
            현재 토큰 잔액
        """
        return user.token_balance - user.token_used

    # ===== 거래 생성 =====

    def create_transaction(
        self,
        user: User,
        action_type: ActionType,
        source_type: SourceType,
        amount: int,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Optional[TokenTransaction]:
        """
        토큰 거래 생성 (원자적)

        멱등성 키가 제공되고 이미 존재하면 None을 반환합니다.
        잔액이 부족한 차감 요청은 None을 반환합니다.

        Args:
            user: User 객체 (잠금 상태여야 함)
            action_type: 액션 타입
            source_type: 출처 타입
            amount: 금액 (양수: 지급, 음수: 차감)
            submission_id: 연관 제출 ID (선택)
            idempotency_key: 멱등성 키 (선택)
            description: 거래 설명 (선택)

        Returns:
            생성된 TokenTransaction (실패 시 None)
        """
        # 멱등성 체크
        if idempotency_key:
            existing = self.find_by_idempotency_key(idempotency_key)
            if existing:
                logger.info(f"Idempotent transaction found: {idempotency_key}")
                return None

        balance_before = self.get_balance(user)

        # 차감 시 잔액 체크
        if amount < 0 and balance_before + amount < 0:
            logger.warning(
                f"Insufficient balance: user={user.id}, "
                f"balance={balance_before}, requested={amount}"
            )
            return None

        balance_after = balance_before + amount

        # 거래 레코드 생성
        transaction = TokenTransaction(
            user_id=user.id,
            action_type=action_type.value if isinstance(action_type, ActionType) else action_type,
            source_type=source_type.value if isinstance(source_type, SourceType) else source_type,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            submission_id=submission_id,
            idempotency_key=idempotency_key,
            description=description,
        )

        # User 잔액 업데이트
        if amount < 0:
            # 차감: token_used 증가
            user.token_used = user.token_used - amount  # amount가 음수이므로 빼면 증가
        else:
            # 지급: token_balance 증가
            user.token_balance = user.token_balance + amount

        self.db.add(transaction)
        # commit은 호출자가 처리

        logger.info(
            f"Transaction created: user={user.id}, action={action_type}, "
            f"amount={amount}, balance={balance_before}→{balance_after}"
        )

        return transaction

    def deduct_tokens(
        self,
        user: User,
        action_type: ActionType,
        cost: int,
        submission_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Optional[TokenTransaction]:
        """
        토큰 차감 (차감 우선순위 적용)

        우선순위:
        1. Daily Bonus (소멸성)
        2. Monthly (기간제)

        Args:
            user: User 객체 (잠금 상태여야 함)
            action_type: 액션 타입
            cost: 차감할 토큰 수 (양수)
            submission_id: 연관 제출 ID (선택)
            idempotency_key: 멱등성 키 (선택)

        Returns:
            생성된 TokenTransaction (실패 시 None)
        """
        if cost <= 0:
            logger.warning(f"Invalid cost: {cost}")
            return None

        # Daily Bonus 먼저 사용
        source_type = SourceType.MONTHLY
        if user.daily_bonus_used < 3:  # 무료 보너스 남음
            # 이 경우는 TokenService에서 처리
            source_type = SourceType.DAILY_BONUS

        return self.create_transaction(
            user=user,
            action_type=action_type,
            source_type=source_type,
            amount=-cost,
            submission_id=submission_id,
            idempotency_key=idempotency_key,
            description=f"Token deduction for {action_type.value if isinstance(action_type, ActionType) else action_type}",
        )

    def grant_tokens(
        self,
        user: User,
        action_type: ActionType,
        source_type: SourceType,
        amount: int,
        description: Optional[str] = None,
    ) -> TokenTransaction:
        """
        토큰 지급

        Args:
            user: User 객체 (잠금 상태여야 함)
            action_type: 액션 타입
            source_type: 출처 타입
            amount: 지급할 토큰 수 (양수)
            description: 지급 사유

        Returns:
            생성된 TokenTransaction

        Raises:
            ValueError: amount가 0 이하인 경우
        """
        if amount <= 0:
            raise ValueError(f"Grant amount must be positive: {amount}")

        return self.create_transaction(
            user=user,
            action_type=action_type,
            source_type=source_type,
            amount=amount,
            description=description,
        )

    # ===== 거래 조회 =====

    def find_by_idempotency_key(self, key: str) -> Optional[TokenTransaction]:
        """
        멱등성 키로 거래 조회

        Args:
            key: 멱등성 키

        Returns:
            거래 (없으면 None)
        """
        return self.db.query(TokenTransaction).filter(
            TokenTransaction.idempotency_key == key
        ).first()

    def get_user_transactions(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        action_type: Optional[ActionType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[TokenTransaction], int]:
        """
        사용자 거래 내역 조회

        Args:
            user_id: 사용자 ID
            limit: 조회 개수
            offset: 시작 위치
            action_type: 액션 타입 필터 (선택)
            start_date: 시작일 (선택)
            end_date: 종료일 (선택)

        Returns:
            (거래 목록, 전체 개수)
        """
        query = self.db.query(TokenTransaction).filter(
            TokenTransaction.user_id == user_id
        )

        if action_type:
            query = query.filter(
                TokenTransaction.action_type == (
                    action_type.value if isinstance(action_type, ActionType) else action_type
                )
            )

        if start_date:
            query = query.filter(TokenTransaction.created_at >= start_date)

        if end_date:
            query = query.filter(TokenTransaction.created_at <= end_date)

        total = query.count()

        transactions = query.order_by(
            desc(TokenTransaction.created_at)
        ).offset(offset).limit(limit).all()

        return transactions, total

    def get_period_usage(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """
        기간별 사용량 통계

        Args:
            user_id: 사용자 ID
            start_date: 시작일
            end_date: 종료일 (기본: 현재)

        Returns:
            {
                'total_deducted': int,  # 총 차감
                'total_granted': int,   # 총 지급
                'by_action': {...},     # 액션별 사용량
            }
        """
        if end_date is None:
            end_date = datetime.utcnow()

        # 차감 총합
        deducted = self.db.query(func.sum(TokenTransaction.amount)).filter(
            and_(
                TokenTransaction.user_id == user_id,
                TokenTransaction.amount < 0,
                TokenTransaction.created_at >= start_date,
                TokenTransaction.created_at <= end_date,
            )
        ).scalar() or 0

        # 지급 총합
        granted = self.db.query(func.sum(TokenTransaction.amount)).filter(
            and_(
                TokenTransaction.user_id == user_id,
                TokenTransaction.amount > 0,
                TokenTransaction.created_at >= start_date,
                TokenTransaction.created_at <= end_date,
            )
        ).scalar() or 0

        # 액션별 사용량
        action_usage = self.db.query(
            TokenTransaction.action_type,
            func.sum(TokenTransaction.amount).label('total'),
            func.count().label('count')
        ).filter(
            and_(
                TokenTransaction.user_id == user_id,
                TokenTransaction.amount < 0,
                TokenTransaction.created_at >= start_date,
                TokenTransaction.created_at <= end_date,
            )
        ).group_by(TokenTransaction.action_type).all()

        by_action = {
            row.action_type: {'total': abs(row.total), 'count': row.count}
            for row in action_usage
        }

        return {
            'total_deducted': abs(deducted),
            'total_granted': granted,
            'by_action': by_action,
        }

    def get_daily_usage(self, user_id: UUID, date: datetime) -> int:
        """
        특정 일자의 토큰 사용량

        Args:
            user_id: 사용자 ID
            date: 조회 일자

        Returns:
            해당 일자 총 사용량 (양수)
        """
        start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)

        total = self.db.query(func.sum(TokenTransaction.amount)).filter(
            and_(
                TokenTransaction.user_id == user_id,
                TokenTransaction.amount < 0,
                TokenTransaction.created_at >= start,
                TokenTransaction.created_at < end,
            )
        ).scalar() or 0

        return abs(total)
