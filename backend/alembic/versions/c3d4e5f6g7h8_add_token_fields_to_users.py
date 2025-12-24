"""Add token fields to users table

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6a7
Create Date: 2024-12-24

Changes:
- Add token_balance column (default 100 monthly tokens)
- Add token_used column (tokens used this month)
- Add token_reset_at column (next monthly reset datetime)
- Add daily_bonus_used column (bonus uses today, max 3)
- Add daily_bonus_reset_at column (next daily reset)
- Add tier column (free/premium)
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6g7h8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Token system fields for AI feature rate limiting
    op.add_column(
        "users",
        sa.Column("token_balance", sa.Integer(), nullable=False, server_default="100")
    )
    op.add_column(
        "users",
        sa.Column("token_used", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column(
        "users",
        sa.Column("token_reset_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("daily_bonus_used", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column(
        "users",
        sa.Column("daily_bonus_reset_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("tier", sa.String(20), nullable=False, server_default="free")
    )


def downgrade() -> None:
    op.drop_column("users", "tier")
    op.drop_column("users", "daily_bonus_reset_at")
    op.drop_column("users", "daily_bonus_used")
    op.drop_column("users", "token_reset_at")
    op.drop_column("users", "token_used")
    op.drop_column("users", "token_balance")
