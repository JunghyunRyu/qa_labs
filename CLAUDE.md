# QA Labs (QA Arena) 개발 가이드

> **최종 업데이트**: 2026-01-09
> **도메인**: https://qa-arena.qalabs.kr

---

## Claude Context 참조 문서

> 세부 정보는 아래 파일에서 불러옵니다. 필요시 해당 파일을 읽어주세요.

| 문서 | 경로 | 내용 |
|------|------|------|
| **인프라 정보** | `docs/claude-context/infrastructure.md` | EC2, SSM 접속, Docker 구성, 네트워크 |
| **API 명세** | `docs/claude-context/api-reference.md` | REST API 엔드포인트, 에러 코드 |
| **DB 스키마** | `docs/claude-context/db-schema.md` | 테이블 정의, 관계, 마이그레이션 |

---

## 핵심 규칙

> **AI 안전 수칙**: 모든 작업 전 `docs/specs/AI_SAFETY_PROTOCOLS.md`를 준수한다.
> 특히 Docker, DB, 인프라 관련 변경은 해당 문서의 **절대 금지 사항**을 위반하지 않도록 한다.

### AI 권한 범위

| 영역 | 권한 | 비고 |
|------|------|------|
| Python/API 로직 | ✅ 수정 가능 | 기능 개선, 버그 수정 |
| Frontend (Next.js) | ✅ 수정 가능 | 컴포넌트, 페이지 |
| 테스트/문서 | ✅ 수정 가능 | 본 문서 및 AI_SAFETY 제외 |
| Docker 설정 | ⚠️ 제안만 | 실제 적용은 사람이 수행 |
| DB 스키마 | ⚠️ 제안만 | 백업 후 사람이 실행 |
| .env/비밀정보 | ⛔ 금지 | 더미 값만 사용 |
| SSL/보안그룹/IAM | ⛔ 금지 | 안내 수준만 |

---

## 프로젝트 개요

**QA Arena**는 뮤테이션 테스트 기반 코딩 테스트 플랫폼입니다.

### 핵심 기능
- **문제 풀이**: pytest 테스트 코드 작성 → 뮤턴트 탐지
- **클라이언트 채점**: Pyodide (WebAssembly Python)로 브라우저에서 실행
- **서버 채점**: Celery Worker (Fallback용)
- **AI 기능**: AI 코치, 힌트, 피드백 (토큰 기반)

### 토큰 정책 요약
| 기능 | 토큰 비용 |
|------|----------|
| 기본 피드백 | 0 (무료) |
| AI 코치/힌트 | 1 |
| 심화 분석 | 2 |
| 피드백 재생성 | 1 |

> 상세: `docs/specs/token-policy.md`

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14, TypeScript, Monaco Editor, Pyodide |
| Backend | FastAPI, Python 3.11+, SQLAlchemy |
| Auth | GitHub/Google OAuth, JWT |
| Task Queue | Celery + Redis |
| Database | PostgreSQL 15 |
| Infra | Docker Compose, AWS EC2 (t3.medium) |

> 아키텍처 상세: `docs/claude-context/infrastructure.md`

---

## 개발 환경

| 항목 | 로컬 | 프로덕션 |
|------|------|----------|
| OS | Windows | Ubuntu 24.04 |
| Docker Compose | `docker-compose` | `docker compose` (v2) |
| 인코딩 | UTF-8 | UTF-8 |

> EC2/SSM 접속 정보: `docs/claude-context/infrastructure.md`

---

## 슬래시 명령어

### Commands (`.claude/commands/`)

| 명령 | 설명 |
|------|------|
| `/check-sync` | 로컬-EC2 Git 싱크 상태 확인 |
| `/deploy` | EC2 배포 (git pull + docker compose) |
| `/init-serena` | Serena MCP 초기화 |
| `/logs` | 주요 서비스 로그 통합 확인 |
| `/logs --error` | ERROR 레벨만 필터링 |
| `/logs --warning` | WARNING 이상 필터링 |

### Skills (`.claude/skills/`)

| 스킬 | 설명 |
|------|------|
| `/code-review` | 코드 변경사항 품질/보안 리뷰 |
| `/daily-report` | EC2 일일 모니터링 리포트 |
| `/daily-report --notify` | 리포트 + Discord 알림 |
| `/docker-debug` | Docker 문제 진단 및 복구 |
| `/ec2-deploy` | 안전한 EC2 배포 워크플로우 (9단계) |
| `/pytest-problem-reviewer` | 문제 출제 검토 (채점 안정성) |
| `/submission-test` | 제출 시스템 빠른 테스트 |
| `/submission-test --full` | 상세 E2E 검증 |

---

## 개발 워크플로우

### 기본 사이클

1. **Task 시작**: `docs/specs/` 사양 문서 확인
2. **개발**: 코드 작성/수정
3. **Task 완료**: 테스트 실행 → 커밋
4. **Milestone 완료**: 푸시
5. **200줄 이상 변경**: 사용자 확인 요청

### 배포 플로우

```
코드 수정 → /check-sync → /code-review → /ec2-deploy
                │              │              │
                │              │              ├→ 성공
                │              │              └→ /docker-debug
                │              │
                └──────────────┴── 배포 전 검증
```

### 운영 모니터링

```
/daily-report → 이상 발견 → /logs --error → /docker-debug
```

---

## 주요 디렉토리 구조

```
qa_labs/
├── backend/
│   ├── app/              # FastAPI 애플리케이션
│   ├── alembic/          # DB 마이그레이션
│   ├── scripts/          # 운영 스크립트 (daily_report.py 등)
│   └── tests/            # pytest 테스트
├── frontend/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 컴포넌트
│   └── workers/          # Pyodide Web Worker
├── deploy/nginx/         # Nginx 설정
├── docs/
│   ├── specs/            # 기능 명세서
│   ├── issues/           # 이슈/마일스톤
│   └── plans/            # 구현 계획
├── .claude/
│   ├── commands/         # 슬래시 커맨드
│   ├── skills/           # 전문화 스킬
│   └── settings.local.json  # 권한 설정
└── docker-compose.prod.yml  # 프로덕션 Docker 설정
```

---

## 빠른 참조

### 로컬 개발

```bash
# Backend 테스트
cd backend && pytest

# Frontend 개발 서버
cd frontend && npm run dev

# 로컬 Docker 시작
docker-compose up -d --build
```

### EC2 명령 (SSM 통해 실행)

```bash
# 서비스 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f celery_worker

# 서비스 재시작
docker compose -f docker-compose.prod.yml restart backend
```

### Git 컨벤션

```
feat(scope): 기능 추가
fix(scope): 버그 수정
docs: 문서 변경
refactor: 리팩토링
test: 테스트 추가/수정
```

---

## 핵심 문서 참조

| 문서 | 경로 | 설명 |
|------|------|------|
| AI 안전 수칙 | `docs/specs/AI_SAFETY_PROTOCOLS.md` | **필독** - 절대 금지 사항 |
| 아키텍처 개요 | `docs/specs/overview.md` | 시스템 구조 |
| 토큰 정책 | `docs/specs/token-policy.md` | AI 기능 과금 |
| 배포 가이드 | `docs/specs/deployment.md` | 배포 절차 |
| 에러 처리 | `docs/specs/ERROR_HANDLING.md` | 에러 코드 규격 |
| 백업/복구 | `docs/specs/backup_restore.md` | DB 백업 절차 |

---

## MCP 서버

### Serena MCP
코드베이스 탐색 및 프로젝트 컨텍스트 제공

```
Serena의 read_memory 도구 사용:
- project_overview: 프로젝트 전체 개요
- suggested_commands: 명령어 모음
```

### Playwright MCP
브라우저 자동화 및 E2E 테스트

---

## 환경 변수

> 실제 값은 `.env` 파일에서 관리 (Git 미추적)
> 상세 목록: `docs/claude-context/infrastructure.md`

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-09 | Claude Context 분리 (infrastructure, api-reference, db-schema) |
| 2026-01-09 | P1~P5 설정 개선 반영, 전체 구조 재작성 |
| 2025-12-31 | M5 마일스톤 완료, 보안 강화 |
| 2025-12-30 | 브랜딩 리뉴얼(QA Arena), GA4 통합 |
| 2025-12-18 | 클라이언트 사이드 실행(Pyodide) 반영 |
