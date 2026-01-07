# Sentry + Discord 모니터링 설정 가이드

QA Arena 프로젝트의 에러 트래킹 및 알림 시스템 설정 가이드입니다.

---

## 1. Sentry 계정 설정

### 1.1 Sentry 계정 생성

1. https://sentry.io 접속
2. "Get Started Free" 클릭
3. GitHub 계정으로 가입 (권장)
4. Organization 이름 설정: `qalabs` (또는 원하는 이름)

### 1.2 프로젝트 생성

**Backend 프로젝트:**
1. "Create Project" 클릭
2. Platform: **Python** > **FastAPI** 선택
3. Project name: `qa-arena-backend`
4. DSN 복사 (예: `https://xxx@xxx.ingest.sentry.io/xxx`)

**Frontend 프로젝트:**
1. "Create Project" 클릭
2. Platform: **JavaScript** > **Next.js** 선택
3. Project name: `qa-arena-frontend`
4. DSN 복사

---

## 2. 환경변수 설정

### 2.1 로컬 개발 (.env)

```bash
# Sentry - Backend
SENTRY_DSN=https://your-backend-dsn@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=1.0  # 개발환경: 100% 샘플링

# Sentry - Frontend
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_ENVIRONMENT=development
```

### 2.2 프로덕션 (EC2 .env)

```bash
# Sentry - Backend
SENTRY_DSN=https://your-backend-dsn@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1  # 프로덕션: 10% 샘플링
ENVIRONMENT=production

# Sentry - Frontend
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 3. Discord Webhook 연동

### 3.1 Discord 서버 설정

1. Discord 서버 생성 또는 기존 서버 사용
2. 알림 채널 생성: `#alerts` (또는 원하는 이름)
3. 채널 설정 > 연동 > 웹후크 > 새 웹후크
4. Webhook URL 복사

### 3.2 Sentry → Discord 연동

1. Sentry 프로젝트 > Settings > Integrations
2. "Discord" 검색 > Install
3. Discord 서버 연결 (OAuth 인증)
4. Alert Rules 설정:
   - Project Settings > Alerts > Create Alert Rule

### 3.3 추천 Alert Rules

**Rule 1: 새로운 에러 발생**
```
WHEN: An issue is first seen
THEN: Send a Discord notification
```

**Rule 2: 에러 급증**
```
WHEN: Number of events in an issue is more than 10 in 1 hour
THEN: Send a Discord notification
```

**Rule 3: 크리티컬 에러**
```
WHEN: An event's level is error or fatal
AND: An event's tags[environment] equals production
THEN: Send a Discord notification to #critical-alerts
```

---

## 4. Sentry Alert Rule 상세 설정

### 4.1 기본 Alert Rule 생성

Sentry Dashboard에서:

1. **Alerts** > **Create Alert**
2. **Issue Alerts** 선택
3. 설정:
   ```
   Environment: production

   When:
   - A new issue is created
   - OR The issue is seen more than 5 times in 10 minutes

   Then:
   - Send a notification to Discord #alerts

   Action Interval: 30 minutes (같은 이슈 재알림 간격)
   ```

### 4.2 Performance Alert (선택사항)

1. **Alerts** > **Create Alert** > **Metric Alerts**
2. 설정:
   ```
   Metric: transaction.duration (p95)
   Threshold: > 3000ms
   Time Window: 5 minutes

   Then: Send Discord notification
   ```

---

## 5. 테스트 방법

### 5.1 Backend 테스트

```python
# backend/에서 실행
import sentry_sdk
sentry_sdk.capture_message("Test message from QA Arena Backend")
```

또는 의도적 에러 발생:
```bash
# API 호출로 에러 트리거 (개발환경에서만)
curl http://localhost:8000/api/v1/test-sentry-error
```

### 5.2 Frontend 테스트

```javascript
// 브라우저 콘솔에서
import * as Sentry from "@sentry/nextjs";
Sentry.captureMessage("Test message from QA Arena Frontend");
```

---

## 6. 모니터링 대시보드 구성

### 6.1 Sentry 대시보드 위젯

권장 위젯:
1. **Crash Free Sessions** - 에러 없는 세션 비율
2. **Error Count by Environment** - 환경별 에러 수
3. **Top Errors** - 가장 빈번한 에러
4. **Performance Overview** - API 응답 시간

### 6.2 Discord 채널 구조 (권장)

```
#alerts          - 일반 에러 알림
#critical-alerts - 크리티컬 에러 (즉시 대응 필요)
#deployments     - 배포 알림 (선택사항)
```

---

## 7. 추가 모니터링 (선택사항)

### 7.1 Uptime 모니터링

**UptimeRobot (무료)**
1. https://uptimerobot.com 가입
2. Monitor 추가:
   - URL: `https://qa-arena.qalabs.kr/healthz/status`
   - Check interval: 5분
   - Alert contacts: Discord Webhook

### 7.2 로그 중앙화 (향후 확장)

```yaml
# docker-compose.prod.yml에 추가 (선택사항)
loki:
  image: grafana/loki:2.9.0
  ports:
    - "3100:3100"

grafana:
  image: grafana/grafana:10.0.0
  ports:
    - "3001:3000"
```

---

## 8. 체크리스트

- [ ] Sentry 계정 생성
- [ ] Backend 프로젝트 생성 및 DSN 획득
- [ ] Frontend 프로젝트 생성 및 DSN 획득
- [ ] EC2 .env에 환경변수 추가
- [ ] Discord 서버/채널 설정
- [ ] Sentry-Discord 연동
- [ ] Alert Rules 설정
- [ ] 테스트 에러 전송 확인
- [ ] 배포 후 실제 에러 수신 확인

---

## 9. 참고 링크

- [Sentry FastAPI 문서](https://docs.sentry.io/platforms/python/integrations/fastapi/)
- [Sentry Celery 문서](https://docs.sentry.io/platforms/python/integrations/celery/)
- [Sentry Next.js 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Discord 연동](https://docs.sentry.io/product/integrations/notification-incidents/discord/)
