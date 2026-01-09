# Pytest 테스트 패턴 예시

> QA Labs 프로젝트에서 사용하는 pytest 테스트 패턴

---

## 1. 기본 단위 테스트

```python
import pytest
from app.services.validation import validate_age

class TestValidateAge:
    """나이 검증 함수 테스트"""

    # === 정상 케이스 ===
    def test_valid_age_minimum(self):
        """최소 유효 나이"""
        assert validate_age(0) == True

    def test_valid_age_maximum(self):
        """최대 유효 나이"""
        assert validate_age(120) == True

    def test_valid_age_middle(self):
        """중간 값"""
        assert validate_age(25) == True

    # === 경계값 테스트 ===
    def test_boundary_below_minimum(self):
        """최소값 미만"""
        with pytest.raises(ValueError, match="나이는 0 이상"):
            validate_age(-1)

    def test_boundary_above_maximum(self):
        """최대값 초과"""
        with pytest.raises(ValueError, match="나이는 120 이하"):
            validate_age(121)

    # === 타입 테스트 ===
    def test_invalid_type_string(self):
        """문자열 입력"""
        with pytest.raises(TypeError):
            validate_age("25")

    def test_invalid_type_none(self):
        """None 입력"""
        with pytest.raises(TypeError):
            validate_age(None)

    def test_invalid_type_float(self):
        """실수 입력"""
        with pytest.raises(TypeError):
            validate_age(25.5)

    def test_invalid_type_bool(self):
        """bool 입력 (int 서브클래스지만 금지)"""
        with pytest.raises(TypeError):
            validate_age(True)
```

---

## 2. Fixture 활용

```python
import pytest
from sqlalchemy.orm import Session
from app.models import User, Problem, Submission

@pytest.fixture
def sample_user(db_session: Session) -> User:
    """테스트용 사용자 생성"""
    user = User(
        email="test@example.com",
        username="testuser",
        provider="github"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def sample_problem(db_session: Session) -> Problem:
    """테스트용 문제 생성"""
    problem = Problem(
        title="테스트 문제",
        description="설명",
        difficulty="easy",
        category="validation"
    )
    db_session.add(problem)
    db_session.commit()
    return problem

class TestSubmissionService:
    def test_create_submission(
        self,
        db_session: Session,
        sample_user: User,
        sample_problem: Problem
    ):
        """제출 생성 테스트"""
        service = SubmissionService(db_session)

        submission = service.create(
            user_id=sample_user.id,
            problem_id=sample_problem.id,
            code="def test(): pass"
        )

        assert submission.status == "pending"
        assert submission.user_id == sample_user.id
```

---

## 3. 파라미터화 테스트

```python
import pytest

class TestValidation:
    @pytest.mark.parametrize("input_value,expected", [
        (0, True),
        (1, True),
        (50, True),
        (119, True),
        (120, True),
    ])
    def test_valid_ages(self, input_value, expected):
        """유효한 나이 범위"""
        assert validate_age(input_value) == expected

    @pytest.mark.parametrize("invalid_input,error_type", [
        (-1, ValueError),
        (-100, ValueError),
        (121, ValueError),
        (1000, ValueError),
        ("abc", TypeError),
        (None, TypeError),
        ([], TypeError),
        ({}, TypeError),
    ])
    def test_invalid_inputs(self, invalid_input, error_type):
        """잘못된 입력"""
        with pytest.raises(error_type):
            validate_age(invalid_input)
```

---

## 4. 비동기 테스트

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
class TestSubmissionAPI:
    async def test_submit_code_success(self, auth_headers):
        """코드 제출 성공"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/submissions/",
                headers=auth_headers,
                json={
                    "problem_id": 1,
                    "code": "def test_example(): assert True"
                }
            )

        assert response.status_code == 200
        data = response.json()
        assert "submission_id" in data
        assert data["status"] == "pending"

    async def test_submit_code_unauthorized(self):
        """인증 없이 제출 시도"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/submissions/",
                json={"problem_id": 1, "code": "..."}
            )

        assert response.status_code == 401
```

---

## 5. Mock 활용

```python
import pytest
from unittest.mock import Mock, patch, AsyncMock

class TestFeedbackService:
    @patch("app.services.feedback_service.openai_client")
    def test_generate_feedback(self, mock_openai):
        """AI 피드백 생성"""
        # Mock 설정
        mock_openai.chat.completions.create = AsyncMock(
            return_value=Mock(
                choices=[Mock(message=Mock(content="피드백 내용"))]
            )
        )

        service = FeedbackService()
        result = service.generate(submission_id=1)

        assert result.content == "피드백 내용"
        mock_openai.chat.completions.create.assert_called_once()

    @patch("app.services.docker_service.docker_client")
    def test_run_judge_container(self, mock_docker):
        """Judge 컨테이너 실행"""
        mock_container = Mock()
        mock_container.wait.return_value = {"StatusCode": 0}
        mock_docker.containers.run.return_value = mock_container

        result = run_judge(code="...", problem_id=1)

        assert result["success"] == True
```

---

## 6. 뮤테이션 테스트 패턴

```python
class TestMutationDetection:
    """
    이 테스트들은 Golden 코드에서 통과하고,
    Buggy 코드에서 실패해야 뮤턴트를 탐지합니다.
    """

    def test_detects_off_by_one_upper(self):
        """상한 경계값 오류 탐지"""
        # Buggy: age <= 119 (120 포함 안함)
        assert validate_age(120) == True

    def test_detects_off_by_one_lower(self):
        """하한 경계값 오류 탐지"""
        # Buggy: age >= 1 (0 포함 안함)
        assert validate_age(0) == True

    def test_detects_wrong_comparison(self):
        """비교 연산자 오류 탐지"""
        # Buggy: age > 0 대신 age >= 0
        with pytest.raises(ValueError):
            validate_age(-1)

    def test_detects_missing_type_check(self):
        """타입 체크 누락 탐지"""
        # Buggy: isinstance 체크 없음
        with pytest.raises(TypeError):
            validate_age("25")
```

---

## 7. conftest.py 템플릿

```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.core.config import settings

# 테스트용 DB
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    """테스트 DB 엔진"""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(engine):
    """각 테스트용 DB 세션"""
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture
def auth_headers(sample_user):
    """인증 헤더"""
    from app.core.auth import create_access_token
    token = create_access_token({"sub": str(sample_user.id)})
    return {"Authorization": f"Bearer {token}"}
```

---

*pytest 테스트 패턴 v1.0 - QA Labs*
