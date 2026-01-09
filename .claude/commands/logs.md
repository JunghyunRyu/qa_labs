---
description: QA Labs 주요 서비스의 로그를 한 번에 확인합니다
---

# 통합 로그 확인

다음 서비스들의 최근 로그를 수집하여 보기 좋게 표시합니다.

## 사용법

| 명령 | 설명 |
|------|------|
| `/logs` | 전체 로그 (기본) |
| `/logs --error` | ERROR 레벨만 필터링 |
| `/logs --warning` | WARNING 이상 필터링 (WARNING + ERROR) |


## 로그 수집 대상
1. **backend** (최근 50줄)
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | tail -50
   ```

2. **celery_worker** (최근 50줄)
   ```bash
   docker compose -f docker-compose.prod.yml logs celery_worker | tail -50
   ```

3. **nginx** (최근 30줄)
   ```bash
   docker compose -f docker-compose.prod.yml logs nginx | tail -30
   ```

4. **postgres** (최근 30줄)
   ```bash
   docker compose -f docker-compose.prod.yml logs postgres | tail -30
   ```

## 출력 형식
각 서비스별로 구분선과 헤더를 표시하여 로그를 구분합니다:

```
========================================
Backend Logs (최근 50줄)
========================================
[로그 내용]

========================================
Celery Worker Logs (최근 50줄)
========================================
[로그 내용]

...
```

**사용 시점:**
- 시스템 전체 상태를 빠르게 파악할 때
- 에러 발생 후 원인을 찾을 때
- 배포 후 각 서비스가 정상 동작하는지 확인할 때

---

## 필터링 옵션

### --error 옵션
ERROR 레벨 로그만 필터링하여 표시합니다.

```bash
# 각 서비스에 grep 필터 적용
docker compose -f docker-compose.prod.yml logs backend | grep -i "error" | tail -50
docker compose -f docker-compose.prod.yml logs celery_worker | grep -i "error" | tail -50
docker compose -f docker-compose.prod.yml logs nginx | grep -iE "(error|5[0-9]{2})" | tail -30
docker compose -f docker-compose.prod.yml logs postgres | grep -i "error" | tail -30
```

### --warning 옵션
WARNING 이상 (WARNING + ERROR) 로그를 필터링하여 표시합니다.

```bash
# 각 서비스에 grep 필터 적용
docker compose -f docker-compose.prod.yml logs backend | grep -iE "(warning|error)" | tail -50
docker compose -f docker-compose.prod.yml logs celery_worker | grep -iE "(warning|error)" | tail -50
docker compose -f docker-compose.prod.yml logs nginx | grep -iE "(warn|error|4[0-9]{2}|5[0-9]{2})" | tail -30
docker compose -f docker-compose.prod.yml logs postgres | grep -iE "(warning|error)" | tail -30
```

### 출력 형식 (필터링 시)
```
========================================
Backend Logs (ERROR only)
========================================
2026-01-09 10:15:32 ERROR: Database connection failed
2026-01-09 10:15:35 ERROR: Retry attempt 1/3

========================================
Celery Worker Logs (ERROR only)
========================================
2026-01-09 10:20:11 ERROR: Task timeout exceeded

========================================
Nginx Logs (ERROR only)
========================================
[에러 로그 또는 5xx 응답]

========================================
Postgres Logs (ERROR only)
========================================
[에러 로그]

========================================
요약: 총 3건의 ERROR 발견
========================================
```

---

## 필터링 키워드

| 서비스 | ERROR 패턴 | WARNING 패턴 |
|--------|-----------|-------------|
| backend | `error` (대소문자 무시) | `warning`, `error` |
| celery_worker | `error` | `warning`, `error` |
| nginx | `error`, `5xx` 상태코드 | `warn`, `error`, `4xx`, `5xx` |
| postgres | `error` | `warning`, `error` |
