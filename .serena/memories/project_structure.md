# 프로젝트 구조

## 전체 디렉토리 구조

```
qa_labs/
├── backend/              # FastAPI Backend
├── frontend/             # Next.js Frontend
├── judge/                # Judge/Runner Docker 이미지
├── nginx/                # Nginx 설정
├── scripts/              # 유틸리티 스크립트
├── docs/                 # 프로젝트 문서
├── deploy/               # 배포 관련 파일
├── .claude/              # Claude Code 설정 (agents, commands, skills)
├── .serena/              # Serena MCP 설정
├── .github/              # GitHub 설정
├── docker-compose.yml    # 개발용 Docker Compose
└── docker-compose.prod.yml  # 프로덕션용 Docker Compose
```

## Backend 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── api/                 # API 라우터
│   │   ├── admin.py         # Admin API
│   │   ├── ai.py            # AI 관련 API
│   │   ├── auth.py          # 인증 API (OAuth)
│   │   ├── feedback.py      # 피드백 API
│   │   ├── health.py        # 헬스체크 API
│   │   ├── plans.py         # 요금제 API
│   │   ├── problems.py      # 문제 관련 API
│   │   ├── progress.py      # 진행상황 API
│   │   ├── submissions.py   # 제출 관련 API
│   │   ├── test_quality.py  # 테스트 품질 API
│   │   ├── tokens.py        # 토큰 관련 API
│   │   └── users.py         # 사용자 API
│   ├── core/                # 설정 및 공통 기능
│   │   ├── config.py        # 환경 설정
│   │   ├── celery_app.py    # Celery 설정
│   │   └── logging.py       # 로깅 설정
│   ├── middleware/          # 미들웨어
│   ├── models/              # 데이터베이스 모델 (SQLAlchemy)
│   ├── repositories/        # 데이터 액세스 레이어
│   ├── schemas/             # Pydantic 스키마
│   ├── services/            # 비즈니스 로직
│   └── workers/             # Celery 작업
├── tests/                   # 테스트 코드
├── alembic/                # 데이터베이스 마이그레이션
├── logs/                   # 로그 파일
├── generated_problems/     # 생성된 문제 저장
├── requirements.txt        # Python 의존성
├── alembic.ini            # Alembic 설정
├── Dockerfile             # Backend Docker 이미지
├── .env                   # 환경 변수 (gitignore)
└── .env.example           # 환경 변수 예시
```

### Backend 주요 파일
- `app/main.py`: FastAPI 앱 진입점, 전역 예외 핸들러, CORS 설정
- `app/api/*.py`: API 엔드포인트 정의
- `app/core/config.py`: 환경 변수 및 설정 관리
- `app/models/`: SQLAlchemy ORM 모델
- `app/schemas/`: API 요청/응답 스키마
- `app/services/`: 비즈니스 로직 (채점, 피드백 생성 등)
- `app/workers/`: Celery 비동기 작업 (코드 실행, 채점)

## Frontend 구조

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지
│   └── ...                # 기타 페이지
├── components/            # React 컴포넌트
├── hooks/                 # Custom React Hooks
├── stores/                # 상태 관리 (Zustand 등)
├── lib/                   # 유틸리티 함수
├── utils/                 # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
├── workers/               # Web Workers
├── e2e/                   # Playwright E2E 테스트
├── public/                # 정적 파일
├── __mocks__/            # Jest 모의 객체
├── package.json          # npm 의존성
├── tsconfig.json         # TypeScript 설정
├── next.config.ts        # Next.js 설정
├── tailwind.config.ts    # Tailwind CSS 설정
├── playwright.config.ts  # Playwright 설정
├── jest.config.js        # Jest 설정
├── sentry.*.config.ts    # Sentry 모니터링 설정
├── eslint.config.mjs     # ESLint 설정
└── Dockerfile            # Frontend Docker 이미지
```

### Frontend 주요 파일
- `app/`: Next.js 14+ App Router 기반 페이지
- `components/`: 재사용 가능한 React 컴포넌트
- `hooks/`: Custom React Hooks
- `stores/`: 전역 상태 관리
- `lib/`: API 클라이언트, 유틸리티 함수
- `types/`: TypeScript 타입 및 인터페이스
- `e2e/`: Playwright 기반 E2E 테스트

## Judge 구조

```
judge/
├── Dockerfile            # Judge 컨테이너 이미지
├── conftest.py          # 보안 제한 설정 (pytest)
└── samples/             # 샘플 테스트 파일
```

### Judge 특징
- Docker-in-Docker로 실행
- celery_worker 컨테이너가 judge 컨테이너 생성
- 샌드박스 환경에서 사용자 코드 실행
- `/tmp/qa_arena_judge` 공유 볼륨 사용

## Nginx 구조

```
nginx/
├── nginx.conf           # Nginx 메인 설정
└── conf.d/              # 추가 설정 파일
```

## Scripts 구조

```
scripts/
├── backup_db.sh         # DB 백업 (Linux/Mac)
├── restore_db.sh        # DB 복구 (Linux/Mac)
├── backup_db.ps1        # DB 백업 (Windows)
├── restore_db.ps1       # DB 복구 (Windows)
├── deploy_ec2.sh        # EC2 배포 스크립트
├── ec2_setup.sh         # EC2 초기 설정
├── setup_ssl.sh         # SSL 인증서 설정
├── check_ec2_backend_status.ps1  # EC2 상태 확인
├── diagnose_502_error.ps1        # 502 에러 진단
├── restart_ec2_services.ps1      # EC2 서비스 재시작
├── generate-oss-licenses.js      # OSS 라이선스 생성
├── qa-arena.service              # systemd 서비스 파일
└── verify_pipeline_api.py        # 파이프라인 검증
```

## Docs 구조

```
docs/
├── specs/                    # 기술 사양 문서
│   ├── overview.md          # 전체 개요
│   ├── qa-arena-spec.md     # 전체 사양서
│   ├── ai-feedback.md       # AI 피드백 사양
│   ├── AI_SAFETY_PROTOCOLS.md  # AI 안전 프로토콜
│   ├── ERROR_HANDLING.md    # 에러 처리 가이드
│   ├── deployment.md        # 배포 가이드
│   ├── operations.md        # 운영 가이드
│   ├── git-workflow.md      # Git 워크플로우
│   ├── backup_restore.md    # 백업/복구 가이드
│   ├── SUBMISSION_STATUS_FLOW.md  # 제출 상태 흐름
│   ├── problem-generation-templates.md  # 문제 생성 템플릿
│   ├── test-quality-system.md     # 테스트 품질 시스템
│   ├── test-quality-milestones.md # 테스트 품질 마일스톤
│   ├── token-policy.md      # 토큰 정책
│   └── milestones/          # 마일스톤별 스펙
├── issues/                  # 이슈 및 기능 요청
│   ├── pricing-system/      # 가격 시스템 관련
│   ├── improve-ui/          # UI 개선 관련
│   └── resolved/            # 해결된 이슈
├── plans/                   # 개발 계획
├── assets/                  # 문서 자산 (이미지 등)
├── data/                    # 데이터 파일
└── velog/                   # 블로그 포스트
```

## Claude Code 구조

```
.claude/
├── agents/                  # 서브에이전트 정의 (가상 팀원)
│   ├── qa-engineer/         # QA 엔지니어 - 테스트 작성, 버그 재현
│   ├── db-admin/            # DB 관리자 - 스키마, 마이그레이션
│   ├── docs-writer/         # 문서 작성자 - 자동 문서화
│   ├── sre-devops/          # SRE/DevOps - 인프라, 배포
│   └── _template/           # 에이전트 템플릿
├── commands/                # Slash commands
│   ├── check-sync.md
│   ├── deploy.md
│   ├── init-serena.md
│   └── logs.md
├── skills/                  # Custom skills
│   ├── code-review/
│   ├── daily-report/
│   ├── docker-debug/
│   ├── ec2-deploy/
│   ├── pytest-problem-reviewer/
│   └── submission-test/
├── config.example.json      # 설정 템플릿 (Git)
├── config.json              # 실제 설정
└── settings.local.json      # 로컬 설정 (gitignore)
```

### Agent 호출 방식
Task 도구로 subagent_type 지정:
- "QA Engineer Agent" - 테스트 케이스 작성, 버그 재현, 회귀 테스트
- "Database Admin Agent" - 스키마 관리, 쿼리 최적화, 마이그레이션
- "Docs Writer Agent" - 코드 변경 시 문서 자동 업데이트
- "SRE/DevOps Agent" - 인프라 관리, 배포 자동화, 모니터링

## Docker Compose 서비스

### 개발 환경 (docker-compose.yml)
- `postgres`: PostgreSQL 15
- `redis`: Redis 7
- `backend`: FastAPI 서버
- `celery_worker`: Celery Worker

### 프로덕션 환경 (docker-compose.prod.yml)
- 동일한 서비스 + nginx
- 최적화된 설정
- SSL/TLS 지원
