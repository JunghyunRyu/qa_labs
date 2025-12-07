# 채점 파이프라인 검증 결과

**검증 일시**: 2025-12-06  
**환경**: Windows 10, Docker Desktop

## 검증 결과 요약

### ✅ 성공한 항목

1. **데이터베이스 연결**
   - PostgreSQL 컨테이너 정상 동작
   - 문제 15개 등록 확인
   - 데이터 조회 정상

2. **API 서버**
   - FastAPI 서버 정상 동작
   - 문제 목록 조회 API 정상
   - 문제 상세 조회 API 정상
   - 제출 생성 API 정상

3. **Celery Worker**
   - Celery Worker 컨테이너 정상 시작
   - Redis 연결 정상
   - Task 수신 정상

4. **Judge Docker 이미지**
   - `qa-arena-judge:latest` 이미지 존재 확인

### ⚠️ 문제점

1. **Docker 소켓 마운트 (Windows 환경)**
   - Windows Docker Desktop에서는 `/var/run/docker.sock`이 존재하지 않음
   - 컨테이너 내부에서 호스트의 Docker 데몬에 접근 불가
   - Celery Worker가 Judge 컨테이너를 생성할 수 없음

2. **채점 처리 실패**
   - 제출은 정상적으로 생성됨 (PENDING 상태)
   - Celery Task는 수신되지만 Docker 클라이언트 초기화 실패
   - 채점이 진행되지 않음

## 발견된 오류

```
docker.errors.DockerException: Error while fetching server API version: Not supported URL scheme http+docker
```

**원인**: Windows Docker Desktop 환경에서 컨테이너 내부에서 호스트의 Docker 데몬에 접근하는 것이 제한적임.

## 해결 방안

### 1. Linux 환경에서 검증 (권장)

Windows 환경에서는 Docker 소켓 마운트가 제한적이므로, 실제 프로덕션 환경인 Linux (EC2)에서 검증하는 것이 좋습니다.

**EC2에서 검증 명령어**:
```bash
# EC2 서버 접속
ssh -i C:\pem\my_proton_key.pem ubuntu@13.125.154.68

# 프로젝트 디렉토리로 이동
cd /home/ubuntu/qa_labs

# docker-compose.prod.yml로 서비스 시작
docker compose -f docker-compose.prod.yml up -d

# 검증 스크립트 실행 (API 기반)
python scripts/verify_pipeline_api.py
```

### 2. Windows 환경에서의 대안

Windows에서도 테스트하려면 다음 방법을 고려할 수 있습니다:

1. **WSL2 사용**
   - WSL2 내부에서 Docker를 실행
   - WSL2 내부의 Docker 소켓 사용

2. **Docker-in-Docker (DinD)**
   - Celery Worker 컨테이너 내부에 Docker 데몬 실행
   - 리소스 사용량 증가

3. **TCP를 통한 Docker 접근**
   - Docker Desktop에서 TCP 포트 열기
   - 보안 고려 필요

### 3. 코드 개선 사항

`backend/app/services/docker_service.py`에서 Windows 환경 감지 및 처리 로직을 개선했습니다:

- 컨테이너 내부 환경 감지 (`/.dockerenv` 확인)
- 잘못된 `DOCKER_HOST` 환경변수 정리
- Unix 소켓 우선 시도, 실패 시 `from_env()` 사용

## 다음 단계

1. **Linux 환경에서 검증** (EC2)
   - `docker-compose.prod.yml` 사용
   - Docker 소켓 마운트 정상 동작 확인
   - 전체 채점 플로우 검증

2. **Windows 개발 환경 개선** (선택사항)
   - WSL2 환경 구성
   - 또는 로컬 개발 시 Docker 없이 테스트하는 방법 고려

3. **에러 핸들링 강화**
   - Docker 연결 실패 시 명확한 에러 메시지
   - Submission 상태를 ERROR로 업데이트

## 검증 스크립트

검증에 사용한 스크립트:
- `scripts/verify_pipeline_api.py`: API 기반 검증 스크립트
- `backend/scripts/verify_pipeline.py`: 데이터베이스 직접 접근 검증 스크립트 (로컬 환경 필요)

## 참고

- Windows Docker Desktop 제한사항: https://docs.docker.com/desktop/faqs/windowsfaqs/
- Docker 소켓 마운트: https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option

