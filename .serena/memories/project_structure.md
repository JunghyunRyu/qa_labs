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
│   │   ├── daily_bounty.py  # 일일 현상금 API (신규)
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
├── scripts/                # 운영 스크립트 (daily_report.py 등)
├── requirements.txt        # Python 의존성
├── alembic.ini            # Alembic 설정
├── Dockerfile             # Backend Docker 이미지
├── .env                   # 환경 변수 (gitignore)
└── .env.example           # 환경 변수 예시
```

## Frontend 구조

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지
│   └── ...                # 기타 페이지
├── components/            # React 컴포넌트
│   ├── ai/                # AI 관련 컴포넌트
│   ├── conversion/        # 게스트 전환 관련 (M6)
│   ├── dashboard/         # 대시보드 컴포넌트
│   ├── hero/              # 히어로 섹션
│   ├── home/              # 홈 페이지 컴포넌트
│   ├── how-it-works/      # 사용 방법 섹션
│   ├── landing/           # 랜딩 페이지
│   ├── layout/            # 레이아웃 컴포넌트
│   ├── pricing/           # 가격 정책
│   ├── problems/          # 문제 관련
│   ├── showcase/          # 쇼케이스
│   ├── test-quality/      # 테스트 품질
│   ├── tutorial/          # 튜토리얼
│   └── ui/                # 공통 UI 컴포넌트
├── hooks/                 # Custom React Hooks
├── stores/                # 상태 관리 (Zustand)
├── lib/                   # 유틸리티 함수
├── utils/                 # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
├── workers/               # Web Workers (Pyodide)
│   ├── pyodide.worker.ts
│   └── pyodide-worker-types.ts
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

### 주요 컴포넌트 (신규/업데이트)
- `DailyBountyBanner.tsx`: 일일 현상금 배너
- `WeekendChallengeBanner.tsx`: 주말 챌린지 배너
- `MissedBugAccordion.tsx`: 놓친 버그 아코디언 UI
- `RankBadge.tsx`: SDET Career Path 랭크 뱃지
- `PyodidePreloader.tsx`: Pyodide 사전 로딩
- `LocalTestResultPanel.tsx`: 클라이언트 사이드 테스트 결과

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
│   ├── monitoring-setup.md  # 모니터링 설정 (신규)
│   ├── git-workflow.md      # Git 워크플로우
│   ├── backup_restore.md    # 백업/복구 가이드
│   ├── SUBMISSION_STATUS_FLOW.md  # 제출 상태 흐름
│   ├── problem-generation-templates.md  # 문제 생성 템플릿
│   ├── test-quality-system.md     # 테스트 품질 시스템
│   ├── test-quality-milestones.md # 테스트 품질 마일스톤
│   ├── token-policy.md      # 토큰 정책
│   ├── user-conversion-onboarding.md  # 사용자 전환 온보딩 (신규)
│   └── milestones/          # 마일스톤별 스펙
├── claude-context/          # Claude AI 컨텍스트
│   ├── api-reference.md     # API 참조
│   ├── db-schema.md         # DB 스키마
│   └── infrastructure.md    # 인프라 정보
├── issues/                  # 이슈 및 기능 요청
├── plans/                   # 개발 계획
├── assets/                  # 문서 자산 (이미지 등)
├── data/                    # 데이터 파일
└── troubleshooting/         # 트러블슈팅 가이드
    └── local-dev-setup.md   # 로컬 개발 환경
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

## Docker Compose 서비스

### 개발 환경 (docker-compose.yml)
- `postgres`: PostgreSQL 15
- `redis`: Redis 7
- `backend`: FastAPI 서버
- `celery_worker`: Celery Worker

### 프로덕션 환경 (docker-compose.prod.yml)
- `postgres`: PostgreSQL 15
- `redis`: Redis 7
- `backend`: FastAPI 서버
- `celery_worker`: Celery Worker
- `frontend`: Next.js 서버
- `docker-socket-proxy`: Docker 소켓 프록시
- `worker_monitor`: 워커 상태 모니터링
- ~~nginx~~: 제거됨 (외부 Nginx 사용)
