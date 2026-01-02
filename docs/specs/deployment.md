# QA Arena Deployment Guide

## 📌 Purpose
Defines the official and quick deployment flows for the QA Arena production environment.

> 📅 Last Updated: 2025-12-31

---

# 1. Prerequisites
- GitHub repo connected to EC2
- `.env` file exists on EC2
- Docker & Docker Compose installed
- Claude Code CLI 설치 (로컬 환경)
- AWS CLI 설치 및 SSM 권한 설정

## EC2 접속 방법 (AWS SSM)
```bash
aws ssm start-session --target i-05b23ecec2bdcd44a --document-name AWS-StartInteractiveCommand --parameters command="bash -l"
```
> SSH 대신 AWS Systems Manager를 사용합니다.

---

# 2. Standard Deployment Procedure

## 방법 1: Claude Code 슬래시 명령어 사용 (권장)
```bash
# 터미널에서 Claude Code 실행 후
/deploy
```
> `/deploy` 명령은 git pull + docker compose rebuild를 자동으로 수행합니다.

## 방법 2: 수동 배포 (EC2 콘솔에서)

### 1. 프로젝트 디렉터리로 이동
```bash
cd ~/qa_labs
```

### 2. main 브랜치 동기화
```bash
git switch main
git fetch origin
git pull origin main
```

### 3. (선택) DB 스키마 변경이 있을 때만 백업 실행
- 모델/Alembic 마이그레이션 변경이 포함된 배포라면:

```bash
./scripts/backup_db.sh
ls -lh ./backups
# ./backups/qa_arena_backup_YYYYMMDD_HHMMSS.sql.gz 가 생성되었는지 확인
```

### 4. Docker Compose로 배포 (빌드 + 재기동)
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 5. 컨테이너 상태 확인
```bash
docker compose -f docker-compose.prod.yml ps
```

### 6. 애플리케이션 헬스 체크
```bash
curl -I https://qa-arena.qalabs.kr -k
```

---

# 3. Quick Deploy
> ⚠ DB 스키마/마이그레이션 변경이 없는, 순수 코드 변경 배포용이다.

```bash
# Claude Code에서 실행
/deploy
```

또는 EC2 콘솔에서 직접 실행:
```bash
cd ~/qa_labs && \
git switch main && git pull origin main && \
docker compose -f docker-compose.prod.yml --env-file .env up -d --build && \
docker compose -f docker-compose.prod.yml ps
```

---

# 4. Notes
- env 변경, Backend 코드 변경, Frontend 정적 리소스 변경 시에는 항상 --build 포함 배포.
- DB 스키마 변경 전에는 반드시 ./scripts/backup_db.sh 로 백업을 남긴다.
- 프로덕션에서는 다음 명령은 사용하지 않는다:
    - docker compose down -v
    - docker volume rm, docker volume prune
- AI/코드 어시스턴트로 배포 스크립트를 수정할 때는 @docs/specs/AI_SAFETY_PROTOCOLS.md 의 절대 금지 사항을 먼저 확인한다.
---

# 5. 환경 변수 (2025-12-31 추가)

## 5.1. Google Analytics 4 설정

Frontend에서 GA4를 활성화하려면 `.env` 파일에 다음 환경변수를 추가합니다:

```bash
# Google Analytics 4 측정 ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Docker 빌드 시 빌드 인자로 전달:
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

> `docker-compose.prod.yml`의 frontend 서비스에서 `NEXT_PUBLIC_GA_ID`를 빌드 인자로 받도록 설정되어 있습니다.

## 5.2. 필수 환경 변수 체크리스트

| 변수 | 용도 | 필수 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 | ✅ |
| `REDIS_URL` | Redis 연결 | ✅ |
| `GITHUB_CLIENT_ID` | GitHub OAuth | ✅ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | ✅ |
| `JWT_SECRET_KEY` | JWT 서명 | ✅ |
| `OPENAI_API_KEY` | AI 기능 | ✅ |
| `SENTRY_DSN` | 에러 모니터링 | 권장 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | 권장 |
| `SLACK_WEBHOOK_URL` | Slack 알림 | 선택 |
| `ADMIN_SECRET_KEY` | Admin API 인증 | 권장 |

---

# 6. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12 | 초기 문서 생성 | AI Copilot |
| 2025-12-28 | SSM 접속, 슬래시 명령어 추가 | AI Copilot |
| 2025-12-30 | GA4 환경변수 섹션 추가 | AI Copilot |
| 2025-12-31 | M5 마일스톤(Contract 노출, AI 연동) 및 보안 강화 배포 | AI Copilot |
