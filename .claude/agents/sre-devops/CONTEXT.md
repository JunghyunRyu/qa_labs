# SRE/DevOps Agent Context

> 배포 및 인프라 관리에 필요한 최소한의 컨텍스트

---

## 프로젝트 개요

**QA Arena** - 뮤테이션 테스트 기반 코딩 테스트 플랫폼

### 기술 스택
- **Frontend**: Next.js 16, TypeScript
- **Backend**: FastAPI, Python 3.11
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis, Celery
- **Proxy**: Nginx

---

## 인프라 정보

### EC2
| 항목 | 값 |
|------|---|
| Instance ID | `i-05b23ecec2bdcd44a` |
| Region | ap-northeast-2 (서울) |
| OS | Ubuntu 24.04 LTS |
| Project Path | `/home/ssm-user/qa_labs` |

### 도메인
- **Production**: https://qa-arena.qalabs.kr
- **Backend Health**: http://localhost:8001/health
- **Frontend**: http://localhost:3000

---

## Docker Compose 구성

### 서비스 맵
```
nginx (80/443)
  ├── frontend (3000)
  └── backend (8001→8000)
        ├── postgres (5432)
        ├── redis (6379)
        └── celery_worker
```

### 주요 명령어
```bash
# 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인
docker compose -f docker-compose.prod.yml logs --tail=100 <서비스>

# 재시작
docker compose -f docker-compose.prod.yml restart <서비스>

# 빌드 + 재시작
docker compose -f docker-compose.prod.yml up -d --build <서비스들>
```

---

## 배포 시 주의사항

### 반드시 지켜야 할 규칙

1. **nginx 포함 재시작**
   ```bash
   # 올바른 방법
   docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx
   
   # 잘못된 방법 (502 에러 발생)
   docker compose -f docker-compose.prod.yml up -d --build backend frontend
   ```

2. **빌드 실패 시 네트워크 옵션**
   ```bash
   docker build --network=host -t <이미지> -f <Dockerfile> <context>
   ```

3. **마이그레이션 먼저 실행**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
   ```

---

## 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| 502 Bad Gateway | nginx DNS 캐싱 | `restart nginx` |
| apt-get 실패 | Docker 네트워크 | `--network=host` |
| 타입 에러 | 코드 문제 | 메인 에이전트에 알림 |
| DB 연결 실패 | 마이그레이션 | `alembic upgrade head` |

---

## 접근 권한

### 이 에이전트가 할 수 있는 것
- SSM을 통한 EC2 명령 실행
- Docker 컨테이너 관리
- 로그 확인 및 분석
- 헬스체크 수행

### 이 에이전트가 할 수 없는 것
- 코드 수정 (메인 에이전트 담당)
- DB 스키마 직접 변경 (DB Admin 담당)
- 비밀정보 수정 (.env 등)

---

*최종 업데이트: 2026-01-16*
