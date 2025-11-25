
# QA-Arena – AI-Assisted QA Coding Test Platform Spec

> Version: 0.1 (Draft)  
> Author: Julian (+ AI Copilot)  
> Scope: MVP + AI 통합 구조 설계

---

## 1. Product Overview

### 1.1. One-line Definition

**“QA 엔지니어의 테스트 설계/테스트 코드 작성 역량을 정량화하는, AI-보조 온라인 코딩 테스트 플랫폼 (Python + pytest 중심, 이후 확장)”**

### 1.2. Core Concept

- 사용자는 **테스트 대상 함수/모듈**이 주어졌을 때, pytest 기반 테스트 코드를 작성한다.
- 시스템은 **Golden Code(정답 구현)** + 여러 **Buggy Implementations(mutants)** 에 대해 사용자의 테스트 코드를 실행한다.
- 테스트가 **정상 구현은 통과**시키고, **버그 구현은 실패**시키는 정도를 기반으로 **QA 역량 점수**를 계산한다.
- 채점 결과(점수, kill ratio, 로그)를 기반으로 **AI가 자연어 피드백**을 생성한다.
- Admin은 **AI Problem Designer**를 이용하여 문제를 빠르게 생성하고, 검수 후 배포한다.

---

## 2. Architecture Overview

### 2.1. Components

- **Frontend (Web UI)**
  - Next.js (React + TypeScript)
  - Monaco Editor 기반 코드 에디터
  - REST API 호출로 문제 조회, 제출, 결과 조회

- **Backend API**
  - FastAPI (Python 3.11+)
  - 도메인 로직 / 영속성 / 인증(중기 이후) 담당
  - Celery Task 발행 (채점 비동기 처리)

- **Judge / Runner Service**
  - Celery Worker (Python)
  - Docker 기반 샌드박스 컨테이너 내에서 pytest 실행
  - Golden Code / Buggy Code 교체, 결과 로그 수집

- **AI Services**
  - `AI Problem Designer` (문제 자동 생성 보조)
  - `AI Feedback Engine` (채점 결과 → 자연어 피드백 변환)

- **Storage**
  - PostgreSQL: users, problems, buggy_implementations, submissions
  - (옵션) S3/Blob: 대형 코드 스니펫 / 로그 백업

- **Infra**
  - AWS EC2, Nginx, systemd
  - Redis: Celery broker + result backend

### 2.2. High-Level Request Flow

1. 사용자가 문제 목록/상세를 조회 → FastAPI → DB
2. 사용자가 테스트 코드를 제출 → FastAPI에서 DB에 submission 생성, Celery Task 발행
3. Celery Worker가 Docker 컨테이너에서 pytest 실행 → 점수/로그 산출
4. 결과를 DB에 업데이트 → (옵션) AI Feedback Engine 호출해 자연어 피드백 생성
5. 클라이언트는 Polling/실시간으로 결과 조회

---

## 3. Domain Model (DB Schema – 요약)

### 3.1. Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2. Problems

```sql
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description_md TEXT NOT NULL,
    function_signature TEXT NOT NULL,
    golden_code TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    skills JSONB,                -- 예: ["boundary", "exception", "negative_values"]
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3. Buggy Implementations (Mutants)

```sql
CREATE TABLE buggy_implementations (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),
    buggy_code TEXT NOT NULL,
    bug_description VARCHAR(255),
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4. Submissions

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    problem_id INTEGER REFERENCES problems(id),
    code TEXT NOT NULL,
    status VARCHAR(20), -- PENDING, RUNNING, SUCCESS, FAILURE, ERROR
    score INTEGER DEFAULT 0,
    killed_mutants INTEGER,
    total_mutants INTEGER,
    execution_log JSONB,
    feedback_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. AI Problem Designer

### 4.1. Responsibility

- Admin이 “문제 의도/핵심 평가 역량”만 자연어로 입력하면,
- 아래 항목을 자동 생성하는 서비스:
  - 함수 시그니처
  - Golden Code
  - 여러 Buggy Implementations
  - 문제 설명 (Markdown)
  - 초기 테스트 템플릿
  - skills, tags, difficulty

### 4.2. API Spec

**Endpoint:** `POST /api/admin/problems/ai-generate`  
**Auth:** Admin 전용 (JWT/Token 기반 – 중기 도입)

**Request Body 예시:**

```json
{
  "goal": "경계값 분석을 평가하는 QA 코딩 테스트 문제 생성",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["boundary value analysis", "negative input handling"],
  "difficulty": "Easy",
  "problem_style": "unit_test_for_single_function"
}
```

**Response Body 예시:**

```json
{
  "function_signature": "def sum_list(values: list[int]) -> int:",
  "golden_code": "def sum_list(values: list[int]) -> int:\n    return sum(values)\n",
  "buggy_implementations": [
    {
      "bug_description": "빈 리스트에서 예외 발생",
      "buggy_code": "def sum_list(values: list[int]) -> int:\n    return sum(values[1:])\n",
      "weight": 2
    },
    {
      "bug_description": "음수를 무시하는 버그",
      "buggy_code": "def sum_list(values: list[int]) -> int:\n    return sum(v for v in values if v > 0)\n",
      "weight": 3
    }
  ],
  "description_md": "## 문제 설명\n정수 리스트를 입력받아 합을 계산하는 함수 `sum_list`에 대한 테스트를 작성하세요...",
  "initial_test_template": "import pytest\nfrom target import sum_list\n\n# TODO: 테스트 케이스를 작성하세요.\n",
  "tags": ["boundary", "list"],
  "difficulty": "Easy"
}
```

### 4.3. Prompt Template (LLM용)

**System Prompt (개략):**

> 너는 테스트 자동화/QA 교육용 문제를 설계하는 시니어 SDET이다.  
> 입력으로 주어진 목표(goal), 평가하려는 기술(skills_to_assess)을 바탕으로,  
> Python + pytest 기반의 QA 코딩 테스트 문제를 생성하라.  
> 출력은 반드시 JSON 형식으로 반환한다. 코드는 실행 가능한 수준으로 작성한다.

**User Prompt 구조:**

```text
[GOAL]
{goal}

[LANGUAGE]
{language}

[TEST FRAMEWORK]
{testing_framework}

[SKILLS TO ASSESS]
{skills_to_assess}

[DIFFICULTY]
{difficulty}

[PROBLEM STYLE]
{problem_style}

[OUTPUT SCHEMA]
{JSON 스키마 설명}
```

LLM Output → JSON 파싱 검증 → DB에 저장.

---

## 5. AI Feedback Engine

### 5.1. Responsibility

- 채점 엔진이 산출한 **정량 결과(점수, kill ratio, pytest 로그)**를 입력으로 받아,
- 사용자에게 보여줄 **자연어 피드백**을 생성한다:
  - 잘한 점
  - 부족한 점
  - 추가로 작성하면 좋은 테스트 케이스 제안

### 5.2. API Spec

**Endpoint:** `POST /api/internal/ai/feedback` (내부 호출 전용)  

**Request Body 예시:**

```json
{
  "problem": {
    "title": "리스트 합계의 경계값 테스트",
    "description_md": "## 문제 설명 ...",
    "skills_to_assess": ["boundary", "negative_values", "empty_input"]
  },
  "submission": {
    "test_code": "import pytest\nfrom target import sum_list\n...",
    "score": 65,
    "killed_mutants": 4,
    "total_mutants": 10,
    "status": "SUCCESS",
    "pytest_stdout": "...pytest output..."
  }
}
```

**Response Body 예시:**

```json
{
  "summary": "기본적인 양수 입력 케이스는 잘 커버했지만, 음수와 빈 리스트에 대한 테스트가 부족합니다.",
  "strengths": [
    "정상 흐름에 대한 테스트를 잘 작성했습니다."
  ],
  "weaknesses": [
    "경계값(빈 리스트, 0)에 대한 케이스가 없습니다."
  ],
  "suggested_tests": [
    "빈 리스트([]) 입력에 대한 테스트를 추가해 보세요.",
    "음수가 포함된 리스트([-1, 1, 2])에 대한 테스트를 추가해 보세요."
  ],
  "score_adjustment": 0
}
```

### 5.3. Prompt 개략

> 너는 시니어 QA 코치이다.  
> 아래는 한 수강생이 작성한 pytest 테스트 코드와,  
> 그 테스트를 돌린 결과(점수, mutant kill ratio, pytest 로그)이다.  
> 이 수강생에게 피드백을 3가지 수준으로 제공하라:
> 1) 한 줄 요약 (summary)  
> 2) 잘한 점 (strengths: bullet list)  
> 3) 아쉬운 점 (weaknesses: bullet list)  
> 4) 추가로 작성하면 좋은 테스트 케이스(구체적인 input 예시 포함)  
> JSON으로만 응답하라.

---

## 6. Backend API (요약 버전)

### 6.1. 문제 목록 조회

- `GET /api/v1/problems`
- Query: `page`, `page_size`
- Response: 문제 메타데이터 목록

### 6.2. 문제 상세 조회

- `GET /api/v1/problems/{id}`
- Response:
  - title, description_md, function_signature
  - initial_test_template, difficulty, tags

### 6.3. 제출 생성

- `POST /api/v1/submissions`
- Body:
  ```json
  {
    "problem_id": 1,
    "code": "import pytest\nfrom target import sum_list\n..."
  }
  ```
- 처리:
  - submissions row 생성 (status=PENDING)
  - Celery Task 발행 (`process_submission.delay(submission_id)`)
  - `submission_id` 반환

### 6.4. 제출 결과 조회

- `GET /api/v1/submissions/{id}`
- Response:
  - status, score, killed_mutants, total_mutants, feedback_json, execution_log 일부

---

## 7. Judge / Runner 상세

### 7.1. Docker 컨테이너 환경

- Base Image: `python:3.11-slim`
- Installed:
  - pytest
  - (추가 필요 시) hypothesis 등

### 7.2. 실행 디렉토리 구조 (컨테이너 내부)

```text
/workdir/
  target.py          # golden_code 또는 buggy_code
  test_user.py       # 사용자가 제출한 코드
  conftest.py        # 공통 fixture, 보안 제한 로직
```

### 7.3. 실행 커맨드

```bash
cd /workdir && pytest -q --disable-warnings --maxfail=1
```

### 7.4. 보안 제한 (MVP 수준)

- conftest.py에서 문제 되는 모듈 임포트 시 에러 유도:
  - os, sys, subprocess, socket 등
- pytest 실행 timeout (예: 3~5초)
- Docker 컨테이너에 네트워크 비활성화 옵션 적용

---

## 8. 주요 실행 플로우

### 8.1. Admin – AI 기반 문제 생성 플로우

1. Admin이 Admin UI에서 문제 생성 페이지 진입
2. “AI로 초안 생성” 영역에 goal/skills/difficulty 입력
3. `POST /api/admin/problems/ai-generate` 호출 → LLM
4. 응답 JSON을 화면에 표시
5. Admin이 description, 코드 등 검수/수정
6. “문제 저장” 클릭 → `problems`, `buggy_implementations` 에 저장

### 8.2. 사용자의 제출/채점 플로우

1. 사용자가 UI에서 문제 선택 → 상세 조회
2. Monaco Editor에 initial_test_template 로딩
3. 사용자가 테스트 코드 작성 후 “채점하기” 클릭
4. `POST /api/v1/submissions` → submission_id 반환
5. Celery Worker:
   - Golden Code로 target.py 생성 후 pytest 실행
   - 실패 시 score=0, status=FAILURE, 종료
   - 성공 시, 각 buggy_code로 target.py 교체하며 pytest 반복 실행
   - 잡힌 버그 수/총 mutant 수로 killed_mutants, total_mutants 계산
   - score 계산 후 DB 업데이트
   - AI Feedback Engine 호출, feedback_json 저장
6. 클라이언트는 `GET /api/v1/submissions/{id}` Polling으로 결과 확인

---

## 9. Code Skeleton (요약)

### 9.1. FastAPI 앱 구조 예시

```bash
app/
  main.py
  api/
    __init__.py
    problems.py
    submissions.py
    admin.py
  services/
    problem_service.py
    submission_service.py
    ai_problem_designer.py
    ai_feedback_engine.py
  workers/
    tasks.py
  models/
    __init__.py
    db.py
    problem.py
    submission.py
  core/
    config.py
    logging.py
```

**app/main.py** (의사 코드):

```python
from fastapi import FastAPI
from app.api import problems, submissions, admin

app = FastAPI()

app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(submissions.router, prefix="/api/v1/submissions", tags=["submissions"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
```

### 9.2. Celery Task Skeleton

```python
from celery import Celery
from app.services import submission_service

celery_app = Celery(
    "qa_arena",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/1",
)

@celery_app.task
def process_submission_task(submission_id: str):
    submission_service.process_submission(submission_id)
```

### 9.3. Submission Processing Skeleton

```python
def process_submission(submission_id: str):
    submission = submission_repo.get(submission_id)
    problem = problem_repo.get(submission.problem_id)

    # 1) Golden code 실행
    golden_result = run_pytest_in_docker(
        golden_code=problem.golden_code,
        user_test_code=submission.code,
    )
    if not golden_result.all_tests_passed:
        submission.status = "FAILURE"
        submission.score = 0
        submission.execution_log = {"golden": golden_result.to_dict()}
        submission_repo.save(submission)
        return

    # 2) Buggy 코드들 실행
    mutants = buggy_repo.list_by_problem(problem.id)
    killed = 0
    mutant_logs = []
    for m in mutants:
        result = run_pytest_in_docker(
            golden_code=m.buggy_code,
            user_test_code=submission.code,
        )
        mutant_logs.append(result.to_dict())
        if result.any_test_failed:
            killed += m.weight

    total_weight = sum(m.weight for m in mutants) or 1
    kill_ratio = killed / total_weight

    # 3) 점수 계산 (예시)
    base_score = 30
    score = base_score + int(kill_ratio * 70)

    # 4) AI 피드백 생성
    feedback = ai_feedback_engine.generate_feedback(
        problem=problem,
        submission=submission,
        kill_ratio=kill_ratio,
        logs={
            "golden": golden_result.to_dict(),
            "mutants": mutant_logs,
        },
        score=score,
    )

    submission.status = "SUCCESS"
    submission.score = score
    submission.killed_mutants = killed
    submission.total_mutants = total_weight
    submission.execution_log = {
        "golden": golden_result.to_dict(),
        "mutants": mutant_logs,
    }
    submission.feedback_json = feedback
    submission_repo.save(submission)
```

---

이 파일은 전체 시스템의 개략적인 Tech Spec / 아키텍처 / AI 통합 구조를 담고 있으며,  
이후 세부 구현 시 AI와 “바이브 코딩”할 수 있는 기준 문서로 사용될 수 있습니다.
