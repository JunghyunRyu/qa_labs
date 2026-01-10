"""Remove soft delete fields from users table.

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-01-10

Changes:
- Remove is_deleted column from users table
- Remove deleted_at column from users table
- Soft delete is replaced by hard delete with withdrawal_logs
"""

from alembic import op
import sqlalchemy as sa


revision = "o5p6q7r8s9t0"
down_revision = "n4o5p6q7r8s9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove soft delete fields
    op.drop_column("users", "is_deleted")
    op.drop_column("users", "deleted_at")


def downgrade() -> None:
    # Re-add soft delete fields
    op.add_column(
        "users",
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
