---
description: QA Labs 주요 서비스의 로그를 한 번에 확인합니다
---

# 통합 로그 확인

다음 서비스들의 최근 로그를 수집하여 보기 좋게 표시합니다:

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
