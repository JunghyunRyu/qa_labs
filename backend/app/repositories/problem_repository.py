"""Problem repository."""

from typing import Optional, List, Tuple, Union, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Text, case, literal

from app.models.problem import Problem
from app.models.submission import Submission
from app.models.buggy_implementation import BuggyImplementation
from app.schemas.problem import ProblemCreate

class ProblemRepository:
    """Repository for Problem model."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        difficulty: Optional[str] = None,
        domain: Optional[str] = None,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
        sort: str = "difficulty-asc",
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Get all problems with pagination, filtering, and sorting.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            difficulty: Filter by difficulty level (e.g., "Easy", "Medium")
            domain: Filter by domain (common, fintech, commerce, saas, platform, content)
            search: Search query for title, slug, or skills
            tags: Filter by skill tags (all tags must match)
            sort: Sort option (difficulty-asc, difficulty-desc, success-rate-desc, success-rate-asc)

        Returns:
            Tuple of (list of problem dicts with success_rate, total count)
        """
        # Subquery: 문제별 제출 통계
        stats_subquery = (
            self.db.query(
                Submission.problem_id,
                func.count(Submission.id).label("submission_count"),
                func.count(case((Submission.status == "SUCCESS", 1))).label("success_count"),
            )
            .group_by(Submission.problem_id)
            .subquery()
        )

        # Subquery: 문제별 버그 수
        bugs_subquery = (
            self.db.query(
                BuggyImplementation.problem_id,
                func.count(BuggyImplementation.id).label("bugs_count"),
            )
            .group_by(BuggyImplementation.problem_id)
            .subquery()
        )

        # 정답률 계산 (제출 5건 이상일 때만)
        success_rate_expr = case(
            (stats_subquery.c.submission_count >= 5,
             stats_subquery.c.success_count * 1.0 / stats_subquery.c.submission_count),
            else_=None
        ).label("success_rate")

        # 메인 쿼리: Problem + 통계 + 버그 수 LEFT JOIN
        query = (
            self.db.query(
                Problem,
                func.coalesce(stats_subquery.c.submission_count, 0).label("submission_count"),
                success_rate_expr,
                func.coalesce(bugs_subquery.c.bugs_count, 0).label("bugs_count"),
            )
            .outerjoin(stats_subquery, Problem.id == stats_subquery.c.problem_id)
            .outerjoin(bugs_subquery, Problem.id == bugs_subquery.c.problem_id)
        )

        # Visibility filter: 공개된 문제만 목록에 표시 (Seed & Drip)
        query = query.filter(Problem.is_visible == True)

        # Apply difficulty filter
        if difficulty:
            query = query.filter(Problem.difficulty == difficulty)

        # Apply domain filter
        if domain:
            query = query.filter(Problem.domain == domain)

        # Apply search filter (title, slug, or skills)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Problem.title.ilike(search_term))
                | (Problem.slug.ilike(search_term))
                | (cast(Problem.skills, Text).ilike(search_term))
            )

        # Apply tags filter (all tags must be present in skills)
        if tags:
            for tag in tags:
                query = query.filter(
                    cast(Problem.skills, Text).ilike(f"%{tag}%")
                )

        # Get total count for filtered results (count distinct problems)
        total = query.with_entities(func.count(Problem.id.distinct())).scalar()

        # 난이도 순서 정의
        difficulty_order = case(
            (Problem.difficulty == "Very Easy", 0),
            (Problem.difficulty == "Easy", 1),
            (Problem.difficulty == "Medium", 2),
            (Problem.difficulty == "Hard", 3),
            else_=4
        )

        # Apply sorting
        if sort == "difficulty-asc":
            query = query.order_by(difficulty_order.asc(), Problem.id.asc())
        elif sort == "difficulty-desc":
            query = query.order_by(difficulty_order.desc(), Problem.id.asc())
        elif sort == "success-rate-desc":
            # 정답률 높은순 (NULL은 마지막)
            query = query.order_by(
                case((success_rate_expr.is_(None), 1), else_=0),
                success_rate_expr.desc(),
                Problem.id.asc()
            )
        elif sort == "success-rate-asc":
            # 정답률 낮은순 (NULL은 마지막)
            query = query.order_by(
                case((success_rate_expr.is_(None), 1), else_=0),
                success_rate_expr.asc(),
                Problem.id.asc()
            )
        else:
            # 기본: 난이도 낮은순
            query = query.order_by(difficulty_order.asc(), Problem.id.asc())

        # Apply pagination
        results = query.offset(skip).limit(limit).all()

        # Convert to list of dicts
        problems_with_stats = []
        for problem, submission_count, success_rate, bugs_count in results:
            problem_dict = {
                "id": problem.id,
                "slug": problem.slug,
                "title": problem.title,
                "difficulty": problem.difficulty,
                "domain": getattr(problem, 'domain', 'common'),
                "skills": problem.skills,
                "summary": problem.summary,
                "short_description": problem.short_description,
                "description_md": problem.description_md,
                "success_rate": float(success_rate) if success_rate is not None else None,
                "bugs_count": bugs_count,
            }
            problems_with_stats.append(problem_dict)

        return problems_with_stats, total

    def get_by_id(self, problem_id: int) -> Optional[Problem]:
        """
        Get problem by ID.

        Args:
            problem_id: Problem ID

        Returns:
            Problem if found, None otherwise
        """
        return self.db.query(Problem).filter(Problem.id == problem_id).first()

    def get_by_slug(self, slug: str) -> Optional[Problem]:
        """
        Get problem by slug.

        Args:
            slug: Problem slug

        Returns:
            Problem if found, None otherwise
        """
        return self.db.query(Problem).filter(Problem.slug == slug).first()

    def create(self, problem_in: Union[Problem, ProblemCreate]) -> Problem:
        """
        Create a new Problem row.

        Args:
            problem_in: Either a Problem ORM instance or ProblemCreate schema

        Returns:
            Created Problem instance

        Note: buggy_implementations 저장은 나중에 별도 로직으로 확장해도 됨.
        """
        # If already a Problem instance, just add and commit
        if isinstance(problem_in, Problem):
            problem = problem_in
        else:
            # If ProblemCreate schema, create Problem instance
            problem = Problem(
                slug=problem_in.slug,
                title=problem_in.title,
                description_md=problem_in.description_md,
                function_signature=problem_in.function_signature,
                golden_code=problem_in.golden_code,
                difficulty=problem_in.difficulty,
                domain=getattr(problem_in, "domain", "common"),
                skills=problem_in.skills,
                summary=getattr(problem_in, "summary", None),
            )

        self.db.add(problem)
        self.db.commit()
        self.db.refresh(problem)
        return problem

    def update_short_description(self, problem_id: int, short_description: str) -> bool:
        """
        Update short_description field for a single problem.

        Args:
            problem_id: Problem ID to update
            short_description: New short description text

        Returns:
            True if updated successfully, False if problem not found
        """
        problem = self.get_by_id(problem_id)
        if not problem:
            return False

        problem.short_description = short_description
        self.db.commit()
        return True

    def update_skills(self, problem_id: int, skills: list) -> bool:
        """
        Update skills (tags) field for a single problem.

        Args:
            problem_id: Problem ID to update
            skills: New skills list

        Returns:
            True if updated successfully, False if problem not found
        """
        problem = self.get_by_id(problem_id)
        if not problem:
            return False

        problem.skills = skills
        self.db.commit()
        return True

    def get_stats(self) -> Dict[str, Any]:
        """
        Get aggregate statistics for all problems.

        Returns:
            Dict with total count and counts by difficulty and domain
        """
        # 전체 개수
        total = self.db.query(func.count(Problem.id)).scalar()

        # 난이도별 집계
        difficulty_stats = (
            self.db.query(Problem.difficulty, func.count(Problem.id))
            .group_by(Problem.difficulty)
            .all()
        )

        # 도메인별 집계
        domain_stats = (
            self.db.query(Problem.domain, func.count(Problem.id))
            .group_by(Problem.domain)
            .all()
        )

        return {
            "total": total or 0,
            "by_difficulty": {diff: count for diff, count in difficulty_stats},
            "by_domain": {domain: count for domain, count in domain_stats},
        }
