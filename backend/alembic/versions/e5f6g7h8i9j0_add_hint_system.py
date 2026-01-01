"""Add hint system (M5-5)

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2024-12-31

Changes:
- Add hints JSONB column to problems table
- Create hint_views table to track user hint views
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "e5f6g7h8i9j0"
down_revision: Union[str, None] = "d4e5f6g7h8i9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add hints column to problems table
    op.add_column(
        "problems",
        sa.Column("hints", JSONB, nullable=True)
    )

    # Create hint_views table
    op.create_table(
        "hint_views",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("problem_id", sa.Integer(), nullable=False),
        sa.Column("hint_level", sa.Integer(), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["problem_id"], ["problems.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "problem_id", "hint_level", name="uq_user_problem_hint")
    )
    op.create_index(op.f("ix_hint_views_problem_id"), "hint_views", ["problem_id"], unique=False)
    op.create_index(op.f("ix_hint_views_user_id"), "hint_views", ["user_id"], unique=False)


def downgrade() -> None:
    # Drop hint_views table
    op.drop_index(op.f("ix_hint_views_user_id"), table_name="hint_views")
    op.drop_index(op.f("ix_hint_views_problem_id"), table_name="hint_views")
    op.drop_table("hint_views")

    # Drop hints column from problems
    op.drop_column("problems", "hints")
