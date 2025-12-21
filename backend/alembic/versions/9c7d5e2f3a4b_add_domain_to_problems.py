"""Add domain field to problems table

Revision ID: 9c7d5e2f3a4b
Revises: 8b6c4d9e1f2a
Create Date: 2024-12-20

Changes:
- Add domain column to problems table
- Add CHECK constraint for valid domain values
- Add index for domain column for efficient filtering
- Set default value 'common' for existing rows
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c7d5e2f3a4b'
down_revision = '8b6c4d9e1f2a'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add domain column with default value for existing rows
    op.add_column(
        'problems',
        sa.Column('domain', sa.String(20), nullable=False, server_default='common')
    )

    # 2. Add CHECK constraint for valid domain values
    op.create_check_constraint(
        'problems_domain_check',
        'problems',
        "domain IN ('common', 'fintech', 'commerce', 'saas', 'platform', 'content')"
    )

    # 3. Add index for efficient domain filtering
    op.create_index('ix_problems_domain', 'problems', ['domain'])


def downgrade():
    # Remove index
    op.drop_index('ix_problems_domain', table_name='problems')

    # Remove CHECK constraint
    op.drop_constraint('problems_domain_check', 'problems', type_='check')

    # Remove column
    op.drop_column('problems', 'domain')
