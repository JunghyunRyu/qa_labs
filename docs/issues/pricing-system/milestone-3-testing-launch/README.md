# Milestone 3: 테스트 및 런칭

## 목표
안정적인 MVP 런칭 (Week 3-4)

## 범위
- 결제 플로우 E2E 테스트
- 크레딧 시스템 유닛 테스트
- 엣지 케이스 처리
- 프로덕션 환경 설정
- 런칭 및 프로모션

---

## Week 3: 테스트

### 1. 테스트 시나리오

#### 1.1 결제 플로우 테스트

| 시나리오 | 설명 | 예상 결과 |
|---------|------|----------|
| 정상 결제 | 유효한 카드로 Premier 구독 | 구독 생성, 크레딧 300 부여 |
| 카드 등록 실패 | 잘못된 카드 정보 입력 | 에러 메시지 표시, 재시도 가능 |
| 결제 실패 | 잔액 부족 카드 | 에러 메시지, 구독 미생성 |
| 중복 결제 방지 | 같은 요청 2번 전송 | 첫 번째만 처리 |
| 구독 취소 | 기간 종료 후 취소 | cancel_at_period_end=true |
| 즉시 취소 | 즉시 취소 + 환불 | status=cancelled, 환불 처리 |
| 정기 결제 갱신 | 만료일에 자동 결제 | 구독 기간 연장, 크레딧 리셋 |
| 갱신 실패 | 만료일에 결제 실패 | status=past_due, 알림 발송 |

#### 1.2 크레딧 시스템 테스트

| 시나리오 | 설명 | 예상 결과 |
|---------|------|----------|
| 크레딧 차감 | AI 코칭 1회 사용 | used_credits += 1 |
| 크레딧 소진 | 300회 모두 사용 | 402 응답, 모달 표시 |
| 무료 사용자 제한 | 10회 초과 사용 시도 | 402 응답, 업그레이드 유도 |
| 월간 리셋 | 매월 1일 | used_credits = 0, 새 기간 생성 |
| 보너스 크레딧 | 팩 구매 | bonus_credits += 200 |

#### 1.3 엣지 케이스

| 시나리오 | 설명 | 처리 방법 |
|---------|------|----------|
| 동시 요청 | 같은 사용자가 동시에 2개 결제 요청 | DB 락 또는 idempotency key |
| 웹훅 중복 | 같은 이벤트 2번 수신 | idempotency 처리 |
| 웹훅 순서 | 이벤트 순서 뒤바뀜 | 상태 머신으로 관리 |
| 시간대 이슈 | UTC vs KST | 모든 시간 UTC 저장, 표시 시 변환 |
| 네트워크 오류 | 결제 성공 후 DB 저장 실패 | 재시도 로직, 수동 복구 가능 |

---

### 2. 테스트 코드

#### 2.1 구독 API 테스트 (`backend/tests/test_subscriptions.py`)

```python
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.credit_usage import CreditUsage
from app.services.toss_payments import BillingKeyResponse, PaymentResponse


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_toss_client():
    with patch('app.api.subscriptions.toss_client') as mock:
        # 빌링키 발급 모킹
        mock.issue_billing_key = AsyncMock(return_value=BillingKeyResponse(
            billingKey="billing_key_123",
            customerKey="customer_123",
            cardCompany="삼성카드",
            cardNumber="1234"
        ))
        # 결제 요청 모킹
        mock.request_billing_payment = AsyncMock(return_value=PaymentResponse(
            paymentKey="payment_key_123",
            orderId="order_123",
            status="DONE",
            totalAmount=19900,
            approvedAt=datetime.utcnow().isoformat()
        ))
        yield mock


class TestSubscriptionCreate:
    """구독 생성 테스트"""

    def test_create_subscription_success(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        mock_toss_client
    ):
        """정상 구독 생성"""
        response = client.post(
            "/api/subscriptions",
            json={
                "plan": "premier",
                "auth_key": "test_auth_key"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "premier"
        assert data["status"] == "active"
        assert data["remaining_credits"] == 300

    def test_create_subscription_already_subscribed(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        existing_subscription: Subscription
    ):
        """이미 구독 중인 사용자"""
        response = client.post(
            "/api/subscriptions",
            json={
                "plan": "premier",
                "auth_key": "test_auth_key"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "이미 유료 구독 중" in response.json()["detail"]

    def test_create_subscription_billing_key_failure(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        mock_toss_client
    ):
        """빌링키 발급 실패"""
        mock_toss_client.issue_billing_key.side_effect = Exception("카드 등록 실패")

        response = client.post(
            "/api/subscriptions",
            json={
                "plan": "premier",
                "auth_key": "invalid_auth_key"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "카드 등록 실패" in response.json()["detail"]

    def test_create_subscription_payment_failure(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        mock_toss_client
    ):
        """결제 실패"""
        mock_toss_client.request_billing_payment.side_effect = Exception("잔액 부족")

        response = client.post(
            "/api/subscriptions",
            json={
                "plan": "premier",
                "auth_key": "test_auth_key"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "결제 실패" in response.json()["detail"]


class TestSubscriptionCancel:
    """구독 취소 테스트"""

    def test_cancel_subscription_at_period_end(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        existing_subscription: Subscription
    ):
        """기간 종료 후 취소"""
        response = client.delete(
            f"/api/subscriptions/{existing_subscription.id}",
            json={"cancel_immediately": False},
            headers=auth_headers
        )

        assert response.status_code == 200

        # DB 확인
        db.refresh(existing_subscription)
        assert existing_subscription.cancel_at_period_end is True
        assert existing_subscription.status == SubscriptionStatus.ACTIVE

    def test_cancel_subscription_immediately(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        existing_subscription: Subscription
    ):
        """즉시 취소"""
        response = client.delete(
            f"/api/subscriptions/{existing_subscription.id}",
            json={"cancel_immediately": True},
            headers=auth_headers
        )

        assert response.status_code == 200

        # DB 확인
        db.refresh(existing_subscription)
        assert existing_subscription.status == SubscriptionStatus.CANCELLED

    def test_cancel_already_cancelled(
        self,
        client: TestClient,
        db: Session,
        auth_headers: dict,
        cancelled_subscription: Subscription
    ):
        """이미 취소된 구독"""
        response = client.delete(
            f"/api/subscriptions/{cancelled_subscription.id}",
            json={"cancel_immediately": False},
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "이미 취소된 구독" in response.json()["detail"]


class TestSubscriptionGet:
    """구독 조회 테스트"""

    def test_get_subscription_premier(
        self,
        client: TestClient,
        auth_headers: dict,
        existing_subscription: Subscription
    ):
        """Premier 구독 조회"""
        response = client.get(
            "/api/subscriptions/me",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "premier"
        assert data["remaining_credits"] == 300

    def test_get_subscription_free(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """무료 사용자 조회"""
        response = client.get(
            "/api/subscriptions/me",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "free"
        assert data["remaining_credits"] == 10
```

#### 2.2 크레딧 시스템 테스트 (`backend/tests/test_credits.py`)

```python
import pytest
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.subscription import Subscription, SubscriptionPlan
from app.models.credit_usage import CreditUsage
from app.services.credit_service import CreditService


class TestCreditService:
    """크레딧 서비스 테스트"""

    def test_get_current_credits_premier(
        self,
        db: Session,
        subscription_with_credits: Subscription
    ):
        """Premier 크레딧 조회"""
        service = CreditService(db)
        credits = service.get_current_credits(subscription_with_credits.user_id)

        assert credits["plan"] == "premier"
        assert credits["total_credits"] == 300
        assert credits["used_credits"] == 0
        assert credits["remaining_credits"] == 300

    def test_get_current_credits_free(self, db: Session, user_id: int):
        """무료 사용자 크레딧 조회"""
        service = CreditService(db)
        credits = service.get_current_credits(user_id)

        assert credits["plan"] == "free"
        assert credits["total_credits"] == 10
        assert credits["remaining_credits"] == 10

    def test_use_credit_success(
        self,
        db: Session,
        subscription_with_credits: Subscription
    ):
        """크레딧 사용 성공"""
        service = CreditService(db)

        # 초기 상태 확인
        initial = service.get_current_credits(subscription_with_credits.user_id)
        assert initial["used_credits"] == 0

        # 크레딧 사용
        success, info = service.use_credit(subscription_with_credits.user_id)
        assert success is True
        assert info["remaining_credits"] == 299

    def test_use_credit_exhausted(
        self,
        db: Session,
        exhausted_subscription: Subscription
    ):
        """크레딧 소진 시"""
        service = CreditService(db)
        success, info = service.use_credit(exhausted_subscription.user_id)

        assert success is False
        assert info["error"] == "credit_exhausted"
        assert info["remaining_credits"] == 0

    def test_add_bonus_credits(
        self,
        db: Session,
        subscription_with_credits: Subscription
    ):
        """보너스 크레딧 추가"""
        service = CreditService(db)

        result = service.add_bonus_credits(
            subscription_with_credits.user_id,
            amount=200,
            reason="purchase"
        )

        assert result["total_credits"] == 500  # 300 + 200


class TestCreditUsageModel:
    """CreditUsage 모델 테스트"""

    def test_remaining_credits(self, db: Session):
        """remaining_credits 계산"""
        credit_usage = CreditUsage(
            subscription_id=1,
            period_start=date.today(),
            period_end=date.today() + timedelta(days=30),
            total_credits=300,
            used_credits=150,
            bonus_credits=50
        )

        # 300 + 50 - 150 = 200
        assert credit_usage.remaining_credits == 200

    def test_usage_percentage(self, db: Session):
        """usage_percentage 계산"""
        credit_usage = CreditUsage(
            subscription_id=1,
            period_start=date.today(),
            period_end=date.today() + timedelta(days=30),
            total_credits=300,
            used_credits=150,
            bonus_credits=0
        )

        # 150 / 300 * 100 = 50%
        assert credit_usage.usage_percentage == 50.0
```

#### 2.3 웹훅 테스트 (`backend/tests/test_webhooks.py`)

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.subscription import Subscription, SubscriptionStatus


class TestTossWebhook:
    """토스페이먼츠 웹훅 테스트"""

    def test_billing_execute_success(
        self,
        client: TestClient,
        db: Session,
        subscription_with_billing_key: Subscription
    ):
        """정기결제 성공 웹훅"""
        webhook_payload = {
            "eventType": "BILLING_AUTO_EXECUTE",
            "data": {
                "customerKey": subscription_with_billing_key.customer_key,
                "status": "DONE",
                "paymentKey": "payment_123",
                "amount": 19900
            }
        }

        response = client.post(
            "/api/webhooks/tosspayments",
            json=webhook_payload
        )

        assert response.status_code == 200

        # 구독 상태 확인
        db.refresh(subscription_with_billing_key)
        assert subscription_with_billing_key.status == SubscriptionStatus.ACTIVE

    def test_billing_execute_failed(
        self,
        client: TestClient,
        db: Session,
        subscription_with_billing_key: Subscription
    ):
        """정기결제 실패 웹훅"""
        webhook_payload = {
            "eventType": "BILLING_AUTO_EXECUTE",
            "data": {
                "customerKey": subscription_with_billing_key.customer_key,
                "status": "FAILED",
                "failReason": "잔액 부족"
            }
        }

        response = client.post(
            "/api/webhooks/tosspayments",
            json=webhook_payload
        )

        assert response.status_code == 200

        # 구독 상태 확인
        db.refresh(subscription_with_billing_key)
        assert subscription_with_billing_key.status == SubscriptionStatus.PAST_DUE

    def test_webhook_idempotency(
        self,
        client: TestClient,
        db: Session,
        subscription_with_billing_key: Subscription
    ):
        """웹훅 중복 처리"""
        webhook_payload = {
            "eventType": "BILLING_AUTO_EXECUTE",
            "data": {
                "customerKey": subscription_with_billing_key.customer_key,
                "status": "DONE",
                "paymentKey": "payment_123"
            }
        }

        # 같은 웹훅 2번 전송
        response1 = client.post("/api/webhooks/tosspayments", json=webhook_payload)
        response2 = client.post("/api/webhooks/tosspayments", json=webhook_payload)

        assert response1.status_code == 200
        assert response2.status_code == 200

        # 기간이 2번 연장되지 않았는지 확인
        db.refresh(subscription_with_billing_key)
        # TODO: idempotency 로직 검증
```

#### 2.4 E2E 테스트 (`backend/tests/e2e/test_subscription_flow.py`)

```python
import pytest
from playwright.sync_api import Page, expect


class TestSubscriptionE2E:
    """구독 E2E 테스트"""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page, base_url: str):
        self.page = page
        self.base_url = base_url

    def test_upgrade_flow(self):
        """무료 → Premier 업그레이드 플로우"""
        # 1. 로그인
        self.page.goto(f"{self.base_url}/login")
        self.page.fill('[name="email"]', "test@example.com")
        self.page.fill('[name="password"]', "password123")
        self.page.click('button[type="submit"]')

        # 2. 요금제 페이지로 이동
        self.page.goto(f"{self.base_url}/pricing")
        expect(self.page.locator("h1")).to_contain_text("요금제 선택")

        # 3. Premier 선택
        self.page.click('text=Premier >> .. >> button:has-text("시작하기")')

        # 4. 결제 모달 확인
        expect(self.page.locator('text=구독 결제')).to_be_visible()
        expect(self.page.locator('text=19,900원')).to_be_visible()

        # 5. 결제 버튼 클릭 (테스트 환경에서는 모킹)
        # 실제 토스페이먼츠 결제창은 별도 테스트

    def test_credit_display(self):
        """크레딧 표시 테스트"""
        # 로그인한 상태에서
        self.page.goto(f"{self.base_url}/dashboard")

        # 헤더에 크레딧 표시 확인
        credit_indicator = self.page.locator('[data-testid="credit-indicator"]')
        expect(credit_indicator).to_be_visible()

    def test_credit_exhausted_modal(self):
        """크레딧 소진 모달 테스트"""
        # 크레딧이 0인 사용자로 로그인
        # AI 코칭 사용 시도
        # 모달 표시 확인

    def test_cancel_subscription(self):
        """구독 취소 플로우"""
        # Premier 사용자로 로그인
        self.page.goto(f"{self.base_url}/settings/subscription")

        # 구독 취소 버튼 클릭
        self.page.click('text=구독 취소')

        # 확인 모달
        expect(self.page.locator('text=구독을 취소하시겠습니까?')).to_be_visible()

        # 취소 확인
        self.page.click('button:has-text("구독 취소")')

        # 취소 예정 상태 확인
        expect(self.page.locator('text=취소 예정')).to_be_visible()
```

---

### 3. 테스트 실행

```bash
# 유닛 테스트
pytest backend/tests/ -v

# 특정 테스트만
pytest backend/tests/test_subscriptions.py -v

# 커버리지
pytest backend/tests/ --cov=app --cov-report=html

# E2E 테스트
pytest backend/tests/e2e/ --headed  # 브라우저 표시
pytest backend/tests/e2e/          # 헤드리스
```

---

## Week 4: 런칭

### 4. 런칭 전 체크리스트

#### 4.1 코드 준비
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 민감 정보 환경 변수화 확인
- [ ] 에러 핸들링 검토
- [ ] 로깅 설정 확인

#### 4.2 인프라 준비
- [ ] 토스페이먼츠 프로덕션 API 키 발급
- [ ] 프로덕션 환경 변수 설정
- [ ] 데이터베이스 마이그레이션 준비
- [ ] Celery Beat 스케줄 설정
- [ ] 백업 전략 확인

#### 4.3 모니터링 준비
- [ ] 에러 알림 설정 (Slack/Email)
- [ ] 결제 실패 알림 설정
- [ ] 크레딧 소진 통계 대시보드
- [ ] 전환율 추적 설정

#### 4.4 문서화
- [ ] API 문서 업데이트
- [ ] 고객 지원 FAQ 작성
- [ ] 환불 정책 페이지
- [ ] 이용약관 업데이트

---

### 5. 프로덕션 환경 설정

#### 5.1 환경 변수 (.env.production)

```bash
# 토스페이먼츠 (프로덕션)
TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...
TOSS_API_URL=https://api.tosspayments.com

# 웹훅 시크릿
TOSS_WEBHOOK_SECRET=...

# 알림
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL=admin@qalabs.com
```

#### 5.2 Docker 설정 추가

```yaml
# docker-compose.prod.yml에 추가
services:
  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A app.celery_app beat --loglevel=info
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
      - celery_worker
```

#### 5.3 Nginx 설정 (웹훅 엔드포인트)

```nginx
# 웹훅 엔드포인트 보안
location /api/webhooks/tosspayments {
    # IP 화이트리스트 (토스페이먼츠 서버 IP)
    allow 52.78.xxx.xxx;
    allow 13.124.xxx.xxx;
    deny all;

    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

### 6. 모니터링 설정

#### 6.1 결제 알림 (`backend/app/services/notification.py`)

```python
import httpx
from app.core.config import settings


async def send_payment_alert(
    event: str,
    user_id: int,
    amount: int,
    status: str,
    error: str = None
):
    """결제 관련 알림 전송"""
    if not settings.SLACK_WEBHOOK_URL:
        return

    color = "#36a64f" if status == "success" else "#ff0000"

    message = {
        "attachments": [
            {
                "color": color,
                "title": f"결제 {event}",
                "fields": [
                    {"title": "User ID", "value": str(user_id), "short": True},
                    {"title": "Amount", "value": f"{amount:,}원", "short": True},
                    {"title": "Status", "value": status, "short": True},
                ],
            }
        ]
    }

    if error:
        message["attachments"][0]["fields"].append({
            "title": "Error",
            "value": error,
            "short": False
        })

    async with httpx.AsyncClient() as client:
        await client.post(settings.SLACK_WEBHOOK_URL, json=message)


async def send_subscription_stats():
    """일일 구독 통계 알림"""
    # TODO: 구현
    pass
```

#### 6.2 메트릭 수집 (`backend/app/services/metrics.py`)

```python
from prometheus_client import Counter, Gauge, Histogram

# 결제 메트릭
payment_total = Counter(
    'payment_total',
    'Total number of payments',
    ['status', 'plan']
)

payment_amount = Histogram(
    'payment_amount_won',
    'Payment amount in KRW',
    buckets=[10000, 20000, 50000, 100000, 200000]
)

# 구독 메트릭
active_subscriptions = Gauge(
    'active_subscriptions',
    'Number of active subscriptions',
    ['plan']
)

# 크레딧 메트릭
credit_usage = Histogram(
    'credit_usage_percentage',
    'Credit usage percentage',
    buckets=[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
)


def record_payment(plan: str, amount: int, success: bool):
    """결제 메트릭 기록"""
    status = "success" if success else "failed"
    payment_total.labels(status=status, plan=plan).inc()
    if success:
        payment_amount.observe(amount)


def update_subscription_count(plan: str, count: int):
    """구독 수 업데이트"""
    active_subscriptions.labels(plan=plan).set(count)
```

---

### 7. 런칭 프로모션

#### 7.1 초기 프로모션 아이디어

| 프로모션 | 설명 | 기간 |
|---------|------|------|
| 얼리버드 50% | 첫 달 50% 할인 (9,950원) | 런칭 후 2주 |
| 연간 추가 할인 | 연간 결제 시 30% 할인 | 런칭 후 1개월 |
| 친구 추천 | 추천인/피추천인 각 1개월 무료 | 상시 |

#### 7.2 프로모션 코드 시스템 (Phase 2)

```python
# 프로모션 코드 모델 (향후 구현)
class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True)
    discount_percent = Column(Integer)  # 할인율
    discount_amount = Column(Integer)   # 정액 할인
    valid_until = Column(DateTime)
    max_uses = Column(Integer)
    current_uses = Column(Integer, default=0)
```

---

### 8. 인시던트 대응 플레이북

#### 8.1 결제 실패 급증

**증상**: 결제 실패율 10% 이상

**확인 사항**:
1. 토스페이먼츠 상태 확인 (https://status.tosspayments.com)
2. 에러 로그 확인 (`docker logs backend`)
3. DB 연결 상태 확인

**대응**:
1. 사용자에게 안내 메시지 표시
2. 토스페이먼츠 지원팀 연락
3. 필요시 결제 기능 일시 중단

#### 8.2 크레딧 시스템 오류

**증상**: 크레딧이 차감되지 않거나 과다 차감

**확인 사항**:
1. `credit_usage` 테이블 데이터 확인
2. 미들웨어 로그 확인
3. 동시성 이슈 여부 확인

**대응**:
1. 영향받은 사용자 식별
2. 크레딧 수동 보정
3. 원인 파악 후 핫픽스

#### 8.3 웹훅 처리 실패

**증상**: 정기결제 갱신이 처리되지 않음

**확인 사항**:
1. 웹훅 엔드포인트 접근성 확인
2. 웹훅 로그 확인
3. DB 트랜잭션 상태 확인

**대응**:
1. 실패한 이벤트 수동 재처리
2. 웹훅 재전송 요청 (토스페이먼츠)
3. 구독 상태 수동 업데이트

---

## 구현 태스크 체크리스트

### Week 3: 테스트
- [ ] 테스트 환경 설정 (pytest fixtures)
- [ ] 구독 API 유닛 테스트 작성
- [ ] 크레딧 시스템 유닛 테스트 작성
- [ ] 웹훅 처리 테스트 작성
- [ ] E2E 테스트 작성 (Playwright)
- [ ] 테스트 커버리지 80% 이상 달성
- [ ] 엣지 케이스 처리 로직 구현
- [ ] 버그 수정

### Week 4: 런칭
- [ ] 프로덕션 환경 변수 설정
- [ ] DB 마이그레이션 실행
- [ ] Celery Beat 설정
- [ ] 모니터링 대시보드 구축
- [ ] 알림 설정 (Slack)
- [ ] 런칭 공지 작성
- [ ] 프로모션 설정
- [ ] 고객 지원 FAQ 작성

---

## 완료 기준

1. 모든 테스트 통과 (유닛 + E2E)
2. 테스트 커버리지 80% 이상
3. 프로덕션 환경에서 결제 플로우 정상 동작
4. 모니터링 및 알림 시스템 동작
5. 런칭 공지 및 프로모션 활성화
