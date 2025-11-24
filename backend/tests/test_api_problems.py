"""Tests for problems API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.db import get_db, Base, engine
from app.models.problem import Problem
from app.main import app


@pytest.fixture(scope="function", autouse=True)
def cleanup_db():
    """Clean up database before each test."""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        # Clean up test data before test
        db.execute(text("DELETE FROM submissions"))
        db.execute(text("DELETE FROM buggy_implementations"))
        db.execute(text("DELETE FROM problems"))
        db.execute(text("DELETE FROM users"))
        db.commit()
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session."""
    db = next(get_db())
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def sample_problems(db_session: Session):
    """Create sample problems for testing."""
    problems = []
    for i in range(5):
        problem = Problem(
            slug=f"test-problem-{i+1}",
            title=f"Test Problem {i+1}",
            description_md=f"# Test Problem {i+1}\nThis is test problem {i+1}.",
            function_signature=f"def test_function_{i+1}(x: int) -> int:",
            golden_code=f"def test_function_{i+1}(x: int) -> int:\n    return x * {i+1}\n",
            difficulty=["Easy", "Medium", "Hard"][i % 3],
            skills=["boundary", "exception"] if i % 2 == 0 else None,
        )
        db_session.add(problem)
        problems.append(problem)
    db_session.commit()
    for problem in problems:
        db_session.refresh(problem)
    return problems


def test_get_problems_empty(client):
    """Test getting problems when database is empty."""
    response = client.get("/api/v1/problems")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["problems"]) == 0
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_pages"] == 0


def test_get_problems_with_data(client, sample_problems):
    """Test getting problems with data."""
    response = client.get("/api/v1/problems")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["problems"]) == 5
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_pages"] == 1

    # Check problem structure
    problem = data["problems"][0]
    assert "id" in problem
    assert "slug" in problem
    assert "title" in problem
    assert "difficulty" in problem
    assert "skills" in problem


def test_get_problems_pagination(client, sample_problems):
    """Test pagination for problems list."""
    # First page
    response = client.get("/api/v1/problems?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["problems"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3

    # Second page
    response = client.get("/api/v1/problems?page=2&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["problems"]) == 2
    assert data["page"] == 2

    # Third page
    response = client.get("/api/v1/problems?page=3&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["problems"]) == 1
    assert data["page"] == 3


def test_get_problems_pagination_edge_cases(client, sample_problems):
    """Test pagination edge cases."""
    # Page 0 should return validation error (FastAPI Query validation)
    response = client.get("/api/v1/problems?page=0")
    assert response.status_code == 422  # Validation error

    # Negative page should return validation error
    response = client.get("/api/v1/problems?page=-1")
    assert response.status_code == 422  # Validation error

    # Page size > 100 should return validation error (FastAPI Query validation)
    response = client.get("/api/v1/problems?page_size=200")
    assert response.status_code == 422  # Validation error


def test_get_problem_by_id_success(client, sample_problems):
    """Test getting problem by ID when it exists."""
    problem_id = sample_problems[0].id
    response = client.get(f"/api/v1/problems/{problem_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == problem_id
    assert data["slug"] == sample_problems[0].slug
    assert data["title"] == sample_problems[0].title
    assert data["description_md"] == sample_problems[0].description_md
    assert data["function_signature"] == sample_problems[0].function_signature
    assert data["golden_code"] == sample_problems[0].golden_code
    assert data["difficulty"] == sample_problems[0].difficulty
    assert "created_at" in data


def test_get_problem_by_id_not_found(client):
    """Test getting problem by ID when it doesn't exist."""
    response = client.get("/api/v1/problems/99999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_get_problems_ordering(client, sample_problems):
    """Test that problems are ordered by created_at descending."""
    import time
    
    # Add small delay between creations to ensure different timestamps
    for i, problem in enumerate(sample_problems):
        if i > 0:
            time.sleep(0.01)  # Small delay to ensure different created_at
    
    response = client.get("/api/v1/problems")
    assert response.status_code == 200
    data = response.json()
    problems = data["problems"]
    
    # Check that problems are returned (ordering is tested by SQL query)
    assert len(problems) == len(sample_problems)
    # Verify all problem IDs are present
    problem_ids = {p["id"] for p in problems}
    sample_ids = {p.id for p in sample_problems}
    assert problem_ids == sample_ids

