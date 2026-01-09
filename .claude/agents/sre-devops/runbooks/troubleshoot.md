# 장애 대응 런북 (Troubleshooting Runbook)

> 서비스 장애 진단 및 복구 절차

---

## 1. 증상별 진단 가이드

### 1.1 서비스 접속 불가 (502/503)

**증상**: https://qa-arena.qalabs.kr 접속 시 502/503 에러

**진단 순서**:
```bash
# 1. Nginx 상태 확인
docker compose -f docker-compose.prod.yml ps nginx

# 2. Backend 상태 확인
docker compose -f docker-compose.prod.yml ps backend

# 3. Frontend 상태 확인
docker compose -f docker-compose.prod.yml ps frontend

# 4. Nginx 로그 확인
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
```

**일반적인 원인 및 해결**:
| 원인 | 해결 |
|------|------|
| Backend 다운 | `docker compose restart backend` |
| Frontend 다운 | `docker compose restart frontend` |
| Nginx 설정 오류 | Nginx 로그 확인 후 설정 수정 |
| 포트 충돌 | `docker compose down && docker compose up -d` |

---

### 1.2 API 응답 지연

**증상**: API 응답이 5초 이상 지연

**진단 순서**:
```bash
# 1. Backend 리소스 사용량
docker stats backend --no-stream

# 2. PostgreSQL 느린 쿼리
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"

# 3. Redis 상태
docker compose -f docker-compose.prod.yml exec redis redis-cli INFO stats
```

**일반적인 원인 및 해결**:
| 원인 | 해결 |
|------|------|
| DB 느린 쿼리 | 인덱스 추가, 쿼리 최적화 |
| 메모리 부족 | 컨테이너 재시작, 메모리 증설 |
| Redis 연결 문제 | Redis 재시작 |

---

### 1.3 Celery Worker 다운

**증상**: AI 피드백 생성 안됨, Worker offline

**진단 순서**:
```bash
# 1. Worker 상태 확인
docker compose -f docker-compose.prod.yml ps celery_worker

# 2. Worker 로그 확인
docker compose -f docker-compose.prod.yml logs --tail=100 celery_worker

# 3. Redis 연결 확인
docker compose -f docker-compose.prod.yml exec celery_worker \
  python -c "import redis; r = redis.from_url('redis://redis:6379'); print(r.ping())"
```

**일반적인 원인 및 해결**:
| 원인 | 해결 |
|------|------|
| Redis 다운 | Redis 재시작 후 Worker 재시작 |
| 메모리 초과 | Worker 재시작 (메모리 정리) |
| 코드 오류 | 로그 확인 후 코드 수정, 재배포 |

---

### 1.4 PostgreSQL 연결 실패

**증상**: `could not connect to server` 에러

**진단 순서**:
```bash
# 1. PostgreSQL 상태
docker compose -f docker-compose.prod.yml ps postgres

# 2. 로그 확인
docker compose -f docker-compose.prod.yml logs --tail=50 postgres

# 3. 연결 테스트
docker compose -f docker-compose.prod.yml exec postgres \
  pg_isready -U postgres
```

**일반적인 원인 및 해결**:
| 원인 | 해결 |
|------|------|
| 컨테이너 다운 | `docker compose restart postgres` |
| 연결 수 초과 | 연결 정리 또는 max_connections 증가 |
| 디스크 풀 | 디스크 정리 |

---

### 1.5 디스크 공간 부족

**증상**: `No space left on device` 에러

**진단 순서**:
```bash
# 1. 디스크 사용량
df -h

# 2. Docker 사용량
docker system df

# 3. 큰 파일 찾기
find /home/ssm-user/qa_labs -type f -size +100M
```

**해결**:
```bash
# Docker 정리 (미사용 이미지/컨테이너)
docker system prune -a --volumes

# 로그 정리
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

---

## 2. 서비스별 복구 명령

### Nginx
```bash
# 재시작
docker compose -f docker-compose.prod.yml restart nginx

# 설정 테스트
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# 설정 리로드
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Backend
```bash
# 재시작
docker compose -f docker-compose.prod.yml restart backend

# 재빌드 (코드 변경 시)
docker compose -f docker-compose.prod.yml up -d --build backend

# 로그 실시간 확인
docker compose -f docker-compose.prod.yml logs -f backend
```

### Frontend
```bash
# 재시작
docker compose -f docker-compose.prod.yml restart frontend

# 재빌드
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### Celery Worker
```bash
# 재시작
docker compose -f docker-compose.prod.yml restart celery_worker

# 강제 재시작 (SIGKILL)
docker compose -f docker-compose.prod.yml kill celery_worker
docker compose -f docker-compose.prod.yml up -d celery_worker
```

### PostgreSQL
```bash
# 재시작 (주의: 연결 끊김)
docker compose -f docker-compose.prod.yml restart postgres

# 연결 상태 확인
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Redis
```bash
# 재시작
docker compose -f docker-compose.prod.yml restart redis

# 캐시 클리어 (필요시)
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

---

## 3. 전체 스택 복구

### 완전 재시작
```bash
# 전체 중지
docker compose -f docker-compose.prod.yml down

# 전체 시작
docker compose -f docker-compose.prod.yml up -d
```

### 완전 재빌드
```bash
# 이미지 포함 재빌드
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### 볼륨 유지 재설치 (DANGER)
```bash
# 볼륨 제외 모든 것 삭제 후 재시작
docker compose -f docker-compose.prod.yml down
docker system prune -a  # 주의: 모든 미사용 이미지 삭제
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 4. 복구 등급별 대응

### 🟢 SAFE (자동 실행 가능)
```bash
# 컨테이너 재시작
docker compose -f docker-compose.prod.yml restart [서비스]

# 로그 정리
docker compose -f docker-compose.prod.yml logs --tail=0 -f
```

### 🟡 CAUTION (확인 권장)
```bash
# 네트워크 재생성
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 이미지 재빌드
docker compose -f docker-compose.prod.yml up -d --build
```

### 🔴 DANGER (필수 확인)
```bash
# 볼륨 삭제 (데이터 손실 위험)
docker compose -f docker-compose.prod.yml down -v

# Docker 데몬 재시작 (모든 컨테이너 중지됨)
sudo systemctl restart docker
```

---

## 5. 알림 및 에스컬레이션

### Discord 알림
```bash
# 장애 발생 알림
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "🔴 [장애] QA Labs 서비스 장애 발생\n- 증상: [증상]\n- 시작: [시간]"}'

# 복구 완료 알림
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "🟢 [복구] QA Labs 서비스 복구 완료\n- 원인: [원인]\n- 조치: [조치]\n- 복구: [시간]"}'
```

---

## 체크리스트

### 장애 발생 시
- [ ] 증상 확인 및 기록
- [ ] 영향 범위 파악
- [ ] 로그 수집
- [ ] 알림 발송

### 복구 중
- [ ] 복구 등급 확인
- [ ] 백업 상태 확인 (DB 관련 시)
- [ ] 단계별 복구 실행
- [ ] 각 단계 결과 확인

### 복구 후
- [ ] 헬스체크 통과
- [ ] 에러 로그 정상
- [ ] 사용자 확인 (필요시)
- [ ] 장애 보고서 작성

---

*장애 대응 런북 v1.0 - QA Labs*
