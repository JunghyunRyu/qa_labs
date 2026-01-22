"""Add AI Verifier Track tables

Revision ID: s9t0u1v2w3x4
Revises: r8s9t0u1v2w3
Create Date: 2026-01-22

AI Verifier Track 시스템:
- ai_challenges: 챌린지 문제 정의
- ai_challenge_attempts: 사용자 시도 기록
- ai_verifier_stats: 사용자 통계
- ai_verifier_badges: 배지 정의
- user_ai_verifier_badges: 사용자 획득 배지
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "s9t0u1v2w3x4"
down_revision: Union[str, None] = "r8s9t0u1v2w3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ai_challenges 테이블 생성
    op.create_table(
        'ai_challenges',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('category', sa.String(50), nullable=False),

        # Function definition
        sa.Column('function_name', sa.String(100), nullable=False),
        sa.Column('bug_type', sa.String(50), nullable=False),

        # Code templates
        sa.Column('buggy_code_template', sa.Text(), nullable=False),
        sa.Column('correct_code', sa.Text(), nullable=False),

        # Input/Output schema
        sa.Column('input_schema', postgresql.JSONB(), nullable=False),
        sa.Column('expected_output_type', sa.String(20), nullable=False, server_default='any'),
        sa.Column('comparison_config', postgresql.JSONB(), server_default='{}'),

        # Test cases
        sa.Column('test_cases', postgresql.JSONB(), nullable=False),
        sa.Column('bug_trigger_cases', postgresql.JSONB(), nullable=False),

        # UX
        sa.Column('input_hint', sa.String(255), nullable=False),
        sa.Column('hints', postgresql.JSONB(), server_default='[]'),

        # AI response control
        sa.Column('ai_system_prompt', sa.Text(), nullable=True),
        sa.Column('prescripted_responses', postgresql.JSONB(), nullable=True),

        # Gamification
        sa.Column('bounty_points', sa.Integer(), server_default='100'),
        sa.Column('difficulty', sa.String(20), server_default="'beginner'"),

        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),

        sa.PrimaryKeyConstraint('id'),
    )

    # ai_challenges indexes
    op.create_index('idx_ai_challenges_level', 'ai_challenges', ['level'])
    op.create_index('idx_ai_challenges_category', 'ai_challenges', ['category'])
    op.create_index('idx_ai_challenges_bug_type', 'ai_challenges', ['bug_type'])
    op.create_index('idx_ai_challenges_active', 'ai_challenges', ['is_active'],
                    postgresql_where=sa.text('is_active = true'))
    op.create_index('idx_ai_challenges_level_active', 'ai_challenges', ['level', 'is_active'],
                    postgresql_where=sa.text('is_active = true'))

    # 2. ai_challenge_attempts 테이블 생성
    op.create_table(
        'ai_challenge_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('challenge_id', postgresql.UUID(as_uuid=True), nullable=False),

        # Attempt info
        sa.Column('user_input', sa.Text(), nullable=False),
        sa.Column('parsed_input', postgresql.JSONB(), nullable=True),

        # Results
        sa.Column('result', sa.String(20), nullable=False),
        sa.Column('bug_found', sa.Boolean(), server_default='false'),
        sa.Column('actual_output', sa.Text(), nullable=True),
        sa.Column('expected_output', sa.Text(), nullable=True),

        # Error info
        sa.Column('error_type', sa.String(20), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),

        # Gamification
        sa.Column('points_earned', sa.Integer(), server_default='0'),
        sa.Column('is_first_solve', sa.Boolean(), server_default='false'),
        sa.Column('hints_used', sa.Integer(), server_default='0'),

        # Metadata
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['challenge_id'], ['ai_challenges.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ai_challenge_attempts indexes
    op.create_index('idx_attempts_user', 'ai_challenge_attempts', ['user_id'])
    op.create_index('idx_attempts_challenge', 'ai_challenge_attempts', ['challenge_id'])
    op.create_index('idx_attempts_result', 'ai_challenge_attempts', ['result'])
    op.create_index('idx_attempts_created', 'ai_challenge_attempts', ['created_at'],
                    postgresql_ops={'created_at': 'DESC'})
    # Unique index for first solve tracking (duplicate score prevention)
    op.create_index('idx_unique_first_solve', 'ai_challenge_attempts',
                    ['user_id', 'challenge_id'],
                    unique=True,
                    postgresql_where=sa.text('bug_found = true AND is_first_solve = true'))

    # 3. ai_verifier_stats 테이블 생성
    op.create_table(
        'ai_verifier_stats',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_score', sa.Integer(), server_default='0'),
        sa.Column('bugs_found', sa.Integer(), server_default='0'),
        sa.Column('challenges_completed', sa.Integer(), server_default='0'),
        sa.Column('current_streak', sa.Integer(), server_default='0'),
        sa.Column('highest_streak', sa.Integer(), server_default='0'),
        sa.Column('rank', sa.String(50), server_default="'Rookie'"),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id'),
    )

    # 4. ai_verifier_badges 테이블 생성
    op.create_table(
        'ai_verifier_badges',
        sa.Column('id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(10), nullable=True),
        sa.Column('condition_type', sa.String(50), nullable=True),
        sa.Column('condition_value', sa.Integer(), nullable=True),

        sa.PrimaryKeyConstraint('id'),
    )

    # 5. user_ai_verifier_badges 테이블 생성
    op.create_table(
        'user_ai_verifier_badges',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('badge_id', sa.String(50), nullable=False),
        sa.Column('earned_at', sa.DateTime(), server_default=sa.text('now()')),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['badge_id'], ['ai_verifier_badges.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'badge_id'),
    )

    # 6. Insert default badges
    op.execute("""
        INSERT INTO ai_verifier_badges (id, name, description, icon, condition_type, condition_value) VALUES
        ('first_blood', 'First Blood', '첫 번째 버그 발견', '🩸', 'bugs_found', 1),
        ('loop_breaker', 'Loop Breaker', '무한 루프 버그 3회 발견', '🔄', 'category_bugs', 3),
        ('type_guardian', 'Type Guardian', '타입 에러 5회 발견', '📝', 'category_bugs', 5),
        ('edge_master', 'Edge Master', '경계값 버그 10회 발견', '📐', 'category_bugs', 10),
        ('streak_5', '5 Streak', '5일 연속 버그 발견', '🔥', 'streak', 5),
        ('level_5', 'Level 5 Clear', 'Level 5 클리어', '⭐', 'level_cleared', 5),
        ('ai_tamer', 'AI Tamer', 'Level 10 클리어', '🏆', 'level_cleared', 10)
    """)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('user_ai_verifier_badges')
    op.drop_table('ai_verifier_badges')
    op.drop_table('ai_verifier_stats')

    op.drop_index('idx_unique_first_solve', table_name='ai_challenge_attempts')
    op.drop_index('idx_attempts_created', table_name='ai_challenge_attempts')
    op.drop_index('idx_attempts_result', table_name='ai_challenge_attempts')
    op.drop_index('idx_attempts_challenge', table_name='ai_challenge_attempts')
    op.drop_index('idx_attempts_user', table_name='ai_challenge_attempts')
    op.drop_table('ai_challenge_attempts')

    op.drop_index('idx_ai_challenges_level_active', table_name='ai_challenges')
    op.drop_index('idx_ai_challenges_active', table_name='ai_challenges')
    op.drop_index('idx_ai_challenges_bug_type', table_name='ai_challenges')
    op.drop_index('idx_ai_challenges_category', table_name='ai_challenges')
    op.drop_index('idx_ai_challenges_level', table_name='ai_challenges')
    op.drop_table('ai_challenges')
