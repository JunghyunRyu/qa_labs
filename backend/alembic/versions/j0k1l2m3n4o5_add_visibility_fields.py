"""Add visibility fields for Seed & Drip strategy

Revision ID: j0k1l2m3n4o5
Revises: h8i9j0k1l2m3
Create Date: 2025-01-03

Changes:
- Add published_at TIMESTAMP column to problems table (공개 시점 제어)
- Add is_visible BOOLEAN column to problems table (비공개 처리용 플래그)
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "j0k1l2m3n4o5"
down_revision: Union[str, None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add published_at column to problems table
    op.add_column(
        "problems",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True)
    )

    # Add is_visible column to problems table (default False)
    op.add_column(
        "problems",
        sa.Column("is_visible", sa.Boolean(), server_default="false", nullable=False)
    )


def downgrade() -> None:
    # Drop is_visible column
    op.drop_column("problems", "is_visible")

    # Drop published_at column
    op.drop_column("problems", "published_at")
