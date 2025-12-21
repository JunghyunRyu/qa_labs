"""Add test quality evaluation fields

Revision ID: a1b2c3d4e5f6
Revises: 9c7d5e2f3a4b
Create Date: 2024-12-21

Changes:
- Add test_quality_score, test_quality_grade, test_quality_analysis to submissions
- Add rubric_score, rubric_analysis to problems
- Create analysis_runs table with constraints and indexes
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "9c7d5e2f3a4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. submissions 테이블 확장
    op.add_column(
        "submissions", sa.Column("test_quality_score", sa.Float(), nullable=True)
    )
    op.add_column(
        "submissions", sa.Column("test_quality_grade", sa.String(1), nullable=True)
    )
    op.add_column(
        "submissions",
        sa.Column(
            "test_quality_analysis",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.create_check_constraint(
        "submissions_test_quality_grade_check",
        "submissions",
        "test_quality_grade IS NULL OR test_quality_grade IN ('A', 'B', 'C', 'D', 'F')",
    )

    # 2. problems 테이블 확장
    op.add_column("problems", sa.Column("rubric_score", sa.Float(), nullable=True))
    op.add_column(
        "problems",
        sa.Column(
            "rubric_analysis", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )

    # 3. analysis_runs 테이블 생성
    op.create_table(
        "analysis_runs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("problem_id", sa.Integer(), nullable=True),
        sa.Column("scope", sa.String(20), nullable=False),
        sa.Column("parser_version", sa.String(10), nullable=False),
        sa.Column("scoring_version", sa.String(10), nullable=False),
        sa.Column("source_hash", sa.String(32), nullable=False),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="PENDING"
        ),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column(
            "result", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["submission_id"], ["submissions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["problem_id"], ["problems.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "scope IN ('submission', 'problem_rubric')",
            name="analysis_runs_scope_check",
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'RUNNING', 'SUCCESS', 'ERROR')",
            name="analysis_runs_status_check",
        ),
        sa.CheckConstraint(
            "(submission_id IS NOT NULL AND problem_id IS NULL) OR "
            "(submission_id IS NULL AND problem_id IS NOT NULL)",
            name="analysis_runs_target_check",
        ),
        sa.CheckConstraint(
            "confidence_score IS NULL OR "
            "(confidence_score >= 0.0 AND confidence_score <= 1.0)",
            name="analysis_runs_confidence_check",
        ),
    )

    # 4. 인덱스 생성
    op.create_index(
        "ix_analysis_runs_submission_id", "analysis_runs", ["submission_id"]
    )
    op.create_index("ix_analysis_runs_problem_id", "analysis_runs", ["problem_id"])
    op.create_index("ix_analysis_runs_status", "analysis_runs", ["status"])


def downgrade() -> None:
    # 1. analysis_runs 테이블 삭제
    op.drop_index("ix_analysis_runs_status", table_name="analysis_runs")
    op.drop_index("ix_analysis_runs_problem_id", table_name="analysis_runs")
    op.drop_index("ix_analysis_runs_submission_id", table_name="analysis_runs")
    op.drop_table("analysis_runs")

    # 2. problems 컬럼 삭제
    op.drop_column("problems", "rubric_analysis")
    op.drop_column("problems", "rubric_score")

    # 3. submissions 컬럼 삭제
    op.drop_constraint(
        "submissions_test_quality_grade_check", "submissions", type_="check"
    )
    op.drop_column("submissions", "test_quality_analysis")
    op.drop_column("submissions", "test_quality_grade")
    op.drop_column("submissions", "test_quality_score")
