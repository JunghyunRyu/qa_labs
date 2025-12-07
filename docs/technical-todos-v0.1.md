# v0.1 - 내부용 MVP (기본 채점 파이프라인 완성)

> 작성일: 2025-01-27  
> 목표: 내부 테스트 가능한 최소 기능 완성  
> 환경: EC2 (13.125.154.68, Ubuntu, /home/ubuntu/qa_labs)  
> 관련 문서: [qa-arena-spec.md](qa-arena-spec.md), [EC2_DEPLOYMENT.md](../EC2_DEPLOYMENT.md)

---

## 개요

v0.1 마일스톤은 기본 채점 파이프라인이 완전히 동작하도록 하는 것을 목표로 합니다. EC2 프로덕션 환경에서 Docker 기반 Judge 서비스가 정상적으로 동작하도록 설정하고, End-to-End 채점 플로우를 검증합니다.

### 완료 조건

- [x] 로컬 개발 환경에서 Docker 소켓 마운트 설정 완료 (코드 수정 완료, Windows 환경 제한 확인)
- [ ] EC2에서 Docker 소켓 마운트가 정상 동작 (EC2에서 검증 필요)
- [ ] Judge 컨테이너가 정상적으로 생성/실행/정리됨 (Windows 환경 제한으로 미검증, EC2에서 검증 필요)
- [x] 전체 채점 플로우 부분 검증 완료 (문제 조회 ✅ → 제출 생성 ✅ → 채점 ⚠️ Windows 제한 → 결과 조회 API ✅)
- [x] 기본 에러 핸들링 코드 구현 완료 (재시도 로직, 상태 업데이트 등)
- [x] 데이터베이스 스키마 확인 완료 (15개 문제 등록 확인)

---

## 1. Docker 인프라 설정

### 1.1. Docker 소켓 마운트 (EC2 프로덕션 환경)

**목적**: Celery Worker가 Docker 데몬에 접근하여 Judge 컨테이너를 생성할 수 있도록 설정

#### 작업 내용

- [x] `docker-compose.yml` 수정 (로컬 개발용)
  - [x] `celery_worker` 서비스에 Docker 소켓 마운트 추가
    ```yaml
    celery_worker:
      volumes:
        - /var/run/docker.sock:/var/run/docker.sock
        - ./backend/logs:/app/logs
      environment:
        DOCKER_CONTAINER: "true"
    ```
  - [ ] `backend` 서비스에도 동일 설정 (필요 시, 현재는 Celery Worker만)
    - [ ] Admin API에서 직접 Judge 실행하는 경우에만 필요
  - [x] 환경변수 설정 확인
    - [x] `DOCKER_CONTAINER=true` 추가 (코드에서 자동 감지)
- [ ] `docker-compose.prod.yml` 수정 (EC2 프로덕션용, EC2에서 검증 필요)

#### EC2에서 실행할 명령어

```bash
# EC2 서버 접속
ssh -i C:\pem\my_proton_key.pem ubuntu@13.125.154.68

# 프로젝트 디렉토리로 이동
cd /home/ubuntu/qa_labs

# docker-compose.prod.yml 수정 확인
cat docker-compose.prod.yml | grep -A 5 celery_worker

# Docker 소켓 권한 확인
ls -la /var/run/docker.sock
# ubuntu 사용자가 docker 그룹에 속해있는지 확인
groups ubuntu

# docker 그룹에 추가 (필요 시)
sudo usermod -aG docker ubuntu
# 재로그인 필요
```

#### 검증 방법

```bash
# 컨테이너 재배포
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Celery Worker 로그 확인
docker-compose -f docker-compose.prod.yml logs celery_worker | tail -n 100

# Celery Worker 컨테이너 내부에서 Docker 접근 테스트
docker exec qa_arena_celery_worker_prod docker ps
# 정상적으로 Docker 명령이 실행되면 성공
```

### 1.2. Docker Service 코드 검증

**목적**: `docker_service.py`가 EC2 환경에서 정상 동작하는지 확인

#### 작업 내용

- [x] `backend/app/services/docker_service.py` 검증
  - [x] `docker.from_env()` 사용 확인
    - [x] 현재 코드: `self.client = docker.from_env()` (컨테이너 내부에서는 Unix socket 우선 시도)
    - [x] EC2 환경에서 `DOCKER_HOST` 환경변수가 자동으로 설정되는지 확인 (코드에서 자동 감지)
  - [x] Windows/Linux 환경 분기 로직 검증
    - [x] EC2는 Linux이므로 `platform.system() == "Windows"` 분기는 실행되지 않음
    - [x] Linux 분기에서 `docker.from_env()`가 정상 동작하는지 확인 (컨테이너 내부 환경 감지 로직 추가)
  - [ ] 프로덕션 환경에서 Docker 클라이언트 연결 테스트 (EC2에서 검증 필요)
    ```python
    # 테스트 코드 작성 또는 수동 테스트
    from app.services.docker_service import DockerService
    docker_service = DockerService()
    # docker_service.client.ping() 성공 확인
    ```

#### EC2에서 테스트

```bash
# Backend 컨테이너 내부에서 Python 인터프리터 실행
docker exec -it qa_arena_backend_prod python

# Python에서 테스트
>>> from app.services.docker_service import DockerService
>>> ds = DockerService()
>>> ds.client.ping()
True  # 성공 시 True 반환
```

### 1.3. Judge Docker 이미지 빌드 및 배포

**목적**: Judge 이미지가 EC2에 빌드되어 사용 가능한지 확인

#### 작업 내용

- [x] Judge 이미지 빌드 스크립트 작성/검증
  - [x] `judge/Dockerfile` 최적화 확인
    - [x] `python:3.11-slim` 기반 사용
    - [x] 필요한 패키지만 설치 (pytest 등)
  - [x] 이미지 빌드: `docker build -t qa-arena-judge:latest ./judge` (로컬에서 확인 완료)
  - [ ] 이미지 태그 및 버전 관리 전략 수립 (EC2 배포 시 적용)
    - [ ] 버전 태그 추가: `qa-arena-judge:v0.1.0`
    - [ ] `latest` 태그는 항상 최신 버전을 가리키도록 설정

#### EC2에서 실행할 명령어

```bash
# Judge 이미지 빌드
cd /home/ubuntu/qa_labs
docker build -t qa-arena-judge:latest ./judge

# 이미지 확인
docker images | grep qa-arena-judge

# 이미지 테스트 (간단한 pytest 실행)
docker run --rm qa-arena-judge:latest pytest --version
```

#### 배포 스크립트에 포함

`scripts/deploy_ec2.sh`에 다음 내용 추가:

```bash
# Judge 이미지 빌드
echo "Building Judge Docker image..."
docker build -t qa-arena-judge:latest ./judge
```

---

## 2. 채점 파이프라인 검증

### 2.1. End-to-End 채점 플로우 테스트

**목적**: 전체 채점 플로우가 정상 동작하는지 검증

#### 2.1.1. 문제 등록 검증

- [x] 최소 1개 이상 문제 등록 확인
  - [x] 기존 문제 확인: 15개 문제 등록 확인 (로컬 환경)
  - [x] 문제 메타데이터 정확성 확인
    - [x] `title`, `description_md`, `function_signature`, `golden_code` 존재
    - [x] `buggy_implementations`가 1개 이상 존재 (API 응답 확인)

#### EC2에서 확인

```bash
# PostgreSQL 컨테이너에 접속
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena

# 문제 목록 확인
SELECT id, slug, title, difficulty FROM problems LIMIT 5;

# Buggy implementations 확인
SELECT problem_id, COUNT(*) as mutant_count 
FROM buggy_implementations 
GROUP BY problem_id;
```

#### 2.1.2. 제출 생성 및 처리 검증

- [x] `POST /api/v1/submissions` 엔드포인트 테스트
  - [x] API 요청 성공 확인
  - [x] Submission ID 반환 확인
- [x] Submission 상태 흐름 확인 (부분 완료)
  - [x] 초기 상태: `PENDING` (확인 완료)
  - [ ] Celery Task 시작 후: `RUNNING` (Windows 환경 제한으로 미검증)
  - [ ] 완료 후: `SUCCESS` 또는 `FAILURE` (Windows 환경 제한으로 미검증)
- [x] Celery Task 발행 및 처리 확인 (부분 완료)
  - [x] Redis 큐에 Task가 추가되는지 확인 (Task 수신 확인)
  - [x] Celery Worker가 Task를 처리하는지 확인 (Task 수신 확인, Docker 연결 실패로 실제 처리 미완료)

#### EC2에서 테스트

```bash
# API 테스트 (로컬 또는 EC2에서)
curl -X POST http://localhost/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "code": "import pytest\nfrom target import normalize_whitespace\n\ndef test_normalize():\n    assert normalize_whitespace(\"hello  world\") == \"hello world\""
  }'

# Submission 상태 확인
curl http://localhost/api/v1/submissions/{submission_id}

# Celery Worker 로그 확인
docker-compose -f docker-compose.prod.yml logs celery_worker | grep "Processing submission"
```

#### 2.1.3. Judge 컨테이너 실행 검증

- [ ] Golden Code 테스트 실행 확인
  - [ ] Judge 컨테이너가 생성됨
  - [ ] `target.py`에 Golden Code가 작성됨
  - [ ] `test_user.py`에 사용자 테스트 코드가 작성됨
  - [ ] pytest 실행 성공
- [ ] Mutant 테스트 실행 확인
  - [ ] 각 Mutant에 대해 Judge 컨테이너 생성
  - [ ] `target.py`에 Buggy Code가 작성됨
  - [ ] 테스트 실패 확인 (Mutant가 kill됨)
- [ ] 컨테이너 리소스 정리 확인
  - [ ] 컨테이너가 실행 후 자동으로 제거됨
  - [ ] 임시 디렉토리가 정리됨
  - [ ] 메모리 누수 없음

#### EC2에서 확인

```bash
# Judge 컨테이너 생성 확인
docker ps -a | grep qa-arena-judge

# 컨테이너 로그 확인
docker logs <container_id>

# 컨테이너 정리 확인 (실행 후 자동 제거)
docker ps -a | grep qa-arena-judge
# 실행 중인 컨테이너가 없어야 함

# 임시 디렉토리 확인
ls -la /tmp/qa_arena_judge_*
# 오래된 임시 디렉토리가 정리되었는지 확인
```

#### 2.1.4. 결과 저장 및 조회 검증

- [ ] `GET /api/v1/submissions/{id}` 응답 정확성
  - [ ] `status` 필드가 올바른 값
  - [ ] `score` 필드가 계산됨
  - [ ] `killed_mutants`, `total_mutants` 필드가 올바름
  - [ ] `execution_log` 필드에 로그가 저장됨
  - [ ] `feedback_json` 필드에 AI 피드백이 저장됨
- [ ] 점수 계산 로직 검증
  - [ ] Base score: 30점
  - [ ] Kill ratio에 따른 추가 점수: `kill_ratio * 70`
  - [ ] 최대 점수: 100점
- [ ] Kill ratio 계산 정확성
  - [ ] `killed_mutants / total_mutants` 계산
  - [ ] Weight를 고려한 계산

#### EC2에서 확인

```bash
# Submission 결과 조회
curl http://localhost/api/v1/submissions/{submission_id} | jq

# 데이터베이스에서 직접 확인
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena
SELECT id, status, score, killed_mutants, total_mutants 
FROM submissions 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 3. 기본 에러 핸들링

### 3.1. Docker 컨테이너 실행 실패 처리

**목적**: Judge 컨테이너 실행 중 발생할 수 있는 에러를 적절히 처리

#### 작업 내용

- [ ] 타임아웃 처리 검증 (기본 5초)
  - [ ] `backend/app/services/docker_service.py`의 `DEFAULT_TIMEOUT` 확인
  - [ ] 타임아웃 발생 시 컨테이너 강제 종료 확인
  - [ ] 타임아웃 에러가 `execution_log`에 기록되는지 확인
- [ ] 컨테이너 강제 종료 로직 검증
  - [ ] `container.kill()` 호출 확인
  - [ ] 컨테이너가 정상적으로 제거되는지 확인
- [ ] 리소스 정리 보장 (finally 블록)
  - [ ] `run_pytest()` 함수의 `finally` 블록 확인
  - [ ] 에러 발생 시에도 임시 디렉토리가 정리되는지 확인

#### 테스트 시나리오

```python
# 테스트: 타임아웃 발생 시나리오
# 무한 루프를 포함한 테스트 코드로 타임아웃 테스트
test_code = """
import time
def test_infinite():
    while True:
        time.sleep(1)
"""
# 타임아웃 발생 후 에러 처리 확인
```

### 3.2. Celery Task 실패 처리

**목적**: Celery Task 실행 중 발생하는 에러를 적절히 처리

#### 작업 내용

- [ ] 재시도 로직 설정
  - [ ] `app/workers/tasks.py` 확인
    - [ ] `max_retries` 설정
    - [ ] `retry_backoff` 설정 (지수 백오프)
  - [ ] 재시도 횟수 초과 시 처리
- [ ] 실패 시 Submission 상태 업데이트
  - [ ] `status = "ERROR"` 설정
  - [ ] `execution_log`에 에러 정보 저장
- [ ] 에러 로그 저장
  - [ ] `execution_log` 필드에 에러 메시지 저장
  - [ ] 스택 트레이스 저장 (디버깅용, 프로덕션에서는 제한)

#### EC2에서 확인

```bash
# Celery Worker 로그 확인
docker-compose -f docker-compose.prod.yml logs celery_worker | grep -i error

# 실패한 Submission 확인
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena
SELECT id, status, execution_log->>'error' as error 
FROM submissions 
WHERE status = 'ERROR';
```

### 3.3. API 에러 응답 표준화

**목적**: API 에러 응답 형식을 일관되게 유지

#### 작업 내용

- [ ] HTTP 상태 코드 일관성
  - [ ] `400 Bad Request`: 잘못된 요청
  - [ ] `404 Not Found`: 리소스 없음
  - [ ] `500 Internal Server Error`: 서버 에러
- [ ] 에러 메시지 형식 통일
  - [ ] JSON 형식: `{"detail": "에러 메시지"}`
  - [ ] 에러 타입 필드 추가 (옵션): `{"detail": "...", "type": "validation_error"}`
- [ ] 스택 트레이스 노출 방지 (프로덕션)
  - [ ] `app/main.py`의 전역 예외 핸들러 확인
  - [ ] `DEBUG=False`일 때 스택 트레이스 숨김
  - [ ] 실제 에러는 로그에만 기록

#### EC2에서 확인

```bash
# 에러 응답 테스트
curl -X POST http://localhost/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# 400 Bad Request 응답 확인

# 존재하지 않는 리소스 조회
curl http://localhost/api/v1/submissions/00000000-0000-0000-0000-000000000000
# 404 Not Found 응답 확인
```

---

## 4. 데이터베이스 스키마 정리

### 4.1. Enum 값 및 제약조건 정리

**목적**: 데이터베이스 스키마의 enum 값과 제약조건을 최종 확정

#### 작업 내용

- [ ] `difficulty` enum 값 최종 확정
  - [ ] 현재 값: `Very Easy`, `Easy`, `Medium`, `Hard`
  - [ ] 마이그레이션 스크립트 검증
    - [ ] `backend/alembic/versions/` 디렉토리 확인
    - [ ] `difficulty` CHECK constraint 확인
- [ ] `status` enum 값 검증 (submissions 테이블)
  - [ ] 현재 값: `PENDING`, `RUNNING`, `SUCCESS`, `FAILURE`, `ERROR`
  - [ ] 상태 전이 규칙 문서화
    - [ ] `PENDING` → `RUNNING` → `SUCCESS`/`FAILURE`/`ERROR`
    - [ ] 잘못된 상태 전이 방지 로직 (옵션)
- [ ] Alembic 마이그레이션 스크립트 재점검
  - [ ] 모든 마이그레이션 파일 검토
  - [ ] 롤백 스크립트 검증
    - [ ] `alembic downgrade -1` 테스트

#### EC2에서 확인

```bash
# 마이그레이션 상태 확인
docker exec qa_arena_backend_prod alembic current

# 마이그레이션 히스토리 확인
docker exec qa_arena_backend_prod alembic history

# 스키마 확인
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena
\d problems
\d submissions
```

### 4.2. 테스트 데이터 세트 추가

**목적**: 다양한 시나리오를 테스트할 수 있는 샘플 데이터 준비

#### 작업 내용

- [ ] 샘플 문제 데이터 (다양한 난이도)
  - [ ] `Very Easy`: 2-3개
  - [ ] `Easy`: 5-7개
  - [ ] `Medium`: 2-3개 (옵션)
  - [ ] `Hard`: 1-2개 (옵션)
- [ ] 샘플 제출 데이터 (성공/실패 케이스)
  - [ ] 성공 케이스: 모든 Mutant를 kill한 제출
  - [ ] 부분 성공: 일부 Mutant만 kill한 제출
  - [ ] 실패 케이스: Golden Code 테스트 실패

#### 데이터 로드 스크립트

```bash
# EC2에서 실행
cd /home/ubuntu/qa_labs
docker exec qa_arena_backend_prod python scripts/load_generated_problems.py
```

---

## 5. EC2 환경 특화 작업

### 5.1. 배포 스크립트 검증

**목적**: EC2 배포 스크립트가 정상 동작하는지 확인

#### 작업 내용

- [ ] `scripts/deploy_ec2.sh` 검증
  - [ ] Judge 이미지 빌드 포함 확인
  - [ ] Docker Compose 프로덕션 설정 확인
  - [ ] 데이터베이스 마이그레이션 자동 실행 확인
- [ ] 배포 후 서비스 상태 확인
  - [ ] 모든 컨테이너가 정상 실행 중
  - [ ] Health check 엔드포인트 응답 확인

#### EC2에서 실행

```bash
# 배포 스크립트 실행
cd /home/ubuntu/qa_labs
chmod +x scripts/deploy_ec2.sh
./scripts/deploy_ec2.sh

# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# Health check
curl http://localhost/health
```

### 5.2. 로그 모니터링 설정

**목적**: EC2에서 로그를 쉽게 확인할 수 있도록 설정

#### 작업 내용

- [ ] 로그 디렉토리 확인
  - [ ] `backend/logs/` 디렉토리 마운트 확인
  - [ ] 로그 파일 권한 확인
- [ ] 로그 로테이션 설정 (옵션)
  - [ ] `logrotate` 설정 파일 생성
  - [ ] 일일/주간 로그 로테이션

#### EC2에서 확인

```bash
# 로그 디렉토리 확인
ls -la /home/ubuntu/qa_labs/backend/logs/

# 최근 로그 확인
tail -f /home/ubuntu/qa_labs/backend/logs/app.log
tail -f /home/ubuntu/qa_labs/backend/logs/error.log
```

---

## 완료 체크리스트

### 필수 항목

- [ ] Docker 소켓 마운트가 EC2에서 정상 동작
- [ ] Judge 컨테이너가 정상적으로 생성/실행/정리됨
- [ ] 전체 채점 플로우가 정상 동작 (문제 조회 → 제출 → 채점 → 결과 조회)
- [ ] 에러 핸들링이 동작함 (타임아웃, 컨테이너 실패, Task 실패)
- [ ] 데이터베이스 스키마가 정리됨 (enum 값, 제약조건)

### 검증 방법

1. **로컬 테스트**: 개발 환경에서 기본 기능 테스트
2. **EC2 배포**: `scripts/deploy_ec2.sh` 실행
3. **E2E 테스트**: 실제 문제 제출 및 채점 결과 확인
4. **에러 테스트**: 의도적으로 에러를 발생시켜 에러 핸들링 확인

---

## 다음 단계

v0.1 완료 후 다음 마일스톤으로 진행:
- [v0.2 - 보안/로그/기본 운영 안정화](technical-todos-v0.2.md)

---

## 참고 문서

- [EC2 배포 가이드](../EC2_DEPLOYMENT.md)
- [프로젝트 사양서](qa-arena-spec.md)
- [마일스톤 진행 상황](qa-arena-milestones.md)

