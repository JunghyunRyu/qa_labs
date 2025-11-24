# QA-Arena 개발 Milestone 기반 To-Do 리스트

> 작성일: 2024  
> 기반 문서: `qa-arena-spec.md`  
> 개발 프로세스: 개발 → 테스트 → 개발 진행 → 머지

---

## 개발 프로세스 가이드

각 Milestone은 다음 단계를 거칩니다:

1. **개발 (Development)**
   - 기능 구현
   - 코드 작성 및 리팩토링

2. **테스트 (Testing)**
   - 단위 테스트 작성
   - 통합 테스트 작성
   - 수동 테스트 수행

3. **검증 (Verification)**
   - 모든 테스트 통과 확인
   - 코드 리뷰 (필요시)
   - 문서 업데이트

4. **머지 (Merge)**
   - 브랜치 머지
   - 다음 Milestone으로 진행

---

## Milestone 1: 프로젝트 초기 설정 및 개발 환경 구성

**목표**: 개발 환경 구축 및 기본 프로젝트 구조 생성

### 1.1. 개발 작업

#### Backend 프로젝트 초기화
- [x] Python 가상환경 생성 및 활성화 (`python -m venv venv`)
- [x] `requirements.txt` 생성 (FastAPI, SQLAlchemy, Pydantic, pytest 등)
- [x] 프로젝트 디렉토리 구조 생성:
  ```
  backend/
    app/
      __init__.py
      main.py
      api/
        __init__.py
      services/
        __init__.py
      models/
        __init__.py
      core/
        __init__.py
        config.py
    tests/
      __init__.py
  ```
- [x] `app/main.py` 기본 FastAPI 앱 생성 (Hello World 엔드포인트)
- [x] `app/core/config.py` 설정 파일 생성 (환경변수 로딩)
- [x] `.env.example` 파일 생성
- [x] `.gitignore` 파일 생성 (Python, 가상환경, IDE 설정 등)

#### Frontend 프로젝트 초기화
- [x] Next.js 프로젝트 생성 (`npx create-next-app@latest frontend --typescript --tailwind --app`)
- [x] 프로젝트 디렉토리 구조 생성:
  ```
  frontend/
    app/
      layout.tsx
      page.tsx
    components/
    lib/
    types/
  ```
- [x] 기본 레이아웃 및 홈페이지 생성
- [x] `.gitignore` 확인 및 업데이트

#### Docker 설정
- [x] `docker-compose.yml` 생성 (PostgreSQL, Redis 컨테이너)
- [x] Backend용 `Dockerfile` 생성 (개발 환경)
- [x] Judge/Runner용 `Dockerfile` 생성 (`python:3.11-slim` 기반)
- [x] `.dockerignore` 파일 생성

#### 문서화
- [x] `README.md` 생성 (프로젝트 개요, 설치 방법)
- [x] `CONTRIBUTING.md` 생성 (개발 가이드라인)

### 1.2. 테스트 작업

- [x] Backend FastAPI 앱 실행 테스트 (`uvicorn app.main:app --reload`)
- [x] Frontend Next.js 앱 실행 테스트 (`npm run dev`)
- [x] Docker Compose로 PostgreSQL, Redis 컨테이너 실행 테스트
- [x] 각 서비스 간 네트워크 연결 확인

### 1.3. 완료 조건

- [x] Backend 서버가 정상적으로 시작됨
- [x] Frontend 서버가 정상적으로 시작됨
- [x] Docker 컨테이너들이 정상적으로 실행됨
- [x] 기본 "Hello World" API 엔드포인트가 동작함

### 1.4. 머지 준비

- [x] 모든 테스트 통과 확인
- [x] 코드 포맷팅 적용 (`black`, `prettier`)
- [x] 불필요한 파일 제거 확인
- [x] 브랜치 머지 및 다음 Milestone 브랜치 생성

---

## Milestone 2: 데이터베이스 스키마 및 모델 구현

**목표**: PostgreSQL 데이터베이스 스키마 생성 및 SQLAlchemy 모델 구현

### 2.1. 개발 작업

#### 데이터베이스 설정
- [x] SQLAlchemy 설정 파일 생성 (`app/models/db.py`)
- [x] 데이터베이스 연결 설정 (환경변수 기반)
- [x] Alembic 초기화 (`alembic init alembic`)
- [x] Alembic 설정 파일 수정

#### 스키마 마이그레이션 생성
- [x] `users` 테이블 마이그레이션 생성
  - id (UUID, Primary Key)
  - email (VARCHAR(255), UNIQUE, NOT NULL)
  - username (VARCHAR(50), NOT NULL)
  - created_at (TIMESTAMP)
- [x] `problems` 테이블 마이그레이션 생성
  - id (SERIAL, Primary Key)
  - slug (VARCHAR(100), UNIQUE, NOT NULL)
  - title (VARCHAR(200), NOT NULL)
  - description_md (TEXT, NOT NULL)
  - function_signature (TEXT, NOT NULL)
  - golden_code (TEXT, NOT NULL)
  - difficulty (VARCHAR(20), CHECK constraint)
  - skills (JSONB)
  - created_at (TIMESTAMP)
- [x] `buggy_implementations` 테이블 마이그레이션 생성
  - id (SERIAL, Primary Key)
  - problem_id (INTEGER, Foreign Key → problems.id)
  - buggy_code (TEXT, NOT NULL)
  - bug_description (VARCHAR(255))
  - weight (INTEGER, DEFAULT 1)
  - created_at (TIMESTAMP)
- [x] `submissions` 테이블 마이그레이션 생성
  - id (UUID, Primary Key)
  - user_id (UUID, Foreign Key → users.id)
  - problem_id (INTEGER, Foreign Key → problems.id)
  - code (TEXT, NOT NULL)
  - status (VARCHAR(20))
  - score (INTEGER, DEFAULT 0)
  - killed_mutants (INTEGER)
  - total_mutants (INTEGER)
  - execution_log (JSONB)
  - feedback_json (JSONB)
  - created_at (TIMESTAMP)

#### SQLAlchemy 모델 구현
- [x] `app/models/user.py` - User 모델
- [x] `app/models/problem.py` - Problem 모델
- [x] `app/models/buggy_implementation.py` - BuggyImplementation 모델
- [x] `app/models/submission.py` - Submission 모델
- [x] 관계 설정 (Foreign Key, Relationship)

#### Pydantic 스키마 생성
- [x] `app/schemas/user.py` - User 스키마 (Request/Response)
- [x] `app/schemas/problem.py` - Problem 스키마
- [x] `app/schemas/submission.py` - Submission 스키마
- [x] `app/schemas/buggy_implementation.py` - BuggyImplementation 스키마

### 2.2. 테스트 작업

- [x] 마이그레이션 실행 테스트 (`alembic upgrade head`)
- [x] 각 모델 CRUD 작업 테스트 (단위 테스트)
- [x] Foreign Key 관계 테스트
- [x] JSONB 필드 저장/조회 테스트
- [x] 데이터베이스 제약조건 테스트 (UNIQUE, CHECK 등)

### 2.3. 완료 조건

- [x] 모든 테이블이 정상적으로 생성됨
- [x] 모델 간 관계가 올바르게 설정됨
- [x] 기본 CRUD 작업이 정상 동작함
- [x] 모든 단위 테스트 통과

### 2.4. 머지 준비

- [x] 마이그레이션 파일 검토
- [x] 테스트 코드 커버리지 확인
- [ ] 브랜치 머지

---

## Milestone 3: Backend API - 문제 조회 기능

**목표**: 문제 목록 및 상세 조회 API 구현

### 3.1. 개발 작업

#### Repository 레이어 구현
- [x] `app/repositories/problem_repository.py` 생성
  - `get_all()` - 문제 목록 조회 (페이징 지원)
  - `get_by_id()` - ID로 문제 조회
  - `get_by_slug()` - Slug로 문제 조회

#### Service 레이어 구현
- [x] `app/services/problem_service.py` 생성
  - 문제 목록 조회 로직
  - 문제 상세 조회 로직
  - 에러 처리

#### API 엔드포인트 구현
- [x] `app/api/problems.py` 생성
  - `GET /api/v1/problems` - 문제 목록 조회
    - Query 파라미터: `page`, `page_size`
    - Response: 문제 메타데이터 목록 (id, slug, title, difficulty, skills)
  - `GET /api/v1/problems/{id}` - 문제 상세 조회
    - Response: title, description_md, function_signature, initial_test_template, difficulty, tags

#### 라우터 등록
- [x] `app/main.py`에 problems 라우터 등록

#### 샘플 데이터 생성
- [x] Alembic seed 스크립트 생성 또는 직접 INSERT
- [x] 최소 2-3개의 샘플 문제 데이터 추가

### 3.2. 테스트 작업

- [x] `GET /api/v1/problems` 단위 테스트 작성
  - 빈 목록 반환 테스트
  - 페이징 테스트
  - 정렬 테스트
- [x] `GET /api/v1/problems/{id}` 단위 테스트 작성
  - 존재하는 문제 조회 테스트
  - 존재하지 않는 문제 404 테스트
- [x] API 통합 테스트 작성
- [x] Postman/Thunder Client로 수동 테스트

### 3.3. 완료 조건

- [x] 문제 목록 API가 정상 동작함
- [x] 문제 상세 API가 정상 동작함
- [x] 페이징이 올바르게 동작함
- [x] 모든 테스트 통과

### 3.4. 머지 준비

- [x] API 문서 확인 (FastAPI 자동 생성 문서)
- [x] 에러 응답 형식 통일 확인
- [ ] 브랜치 머지

---

## Milestone 4: Judge/Runner 기본 구현 - Docker + pytest 실행

**목표**: Docker 컨테이너 내에서 pytest를 실행하는 기본 인프라 구축

### 4.1. 개발 작업

#### Judge Docker 이미지 준비
- [x] `judge/Dockerfile` 생성 (`python:3.11-slim` 기반)
- [x] pytest 및 필수 패키지 설치
- [x] `judge/conftest.py` 생성 (보안 제한 로직)
  - 위험한 모듈 임포트 차단 (os, sys, subprocess, socket 등)
- [ ] Docker 이미지 빌드 테스트

#### Docker 실행 유틸리티 구현
- [ ] `app/services/docker_service.py` 생성
  - Docker 컨테이너 생성 함수
  - 파일 마운트 함수 (target.py, test_user.py, conftest.py)
  - 컨테이너 실행 함수
  - 로그 수집 함수
  - 컨테이너 정리 함수

#### pytest 실행 함수 구현
- [ ] `app/services/judge_service.py` 생성
  - `run_pytest()` 함수 구현
    - 입력: golden_code 또는 buggy_code, user_test_code
    - 출력: 실행 결과 (성공/실패, stdout, stderr, 실행 시간)
  - 타임아웃 처리 (3-5초)
  - 에러 처리

#### 테스트용 샘플 코드 작성
- [ ] 샘플 `target.py` (golden_code 예시)
- [ ] 샘플 `test_user.py` (사용자 테스트 코드 예시)

### 4.2. 테스트 작업

- [ ] Docker 컨테이너 생성/실행 테스트
- [ ] pytest 실행 테스트 (성공 케이스)
- [ ] pytest 실행 테스트 (실패 케이스)
- [ ] 타임아웃 처리 테스트
- [ ] 보안 제한 테스트 (위험한 모듈 임포트 차단)
- [ ] 네트워크 비활성화 테스트
- [ ] 로그 수집 테스트

### 4.3. 완료 조건

- [ ] Docker 컨테이너 내에서 pytest가 정상 실행됨
- [ ] 실행 결과가 올바르게 수집됨
- [ ] 타임아웃이 정상 동작함
- [ ] 보안 제한이 적용됨
- [ ] 모든 테스트 통과

### 4.4. 머지 준비

- [ ] Docker 이미지 크기 최적화 확인
- [ ] 에러 처리 로직 검토
- [ ] 브랜치 머지

---

## Milestone 5: 채점 로직 완성 - Golden Code + Mutants

**목표**: 제출된 테스트 코드를 Golden Code와 Mutants에 대해 실행하고 점수 계산

### 5.1. 개발 작업

#### Celery 설정
- [ ] `app/core/celery_app.py` 생성
  - Celery 앱 초기화
  - Redis broker/backend 설정
- [x] `requirements.txt`에 celery 추가

#### Submission Service 구현
- [ ] `app/services/submission_service.py` 구현
  - `process_submission()` 함수:
    1. Submission 조회
    2. Problem 및 BuggyImplementations 조회
    3. Golden Code로 pytest 실행
    4. 실패 시 FAILURE 상태로 저장 및 종료
    5. 성공 시 각 Mutant에 대해 pytest 실행
    6. Kill ratio 계산
    7. 점수 계산 (base_score + kill_ratio * 70)
    8. 결과 DB 저장

#### Celery Task 구현
- [ ] `app/workers/tasks.py` 생성
  - `process_submission_task()` 함수
  - 에러 핸들링 및 재시도 로직

#### Repository 확장
- [ ] `app/repositories/submission_repository.py` 생성
  - `create()` - Submission 생성
  - `get_by_id()` - ID로 조회
  - `update()` - 상태/점수 업데이트
- [ ] `app/repositories/buggy_implementation_repository.py` 생성
  - `get_by_problem_id()` - 문제별 Mutants 조회

#### API 엔드포인트 구현
- [ ] `app/api/submissions.py` 생성
  - `POST /api/v1/submissions` - 제출 생성
    - Request Body: problem_id, code
    - 처리: Submission 생성, Celery Task 발행
    - Response: submission_id
  - `GET /api/v1/submissions/{id}` - 제출 결과 조회
    - Response: status, score, killed_mutants, total_mutants, execution_log, feedback_json

#### 라우터 등록
- [ ] `app/main.py`에 submissions 라우터 등록

### 5.2. 테스트 작업

- [ ] Golden Code 실행 테스트 (성공 케이스)
- [ ] Golden Code 실행 테스트 (실패 케이스 - score=0 확인)
- [ ] Mutants 실행 테스트 (일부 kill, 일부 통과)
- [ ] 점수 계산 로직 테스트
- [ ] Kill ratio 계산 테스트
- [ ] Celery Task 실행 테스트
- [ ] API 통합 테스트
- [ ] 동시 제출 처리 테스트

### 5.3. 완료 조건

- [ ] 제출 API가 정상 동작함
- [ ] Celery Worker가 Task를 정상 처리함
- [ ] 점수가 올바르게 계산됨
- [ ] 실행 로그가 올바르게 저장됨
- [ ] 모든 테스트 통과

### 5.4. 머지 준비

- [ ] 점수 계산 로직 검토
- [ ] 에러 케이스 처리 확인
- [ ] 브랜치 머지

---

## Milestone 6: Frontend 기본 UI - 문제 목록 및 상세 페이지

**목표**: 문제 목록과 상세 페이지 UI 구현

### 6.1. 개발 작업

#### API 클라이언트 구현
- [ ] `frontend/lib/api.ts` 생성
  - API 호출 유틸리티 함수
  - 타입 정의
- [ ] `frontend/lib/api/problems.ts` 생성
  - `getProblems()` - 문제 목록 조회
  - `getProblem(id)` - 문제 상세 조회

#### 타입 정의
- [ ] `frontend/types/problem.ts` 생성
  - Problem 타입 정의
  - Submission 타입 정의

#### 문제 목록 페이지
- [ ] `frontend/app/problems/page.tsx` 생성
  - 문제 목록 표시
  - 페이징 UI
  - 난이도별 필터링 (옵션)
  - 문제 카드 컴포넌트

#### 문제 상세 페이지
- [ ] `frontend/app/problems/[id]/page.tsx` 생성
  - 문제 제목, 설명 표시
  - 함수 시그니처 표시
  - Markdown 렌더링 (react-markdown 사용)
  - 난이도, 태그 표시

#### 공통 컴포넌트
- [ ] `frontend/components/ProblemCard.tsx` - 문제 카드 컴포넌트
- [ ] `frontend/components/Loading.tsx` - 로딩 스피너
- [ ] `frontend/components/Error.tsx` - 에러 메시지 컴포넌트

#### 스타일링
- [ ] Tailwind CSS 기본 스타일 적용
- [ ] 반응형 디자인 적용

### 6.2. 테스트 작업

- [ ] 문제 목록 페이지 렌더링 테스트
- [ ] 문제 상세 페이지 렌더링 테스트
- [ ] API 호출 에러 처리 테스트
- [ ] 로딩 상태 표시 테스트
- [ ] 페이징 동작 테스트
- [ ] 브라우저에서 수동 테스트

### 6.3. 완료 조건

- [ ] 문제 목록이 정상적으로 표시됨
- [ ] 문제 상세 정보가 정상적으로 표시됨
- [ ] Markdown이 올바르게 렌더링됨
- [ ] 에러 처리가 올바르게 동작함
- [ ] 반응형 디자인이 적용됨

### 6.4. 머지 준비

- [ ] UI/UX 검토
- [ ] 접근성 확인 (기본 수준)
- [ ] 브랜치 머지

---

## Milestone 7: Frontend 코드 에디터 및 제출 기능

**목표**: Monaco Editor를 사용한 코드 에디터 및 제출/결과 조회 기능 구현

### 7.1. 개발 작업

#### Monaco Editor 통합
- [ ] `@monaco-editor/react` 패키지 설치
- [ ] `frontend/components/CodeEditor.tsx` 생성
  - Monaco Editor 래퍼 컴포넌트
  - Python 언어 하이라이팅
  - 기본 테마 설정
  - 초기 템플릿 로딩

#### 제출 API 클라이언트
- [ ] `frontend/lib/api/submissions.ts` 생성
  - `createSubmission()` - 제출 생성
  - `getSubmission(id)` - 제출 결과 조회

#### 제출 기능 구현
- [ ] 문제 상세 페이지에 코드 에디터 추가
- [ ] "채점하기" 버튼 추가
- [ ] 제출 처리 로직 구현
  - 코드 검증 (기본 수준)
  - API 호출
  - 제출 ID 저장

#### 결과 조회 기능 구현
- [ ] Polling 로직 구현 (`useEffect` + `setInterval`)
- [ ] 제출 상태 표시 (PENDING, RUNNING, SUCCESS, FAILURE)
- [ ] 결과 페이지/컴포넌트 생성
  - 점수 표시
  - Kill ratio 표시
  - 실행 로그 표시 (옵션)
  - 에러 메시지 표시

#### UI 컴포넌트
- [ ] `frontend/components/SubmissionStatus.tsx` - 제출 상태 표시
- [ ] `frontend/components/SubmissionResult.tsx` - 제출 결과 표시
- [ ] `frontend/components/ScoreDisplay.tsx` - 점수 표시

### 7.2. 테스트 작업

- [ ] 코드 에디터 렌더링 테스트
- [ ] 코드 입력/수정 테스트
- [ ] 제출 API 호출 테스트
- [ ] Polling 동작 테스트
- [ ] 결과 표시 테스트
- [ ] 에러 처리 테스트
- [ ] 브라우저에서 수동 테스트

### 7.3. 완료 조건

- [ ] 코드 에디터가 정상 동작함
- [ ] 제출 기능이 정상 동작함
- [ ] 결과가 실시간으로 업데이트됨
- [ ] 점수와 Kill ratio가 올바르게 표시됨
- [ ] 모든 테스트 통과

### 7.4. 머지 준비

- [ ] 사용자 경험 검토
- [ ] 에러 메시지 명확성 확인
- [ ] 브랜치 머지

---

## Milestone 8: AI Problem Designer 구현

**목표**: Admin이 문제를 AI로 자동 생성할 수 있는 기능 구현

### 8.1. 개발 작업

#### LLM 통합 설정
- [ ] LLM API 클라이언트 설정 (OpenAI, Anthropic 등)
- [ ] API 키 환경변수 설정
- [ ] `app/core/llm_client.py` 생성

#### AI Problem Designer 서비스 구현
- [ ] `app/services/ai_problem_designer.py` 구현
  - `generate_problem()` 함수:
    - 입력: goal, language, testing_framework, skills_to_assess, difficulty
    - System Prompt 생성
    - User Prompt 생성
    - LLM API 호출
    - JSON 응답 파싱 및 검증
    - 결과 반환

#### Prompt 템플릿 작성
- [ ] System Prompt 작성 (spec 기반)
- [ ] User Prompt 템플릿 작성
- [ ] JSON 스키마 정의 및 검증 로직

#### Admin API 엔드포인트 구현
- [ ] `app/api/admin.py` 생성
  - `POST /api/admin/problems/ai-generate` - AI 문제 생성
    - Request Body: goal, language, testing_framework, skills_to_assess, difficulty
    - Response: 생성된 문제 JSON
  - `POST /api/admin/problems` - 문제 저장
    - Request Body: 문제 전체 데이터
    - 처리: problems, buggy_implementations 테이블에 저장

#### 라우터 등록
- [ ] `app/main.py`에 admin 라우터 등록

#### 에러 처리
- [ ] LLM API 에러 처리
- [ ] JSON 파싱 에러 처리
- [ ] 검증 실패 처리

### 8.2. 테스트 작업

- [ ] AI 문제 생성 API 테스트
- [ ] 다양한 입력에 대한 응답 테스트
- [ ] JSON 파싱 검증 테스트
- [ ] 에러 케이스 테스트
- [ ] 생성된 문제의 품질 검증 (수동)

### 8.3. 완료 조건

- [ ] AI 문제 생성 API가 정상 동작함
- [ ] 생성된 문제가 올바른 형식임
- [ ] 문제 저장 기능이 정상 동작함
- [ ] 에러 처리가 올바르게 동작함

### 8.4. 머지 준비

- [ ] Prompt 품질 검토
- [ ] 생성된 문제 샘플 검토
- [ ] API 키 보안 확인
- [ ] 브랜치 머지

---

## Milestone 9: AI Feedback Engine 구현

**목표**: 채점 결과를 기반으로 자연어 피드백 생성

### 9.1. 개발 작업

#### AI Feedback Engine 서비스 구현
- [ ] `app/services/ai_feedback_engine.py` 구현
  - `generate_feedback()` 함수:
    - 입력: problem, submission, kill_ratio, logs, score
    - System Prompt 생성
    - User Prompt 생성 (문제 정보, 제출 코드, 결과 포함)
    - LLM API 호출
    - JSON 응답 파싱 및 검증
    - 결과 반환 (summary, strengths, weaknesses, suggested_tests)

#### Prompt 템플릿 작성
- [ ] System Prompt 작성 (시니어 QA 코치 역할)
- [ ] User Prompt 템플릿 작성
- [ ] JSON 스키마 정의 및 검증 로직

#### Submission Service 통합
- [ ] `app/services/submission_service.py` 수정
  - 채점 완료 후 AI Feedback Engine 호출
  - feedback_json 필드에 저장

#### API 응답에 피드백 포함
- [ ] `GET /api/v1/submissions/{id}` 응답에 feedback_json 포함 확인

### 9.2. 테스트 작업

- [ ] AI 피드백 생성 테스트
- [ ] 다양한 채점 결과에 대한 피드백 테스트
- [ ] JSON 파싱 검증 테스트
- [ ] 피드백 품질 검증 (수동)
- [ ] 통합 테스트 (제출 → 채점 → 피드백)

### 9.3. 완료 조건

- [ ] AI 피드백이 정상적으로 생성됨
- [ ] 피드백이 올바른 형식임
- [ ] 피드백이 제출 결과에 포함됨
- [ ] 피드백 품질이 적절함

### 9.4. 머지 준비

- [ ] Prompt 품질 검토
- [ ] 피드백 샘플 검토
- [ ] 브랜치 머지

---

## Milestone 10: Frontend 피드백 표시 및 Admin UI

**목표**: 제출 결과에 AI 피드백 표시 및 Admin 문제 생성 UI

### 10.1. 개발 작업

#### 피드백 표시 컴포넌트
- [ ] `frontend/components/FeedbackDisplay.tsx` 생성
  - Summary 표시
  - Strengths 리스트 표시
  - Weaknesses 리스트 표시
  - Suggested Tests 리스트 표시
- [ ] 제출 결과 페이지에 피드백 컴포넌트 통합

#### Admin UI 구현
- [ ] `frontend/app/admin/problems/new/page.tsx` 생성
  - AI 문제 생성 폼
  - 입력 필드: goal, skills_to_assess, difficulty
  - "AI로 생성" 버튼
  - 생성된 문제 미리보기
  - 문제 저장 기능
- [ ] `frontend/app/admin/problems/page.tsx` 생성
  - 문제 목록 (Admin용)
  - 문제 수정/삭제 기능 (옵션)

#### Admin API 클라이언트
- [ ] `frontend/lib/api/admin.ts` 생성
  - `generateProblem()` - AI 문제 생성
  - `createProblem()` - 문제 저장

### 10.2. 테스트 작업

- [ ] 피드백 표시 테스트
- [ ] Admin 문제 생성 UI 테스트
- [ ] 문제 저장 기능 테스트
- [ ] 브라우저에서 수동 테스트

### 10.3. 완료 조건

- [ ] 피드백이 올바르게 표시됨
- [ ] Admin UI가 정상 동작함
- [ ] AI 문제 생성이 UI에서 동작함
- [ ] 문제 저장이 정상 동작함

### 10.4. 머지 준비

- [ ] UI/UX 검토
- [ ] Admin 권한 확인 (기본 수준)
- [ ] 브랜치 머지

---

## Milestone 11: 통합 테스트 및 성능 최적화

**목표**: 전체 시스템 통합 테스트 및 성능 최적화

### 11.1. 개발 작업

#### 통합 테스트 작성
- [ ] End-to-End 테스트 시나리오 작성
  - 문제 조회 → 코드 작성 → 제출 → 결과 확인
  - AI 문제 생성 → 저장 → 사용자 제출 → 피드백 확인
- [ ] API 통합 테스트 작성
- [ ] Frontend 통합 테스트 작성 (옵션)

#### 성능 최적화
- [ ] 데이터베이스 쿼리 최적화 (인덱스 추가)
- [ ] API 응답 시간 측정 및 최적화
- [ ] Docker 컨테이너 실행 시간 최적화
- [ ] Celery Worker 동시 처리 최적화

#### 로깅 및 모니터링
- [ ] 로깅 설정 (`app/core/logging.py`)
- [ ] 주요 이벤트 로깅 (제출, 채점 완료, 에러)
- [ ] 모니터링 대시보드 준비 (옵션)

#### 에러 처리 강화
- [ ] 전역 에러 핸들러 구현
- [ ] 에러 로깅 강화
- [ ] 사용자 친화적 에러 메시지

### 11.2. 테스트 작업

- [ ] 전체 플로우 통합 테스트
- [ ] 부하 테스트 (동시 제출)
- [ ] 에러 케이스 테스트
- [ ] 성능 테스트
- [ ] 보안 테스트 (기본 수준)

### 11.3. 완료 조건

- [ ] 모든 통합 테스트 통과
- [ ] 성능이 허용 범위 내임
- [ ] 에러 처리가 올바르게 동작함
- [ ] 로깅이 정상 동작함

### 11.4. 머지 준비

- [ ] 코드 리뷰
- [ ] 문서 업데이트
- [ ] 브랜치 머지

---

## Milestone 12: 배포 준비 및 문서화

**목표**: 프로덕션 배포 준비 및 최종 문서화

### 12.1. 개발 작업

#### 배포 설정
- [ ] 프로덕션용 Docker Compose 파일 생성
- [ ] 환경변수 설정 파일 정리
- [ ] Nginx 설정 파일 생성 (리버스 프록시)
- [ ] systemd 서비스 파일 생성 (옵션)

#### 보안 강화
- [ ] 환경변수 보안 확인
- [ ] API 키 보안 확인
- [ ] CORS 설정 확인
- [ ] Rate Limiting 구현 (옵션)

#### 문서화
- [ ] API 문서 완성 (FastAPI 자동 생성 + 수동 보완)
- [ ] 배포 가이드 작성 (`DEPLOYMENT.md`)
- [ ] 사용자 가이드 작성 (`USER_GUIDE.md`)
- [ ] 개발자 가이드 업데이트 (`CONTRIBUTING.md`)
- [ ] README.md 최종 업데이트

#### 데이터베이스 백업 스크립트
- [ ] 백업 스크립트 작성
- [ ] 복구 스크립트 작성

### 12.2. 테스트 작업

- [ ] 프로덕션 환경 시뮬레이션 테스트
- [ ] 배포 스크립트 테스트
- [ ] 백업/복구 테스트
- [ ] 보안 스캔 (기본 수준)

### 12.3. 완료 조건

- [ ] 배포 준비가 완료됨
- [ ] 모든 문서가 작성됨
- [ ] 보안이 강화됨
- [ ] 백업/복구가 준비됨

### 12.4. 최종 머지

- [ ] 최종 코드 리뷰
- [ ] 모든 테스트 통과 확인
- [ ] 문서 검토
- [ ] 메인 브랜치 머지
- [ ] 릴리스 태그 생성

---

## 부록: 각 Milestone별 체크리스트

각 Milestone 완료 시 다음 사항을 확인하세요:

- [ ] 코드 작성 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] 통합 테스트 작성 및 통과
- [ ] 수동 테스트 완료
- [ ] 코드 포맷팅 적용
- [ ] 에러 처리 확인
- [ ] 문서 업데이트
- [ ] 코드 리뷰 (필요시)
- [ ] 브랜치 머지

---

## 참고 사항

1. **개발 순서**: Milestone은 순차적으로 진행하되, 병렬 작업이 가능한 부분은 동시에 진행 가능합니다.

2. **테스트 우선**: 각 기능 개발 후 즉시 테스트를 작성하고 실행하세요.

3. **점진적 개발**: 완벽한 구현보다 동작하는 최소 기능부터 시작하여 점진적으로 개선하세요.

4. **문서화**: 각 Milestone 완료 시 관련 문서를 업데이트하세요.

5. **코드 리뷰**: 가능한 경우 코드 리뷰를 진행하세요.

6. **버전 관리**: 각 Milestone은 별도 브랜치에서 개발하고, 완료 후 메인 브랜치에 머지하세요.

