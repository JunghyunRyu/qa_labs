# SRE/DevOps Agent Context

> 인프라 전문 에이전트를 위한 축소 컨텍스트

---

## 인프라 개요

### EC2 인스턴스

| 항목 | 값 |
|------|---|
| Instance ID | `i-05b23ecec2bdcd44a` |
| 타입 | t3.medium |
| OS | Ubuntu 24.04 LTS |
| 프로젝트 경로 | `/home/ssm-user/qa_labs` |
| 접속 방식 | AWS SSM (SSH 미사용) |

### 도메인 및 SSL

| 항목 | 값 |
|------|---|
| 도메인 | qa-arena.qalabs.kr |
| SSL | Let's Encrypt (자동 갱신) |
| Proxy | Nginx |

---

## Docker 서비스 구조

```
┌─────────────────────────────────────────────────────┐
│                    nginx (80/443)                    │
│               Reverse Proxy + SSL                    │
└─────────────┬───────────────────────┬───────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────────┐
│  frontend (:3000)   │   │    backend (:8001)      │
│  Next.js 16         │   │    FastAPI              │
└─────────────────────┘   └───────────┬─────────────┘
                                      │
          ┌───────────────────────────┼───────────────┐
          │                           │               │
          ▼                           ▼               ▼
┌─────────────────┐   ┌─────────────────┐   ┌────────────────┐
│  postgres       │   │     redis       │   │ celery_worker  │
│  (:5432)        │   │   (:6379)       │   │ + worker_mon   │
└─────────────────┘   └─────────────────┘   └────────────────┘
```

### 서비스별 정보

| 서비스 | 포트 | 리소스 제한 | 역할 |
|--------|------|------------|------|
| nginx | 80, 443 | - | 리버스 프록시 |
| frontend | 3000 | 512MB, 0.5 CPU | Next.js SSR |
| backend | 8001 | 1GB, 1 CPU | FastAPI API |
| celery_worker | - | 2GB, 2 CPU | 비동기 작업 |
| postgres | 5432 | - | 데이터베이스 |
| redis | 6379 | 512MB | 캐시/브로커 |

---

## 네트워크 구조

| 네트워크 | 서비스 | 특성 |
|---------|-------|------|
| qa_arena_internal | postgres, redis, celery | internal (외부 차단) |
| qa_arena_frontend | nginx, frontend, backend | 외부 접근 가능 |
| docker_internal | docker-socket-proxy | internal |

---

## SSM 명령 패턴

### 기본 명령 실행
```bash
# 명령 전송
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[\"cd /home/ssm-user/qa_labs && [명령]\"]" \
  --output text --query "Command.CommandId")

# 결과 조회 (5초 대기 후)
sleep 5
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query "StandardOutputContent" --output text
```

### 자주 사용하는 명령

```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 전체 로그
docker compose -f docker-compose.prod.yml logs --tail=50

# 특정 서비스 로그
docker compose -f docker-compose.prod.yml logs -f backend --tail=100

# 서비스 재시작
docker compose -f docker-compose.prod.yml restart [서비스]

# 전체 재빌드 배포
docker compose -f docker-compose.prod.yml up -d --build

# 특정 서비스만 재빌드
docker compose -f docker-compose.prod.yml up -d --build backend
```

---

## 헬스체크 엔드포인트

### API 헬스체크
```bash
curl -s https://qa-arena.qalabs.kr/api/v1/health | jq
```

**응답 예시**:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "online"
}
```

### 프론트엔드 체크
```bash
curl -s -o /dev/null -w "%{http_code}" https://qa-arena.qalabs.kr/
# 기대값: 200
```

---

## 환경 변수 (주요 항목)

| 변수 | 용도 |
|------|------|
| DATABASE_URL | PostgreSQL 연결 |
| REDIS_URL | Redis 연결 |
| JWT_SECRET_KEY | JWT 서명 |
| OPENAI_API_KEY | AI 기능 |
| GITHUB_CLIENT_ID/SECRET | GitHub OAuth |
| GOOGLE_CLIENT_ID/SECRET | Google OAuth |
| SENTRY_DSN | 에러 추적 |
| DISCORD_WEBHOOK_URL | 알림 |

---

## 복구 등급

### SAFE (자동 실행 가능)
- 컨테이너 재시작
- 볼륨 권한 복구
- 로그 정리

### CAUTION (확인 권장)
- 네트워크 재생성
- 전체 스택 재시작
- 이미지 재빌드

### DANGER (필수 확인)
- 볼륨 삭제
- Docker 데몬 재시작
- 롤백

---

## 모니터링 임계치

| 지표 | 정상 | 주의 | 위험 |
|------|-----|-----|-----|
| CPU | <60% | 60-80% | >80% |
| 메모리 | <70% | 70-85% | >85% |
| 디스크 | <70% | 70-85% | >85% |
| 에러율 | <1% | 1-5% | >5% |
| 응답시간 | <500ms | 500-1000ms | >1000ms |

---

## 롤백 절차

### Git 기반 롤백
```bash
# 이전 커밋 확인
git log --oneline -5

# 롤백 (EC2에서)
cd /home/ssm-user/qa_labs
git checkout [이전_커밋_해시]
docker compose -f docker-compose.prod.yml up -d --build
```

### Docker 이미지 롤백
```bash
# 이전 이미지로 복원 (태그가 있는 경우)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 제한 사항

- 소스 코드 수정 금지 (인프라 설정만)
- `--force` 옵션 금지
- 볼륨 삭제 시 확인 필수
- 보안 그룹/IAM 수정 금지

---

*SRE/DevOps Agent 전용 컨텍스트 v1.0*
