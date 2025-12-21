---
description: Docker 컨테이너 관련 문제를 진단하고 해결 방안을 제시합니다. devops-debug Agent와 연동하여 지능적인 근본 원인 분석을 제공합니다.
---

# Docker Debug Skill

Docker 컨테이너, 볼륨, 네트워크 관련 문제를 체계적으로 진단하고 해결합니다.

## Agent 연동

이 Skill은 **devops-debug Agent**와 연동하여 더 정교한 분석을 제공합니다.

### Agent 호출 시점
- **Step 2 완료 후**: 로그 수집이 완료되면 devops-debug Agent를 호출하여 패턴 분석
- **해결 실패 시**: 기본 해결책이 작동하지 않으면 Agent에게 심층 분석 요청

### Agent 호출 방법
```
Task tool을 사용하여 devops-debug agent를 호출합니다:

subagent_type: "devops-debug"
prompt: |
  Docker 진단 데이터를 분석해주세요:

  ## 수집된 데이터
  - 컨테이너 상태: {container_status}
  - 로그 내용: {logs}
  - 볼륨 상태: {volume_status}
  - 네트워크 상태: {network_status}

  ## 요청
  근본 원인을 분석하고 해결 방안을 제시해주세요.
```

---

## 진단 워크플로우

### Step 1: 컨테이너 상태 확인
```bash
# 모든 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 상세 정보
docker compose -f docker-compose.prod.yml ps -a
```

**확인 항목:**
- 모든 컨테이너가 Up 상태인가?
- 재시작 횟수가 많은 컨테이너가 있는가?
- Health 상태가 unhealthy인 것이 있는가?

---

### Step 2: 로그 분석
```bash
# 각 서비스별 최근 로그
docker compose -f docker-compose.prod.yml logs backend | tail -100
docker compose -f docker-compose.prod.yml logs celery_worker | tail -100
docker compose -f docker-compose.prod.yml logs postgres | tail -50
docker compose -f docker-compose.prod.yml logs redis | tail -50
docker compose -f docker-compose.prod.yml logs nginx | tail -50
```

**에러 패턴 찾기:**
- "ERROR", "CRITICAL", "Exception" 키워드 검색
- 타임스탬프 확인 (문제 발생 시점)
- 스택 트레이스 전체 수집

> **Agent 호출 시점**: 로그 수집 후 devops-debug Agent를 호출하여 패턴 분석 요청

---

### Step 3: 볼륨 마운트 확인
```bash
# 볼륨 목록
docker volume ls

# 특정 볼륨 상세 정보
docker volume inspect qa_labs_postgres_data
docker volume inspect qa_labs_redis_data

# 볼륨 마운트 상태 (컨테이너 내부)
docker compose -f docker-compose.prod.yml exec celery_worker ls -la /tmp/qa_arena_judge
docker compose -f docker-compose.prod.yml exec backend ls -la /app/logs
```

**확인 항목:**
- 공유 볼륨이 올바르게 마운트되었는가?
- 파일 권한이 올바른가?
- 디스크 공간이 충분한가? (df -h)

---

### Step 4: 네트워크 연결 확인
```bash
# 네트워크 목록
docker network ls

# qa_arena_network 상세 정보
docker network inspect qa_arena_network

# 컨테이너 간 연결 테스트
docker compose -f docker-compose.prod.yml exec backend ping postgres
docker compose -f docker-compose.prod.yml exec celery_worker ping redis
```

**확인 항목:**
- 모든 컨테이너가 같은 네트워크에 있는가?
- DNS 이름으로 서로 접근 가능한가?
- 포트가 올바르게 매핑되었는가?

---

### Step 5: Docker-in-Docker 특수 체크
```bash
# Docker 소켓 마운트 확인
docker compose -f docker-compose.prod.yml exec celery_worker ls -la /var/run/docker.sock

# 소켓 권한 확인
docker compose -f docker-compose.prod.yml exec celery_worker stat -c '%a %G' /var/run/docker.sock

# group_add 설정 확인
docker inspect qa_arena_celery_worker_prod | grep -A5 GroupAdd

# judge 컨테이너가 실행 중인지
docker ps -a | grep judge
```

**QA Labs 특수 사항:**
- celery_worker가 Docker 소켓에 접근 가능한가?
- group_add로 Docker 그룹이 추가되었는가?
- /tmp/qa_arena_judge 볼륨이 공유되는가?

---

### Step 6: 리소스 사용량 확인
```bash
# 컨테이너별 리소스 사용량
docker stats --no-stream

# 호스트 리소스
free -h
df -h
```

**확인 항목:**
- CPU 사용률이 100%인 컨테이너가 있는가?
- 메모리 부족 (OOM) 발생했는가?
- 디스크 공간이 부족한가?

---

## 자동 복구 액션

### 안전한 자동 수정 (확인 후 실행)

| 문제 유형 | 자동 수정 명령 | 위험도 |
|----------|---------------|--------|
| 컨테이너 비정상 | `docker compose restart {service}` | 낮음 |
| 네트워크 문제 | `docker network prune -f` | 중간 |
| 볼륨 권한 | `chmod 777 /tmp/qa_arena_judge` | 낮음 |
| 전체 재시작 | `docker compose down && up -d` | 중간 |

**위험도가 "중간" 이상인 작업은 사용자 확인 필수**

자세한 복구 패턴은 [remediation-patterns.md](remediation-patterns.md) 참조

---

## 일반적인 문제 패턴 및 해결

### 패턴 1: 컨테이너 반복 재시작
**원인:**
- 환경변수 누락 (.env 파일)
- 의존성 서비스 미준비 (postgres, redis)
- 포트 충돌

**해결:**
```bash
# .env 파일 확인
cat .env

# depends_on health check 확인
docker compose -f docker-compose.prod.yml config

# 포트 충돌 확인
netstat -tuln | grep 8000
```

### 패턴 2: 볼륨 마운트 실패
**원인:**
- 호스트 경로 없음
- 권한 부족
- Docker-in-Docker 경로 불일치

**해결:**
```bash
# 호스트에 디렉토리 생성
sudo mkdir -p /tmp/qa_arena_judge
sudo chmod 777 /tmp/qa_arena_judge

# 컨테이너 재시작
docker compose -f docker-compose.prod.yml restart celery_worker
```

### 패턴 3: 네트워크 연결 실패
**원인:**
- 서비스 이름 오타
- 네트워크 설정 누락
- 포트 번호 불일치

**해결:**
```bash
# 네트워크 재생성
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### 패턴 4: Docker 소켓 권한 오류
**원인:**
- group_add 설정 누락
- Docker 소켓 마운트 누락

**해결:**
```bash
# docker-compose.prod.yml에 추가
# celery_worker:
#   group_add:
#     - "988"  # Docker 그룹 ID
#   volumes:
#     - /var/run/docker.sock:/var/run/docker.sock
```

---

## 최종 리포트 형식

```
========================================
Docker 진단 리포트
========================================

[1] 컨테이너 상태
[OK] backend: Up
[OK] celery_worker: Up
[OK] postgres: Up (healthy)
[OK] redis: Up (healthy)
[FAIL] nginx: Restarting

[2] 발견된 문제
- nginx 컨테이너가 반복적으로 재시작됨
- 로그에서 "bind: address already in use" 에러 확인

[3] Agent 분석 결과
(devops-debug Agent 응답 내용)

[4] 원인 분석
- 포트 80이 이미 사용 중
- 다른 프로세스가 80 포트를 점유한 것으로 추정

[5] 권장 해결 방법
1. 포트를 점유한 프로세스 확인:
   sudo netstat -tuln | grep :80

2. 해당 프로세스 종료 또는 nginx 포트 변경

3. nginx 컨테이너 재시작:
   docker compose -f docker-compose.prod.yml restart nginx

[6] 자동 복구 가능 여부
- [AUTO] 컨테이너 재시작 가능
- [MANUAL] 포트 충돌 해결 필요
```

---

## 사용 시점
- 컨테이너가 시작되지 않을 때
- 서비스 간 통신이 안 될 때
- 볼륨 마운트 문제 발생 시
- Docker-in-Docker 관련 오류 발생 시
