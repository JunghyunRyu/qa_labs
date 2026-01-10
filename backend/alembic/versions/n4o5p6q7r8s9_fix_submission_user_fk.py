"""Fix submission user_id foreign key with ON DELETE SET NULL.

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-01-10

Changes:
- Modify submissions.user_id FK to include ON DELETE SET NULL
- Allows user deletion without violating FK constraint
- Submissions are anonymized (user_id = NULL) when user is deleted
"""

from alembic import op


revision = "n4o5p6q7r8s9"
down_revision = "m3n4o5p6q7r8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing foreign key constraint
    op.drop_constraint(
        "submissions_user_id_fkey",
        "submissions",
        type_="foreignkey",
    )

    # Recreate with ON DELETE SET NULL
    op.create_foreign_key(
        "submissions_user_id_fkey",
        "submissions",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    # Drop the new constraint
    op.drop_constraint(
        "submissions_user_id_fkey",
        "submissions",
        type_="foreignkey",
    )

    # Recreate without ON DELETE clause
    op.create_foreign_key(
        "submissions_user_id_fkey",
        "submissions",
        "users",
        ["user_id"],
        ["id"],
    )
