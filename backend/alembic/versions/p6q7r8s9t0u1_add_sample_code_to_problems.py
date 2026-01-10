"""Add sample_code field to problems table

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-01-10

Changes:
- Add sample_code column to problems table for onboarding pre-filled test code
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "p6q7r8s9t0u1"
down_revision: Union[str, None] = "o5p6q7r8s9t0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "problems",
        sa.Column("sample_code", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("problems", "sample_code")
