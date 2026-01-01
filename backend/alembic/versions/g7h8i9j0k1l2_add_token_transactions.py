"""Add token_transactions table

Revision ID: g7h8i9j0k1l2
Revises: f6g7h8i9j0k1
Create Date: 2026-01-02 13:00:00.000000

PR2: TokenTransaction 원장 레이어
- token_transactions 테이블 생성
- APPEND ONLY 원장 설계
- 동시성 제어용 인덱스
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'g7h8i9j0k1l2'
down_revision = 'f6g7h8i9j0k1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # token_transactions 테이블 생성
    op.create_table(
        'token_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('balance_before', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('submission_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('idempotency_key', sa.String(100), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key'),
    )

    # 인덱스 생성
    # 사용자별 거래 내역 조회 최적화
    op.create_index(
        'ix_token_transactions_user_id',
        'token_transactions',
        ['user_id'],
        unique=False
    )

    # 사용자별 최근 거래 조회 최적화
    op.create_index(
        'ix_token_transactions_user_created',
        'token_transactions',
        ['user_id', 'created_at'],
        unique=False
    )

    # 멱등성 키 조회
    op.create_index(
        'ix_token_transactions_idempotency',
        'token_transactions',
        ['idempotency_key'],
        unique=False
    )

    # 액션별 통계
    op.create_index(
        'ix_token_transactions_action_type',
        'token_transactions',
        ['action_type'],
        unique=False
    )


def downgrade() -> None:
    # 인덱스 삭제
    op.drop_index('ix_token_transactions_action_type', table_name='token_transactions')
    op.drop_index('ix_token_transactions_idempotency', table_name='token_transactions')
    op.drop_index('ix_token_transactions_user_created', table_name='token_transactions')
    op.drop_index('ix_token_transactions_user_id', table_name='token_transactions')

    # 테이블 삭제
    op.drop_table('token_transactions')
