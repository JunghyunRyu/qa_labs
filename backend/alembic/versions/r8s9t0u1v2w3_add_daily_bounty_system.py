"""Add daily bounty system

Revision ID: r8s9t0u1v2w3
Revises: q7r8s9t0u1v2
Create Date: 2026-01-16

Daily Bounty 시스템:
- daily_bounties 테이블: 날짜별 선정 문제
- daily_bounty_completions 테이블: 사용자별 완료 기록
- User 모델에 streak 필드 추가
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "r8s9t0u1v2w3"
down_revision: Union[str, None] = "q7r8s9t0u1v2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. daily_bounties 테이블 생성
    op.create_table(
        'daily_bounties',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['problem_id'], ['problems.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_daily_bounties_date', 'daily_bounties', ['date'], unique=True)
    op.create_index('ix_daily_bounties_problem_id', 'daily_bounties', ['problem_id'], unique=False)

    # 2. daily_bounty_completions 테이블 생성
    op.create_table(
        'daily_bounty_completions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=True),
        sa.Column('submission_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('base_reward_granted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('streak_bonus_granted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('streak_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['problem_id'], ['problems.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_daily_bounty_completions_user_id', 'daily_bounty_completions', ['user_id'], unique=False)
    op.create_index('ix_daily_bounty_completions_date', 'daily_bounty_completions', ['date'], unique=False)
    op.create_index('ix_dbc_user_date', 'daily_bounty_completions', ['user_id', 'date'], unique=True)

    # 3. User 모델에 streak 필드 추가
    op.add_column('users', sa.Column('bounty_streak', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('bounty_streak_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_bounty_completed_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # User 필드 제거
    op.drop_column('users', 'last_bounty_completed_at')
    op.drop_column('users', 'bounty_streak_updated_at')
    op.drop_column('users', 'bounty_streak')

    # 테이블 삭제
    op.drop_index('ix_dbc_user_date', table_name='daily_bounty_completions')
    op.drop_index('ix_daily_bounty_completions_date', table_name='daily_bounty_completions')
    op.drop_index('ix_daily_bounty_completions_user_id', table_name='daily_bounty_completions')
    op.drop_table('daily_bounty_completions')

    op.drop_index('ix_daily_bounties_problem_id', table_name='daily_bounties')
    op.drop_index('ix_daily_bounties_date', table_name='daily_bounties')
    op.drop_table('daily_bounties')
