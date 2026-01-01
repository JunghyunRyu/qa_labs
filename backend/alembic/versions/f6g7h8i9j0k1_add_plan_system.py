"""Add plan system to users

Revision ID: f6g7h8i9j0k1
Revises: e5f6g7h8i9j0
Create Date: 2026-01-02 12:00:00.000000

PR1: Plan/Entitlement 레이어
- plan_key: free/lite/pro 플랜 식별자
- plan_started_at: 플랜 시작일
- plan_expires_at: 플랜 만료일 (NULL = 영구)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6g7h8i9j0k1'
down_revision = 'e5f6g7h8i9j0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # plan_key 컬럼 추가
    op.add_column('users', sa.Column('plan_key', sa.String(20), nullable=True))

    # plan_started_at 컬럼 추가
    op.add_column('users', sa.Column('plan_started_at', sa.DateTime(timezone=True), nullable=True))

    # plan_expires_at 컬럼 추가
    op.add_column('users', sa.Column('plan_expires_at', sa.DateTime(timezone=True), nullable=True))

    # 기존 tier 값을 plan_key로 복사
    op.execute("UPDATE users SET plan_key = tier WHERE tier IS NOT NULL")
    op.execute("UPDATE users SET plan_key = 'free' WHERE plan_key IS NULL")

    # plan_key를 NOT NULL로 변경 (기본값 설정)
    op.alter_column('users', 'plan_key',
                    existing_type=sa.String(20),
                    nullable=False,
                    server_default='free')


def downgrade() -> None:
    op.drop_column('users', 'plan_expires_at')
    op.drop_column('users', 'plan_started_at')
    op.drop_column('users', 'plan_key')
