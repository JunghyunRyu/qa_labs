"""Add Google OAuth and terms acceptance fields

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-01-09

Changes:
- Add google_id VARCHAR(50) column to users table (Google OAuth ID)
- Add terms_accepted_at TIMESTAMP column to users table (terms acceptance)
- Backfill existing users with terms_accepted_at = created_at
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "l2m3n4o5p6q7"
down_revision = "k1l2m3n4o5p6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add google_id column to users table
    op.add_column(
        "users",
        sa.Column(
            "google_id",
            sa.String(50),
            nullable=True,
        ),
    )
    # Create unique index for google_id
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    # Add terms_accepted_at column to users table
    op.add_column(
        "users",
        sa.Column(
            "terms_accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Backfill existing users: set terms_accepted_at = created_at
    # (Existing users have already implicitly agreed to terms)
    op.execute("UPDATE users SET terms_accepted_at = created_at WHERE terms_accepted_at IS NULL")


def downgrade() -> None:
    # Drop terms_accepted_at column
    op.drop_column("users", "terms_accepted_at")

    # Drop google_id index and column
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "google_id")
