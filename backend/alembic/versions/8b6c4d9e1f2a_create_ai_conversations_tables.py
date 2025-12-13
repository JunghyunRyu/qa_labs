"""Create AI conversations tables

Revision ID: 8b6c4d9e1f2a
Revises: 7a5b3c8d9e0f
Create Date: 2024-12-13

Changes:
- Create ai_conversations table for storing AI coach conversations
- Create ai_messages table for storing conversation messages
- Add CHECK constraint for user_id OR anonymous_id
- Add indexes for efficient querying
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '8b6c4d9e1f2a'
down_revision = '7a5b3c8d9e0f'
branch_labels = None
depends_on = None


def upgrade():
    # 1. ai_conversations 테이블 생성
    op.create_table(
        'ai_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('anonymous_id', sa.String(36), nullable=True),
        sa.Column('problem_id', sa.Integer,
                  sa.ForeignKey('problems.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mode', sa.String(10), nullable=False, server_default='COACH'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()')),
    )

    # 2. ai_conversations 인덱스 생성
    op.create_index('idx_ai_conv_user_id', 'ai_conversations', ['user_id'])
    op.create_index('idx_ai_conv_anonymous_id', 'ai_conversations', ['anonymous_id'])
    op.create_index('idx_ai_conv_problem_id', 'ai_conversations', ['problem_id'])

    # 3. ai_conversations CHECK 제약 추가
    op.create_check_constraint(
        'chk_ai_conv_owner',
        'ai_conversations',
        'user_id IS NOT NULL OR anonymous_id IS NOT NULL'
    )

    # 4. ai_messages 테이블 생성
    op.create_table(
        'ai_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ai_conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(10), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('token_estimate', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()')),
    )

    # 5. ai_messages 인덱스 생성
    op.create_index('idx_ai_msg_conversation', 'ai_messages', ['conversation_id'])

    # 6. ai_messages role CHECK 제약 추가
    op.create_check_constraint(
        'chk_ai_msg_role',
        'ai_messages',
        "role IN ('user', 'assistant')"
    )


def downgrade():
    # 역순으로 롤백

    # 1. ai_messages CHECK 제약 제거
    op.drop_constraint('chk_ai_msg_role', 'ai_messages', type_='check')

    # 2. ai_messages 인덱스 제거
    op.drop_index('idx_ai_msg_conversation', 'ai_messages')

    # 3. ai_messages 테이블 제거
    op.drop_table('ai_messages')

    # 4. ai_conversations CHECK 제약 제거
    op.drop_constraint('chk_ai_conv_owner', 'ai_conversations', type_='check')

    # 5. ai_conversations 인덱스 제거
    op.drop_index('idx_ai_conv_problem_id', 'ai_conversations')
    op.drop_index('idx_ai_conv_anonymous_id', 'ai_conversations')
    op.drop_index('idx_ai_conv_user_id', 'ai_conversations')

    # 6. ai_conversations 테이블 제거
    op.drop_table('ai_conversations')
