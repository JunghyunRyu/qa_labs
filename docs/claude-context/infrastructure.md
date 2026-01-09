# Infrastructure Reference

> Claude Context 전용 - 인프라/접속 정보

---

## EC2 인스턴스 정보

| 항목 | 값 |
|------|---|
| **Instance ID** | `i-05b23ecec2bdcd44a` |
| **Instance Type** | t3.medium |
| **OS** | Ubuntu 24.04 LTS |
| **Region** | ap-northeast-2 (서울) |
| **Project Path** | `/home/ssm-user/qa_labs` |
| **Domain** | https://qa-arena.qalabs.kr |

---

## SSM 접속 방법

> SSH 대신 AWS Systems Manager (SSM)을 사용합니다.

### SSM 명령 실행

```bash
# 단일 명령 실행
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && <명령어>"]' \
  --query 'Command.CommandId' --output text

# 결과 확인 (60초 대기 후)
aws ssm get-command-invocation \
  --command-id "<COMMAND_ID>" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query 'StandardOutputContent' --output text
```

### 자주 사용하는 명령

```bash
# 서비스 상태 확인
cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml ps

# 로그 확인
cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml logs -f <서비스명>

# 서비스 재시작
cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml restart <서비스명>

# Git pull + 재빌드
cd /home/ssm-user/qa_labs && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

---

## Docker 서비스 구성

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                         nginx (80/443)                       │
│                    Reverse Proxy + SSL                       │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│   frontend (:3000)      │     │      backend (:8000)        │
│   Next.js + Pyodide     │     │      FastAPI + JWT          │
└─────────────────────────┘     └──────────────┬──────────────┘
                                               │
              ┌────────────────────────────────┼────────────────┐
              │                                │                │
              ▼                                ▼                ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐
│  postgres (:5432)   │  │    redis (:6379)    │  │   celery_worker    │
│   PostgreSQL 15     │  │   Celery Broker     │  │    ───────────     │
└─────────────────────┘  └─────────────────────┘  │ worker_monitor     │
                                                  └─────────┬──────────┘
                                                            │
                                                            ▼
                                                  ┌────────────────────┐
                                                  │ docker-socket-proxy │
                                                  │  (보안 Docker API)   │
                                                  └────────────────────┘
```

### 서비스 목록

| 서비스 | 포트 | 역할 | 이미지 |
|--------|------|------|--------|
| nginx | 80, 443 | Reverse Proxy, SSL Termination | nginx:alpine |
| frontend | 3000 | Next.js 웹 애플리케이션 | Custom (Node.js) |
| backend | 8000 | FastAPI REST API | Custom (Python 3.11) |
| postgres | 5432 | PostgreSQL 15 데이터베이스 | postgres:15-alpine |
| redis | 6379 | Celery Broker, 캐시 | redis:7-alpine |
| celery_worker | - | 비동기 작업 처리 (AI 피드백, 채점) | Custom (Python 3.11) |
| worker_monitor | - | Celery Worker 상태 모니터링 | Custom (Python 3.11) |
| docker-socket-proxy | 2375 | Docker Socket 보안 프록시 | tecnativa/docker-socket-proxy |

---

## Docker 네트워크

| 네트워크 | 용도 | Driver | 특성 |
|---------|------|--------|------|
| qa_arena_internal | DB, Redis, Worker 통신 | bridge | internal (외부 차단) |
| qa_arena_frontend | Nginx, Frontend, Backend | bridge | 외부 접근 가능 |
| docker_internal | Docker Socket Proxy | bridge | internal |

### 네트워크 연결 매트릭스

| 서비스 | qa_arena_internal | qa_arena_frontend | docker_internal |
|--------|------------------|-------------------|-----------------|
| nginx | - | ✅ | - |
| frontend | - | ✅ | - |
| backend | ✅ | ✅ | - |
| postgres | ✅ | - | - |
| redis | ✅ | - | - |
| celery_worker | ✅ | ✅ | ✅ |
| worker_monitor | ✅ | - | - |
| docker-socket-proxy | - | - | ✅ |

---

## Docker-in-Docker (DinD) 구성

### 채점 시스템 아키텍처

```
celery_worker ──────────────────────────────────────────────┐
    │                                                        │
    │ [제출 요청 수신]                                        │
    ▼                                                        │
┌─────────────────────────────────────────────────────────┐  │
│ Judge 컨테이너 생성 (임시)                                │  │
│ ├── test_user.py (사용자 테스트 코드)                     │  │
│ ├── target.py (golden_code 또는 buggy_code)              │  │
│ └── pytest 실행 → 결과 수집                              │  │
└─────────────────────────────────────────────────────────┘  │
    │                                                        │
    │ [컨테이너 정리 후 결과 반환]                            │
    ▼                                                        │
┌─────────────────────────────────────────────────────────┐  │
│ 호스트 공유 볼륨: /tmp/qa_arena_judge                     │◀─┘
│ (임시 파일 저장/교환용)                                   │
└─────────────────────────────────────────────────────────┘
```

### Docker Socket Proxy

- celery_worker는 Docker Socket에 직접 접근하지 않고 **Docker Socket Proxy**를 통해 제한된 API만 사용
- 허용된 작업: 컨테이너 생성, 시작, 중지, 삭제, 로그 조회
- 차단된 작업: 이미지 빌드, 네트워크 생성, 볼륨 삭제 등

### 공유 볼륨

| 경로 | 용도 |
|------|------|
| `/tmp/qa_arena_judge` | 채점용 임시 파일 (호스트 ↔ 컨테이너) |
| `/var/run/docker.sock` | Docker Socket (Proxy 경유) |

---

## 환경 변수 위치

| 파일 | 용도 | 비고 |
|------|------|------|
| `.env` (로컬) | 로컬 개발 환경 | Git 미추적 |
| `.env.prod` (EC2) | 프로덕션 환경 | Git 미추적 |
| `docker-compose.prod.yml` | 일부 환경변수 직접 정의 | Git 추적 |

### 주요 환경 변수

| 변수 | 설명 |
|------|------|
| DATABASE_URL | PostgreSQL 연결 문자열 |
| REDIS_URL | Redis 연결 문자열 |
| JWT_SECRET_KEY | JWT 서명 키 |
| OPENAI_API_KEY | OpenAI API 키 |
| GITHUB_CLIENT_ID/SECRET | GitHub OAuth |
| GOOGLE_CLIENT_ID/SECRET | Google OAuth |
| SENTRY_DSN | Sentry 에러 추적 |
| DISCORD_WEBHOOK_URL | Discord 알림 |

---

## SSL/HTTPS 설정

| 항목 | 값 |
|------|---|
| 인증서 발급 | Let's Encrypt |
| 갱신 방식 | Certbot (자동) |
| 인증서 경로 | `/etc/letsencrypt/live/qa-arena.qalabs.kr/` |

---

## 모니터링

| 도구 | 용도 | 설정 위치 |
|------|------|----------|
| Sentry | 에러 추적 | Backend + Frontend |
| Discord Webhook | 일일 리포트 알림 | `/daily-report --notify` |
| Docker Healthcheck | 컨테이너 상태 | docker-compose.prod.yml |

---

## 백업 정책

| 대상 | 주기 | 보관 기간 | 상세 문서 |
|------|------|----------|----------|
| PostgreSQL | 일일 | 7일 | `docs/specs/backup_restore.md` |
| 볼륨 데이터 | 수동 | - | 필요시 |

---

*최종 업데이트: 2026-01-10*
