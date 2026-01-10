"""Add withdrawal_logs table for abuse prevention.

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-01-10

Changes:
- Add withdrawal_logs table to store hashed identifiers of deleted users
- Used for preventing token abuse on re-registration
- Data retained for 1 year after account deletion
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision = "m3n4o5p6q7r8"
down_revision = "l2m3n4o5p6q7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create withdrawal_logs table
    op.create_table(
        "withdrawal_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("github_id_hash", sa.String(64), nullable=True),
        sa.Column("google_id_hash", sa.String(64), nullable=True),
        sa.Column("email_hash", sa.String(64), nullable=False),
        sa.Column(
            "deleted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("expire_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason", sa.String(50), nullable=True),
    )

    # Create indexes for fast lookup
    op.create_index(
        "ix_withdrawal_logs_github_id_hash",
        "withdrawal_logs",
        ["github_id_hash"],
    )
    op.create_index(
        "ix_withdrawal_logs_google_id_hash",
        "withdrawal_logs",
        ["google_id_hash"],
    )
    op.create_index(
        "ix_withdrawal_logs_email_hash",
        "withdrawal_logs",
        ["email_hash"],
    )
    op.create_index(
        "idx_withdrawal_expire_at",
        "withdrawal_logs",
        ["expire_at"],
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_withdrawal_expire_at", table_name="withdrawal_logs")
    op.drop_index("ix_withdrawal_logs_email_hash", table_name="withdrawal_logs")
    op.drop_index("ix_withdrawal_logs_google_id_hash", table_name="withdrawal_logs")
    op.drop_index("ix_withdrawal_logs_github_id_hash", table_name="withdrawal_logs")

    # Drop table
    op.drop_table("withdrawal_logs")
