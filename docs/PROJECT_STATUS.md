# QA-Arena 프로젝트 상황 요약

> 작성일: 2024년 12월 1일  
> 목적: 프로젝트 현황 공유 및 외부 평가 요청용 문서

---

## 1. 프로젝트 목적

**"QA 엔지니어의 테스트 설계/테스트 코드 작성 역량을 정량화하는, AI-보조 온라인 코딩 테스트 플랫폼"**

### 1.1 핵심 가치

- **Mutation Testing 기반 채점**: 단순히 테스트 통과 여부가 아닌, 얼마나 많은 버그를 탐지하는지로 테스트 품질 측정
- **AI 피드백**: 채점 결과를 바탕으로 개선점과 추가 테스트 케이스 제안
- **AI 문제 생성**: Admin이 문제 의도만 입력하면 AI가 문제, 정답 코드, 버그 구현을 자동 생성

### 1.2 사용자 시나리오

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 사용자 플로우                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 문제 선택 → 테스트 대상 함수 스펙 확인                                      │
│ 2. pytest 기반 테스트 코드 작성 (Monaco Editor)                               │
│ 3. 제출 → Docker 컨테이너에서 채점 실행                                        │
│    - Golden Code(정답)로 테스트 실행 → 모두 통과해야 함                         │
│    - Buggy Implementations(mutants)로 테스트 실행 → 많이 실패시킬수록 고득점    │
│ 4. 점수 + AI 피드백 확인                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 진행 상황

### 2.1 Milestone 진행률

| Milestone | 항목 | 상태 | 완료율 |
|:---------:|------|:----:|:------:|
| **M1** | 프로젝트 초기 설정 및 개발 환경 | ✅ 완료 | 100% |
| **M2** | DB 스키마 및 모델 구현 | ✅ 완료 | 100% |
| **M3** | 문제 조회 API | ✅ 완료 | 100% |
| **M4** | Judge/Runner (Docker+pytest) | ✅ 완료 | 100% |
| **M5** | 채점 로직 (Golden+Mutants) | ✅ 완료 | 100% |
| **M6** | Frontend 문제 목록/상세 | ✅ 완료 | 100% |
| **M7** | 코드 에디터 및 제출 기능 | ✅ 완료 | 100% |
| **M8** | AI Problem Designer | ✅ 완료 | 100% |
| **M9** | AI Feedback Engine | ✅ 완료 | 100% |
| **M10** | Frontend 피드백 표시/Admin UI | ✅ 완료 | 100% |
| **M11** | 통합 테스트 및 최적화 | 🔄 진행중 | 70% |
| **M12** | 배포 준비 및 문서화 | 🔄 진행중 | 80% |

**전체 개발 완료율: 약 90%**

### 2.2 구현 완료 기능

#### Backend (FastAPI)
- [x] 문제 CRUD API (`GET /api/v1/problems`, `GET /api/v1/problems/{id}`)
- [x] 제출 API (`POST /api/v1/submissions`, `GET /api/v1/submissions/{id}`)
- [x] Admin API (`POST /api/admin/problems/ai-generate`, `POST /api/admin/problems`)
- [x] Celery 기반 비동기 채점 처리
- [x] Docker 컨테이너 기반 pytest 실행
- [x] AI Problem Designer (OpenAI GPT-4)
- [x] AI Feedback Engine (OpenAI GPT-4)

#### Frontend (Next.js)
- [x] 문제 목록/상세 페이지
- [x] Monaco Editor 기반 코드 에디터
- [x] 실시간 채점 상태 표시 (Polling)
- [x] 점수 및 Kill Ratio 시각화
- [x] AI 피드백 표시 컴포넌트
- [x] Admin 문제 생성 UI

#### Infrastructure
- [x] PostgreSQL + Redis Docker Compose 설정
- [x] Judge Docker 이미지 (python:3.11-slim)
- [x] 보안 제한 (위험 모듈 import 차단, 네트워크 비활성화)
- [x] Nginx 리버스 프록시 설정
- [x] 배포 스크립트 및 가이드

### 2.3 테스트 현황

```
Backend 테스트 파일 (14개):
├── test_ai_feedback_engine.py
├── test_ai_problem_designer.py
├── test_api_admin.py
├── test_api_problems.py
├── test_api_submissions.py
├── test_celery_tasks.py
├── test_docker_service.py
├── test_integration.py
├── test_judge_service.py
├── test_models.py
└── test_submission_service.py

Frontend 테스트 파일 (8개):
├── CodeEditor.test.tsx
├── Error.test.tsx
├── FeedbackDisplay.test.tsx
├── Loading.test.tsx
├── ProblemCard.test.tsx
├── ScoreDisplay.test.tsx
├── SubmissionStatus.test.tsx
└── ProblemsPage.test.tsx
```

---

## 3. 진행할 항목 (남은 작업)

### 3.1 문제 컨텐츠 생성 [최우선]

| 난이도 | 목표 | 현재 | 진행률 |
|:------:|:----:|:----:|:------:|
| Easy | 10개 | 7개 (E01~E07) | 70% |
| Medium | 10개 | 0개 | 0% |
| Hard | 10개 | 0개 | 0% |
| **합계** | **30개** | **7개** | **23%** |

**생성된 문제 예시 (E01):**
- 제목: 나이 유효성 검증 함수
- 평가 역량: 경계값 분석 (Boundary Value Analysis)
- Mutants 수: 4개
- 버그 유형:
  - 하한 경계 off-by-one (age=0 처리 오류)
  - 상한 경계 off-by-one (age=150 처리 오류)
  - 논리 연산자 오류 (or vs and)
  - 상한값 하드코딩 오류 (150 → 120)

### 3.2 Docker 환경 통합 테스트

- [ ] docker-compose up으로 전체 서비스 시작
- [ ] DB 마이그레이션 자동 실행 확인
- [ ] Celery Worker 정상 동작 확인
- [ ] 실제 문제 풀이 E2E 테스트

### 3.3 실제 서버 배포

- [ ] AWS EC2 인스턴스 생성
- [ ] Docker Compose 배포
- [ ] SSL/HTTPS 설정
- [ ] 도메인 연결

### 3.4 수동 브라우저 테스트

- [ ] 문제 목록 → 상세 → 제출 → 결과 확인 플로우
- [ ] Admin 문제 생성 플로우
- [ ] 에러 케이스 처리 확인

---

## 4. 허들 (Blockers / 도전 과제)

### 4.1 문제 컨텐츠 품질 확보

**문제점:**
- AI 생성 문제의 품질이 일정하지 않음
- Buggy Implementation이 테스트로 구분 가능한지 검증 필요
- 문제 설명의 명확성 검토 필요

**대응:**
- `generate_problems.py` 스크립트로 배치 생성 자동화
- 생성된 문제를 `generated_problems/` 폴더에 JSON 저장
- 수동 검수 후 DB 저장 프로세스 수립

### 4.2 Docker 환경 의존성

**문제점:**
- Windows 환경에서 Docker Desktop 설치 필요
- WSL2 활성화 필요
- Docker 없이는 채점 기능 테스트 불가

**대응:**
- Docker 설치 가이드 문서화 (`DOCKER_SETUP_WINDOWS.md`)
- 로컬 개발 시 Mock 서비스 사용 가능
- CI/CD 환경에서는 Docker 필수

### 4.3 OpenAI API 비용

**문제점:**
- AI Problem Designer: 문제당 약 $0.05~0.10
- AI Feedback Engine: 피드백당 약 $0.02~0.05
- 대량 사용 시 비용 증가

**대응:**
- 문제 생성은 Admin만 사용 (제한적 호출)
- 피드백 캐싱 고려 (동일 결과에 대한 중복 호출 방지)
- API 호출 로깅 및 모니터링

### 4.4 인증 시스템 미구현

**문제점:**
- 현재 모든 API가 인증 없이 접근 가능
- Admin API도 보호되지 않음
- 실제 서비스에는 사용자 인증 필수

**대응:**
- MVP 단계에서는 내부 테스트용으로 사용
- Phase 2에서 JWT 기반 인증 도입 예정
- Admin API는 IP 화이트리스트로 임시 보호 가능

---

## 5. 기술 스택

### 5.1 Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.11+ | 런타임 |
| FastAPI | 0.100+ | Web Framework |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.12+ | DB Migration |
| Celery | 5.3+ | Task Queue |
| Pydantic | 2.0+ | Data Validation |

### 5.2 Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14+ | React Framework |
| React | 18+ | UI Library |
| TypeScript | 5+ | Type Safety |
| TailwindCSS | 3+ | Styling |
| Monaco Editor | 0.40+ | Code Editor |

### 5.3 Infrastructure

| 기술 | 용도 |
|------|------|
| PostgreSQL | Primary Database |
| Redis | Celery Broker/Backend |
| Docker | Containerization |
| Nginx | Reverse Proxy |

### 5.4 AI Services

| 서비스 | 모델 | 용도 |
|--------|------|------|
| OpenAI | GPT-4 | Problem Designer |
| OpenAI | GPT-4 | Feedback Engine |

---

## 6. 주요 파일 구조

```
qa_labs/
├── backend/
│   ├── app/
│   │   ├── api/                  # API 엔드포인트
│   │   │   ├── admin.py          # Admin API
│   │   │   ├── problems.py       # 문제 API
│   │   │   └── submissions.py    # 제출 API
│   │   ├── core/                 # 핵심 설정
│   │   │   ├── celery_app.py     # Celery 설정
│   │   │   ├── config.py         # 환경 설정
│   │   │   ├── llm_client.py     # OpenAI 클라이언트
│   │   │   └── logging.py        # 로깅 설정
│   │   ├── models/               # SQLAlchemy 모델
│   │   ├── repositories/         # 데이터 접근 계층
│   │   ├── schemas/              # Pydantic 스키마
│   │   ├── services/             # 비즈니스 로직
│   │   │   ├── ai_feedback_engine.py
│   │   │   ├── ai_problem_designer.py
│   │   │   ├── docker_service.py
│   │   │   ├── judge_service.py
│   │   │   └── submission_service.py
│   │   └── workers/              # Celery 태스크
│   ├── tests/                    # 테스트 코드
│   ├── generated_problems/       # AI 생성 문제 (E01~E07)
│   └── alembic/                  # DB 마이그레이션
│
├── frontend/
│   ├── app/                      # Next.js 페이지
│   │   ├── problems/             # 문제 페이지
│   │   └── admin/                # Admin 페이지
│   ├── components/               # React 컴포넌트
│   ├── lib/                      # 유틸리티
│   └── types/                    # TypeScript 타입
│
├── judge/
│   ├── Dockerfile                # 채점 컨테이너 이미지
│   ├── conftest.py               # pytest 보안 설정
│   └── samples/                  # 샘플 코드
│
├── docs/
│   ├── qa-arena-spec.md          # 개발 스펙
│   ├── qa-arena-milestones.md    # 마일스톤 상세
│   ├── qa-arena-launch-checklist.md
│   └── PROJECT_STATUS.md         # 이 문서
│
├── scripts/                      # 배포/백업 스크립트
├── nginx/                        # Nginx 설정
├── docker-compose.yml            # 개발 환경
└── docker-compose.prod.yml       # 운영 환경
```

---

## 7. 평가 요청 사항

이 프로젝트에 대해 다음 관점에서 평가해 주세요:

### 7.1 아키텍처 적절성
- Mutation Testing 기반 QA 코딩 테스트 플랫폼으로서의 설계가 적절한가?
- Backend/Frontend 분리, Celery 비동기 처리, Docker 격리 환경이 적절한가?

### 7.2 완성도
- MVP 수준으로서 기능이 충분히 구현되었는가?
- 테스트 커버리지가 적절한가?

### 7.3 확장성
- 향후 기능 추가 (다양한 언어 지원, 난이도별 문제 추천 등)가 용이한가?
- 사용자 증가에 대응할 수 있는 구조인가?

### 7.4 개선점
- 현재 구조에서 개선이 필요한 부분은?
- 보안, 성능, 유지보수성 측면에서 우려되는 점은?

### 7.5 우선순위 제안
- 남은 작업 중 가장 먼저 해야 할 것은?
- MVP 런칭을 위해 최소한으로 필요한 것은?

---

## 8. 참고 문서

- [개발 스펙](./qa-arena-spec.md)
- [마일스톤 상세](./qa-arena-milestones.md)
- [런칭 체크리스트](./qa-arena-launch-checklist.md)
- [배포 가이드](../DEPLOYMENT.md)
- [EC2 배포 가이드](../EC2_DEPLOYMENT.md)
- [사용자 가이드](../USER_GUIDE.md)

