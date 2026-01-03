"""Add client result verification fields

Revision ID: i9j0k1l2m3n4
Revises: j0k1l2m3n4o5
Create Date: 2025-01-03

Changes:
- Add execution_mode, verified, verification_status to submissions
- Add server_score, verification_triggered_by, verified_at, code_hash
- Add indexes for efficient querying
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "i9j0k1l2m3n4"
down_revision = "j0k1l2m3n4o5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # execution_mode: "client" or "server"
    op.add_column(
        "submissions",
        sa.Column(
            "execution_mode",
            sa.String(10),
            nullable=False,
            server_default="client",
        ),
    )

    # verified: server verification completed
    op.add_column(
        "submissions",
        sa.Column(
            "verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # verification_status: "pending", "verified", "mismatch"
    op.add_column(
        "submissions",
        sa.Column(
            "verification_status",
            sa.String(20),
            nullable=True,
        ),
    )

    # server_score: score from server re-verification
    op.add_column(
        "submissions",
        sa.Column(
            "server_score",
            sa.Integer(),
            nullable=True,
        ),
    )

    # verification_triggered_by: reason for triggering verification
    op.add_column(
        "submissions",
        sa.Column(
            "verification_triggered_by",
            sa.String(50),
            nullable=True,
        ),
    )

    # verified_at: timestamp of verification completion
    op.add_column(
        "submissions",
        sa.Column(
            "verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # code_hash: SHA256 hash for duplicate detection
    op.add_column(
        "submissions",
        sa.Column(
            "code_hash",
            sa.String(64),
            nullable=True,
        ),
    )

    # Create indexes
    op.create_index(
        "ix_submissions_execution_mode",
        "submissions",
        ["execution_mode"],
    )
    op.create_index(
        "ix_submissions_verified",
        "submissions",
        ["verified"],
    )
    op.create_index(
        "ix_submissions_code_hash",
        "submissions",
        ["code_hash"],
    )
    op.create_index(
        "ix_submissions_verification_status",
        "submissions",
        ["verification_status"],
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_submissions_verification_status", table_name="submissions")
    op.drop_index("ix_submissions_code_hash", table_name="submissions")
    op.drop_index("ix_submissions_verified", table_name="submissions")
    op.drop_index("ix_submissions_execution_mode", table_name="submissions")

    # Drop columns
    op.drop_column("submissions", "code_hash")
    op.drop_column("submissions", "verified_at")
    op.drop_column("submissions", "verification_triggered_by")
    op.drop_column("submissions", "server_score")
    op.drop_column("submissions", "verification_status")
    op.drop_column("submissions", "verified")
    op.drop_column("submissions", "execution_mode")
