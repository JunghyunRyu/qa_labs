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
├── .claude/              # Claude Code 설정
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
│   │   ├── __init__.py
│   │   ├── admin.py         # Admin API
│   │   ├── problems.py      # 문제 관련 API
│   │   └── submissions.py   # 제출 관련 API
│   ├── core/                # 설정 및 공통 기능
│   │   ├── config.py        # 환경 설정
│   │   ├── celery_app.py    # Celery 설정
│   │   └── logging.py       # 로깅 설정
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
├── lib/                   # 유틸리티 함수
├── types/                 # TypeScript 타입 정의
├── public/                # 정적 파일
├── __mocks__/            # Jest 모의 객체
├── .next/                # Next.js 빌드 출력 (gitignore)
├── node_modules/         # npm 패키지 (gitignore)
├── package.json          # npm 의존성
├── package-lock.json     # npm 잠금 파일
├── tsconfig.json         # TypeScript 설정
├── next.config.ts        # Next.js 설정
├── tailwind.config.ts    # Tailwind CSS 설정 (추정)
├── postcss.config.mjs    # PostCSS 설정
├── jest.config.js        # Jest 설정
├── jest.setup.js         # Jest 셋업
├── eslint.config.mjs     # ESLint 설정
└── Dockerfile            # Frontend Docker 이미지
```

### Frontend 주요 파일
- `app/`: Next.js 14+ App Router 기반 페이지
- `components/`: 재사용 가능한 React 컴포넌트
- `lib/`: API 클라이언트, 유틸리티 함수
- `types/`: TypeScript 타입 및 인터페이스

## Judge 구조

```
judge/
├── Dockerfile            # Judge 컨테이너 이미지
└── conftest.py          # 보안 제한 설정 (pytest)
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
└── restore_db.ps1       # DB 복구 (Windows)
```

## Docs 구조

```
docs/
├── specs/                    # 기술 사양 문서
│   ├── qa-arena-spec.md     # 전체 사양서
│   ├── ERROR_HANDLING.md    # 에러 처리 가이드
│   ├── deployment.md        # 배포 가이드
│   ├── operations.md        # 운영 가이드
│   ├── git-workflow.md      # Git 워크플로우
│   ├── SUBMISSION_STATUS_FLOW.md  # 제출 상태 흐름
│   └── problem-generation-templates.md  # 문제 생성 템플릿
├── todo_actions/            # 작업 목록
│   └── qa-arena-technical-todos.md
└── issues/                  # 이슈 추적
```

## Claude Code 구조

```
.claude/
├── commands/                # Slash commands
├── skills/                  # Custom skills
├── config.example.json      # 설정 템플릿 (Git)
├── settings.local.json      # 로컬 설정 (gitignore)
└── config.local.json        # EC2 설정 (gitignore)
```

## Docker Compose 서비스

### 개발 환경 (docker-compose.yml)
- `postgres`: PostgreSQL 15
- `redis`: Redis 7
- `backend`: FastAPI 서버
- `celery_worker`: Celery Worker

### 프로덕션 환경 (docker-compose.prod.yml)
- 동일한 서비스 + nginx (추정)
- 최적화된 설정
