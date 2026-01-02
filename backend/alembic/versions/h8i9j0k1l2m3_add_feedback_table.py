"""add feedback table

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2025-01-02

PR4: 심화/성공 분석 및 재생성을 위한 피드백 테이블 추가
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'h8i9j0k1l2m3'
down_revision = 'g7h8i9j0k1l2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # feedbacks 테이블 생성
    op.create_table(
        'feedbacks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('submission_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('feedback_type', sa.String(20), nullable=False, server_default='base'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('schema_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('token_cost', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 인덱스 생성
    op.create_index('ix_feedbacks_submission_id', 'feedbacks', ['submission_id'])
    op.create_index('ix_feedbacks_user_id', 'feedbacks', ['user_id'])
    op.create_index('ix_feedbacks_status', 'feedbacks', ['status'])
    op.create_index('ix_feedbacks_submission_type', 'feedbacks', ['submission_id', 'feedback_type'])
    op.create_index('ix_feedbacks_user_status', 'feedbacks', ['user_id', 'status'])


def downgrade() -> None:
    # 인덱스 삭제
    op.drop_index('ix_feedbacks_user_status', table_name='feedbacks')
    op.drop_index('ix_feedbacks_submission_type', table_name='feedbacks')
    op.drop_index('ix_feedbacks_status', table_name='feedbacks')
    op.drop_index('ix_feedbacks_user_id', table_name='feedbacks')
    op.drop_index('ix_feedbacks_submission_id', table_name='feedbacks')

    # 테이블 삭제
    op.drop_table('feedbacks')
