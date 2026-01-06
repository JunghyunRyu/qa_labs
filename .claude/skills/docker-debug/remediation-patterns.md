# Docker 자동 복구 패턴

이 문서는 docker-debug skill에서 사용하는 자동 복구 패턴을 정의합니다.

## 복구 분류

### 안전 등급

| 등급 | 설명 | 사용자 확인 |
|------|------|-------------|
| SAFE | 데이터 손실 없음, 즉시 실행 가능 | 불필요 |
| CAUTION | 일시적 서비스 중단 가능 | 권장 |
| DANGER | 데이터 손실 또는 장시간 중단 가능 | 필수 |

---

## 패턴 1: 컨테이너 재시작

**등급**: SAFE

**증상**:
- 컨테이너 상태가 unhealthy
- 응답 없음 (timeout)
- 메모리 누수 의심

**자동 복구 명령**:
```bash
docker compose -f docker-compose.prod.yml restart {service_name}
```

**검증**:
```bash
docker compose -f docker-compose.prod.yml ps {service_name}
# 상태가 Up인지 확인
```

---

## 패턴 2: 볼륨 권한 복구

**등급**: SAFE

**증상**:
- "Permission denied" 에러
- 파일 쓰기 실패
- 로그 파일 생성 불가

**자동 복구 명령**:
```bash
# Judge 공유 볼륨
sudo mkdir -p /tmp/qa_arena_judge
sudo chmod 777 /tmp/qa_arena_judge

# 로그 디렉토리
sudo chmod 755 /app/logs
```

**검증**:
```bash
ls -la /tmp/qa_arena_judge
# drwxrwxrwx 권한 확인
```

---

## 패턴 3: 네트워크 재생성

**등급**: CAUTION

**증상**:
- 컨테이너 간 통신 실패
- DNS 해석 실패
- "network not found" 에러

**자동 복구 명령**:
```bash
# 기존 네트워크 정리
docker network prune -f

# 서비스 재시작 (네트워크 자동 생성)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

**검증**:
```bash
docker network inspect qa_arena_network
# 모든 컨테이너가 연결되어 있는지 확인
```

---

## 패턴 4: 전체 스택 재시작

**등급**: CAUTION

**증상**:
- 여러 서비스 동시 장애
- 복잡한 의존성 문제
- 설정 변경 후 적용 필요

**자동 복구 명령**:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

**검증**:
```bash
docker compose -f docker-compose.prod.yml ps
# 모든 서비스가 Up 상태인지 확인
```

---

## 패턴 5: 이미지 재빌드

**등급**: CAUTION

**증상**:
- 코드 변경이 반영되지 않음
- 의존성 업데이트 필요
- "image not found" 에러

**자동 복구 명령**:
```bash
docker compose -f docker-compose.prod.yml build --no-cache {service_name}
docker compose -f docker-compose.prod.yml up -d {service_name}
```

**검증**:
```bash
docker images | grep {service_name}
# 빌드 시간이 최신인지 확인
```

---

## 패턴 6: 볼륨 완전 삭제 및 재생성

**등급**: DANGER

**증상**:
- 볼륨 손상
- 데이터 불일치
- 마이그레이션 실패

**자동 복구 명령**:
```bash
# 주의: 데이터가 삭제됩니다!
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

**사전 조건**:
- 반드시 백업 확인
- 사용자 명시적 승인 필수

---

## 패턴 7: Docker 데몬 재시작

**등급**: DANGER

**증상**:
- Docker API 응답 없음
- 모든 컨테이너 작업 실패
- 소켓 연결 불가

**자동 복구 명령**:
```bash
sudo systemctl restart docker
docker compose -f docker-compose.prod.yml up -d
```

**사전 조건**:
- 서버 전체 Docker 서비스 중단
- 사용자 명시적 승인 필수

---

## 복잡한 문제 해결 워크플로우

복잡한 문제의 경우 다단계 분석이 필요합니다:

```
1. 기본 패턴 매칭 시도
   ↓ (실패 시)
2. 추가 로그 수집 및 분석
   - 전체 스택 트레이스 수집
   - 시스템 리소스 상태 확인
   ↓
3. 근본 원인 분석
   - 수집된 데이터 기반 패턴 매칭
   - 권장 해결책 도출
   ↓
4. 사용자 확인 (CAUTION 이상)
   ↓
5. 복구 실행 및 검증
```

---

## 복구 실패 시 에스컬레이션

자동 복구가 실패한 경우:

1. **로그 수집 완료**: 모든 관련 로그를 파일로 저장
2. **상태 스냅샷**: 현재 Docker 상태 캡처
3. **심층 분석**: 수집된 데이터 기반 근본 원인 분석
4. **수동 개입 안내**: 관리자에게 문제 전달

```bash
# 로그 수집
docker compose -f docker-compose.prod.yml logs > docker_debug_$(date +%Y%m%d_%H%M%S).log

# 상태 스냅샷
docker ps -a > container_status.txt
docker network ls > network_status.txt
docker volume ls > volume_status.txt
```
