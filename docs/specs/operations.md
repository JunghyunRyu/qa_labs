# QA-Arena Operations & Incident Response Guide

## 📌 Purpose
프로덕션 환경에서 문제를 진단하고, 복구하고, 정기 점검을 수행하기 위한 운영 가이드.

> ⚠ AI / 코드 어시스턴트로 트러블슈팅을 진행할 때는
> 반드시 `docs/specs/AI_SAFETY_PROTOCOLS.md`의 **절대 금지 사항**을 먼저 확인한다.

> 📅 Last Updated: 2025-12-28
> 하이브리드 아키텍처 (클라이언트 + 서버 사이드 실행) 반영

## 0. Claude Code 슬래시 명령어

운영 관련 작업은 Claude Code 슬래시 명령어를 활용하면 편리합니다.

| 명령어 | 설명 |
|--------|------|
| `/logs` | 주요 서비스 로그 한 번에 확인 |
| `/deploy` | EC2 자동 배포 (git pull + docker rebuild) |
| `/check-sync` | 로컬-EC2 코드 싱크 상태 확인 |
| `/docker-debug` | Docker 컨테이너 문제 진단 |

### EC2 접속 방법

EC2 서버 접속은 **AWS Systems Manager (SSM)**을 사용합니다.
SSH는 보안상 사용하지 않습니다.

```bash
# AWS SSM으로 EC2 접속 (AWS CLI 필요)
aws ssm start-session --target <instance-id>
```

---

# 1. 서비스 구성 및 컨테이너 이름

프로덕션 `docker-compose.prod.yml` 기준 주요 컨테이너:

- `qa_arena_nginx_prod`        – 프론트 도메인/SSL 종단 (80/443)
- `qa_arena_frontend_prod`     – Next.js 프론트엔드 + Pyodide 클라이언트 실행 (3000)
- `qa_arena_backend_prod`      – FastAPI 백엔드 (8000 → 호스트 8001)
- `qa_arena_celery_worker_prod` – 채점용 Celery 워커 (서버 사이드 Fallback)
- `qa_arena_worker_monitor_prod` – 워커 헬스 체크/모니터링
- `qa_arena_postgres_prod`     – PostgreSQL DB
- `qa_arena_redis_prod`        – Redis (Celery broker/result + AI 피드백 큐)

> **참고**: 대부분의 채점은 클라이언트(Pyodide)에서 처리됩니다.
> Celery Worker는 Fallback 및 AI 피드백 생성용입니다.
> Celery Worker가 다운되어도 기본 채점 기능은 정상 동작합니다.

---

# 2. Frequently Used Commands

### 2.1 컨테이너 상태 확인

```bash
docker compose -f docker-compose.prod.yml ps
# 또는
docker ps
```

### 2.2 주요 로그 보기
```bash
# Backend API
docker logs qa_arena_backend_prod --tail 200

# Celery Worker
docker logs qa_arena_celery_worker_prod --tail 200

# Worker Monitor
docker logs qa_arena_worker_monitor_prod --tail 200

# Nginx
docker logs qa_arena_nginx_prod --tail 200

# Postgres / Redis (필요 시)
docker logs qa_arena_postgres_prod --tail 100
docker logs qa_arena_redis_prod --tail 100
```
실시간 스트림이 필요하면 --tail 대신 -f 옵션을 사용한다.

### 2.3 전체 서비스 재배포 / 재시작
```bash
docker compose -f docker-compose.prod.yml restart qa_arena_backend_prod
docker compose -f docker-compose.prod.yml restart qa_arena_celery_worker_prod
docker compose -f docker-compose.prod.yml restart qa_arena_nginx_prod
```
- 코드/이미지 변경 시 표준 배포 명령.
- 볼륨 삭제 옵션(down -v)은 사용하지 않는다.

### 2.4 단일 서비스 재시작
```bash 
docker compose -f docker-compose.prod.yml restart qa_arena_backend_prod
docker compose -f docker-compose.prod.yml restart qa_arena_celery_worker_prod
docker compose -f docker-compose.prod.yml restart qa_arena_nginx_prod
```

## 3. Incident Response Workflow
### Step 1. 장애 서비스 식별
```bash
docker compose -f docker-compose.prod.yml ps
```
- **STATUS**가 **Restarting**, **Exited**인 컨테이너가 있는지 확인한다.

### Step 2. 로그로 원인 파악
예: 백엔드 장애인 경우

```bash
docker logs qa_arena_backend_prod --tail 200
```
Celery Worker, Nginx 등도 동일한 패턴으로 확인한다.

### Step 3. 최소 범위 재시작
설정/코드 수정 후, 가능한 한 해당 서비스만 재시작한다.
```bash
docker compose -f docker-compose.prod.yml restart qa_arena_backend_prod
# 또는
docker compose -f docker-compose.prod.yml up -d --build qa_arena_backend_prod
```

### Step 4. 전체 재배포가 필요한 경우
- main 브랜치 코드 기준으로 전체를 재배포한다.
```bash
cd ~/qa_labs
git switch main
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
```

### Step 5. Rollback (코드 기준)
문제가 특정 커밋 이후 발생했다고 판단되면:
```bash
cd ~/qa_labs
git switch main
git log --oneline   # 정상 동작하던 커밋 확인
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
- 롤백 후 반드시 상태/로그를 다시 확인한다.
> ⚠ DB 롤백(데이터 레벨)은 별도의 절차가 필요하므로
> @docs/specs/backup_restore.md를 참고하고, 임의로 데이터를 되돌리지 않는다.

## 4. DB Backup & Restore (요약)
### 4.1 백업 생성 (정기 + 중요 배포 전)
```bash
cd ~/qa_labs
./scripts/backup_db.sh [backup_directory]
ls -lh ./backups
# 예: ./backups/qa_arena_backup_YYYYMMDD_HHMMSS.sql.gz
```
- **DB 스키마 변경, 중요 배포 직전에는 반드시 백업**을 남긴다.
- 백업 디렉터리: 기본값 `./backups`, 인자로 지정 가능
- 백업 형식: `.sql` (gzip 압축 시 `.sql.gz`)
- 30일 이상 된 백업은 자동 삭제됨

### 4.2 백업 유효성 간단 검증
(필요 시) Postgres 컨테이너에서 목록 확인:
```bash
docker exec -it qa_arena_postgres_prod \
  pg_restore -l /var/lib/postgresql/data/backups/<덤프파일명> | head
```
> 실제 복구 절차는 docs/specs/backup_restore.md 문서를 따르고,
> 운영 DB에 직접 pg_restore를 실행하기 전에 반드시 시뮬레이션/리뷰를 거친다.

## 5. Daily & Weekly Checklist
### 5.1 Daily
- 컨테이너 상태 확인
```bash
docker compose -f docker-compose.prod.yml ps
```
- Celery Worker / Worker Monitor 로그 스팟 체크
```bash
docker logs qa_arena_celery_worker_prod --tail 50
docker logs qa_arena_worker_monitor_prod --tail 50
```
- 시스템 리소스 확인
```
df -h
htop   # 설치되어 있다면
```

### 5.2 Weekly
- DB 백업 생성 (./scripts/backup_db.sh)
- SSL 인증서 만료일 확인 (/etc/letsencrypt/live/qa-arena.qalabs.kr/)
- Git 리포지토리와 EC2 코드 싱크 확인
    - git status, git log
- 주요 로그(nginx/backend)에 비정상 응답 패턴이 없는지 확인

## 6. 에러 모니터링 (Sentry)

### 6.1 Sentry 대시보드 확인
- 프로덕션 에러는 Sentry에서 실시간으로 확인 가능
- Backend (FastAPI) + Frontend (Next.js) 모두 Sentry 연동됨
- 에러 ID가 API 응답에 포함되어 Sentry에서 검색 가능

### 6.2 주요 에러 유형
- `rate_limit_exceeded`: API Rate Limit 초과
- `validation_error`: 요청 검증 실패
- `internal_server_error`: 서버 내부 오류 (즉시 확인 필요)

### 6.3 Slack 알림
- Worker Monitor가 Celery Worker 이상 감지 시 Slack 알림 발송
- 자동 복구 시에도 복구 알림 발송
- 환경 변수: `SLACK_WEBHOOK_URL`, `SLACK_ALERT_ENABLED`

---

## 7. 금지/주의 명령 요약
- ❌ docker compose down -v
- ❌ docker volume rm, docker volume prune (프로덕션에서)
- ❌ /var/lib/postgresql/data 등 DB 데이터 디렉터리 삭제/초기화

⚠ Nginx, Docker Compose 설정 파일(docker-compose.prod.yml, nginx/qa_arena.conf)의 구조를 AI가 자동 리팩토링하도록 두지 않는다.

---

## 8. 장애 영향 범위 (하이브리드 아키텍처)

하이브리드 아키텍처에서 각 컴포넌트 장애 시 영향 범위를 정리합니다.

### 8.1 Celery Worker 다운 시

**영향 없음**:
- 클라이언트 사이드 채점 (Pyodide) - 정상 동작
- 문제 목록/상세 조회
- 제출 기록 조회

**영향 있음**:
- 서버 사이드 Fallback 채점 불가
- AI 피드백 생성 지연/실패
- Worker Monitor 알림 발송

**사용자 경험**:
- 채점은 정상 동작
- AI 피드백만 누락 가능
- Pyodide 미지원 환경에서 채점 불가

**대응**:
```bash
docker compose -f docker-compose.prod.yml restart qa_arena_celery_worker_prod
docker logs qa_arena_celery_worker_prod --tail 100
```

### 8.2 Redis 다운 시

**영향 없음**:
- 클라이언트 사이드 채점 (Pyodide) - 정상 동작
- 문제 목록/상세 조회

**영향 있음**:
- 모든 Celery Task 불가 (브로커 역할)
- AI 피드백 생성 불가
- 서버 사이드 Fallback 채점 불가

**사용자 경험**:
- 채점은 정상 동작
- AI 피드백만 누락

**대응**:
```bash
docker compose -f docker-compose.prod.yml restart qa_arena_redis_prod
docker logs qa_arena_redis_prod --tail 50
```

### 8.3 Pyodide CDN 장애 시

**자동 Fallback**: 서버 사이드 채점으로 전환

**영향**:
- 클라이언트 측 Pyodide 초기화 실패
- 모든 채점이 서버로 전달됨
- 응답 시간 증가 (밀리초 → 수초)

**사용자 경험**:
- 채점 기능은 정상
- 응답 시간만 증가

**대응**:
- 프론트엔드 로그에서 Pyodide 초기화 에러 확인
- CDN 상태 확인 (cdn.jsdelivr.net)
- 서버 부하 모니터링 강화

### 8.4 Frontend 장애 시

**영향**: 전체 서비스 불가

**대응**:
```bash
docker compose -f docker-compose.prod.yml restart qa_arena_frontend_prod
docker logs qa_arena_frontend_prod --tail 100
```

### 8.5 Backend 장애 시

**영향**:
- 모든 API 호출 불가
- 채점 결과 저장 불가 (클라이언트/서버 모두)
- 인증 불가

**대응**:
```bash
docker compose -f docker-compose.prod.yml restart qa_arena_backend_prod
docker logs qa_arena_backend_prod --tail 100
```

### 8.6 장애 우선순위 가이드

| 우선순위 | 컴포넌트 | 이유 |
|----------|----------|------|
| 1 (최고) | Backend | 모든 기능 영향 |
| 2 | Frontend | 사용자 접근 불가 |
| 3 | Nginx | 외부 접근 불가 |
| 4 | PostgreSQL | 데이터 접근 불가 |
| 5 | Redis | AI 피드백만 영향 |
| 6 (최저) | Celery Worker | Fallback만 영향 |

---

## 9. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12 | 초기 문서 생성 | AI Copilot |
| 2025-12-18 | 하이브리드 아키텍처(Pyodide + Celery) 장애 영향 범위 추가 | AI Copilot |
| 2025-12-28 | Section 0 슬래시 명령어 및 SSM 접속 방법 추가, 백업 스크립트 경로/형식 수정 | AI Copilot |