
# QA-Arena – AI-Assisted QA Coding Test Platform Spec

> Version: 0.5 (Updated 2025-12-28)
> Scope: MVP + AI 통합 + GitHub OAuth 인증 + 모니터링 통합 + **클라이언트 사이드 실행(Pyodide)** + **토큰 시스템** + **테스트 품질 분석** + **AI 코치**

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
  - **Pyodide (WebAssembly Python)** + Web Worker 기반 클라이언트 사이드 채점
  - Sentry 클라이언트 에러 모니터링

- **Backend API**
  - FastAPI (Python 3.11+)
  - 도메인 로직 / 영속성 / 인증 담당
  - GitHub OAuth 인증 + JWT 토큰 기반 세션 관리
  - 클라이언트 실행 결과 저장 또는 Celery Task 발행 (조건부)
  - Rate Limiter (slowapi 기반)
  - Sentry 서버 에러 모니터링

- **Judge / Runner Service** (하이브리드 아키텍처)
  - **클라이언트 사이드 (기본)**
    - Pyodide (WebAssembly Python) + 브라우저 Web Worker
    - 즉각적인 피드백 (~밀리초), 서버 부하 없음
    - 조건: `isPyodideReady && buggy_implementations.length > 0`
  - **서버 사이드 (Fallback)**
    - Celery Worker + Docker 컨테이너
    - Pyodide 미지원 환경 또는 복잡한 테스트용
    - Docker-in-Docker 환경 (`/tmp/qa_arena_judge` 공유 볼륨)

- **Worker Health Monitor**
  - 별도 컨테이너에서 주기적으로 Celery Worker 상태 및 Health Check 엔드포인트를 점검
  - 이상 징후(워커 미응답 등) 발생 시 Slack 알림 발송
  - 자동 복구 감지 및 알림

- **AI Services**
  - `AI Problem Designer` (문제 자동 생성 보조)
  - `AI Feedback Engine` (채점 결과 → 자연어 피드백 변환)
  - `AI Coach` (실시간 학습 도우미 채팅)
  - `AI Test Generator` (Admin용 테스트 코드 자동 생성)
  - `Test Hint Generator` (사용자용 텍스트 힌트 생성)
  - OpenAI API 기반 (gpt-4o-mini 등)

- **Test Quality System**
  - 테스트 코드 품질 자동 분석 (AST 기반)
  - 카테고리 분류 (ValueType, InputDiversity, TestPurpose)
  - AntiPattern 감지 및 감점
  - 등급 산출 (A/B/C/D/F)

- **Token System**
  - 일/월 단위 토큰 할당 및 리셋
  - AI 기능 사용량 관리
  - 기본 피드백 무료, 고급 기능 토큰 차감

- **Storage**
  - PostgreSQL: users, problems, buggy_implementations, submissions, bookmarked_problems, ai_conversations, analysis_runs
  - Redis: Celery broker + result backend + 캐싱

- **Infra**
  - AWS EC2, Docker Compose, Nginx
  - Let's Encrypt SSL 인증서
  - Sentry 에러 모니터링

### 2.2. High-Level Request Flow (하이브리드)

1. 사용자가 문제 목록/상세를 조회 → FastAPI → DB
2. 사용자가 테스트 코드를 제출:
   - **[클라이언트 경로]** Pyodide 준비 + buggy_implementations 존재 시:
     - 프론트엔드에서 Pyodide로 mutation test 실행
     - 결과(`ClientExecutionResult`)와 함께 API 호출
     - 서버는 결과 저장만 (Celery 스킵)
     - 즉시 응답 반환
   - **[서버 경로]** Pyodide 미준비 또는 buggy_implementations 없을 시:
     - API 호출 → submission 생성 (PENDING)
     - Celery Task 발행 (`process_submission_task`)
     - Worker가 Docker에서 pytest 실행
     - 클라이언트는 Polling으로 결과 확인
3. AI Feedback Engine 호출:
   - 클라이언트 경로: `generate_feedback_task.delay()` (비동기)
   - 서버 경로: `process_submission` 내에서 동기 호출
4. 클라이언트에서 결과 표시

---

## 3. Domain Model (DB Schema – 요약)

### 3.1. Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- GitHub OAuth fields
    github_id VARCHAR(50) UNIQUE,
    github_username VARCHAR(100),
    avatar_url VARCHAR(500),

    -- Account status
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Token system for AI features
    token_balance INTEGER DEFAULT 100 NOT NULL,      -- 월간 토큰 할당량
    token_used INTEGER DEFAULT 0 NOT NULL,           -- 이번 달 사용량
    token_reset_at TIMESTAMP WITH TIME ZONE,         -- 다음 월간 리셋 시각
    daily_bonus_used INTEGER DEFAULT 0 NOT NULL,     -- 오늘 사용한 보너스 (최대 3)
    daily_bonus_reset_at TIMESTAMP WITH TIME ZONE,   -- 다음 일간 리셋 시각
    tier VARCHAR(20) DEFAULT 'free' NOT NULL         -- free / premium
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
    difficulty VARCHAR(20) CHECK (difficulty IN ('Very Easy', 'Easy', 'Medium', 'Hard')) NOT NULL,
    domain VARCHAR(20) CHECK (domain IN ('common', 'fintech', 'commerce', 'saas', 'platform', 'content'))
           DEFAULT 'common' NOT NULL,     -- 문제 도메인 분류
    skills JSONB,                          -- 예: ["boundary", "exception", "negative_values"]
    summary TEXT,                          -- 핵심 테스트 포인트 요약 (마크다운)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Rubric Evaluation (테스트 품질 시스템)
    rubric_score FLOAT,                    -- 문제 루브릭 점수 (0.0 ~ 100.0)
    rubric_analysis JSONB                  -- RubricAnalysis JSON
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
    user_id UUID REFERENCES users(id),              -- nullable (비회원 제출 지원)
    anonymous_id VARCHAR(36),                        -- 비회원 식별자
    problem_id INTEGER NOT NULL REFERENCES problems(id),
    code TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
           CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILURE', 'ERROR')),
    score INTEGER NOT NULL DEFAULT 0,
    killed_mutants INTEGER,
    total_mutants INTEGER,
    execution_log JSONB,
    feedback_json JSONB,
    progress JSONB,                                  -- {"step": "testing_buggy", "current": 2, "total": 4, "percent": 50}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Test Quality Evaluation (테스트 품질 시스템)
    test_quality_score FLOAT,                        -- 품질 점수 (0.0 ~ 100.0)
    test_quality_grade VARCHAR(1),                   -- 등급 (A/B/C/D/F)
    test_quality_analysis JSONB,                     -- TestQualityAnalysis JSON

    -- Constraint: 회원 또는 비회원 중 하나는 반드시 존재
    CONSTRAINT submissions_user_or_anonymous_check CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);
```

### 3.5. Bookmarked Problems (북마크)

```sql
CREATE TABLE bookmarked_problems (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, problem_id)
);
```

### 3.6. AI Conversations (AI 코치 대화)

```sql
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER REFERENCES problems(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    messages JSONB NOT NULL DEFAULT '[]',            -- 대화 메시지 배열
    token_cost INTEGER DEFAULT 0,                     -- 소비된 토큰
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.7. Analysis Runs (테스트 품질 분석 기록)

```sql
CREATE TABLE analysis_runs (
    id SERIAL PRIMARY KEY,
    submission_id UUID REFERENCES submissions(id),   -- 제출 분석 시
    problem_id INTEGER REFERENCES problems(id),      -- 문제 루브릭 분석 시
    scope VARCHAR(20) NOT NULL,                      -- 'submission' / 'problem_rubric'
    parser_version VARCHAR(10),                      -- 파서 버전
    scoring_version VARCHAR(10),                     -- 점수 모델 버전
    source_hash VARCHAR(32),                         -- 분석 대상 코드의 MD5
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- PENDING/RUNNING/SUCCESS/ERROR
    confidence_score FLOAT,                          -- 분석 신뢰도 (0.0~1.0)
    result JSONB,                                    -- 분석 결과
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: submission 또는 problem 중 하나만 존재
    CONSTRAINT analysis_runs_scope_check CHECK (
        (scope = 'submission' AND submission_id IS NOT NULL AND problem_id IS NULL) OR
        (scope = 'problem_rubric' AND problem_id IS NOT NULL AND submission_id IS NULL)
    )
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

### 6.1. 인증 API (`/api/v1/auth`)

- `GET /api/v1/auth/github` - GitHub OAuth 로그인 시작
- `GET /api/v1/auth/github/callback` - GitHub OAuth 콜백 처리
- `POST /api/v1/auth/logout` - 로그아웃
- `GET /api/v1/auth/me` - 현재 사용자 정보 조회
- `POST /api/v1/auth/refresh` - 토큰 갱신

### 6.2. 문제 API (`/api/v1/problems`)

- `GET /api/v1/problems` - 문제 목록 조회
  - Query: `page`, `page_size`, `difficulty`, `skills`
- `GET /api/v1/problems/{slug}` - 문제 상세 조회
- `POST /api/v1/problems/{problem_id}/bookmark` - 북마크 토글

### 6.3. 제출 API (`/api/v1/submissions`)

- `POST /api/v1/submissions` - 제출 생성
  - Body:
    ```json
    {
      "problem_id": 1,
      "code": "import pytest\nfrom target import sum_list\n...",
      "client_result": {
        "golden_code_passed": true,
        "mutants_killed": 4,
        "total_mutants": 5,
        "score": 86,
        "details": [...],
        "total_execution_time": 1234.56
      }
    }
    ```
  - 처리:
    - `client_result` 존재 시 (클라이언트 사이드 실행):
      - 결과 저장만 수행 (Celery 스킵)
      - status = SUCCESS 또는 FAILURE 즉시 설정
      - 회원인 경우 `generate_feedback_task.delay()` 발행
    - `client_result` 없을 시 (서버 사이드 Fallback):
      - submissions row 생성 (status=PENDING)
      - Celery Task 발행 (`process_submission_task.delay(submission_id)`)
    - `submission_id` 반환

- `GET /api/v1/submissions/{id}` - 제출 결과 조회
  - Response: status, score, killed_mutants, total_mutants, feedback_json, progress

- `GET /api/v1/submissions` - 사용자 제출 내역 조회

### 6.4. 사용자 API (`/api/v1/users`)

- `GET /api/v1/users/me` - 현재 사용자 정보
- `GET /api/v1/users/me/submissions` - 제출 히스토리
- `GET /api/v1/users/me/stats` - 사용자 통계

### 6.5. 관리자 API (`/api/admin`)

- `POST /api/admin/problems/ai-generate` - AI로 문제 생성
- `POST /api/admin/problems` - 문제 저장

### 6.6. 헬스 체크 API (`/healthz`)

- `GET /healthz` - 전체 시스템 헬스 체크
- `GET /healthz/worker` - Celery Worker 상태 확인

### 6.7. AI 코치 API (`/api/v1/ai`)

- `POST /api/v1/ai/coach` - AI 코치와 채팅
  - Body:
    ```json
    {
      "message": "경계값 테스트가 뭔가요?",
      "problem_id": 1,
      "submission_id": "uuid"
    }
    ```
  - 토큰: 1 토큰 차감
- `GET /api/v1/ai/conversations` - 대화 이력 조회
- `GET /api/v1/ai/conversations/{id}` - 특정 대화 조회

### 6.8. 테스트 품질 API (`/api/v1/test-quality`)

**사용자 엔드포인트:**
- `GET /api/v1/test-quality/submissions/{id}/quality` - 품질 분석 조회
- `GET /api/v1/test-quality/submissions/{id}/hints` - 힌트 조회 (코드 미포함)

**Admin 엔드포인트:**
- `POST /api/v1/test-quality/admin/analyze-submission/{id}` - 제출 분석 실행
- `POST /api/v1/test-quality/admin/analyze-problem/{id}` - 문제 루브릭 분석
- `GET /api/v1/test-quality/admin/statistics` - 통계 조회
- `POST /api/v1/test-quality/admin/generate-tests/{problem_id}` - AI 테스트 생성

### 6.9. 진행률 API (`/api/v1`)

- `GET /api/v1/problems/{id}/progress` - 문제 진행률 조회 (현재 사용자 기준)

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

### 7.4. 보안 제한 (MVP 수준) - 서버 사이드

- conftest.py에서 문제 되는 모듈 임포트 시 에러 유도:
  - os, sys, subprocess, socket 등
- pytest 실행 timeout (예: 3~5초)
- Docker 컨테이너에 네트워크 비활성화 옵션 적용

### 7.5. 클라이언트 사이드 실행 (Pyodide)

#### 실행 환경
- **런타임**: Pyodide (WebAssembly Python 3.11)
- **위치**: 브라우저 Web Worker (별도 스레드)
- **패키지**: micropip으로 pytest 동적 설치

#### 실행 흐름
1. Pyodide Worker 초기화 (CDN에서 로드)
2. pytest 설치
3. Golden Code 테스트 → 실패 시 즉시 FAILURE
4. Buggy Implementations 순회 테스트
5. Kill ratio 및 점수 계산
6. `ClientExecutionResult` 반환

#### 보안 및 제한 사항
- 네트워크 접근 불가 (브라우저 샌드박스)
- 파일 시스템 가상화 (Emscripten FS)
- 일부 C 확장 모듈 미지원

#### Fallback 조건
- Pyodide 초기화 실패 (CDN, 브라우저 호환성)
- `buggy_implementations` 없음
- SharedArrayBuffer 미지원 브라우저

---

## 8. 주요 실행 플로우

### 8.1. Admin – AI 기반 문제 생성 플로우

1. Admin이 Admin UI에서 문제 생성 페이지 진입
2. “AI로 초안 생성” 영역에 goal/skills/difficulty 입력
3. `POST /api/admin/problems/ai-generate` 호출 → LLM
4. 응답 JSON을 화면에 표시
5. Admin이 description, 코드 등 검수/수정
6. “문제 저장” 클릭 → `problems`, `buggy_implementations` 에 저장

### 8.2. 사용자의 제출/채점 플로우 (하이브리드)

#### 클라이언트 사이드 경로 (기본)
1. 사용자가 UI에서 문제 선택 → 상세 조회
2. Monaco Editor에 initial_test_template 로딩
3. Pyodide 백그라운드 초기화 (자동)
4. 사용자가 테스트 코드 작성 후 "채점하기" 클릭
5. 프론트엔드에서 Pyodide Worker로 mutation test 실행:
   - Golden Code 테스트
   - 각 Buggy Implementation 테스트
   - Score 계산
6. `POST /api/v1/submissions` (`client_result` 포함)
   - 서버는 DB 저장만 수행 (Celery 스킵)
   - status = SUCCESS 또는 FAILURE
7. 회원인 경우 `generate_feedback_task.delay()` 발행
8. 즉시 응답 반환 → UI에 결과 표시

#### 서버 사이드 경로 (Fallback)
1-4. (동일)
5. `POST /api/v1/submissions` (`client_result` 없음)
   - submission 생성 (status = PENDING)
   - `process_submission_task.delay()` 발행
6. Celery Worker:
   - 상태 변경: PENDING → RUNNING
   - Docker 컨테이너에서 pytest 실행
   - Golden Code 테스트 → 실패 시 FAILURE
   - Buggy Code 테스트들
   - Score 계산 + AI 피드백 생성 (동기)
   - 상태 변경: RUNNING → SUCCESS
7. 클라이언트는 `GET /api/v1/submissions/{id}` Polling (2초 간격)
8. 상태 변경 감지 → UI에 결과 표시

---

## 9. Code Skeleton (요약)

### 9.1. FastAPI 앱 구조

```bash
backend/
  app/
    main.py                      # FastAPI 앱 진입점 + 미들웨어/예외 핸들러
    api/
      __init__.py
      admin.py                   # 관리자 API (문제 생성)
      ai.py                      # AI 코치 API
      auth.py                    # GitHub OAuth + JWT 인증
      health.py                  # 헬스 체크 엔드포인트
      problems.py                # 문제 CRUD
      progress.py                # 진행률 API
      submissions.py             # 제출 처리
      test_quality.py            # 테스트 품질 API
      users.py                   # 사용자 정보
    services/
      ai_coach_service.py        # AI 코치 서비스
      ai_feedback_engine.py      # AI 피드백 생성
      ai_problem_designer.py     # AI 문제 생성
      ai_test_generator.py       # AI 테스트 코드 생성 (Admin용)
      docker_service.py          # Docker 컨테이너 관리
      github_oauth.py            # GitHub OAuth 클라이언트
      idempotency_guard.py       # 중복 요청 방지
      judge_service.py           # 채점 로직
      problem_service.py         # 문제 비즈니스 로직
      progress_service.py        # 진행률 서비스
      slack_notifier.py          # Slack 알림
      submission_service.py      # 제출 비즈니스 로직
      test_case_parser.py        # 테스트 코드 AST 파싱
      test_hint_generator.py     # 사용자용 힌트 생성
      test_quality_analyzer.py   # 테스트 품질 분석 엔진
      test_quality_classifier.py # 테스트 분류기
      token_service.py           # 토큰 관리 서비스
      worker_monitor.py          # 워커 모니터링
    repositories/
      ai_repository.py           # AI 대화 데이터 접근
      buggy_implementation_repository.py
      problem_repository.py      # 문제 데이터 접근
      submission_repository.py   # 제출 데이터 접근
      test_quality_repository.py # 테스트 품질 데이터 접근
    schemas/
      ai.py                      # AI 관련 스키마
      auth.py                    # 인증 Pydantic 스키마
      buggy_implementation.py
      problem.py                 # 문제 스키마
      progress.py                # 진행률 스키마
      submission.py              # 제출 스키마
      test_quality.py            # 테스트 품질 스키마
      user.py                    # 사용자 스키마
    models/
      __init__.py
      ai_conversation.py         # AI 대화 모델
      bookmarked_problem.py      # BookmarkedProblem ORM 모델
      buggy_implementation.py    # BuggyImplementation ORM 모델
      db.py                      # DB 연결 설정
      problem.py                 # Problem ORM 모델
      submission.py              # Submission ORM 모델
      test_quality.py            # AnalysisRun ORM 모델
      user.py                    # User ORM 모델
    middleware/
      anonymous.py               # 비회원 ID 미들웨어
    workers/
      tasks.py                   # Celery 태스크 정의
      monitor_scheduler.py       # 워커 모니터 스케줄러
    core/
      celery_app.py              # Celery 앱 설정
      config.py                  # 설정 (환경 변수)
      logging.py                 # 로깅 설정
      rate_limiter.py            # Rate Limiter 설정
      sentry.py                  # Sentry 설정
  alembic/                       # DB 마이그레이션
  scripts/                       # 유틸리티 스크립트
    coverage_spike.py            # 테스트 품질 스파이크
  tests/                         # 테스트 코드
  Dockerfile
  requirements.txt
```

**app/main.py** (실제 구조):

```python
from fastapi import FastAPI
from app.api import problems, submissions, admin, health, auth, users, ai, test_quality, progress
from app.middleware.anonymous import AnonymousIDMiddleware

app = FastAPI()

# Rate Limiter, CORS, Exception Handlers 설정...
app.add_middleware(AnonymousIDMiddleware)  # 비회원 ID 미들웨어

app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(submissions.router, prefix="/api/v1/submissions", tags=["submissions"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(health.router, prefix="/healthz", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(test_quality.router, prefix="/api/v1/test-quality", tags=["test-quality"])
app.include_router(progress.router, prefix="/api/v1", tags=["progress"])
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

### 9.4. 클라이언트 결과 처리 (submissions.py)

```python
# backend/app/api/submissions.py (라인 102-162)
client_result = submission_data.client_result

if client_result:
    # 클라이언트 사이드 실행 - Celery 스킵
    submission_status = "SUCCESS" if client_result.golden_code_passed else "FAILURE"

    execution_log = {
        "execution_mode": "client",
        "golden_code_passed": client_result.golden_code_passed,
        "total_execution_time_ms": client_result.total_execution_time,
        "mutant_details": [...]
    }

    submission = Submission(
        status=submission_status,
        score=client_result.score,
        killed_mutants=client_result.mutants_killed,
        total_mutants=client_result.total_mutants,
        execution_log=execution_log,
        ...
    )

    # 회원이고 SUCCESS인 경우 AI 피드백 비동기 생성
    if user_id and submission_status == "SUCCESS":
        generate_feedback_task.delay(submission.id)
else:
    # 서버 사이드 실행 - Celery로 처리
    submission = Submission(status="PENDING", ...)
    process_submission_task.delay(submission.id)
```

### 9.5. ClientExecutionResult 타입 정의

```typescript
// frontend/types/problem.ts (라인 86-99)
export interface ClientExecutionResult {
  golden_code_passed: boolean;
  mutants_killed: number;
  total_mutants: number;
  score: number;
  details?: Array<{
    mutant_id: string;
    killed: boolean;
    test_output?: string;
    execution_time?: number;
  }>;
  total_execution_time?: number;
}
```

---

이 파일은 전체 시스템의 개략적인 Tech Spec / 아키텍처 / AI 통합 구조를 담고 있으며,
이후 세부 구현 시 AI와 "바이브 코딩"할 수 있는 기준 문서로 사용될 수 있습니다.

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12 | 0.3 | 초기 버전 (Celery 기반) | - |
| 2025-12-18 | 0.4 | 클라이언트 사이드 실행(Pyodide) 하이브리드 아키텍처 반영 | AI Copilot |
| 2025-12-28 | 0.5 | 실제 구현과 스펙 동기화: 토큰 시스템, 테스트 품질 시스템, AI 코치, 비회원 제출, 도메인 분류 등 추가 | AI Copilot |

---

## 관련 문서

| 문서 | 용도 |
|------|------|
| [token-policy.md](./token-policy.md) | 토큰 정책 상세 |
| [ai-feedback.md](./ai-feedback.md) | AI 피드백 정책 상세 |
| [test-quality-system.md](./test-quality-system.md) | 테스트 품질 평가 시스템 상세 |
| [SUBMISSION_STATUS_FLOW.md](./SUBMISSION_STATUS_FLOW.md) | Submission 상태 전이 규칙 |
| [ERROR_HANDLING.md](./ERROR_HANDLING.md) | 에러 처리 가이드 |
| [operations.md](./operations.md) | 운영/인시던트 가이드 |
| [deployment.md](./deployment.md) | 배포 가이드 |
| [AI_SAFETY_PROTOCOLS.md](./AI_SAFETY_PROTOCOLS.md) | AI 작업 안전 수칙 |
