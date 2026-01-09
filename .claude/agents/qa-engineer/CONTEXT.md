# QA Engineer Agent Context

> 테스트 전문 에이전트를 위한 축소 컨텍스트

---

## 프로젝트 개요

**QA Labs (QA Arena)**: 뮤테이션 테스트 기반 코딩 테스트 플랫폼

### 핵심 채점 방식
1. **Golden Code**: 정답 구현 (테스트 통과해야 함)
2. **Buggy Code**: 의도적 버그 포함 (테스트로 탐지해야 함)
3. **Mutation Score**: 버기 코드 탐지율 = 점수

---

## 테스트 구조

### Backend (pytest)
```
backend/
├── tests/
│   ├── conftest.py          # 공용 fixture
│   ├── test_api/             # API 엔드포인트 테스트
│   │   ├── test_auth.py
│   │   ├── test_problems.py
│   │   ├── test_submissions.py
│   │   └── test_feedback.py
│   ├── test_services/        # 서비스 로직 테스트
│   │   ├── test_submission_service.py
│   │   └── test_feedback_service.py
│   └── test_models/          # 모델 테스트
```

### Frontend (Jest + Playwright)
```
frontend/
├── __tests__/                # Jest 단위 테스트
│   ├── components/
│   └── lib/
├── e2e/                      # Playwright E2E
│   └── *.spec.ts
```

---

## 테스트 실행 명령

### Backend
```bash
# 전체 테스트
cd backend && pytest

# 특정 파일
pytest tests/test_api/test_submissions.py

# 특정 테스트
pytest tests/test_api/test_submissions.py::test_submit_success

# 커버리지
pytest --cov=app --cov-report=html

# 상세 출력
pytest -v --tb=short
```

### Frontend
```bash
# Jest 테스트
cd frontend && npm test

# 특정 파일
npm test -- --testPathPattern=components

# E2E (Playwright)
npx playwright test
```

---

## 주요 테스트 패턴

### 1. API 테스트 (pytest + httpx)
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_submit_code():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/submissions/",
            json={"problem_id": 1, "code": "def test(): pass"}
        )
        assert response.status_code == 200
```

### 2. 서비스 테스트
```python
import pytest
from app.services.submission_service import SubmissionService

class TestSubmissionService:
    @pytest.fixture
    def service(self, db_session):
        return SubmissionService(db_session)

    def test_create_submission(self, service):
        result = service.create(...)
        assert result.status == "pending"
```

### 3. 뮤테이션 테스트 검증
```python
def test_detects_boundary_bug():
    """경계값 버그를 탐지하는지 검증"""
    # 이 테스트는 buggy 코드에서 실패해야 함
    result = validate_age(120)
    assert result == True  # Golden: True, Buggy: False
```

---

## Fixture 사용법

### conftest.py 주요 fixture
```python
@pytest.fixture
def db_session():
    """테스트용 DB 세션"""

@pytest.fixture
def test_user(db_session):
    """테스트 사용자"""

@pytest.fixture
def test_problem(db_session):
    """테스트 문제"""

@pytest.fixture
def auth_headers(test_user):
    """인증 헤더"""
```

---

## 테스트 작성 시 주의사항

### QA Labs 특화 규칙

1. **뮤턴트 탐지율 고려**
   - 테스트는 Golden 통과 + Buggy 실패해야 의미 있음
   - 단순 존재 여부 체크는 낮은 탐지율

2. **경계값 필수**
   - 숫자 범위: min, max, min-1, max+1
   - 문자열: 빈값, 공백, 특수문자

3. **예외 타입 검증**
   - TypeError: 타입 불일치
   - ValueError: 값 범위/형식 오류

4. **독립성 유지**
   - DB 상태 의존 금지
   - fixture로 필요 데이터 생성

---

## 참조 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| API 명세 | `docs/claude-context/api-reference.md` | 엔드포인트 정보 |
| DB 스키마 | `docs/claude-context/db-schema.md` | 테이블 구조 |
| 문제 출제 정책 | `docs/specs/problem-policy.md` | 테스트 기준 |

---

## 제한 사항

- 테스트 파일만 생성/수정 (`**/tests/**`, `**/__tests__/**`)
- 소스 코드는 읽기만 가능 (수정은 제안만)
- Docker, 인프라 관련 명령 금지

---

*QA Engineer Agent 전용 컨텍스트 v1.0*
