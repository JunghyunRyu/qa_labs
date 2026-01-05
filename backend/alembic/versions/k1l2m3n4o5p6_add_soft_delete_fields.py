"""Add soft delete fields to users table

Revision ID: k1l2m3n4o5p6
Revises: i9j0k1l2m3n4
Create Date: 2026-01-05

Changes:
- Add is_deleted BOOLEAN column to users table (soft delete flag)
- Add deleted_at TIMESTAMP column to users table (deletion timestamp)
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "k1l2m3n4o5p6"
down_revision = "i9j0k1l2m3n4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_deleted column to users table (default False)
    op.add_column(
        "users",
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Add deleted_at column to users table
    op.add_column(
        "users",
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    # Drop deleted_at column
    op.drop_column("users", "deleted_at")

    # Drop is_deleted column
    op.drop_column("users", "is_deleted")
