"""Add guest submission support

Revision ID: 7a5b3c8d9e0f
Revises: 66a01fac575d
Create Date: 2024-12-13

Changes:
- Make user_id nullable in submissions table
- Add anonymous_id column for guest users
- Add CHECK constraint: user_id OR anonymous_id must be present
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7a5b3c8d9e0f'
down_revision = '66a01fac575d'
branch_labels = None
depends_on = None


def upgrade():
    # 1. user_id를 nullable로 변경
    op.alter_column('submissions', 'user_id',
        existing_type=sa.UUID(),
        nullable=True
    )

    # 2. anonymous_id 컬럼 추가
    op.add_column('submissions',
        sa.Column('anonymous_id', sa.String(36), nullable=True)
    )

    # 3. anonymous_id 인덱스 추가
    op.create_index('ix_submissions_anonymous_id', 'submissions', ['anonymous_id'])

    # 4. CHECK 제약 추가: user_id 또는 anonymous_id 중 하나는 반드시 있어야 함
    op.create_check_constraint(
        'submissions_user_or_anonymous_check',
        'submissions',
        'user_id IS NOT NULL OR anonymous_id IS NOT NULL'
    )


def downgrade():
    # 역순으로 롤백

    # 1. CHECK 제약 제거
    op.drop_constraint('submissions_user_or_anonymous_check', 'submissions', type_='check')

    # 2. 인덱스 제거
    op.drop_index('ix_submissions_anonymous_id', 'submissions')

    # 3. anonymous_id 컬럼 제거
    op.drop_column('submissions', 'anonymous_id')

    # 4. user_id를 NOT NULL로 복원 (주의: 기존 NULL 데이터가 있으면 실패)
    op.alter_column('submissions', 'user_id',
        existing_type=sa.UUID(),
        nullable=False
    )
