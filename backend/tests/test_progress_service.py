"""Tests for Progress Service."""

import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from unittest.mock import MagicMock, patch

from app.services.progress_service import ProgressService
from app.schemas.progress import (
    DifficultyStats,
    DomainStats,
    SkillStats,
    ProgressSummaryResponse,
    TimelineEntry,
    ProgressTimelineResponse,
)


class TestProgressService:
    """Tests for ProgressService."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_db):
        """Create ProgressService with mock db."""
        return ProgressService(mock_db)

    @pytest.fixture
    def user_id(self):
        """Generate test user ID."""
        return uuid4()

    @pytest.fixture
    def anonymous_id(self):
        """Generate test anonymous ID."""
        return "anon-12345678"

    # ================== _build_user_filter Tests ==================

    def test_build_user_filter_with_user_id(self, service, user_id):
        """Test filter building with user_id."""
        filter_expr = service._build_user_filter(user_id=user_id)
        # Just verify it returns something (SQLAlchemy filter expression)
        assert filter_expr is not None

    def test_build_user_filter_with_anonymous_id(self, service, anonymous_id):
        """Test filter building with anonymous_id."""
        filter_expr = service._build_user_filter(anonymous_id=anonymous_id)
        assert filter_expr is not None

    def test_build_user_filter_with_both(self, service, user_id, anonymous_id):
        """Test filter building with both IDs (user_id takes precedence)."""
        filter_expr = service._build_user_filter(user_id=user_id, anonymous_id=anonymous_id)
        assert filter_expr is not None

    def test_build_user_filter_with_none(self, service):
        """Test filter building with no IDs."""
        filter_expr = service._build_user_filter()
        assert filter_expr is not None

    # ================== has_submissions Tests ==================

    def test_has_submissions_true(self, service, mock_db, user_id):
        """Test has_submissions returns True when submissions exist."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.scalar.return_value = 5

        result = service.has_submissions(user_id=user_id)
        assert result is True

    def test_has_submissions_false(self, service, mock_db, user_id):
        """Test has_submissions returns False when no submissions."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.scalar.return_value = 0

        result = service.has_submissions(user_id=user_id)
        assert result is False

    # ================== get_difficulty_stats Tests ==================

    def test_get_difficulty_stats_returns_sorted_list(self, service, mock_db, user_id):
        """Test difficulty stats are sorted by difficulty order."""
        # Mock query result
        mock_row_easy = MagicMock()
        mock_row_easy.difficulty = "Easy"
        mock_row_easy.submission_count = 10
        mock_row_easy.avg_score = 85.5
        mock_row_easy.success_count = 8

        mock_row_hard = MagicMock()
        mock_row_hard.difficulty = "Hard"
        mock_row_hard.submission_count = 5
        mock_row_hard.avg_score = 70.0
        mock_row_hard.success_count = 2

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        # Return in wrong order to test sorting
        mock_query.all.return_value = [mock_row_hard, mock_row_easy]

        result = service.get_difficulty_stats(user_id=user_id)

        assert len(result) == 2
        assert result[0].difficulty == "Easy"  # Should be first after sorting
        assert result[1].difficulty == "Hard"
        assert result[0].avg_score == 85.5
        assert result[0].success_rate == 0.8

    def test_get_difficulty_stats_empty(self, service, mock_db, user_id):
        """Test difficulty stats returns empty list when no submissions."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.all.return_value = []

        result = service.get_difficulty_stats(user_id=user_id)
        assert result == []

    # ================== get_domain_stats Tests ==================

    def test_get_domain_stats_returns_list(self, service, mock_db, user_id):
        """Test domain stats returns proper list."""
        mock_row = MagicMock()
        mock_row.domain = "common"
        mock_row.submission_count = 15
        mock_row.avg_score = 78.3

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [mock_row]

        result = service.get_domain_stats(user_id=user_id)

        assert len(result) == 1
        assert result[0].domain == "common"
        assert result[0].submission_count == 15
        assert result[0].avg_score == 78.3

    # ================== get_skill_stats Tests ==================

    def test_get_skill_stats_returns_empty_without_user(self, service):
        """Test skill stats returns empty when no user identification."""
        result = service.get_skill_stats()
        assert result == []

    def test_get_skill_stats_handles_db_error(self, service, mock_db, user_id):
        """Test skill stats handles database errors gracefully."""
        mock_db.execute.side_effect = Exception("DB Error")

        result = service.get_skill_stats(user_id=user_id)
        assert result == []

    # ================== get_timeline Tests ==================

    def test_get_timeline_7d(self, service, mock_db, user_id):
        """Test timeline with 7 day range."""
        mock_row = MagicMock()
        mock_row.date = datetime.now(timezone.utc).date()
        mock_row.submission_count = 3
        mock_row.avg_score = 82.5
        mock_row.avg_kill_ratio = 0.75

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = [mock_row]

        result = service.get_timeline(range_str="7d", user_id=user_id)

        assert result.range == "7d"
        assert len(result.entries) == 1
        assert result.entries[0].submission_count == 3
        assert result.entries[0].avg_score == 82.5
        assert result.total_submissions == 3

    def test_get_timeline_30d(self, service, mock_db, user_id):
        """Test timeline with 30 day range."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = []

        result = service.get_timeline(range_str="30d", user_id=user_id)

        assert result.range == "30d"
        assert result.entries == []
        assert result.total_submissions == 0

    def test_get_timeline_all(self, service, mock_db, user_id):
        """Test timeline with 'all' range."""
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = []

        result = service.get_timeline(range_str="all", user_id=user_id)

        assert result.range == "all"

    # ================== get_summary Tests ==================

    def test_get_summary_returns_complete_response(self, service, mock_db, user_id):
        """Test summary returns all required fields."""
        # Mock basic stats query
        mock_stats = MagicMock()
        mock_stats.total = 42
        mock_stats.success = 35
        mock_stats.avg_score = 78.5
        mock_stats.best_score = 100
        mock_stats.avg_kill_ratio = 0.72

        # Mock recent scores query
        mock_score1 = MagicMock()
        mock_score1.score = 80
        mock_score2 = MagicMock()
        mock_score2.score = 85

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_stats
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = [mock_score1, mock_score2]

        # Mock difficulty/domain/skill stats
        mock_query.join.return_value = mock_query
        mock_query.group_by.return_value = mock_query

        with patch.object(service, 'get_difficulty_stats', return_value=[]):
            with patch.object(service, 'get_domain_stats', return_value=[]):
                with patch.object(service, 'get_skill_stats', return_value=[]):
                    result = service.get_summary(user_id=user_id)

        assert result.total_submissions == 42
        assert result.success_submissions == 35
        assert result.avg_score == 78.5
        assert result.best_score == 100
        assert result.avg_kill_ratio == 0.72
        assert result.recent_avg_score == 82.5  # (80 + 85) / 2

    def test_get_summary_with_no_submissions(self, service, mock_db, user_id):
        """Test summary with no submissions returns zero values."""
        mock_stats = MagicMock()
        mock_stats.total = 0
        mock_stats.success = 0
        mock_stats.avg_score = None
        mock_stats.best_score = None
        mock_stats.avg_kill_ratio = None

        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_stats
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []
        mock_query.join.return_value = mock_query
        mock_query.group_by.return_value = mock_query

        with patch.object(service, 'get_difficulty_stats', return_value=[]):
            with patch.object(service, 'get_domain_stats', return_value=[]):
                with patch.object(service, 'get_skill_stats', return_value=[]):
                    result = service.get_summary(user_id=user_id)

        assert result.total_submissions == 0
        assert result.avg_score == 0
        assert result.best_score == 0
        assert result.recent_avg_score == 0


class TestProgressSchemas:
    """Tests for Progress schemas."""

    def test_difficulty_stats_creation(self):
        """Test DifficultyStats schema creation."""
        stats = DifficultyStats(
            difficulty="Easy",
            submission_count=10,
            avg_score=85.5,
            success_rate=0.8,
        )
        assert stats.difficulty == "Easy"
        assert stats.submission_count == 10
        assert stats.avg_score == 85.5
        assert stats.success_rate == 0.8

    def test_domain_stats_creation(self):
        """Test DomainStats schema creation."""
        stats = DomainStats(
            domain="common",
            submission_count=15,
            avg_score=78.3,
        )
        assert stats.domain == "common"
        assert stats.submission_count == 15

    def test_skill_stats_creation(self):
        """Test SkillStats schema creation."""
        stats = SkillStats(
            skill="array",
            submission_count=12,
            avg_score=80.1,
        )
        assert stats.skill == "array"
        assert stats.submission_count == 12

    def test_timeline_entry_creation(self):
        """Test TimelineEntry schema creation."""
        entry = TimelineEntry(
            date="2025-01-01",
            submission_count=5,
            avg_score=75.0,
            avg_kill_ratio=0.68,
        )
        assert entry.date == "2025-01-01"
        assert entry.submission_count == 5
        assert entry.avg_score == 75.0
        assert entry.avg_kill_ratio == 0.68

    def test_progress_summary_response_creation(self):
        """Test ProgressSummaryResponse schema creation."""
        response = ProgressSummaryResponse(
            total_submissions=42,
            success_submissions=35,
            avg_score=78.5,
            avg_kill_ratio=0.72,
            best_score=100,
            recent_avg_score=82.3,
            difficulty_stats=[],
            domain_stats=[],
            skill_stats=[],
        )
        assert response.total_submissions == 42
        assert response.success_submissions == 35
        assert response.avg_kill_ratio == 0.72

    def test_progress_timeline_response_creation(self):
        """Test ProgressTimelineResponse schema creation."""
        response = ProgressTimelineResponse(
            entries=[],
            range="30d",
            total_submissions=0,
        )
        assert response.range == "30d"
        assert response.total_submissions == 0
        assert response.entries == []
