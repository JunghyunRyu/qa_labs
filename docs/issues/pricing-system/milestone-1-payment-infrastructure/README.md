# Milestone 1: 결제 인프라 + 크레딧 시스템

## 목표
토스페이먼츠 연동 및 핵심 백엔드 구축 (Week 1-2)

## 범위
- 토스페이먼츠 정기결제 연동
- 구독/결제/크레딧 DB 스키마
- 구독 관리 API
- 크레딧 카운팅 시스템
- 월간 리셋 스케줄러

---

## Week 1: 결제 인프라

### 1.1 토스페이먼츠 연동 설정

#### 환경 변수 (.env)
```bash
# 토스페이먼츠 API 키 (테스트)
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# 토스페이먼츠 API 키 (프로덕션)
# TOSS_CLIENT_KEY=live_ck_...
# TOSS_SECRET_KEY=live_sk_...

TOSS_API_URL=https://api.tosspayments.com
```

#### 의존성 설치
```bash
pip install httpx  # 비동기 HTTP 클라이언트
```

#### 토스페이먼츠 클라이언트 (`backend/app/services/toss_payments.py`)
```python
import httpx
import base64
from typing import Optional
from pydantic import BaseModel
from app.core.config import settings


class BillingKeyResponse(BaseModel):
    billingKey: str
    customerKey: str
    cardCompany: str
    cardNumber: str


class PaymentResponse(BaseModel):
    paymentKey: str
    orderId: str
    status: str
    totalAmount: int
    approvedAt: Optional[str] = None


class TossPaymentsClient:
    def __init__(self):
        self.base_url = settings.TOSS_API_URL
        self.secret_key = settings.TOSS_SECRET_KEY

    def _get_headers(self) -> dict:
        """인증 헤더 생성"""
        encoded = base64.b64encode(f"{self.secret_key}:".encode()).decode()
        return {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json"
        }

    async def issue_billing_key(
        self,
        customer_key: str,
        auth_key: str
    ) -> BillingKeyResponse:
        """
        카드 등록 후 빌링키 발급
        - 프론트에서 카드 등록 완료 후 받은 authKey로 호출
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/billing/authorizations/{auth_key}",
                headers=self._get_headers(),
                json={"customerKey": customer_key}
            )
            response.raise_for_status()
            return BillingKeyResponse(**response.json())

    async def request_billing_payment(
        self,
        billing_key: str,
        customer_key: str,
        amount: int,
        order_id: str,
        order_name: str
    ) -> PaymentResponse:
        """
        빌링키로 자동 결제 요청
        - 정기 결제 시 사용
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/billing/{billing_key}",
                headers=self._get_headers(),
                json={
                    "customerKey": customer_key,
                    "amount": amount,
                    "orderId": order_id,
                    "orderName": order_name
                }
            )
            response.raise_for_status()
            return PaymentResponse(**response.json())

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str
    ) -> dict:
        """결제 취소"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/payments/{payment_key}/cancel",
                headers=self._get_headers(),
                json={"cancelReason": cancel_reason}
            )
            response.raise_for_status()
            return response.json()


# 싱글톤 인스턴스
toss_client = TossPaymentsClient()
```

---

### 1.2 DB 스키마

#### Subscription 테이블 (`backend/app/models/subscription.py`)
```python
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base_class import Base


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"           # 활성
    CANCELLED = "cancelled"     # 취소됨 (기간 끝까지 사용 가능)
    EXPIRED = "expired"         # 만료됨
    PAST_DUE = "past_due"       # 결제 실패


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PREMIER = "premier"
    PREMIER_YEARLY = "premier_yearly"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # 플랜 정보
    plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)

    # 토스페이먼츠 정보
    billing_key = Column(String(100), nullable=True)  # 정기결제용 빌링키
    customer_key = Column(String(100), nullable=True)  # 고객 식별키

    # 기간 정보
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)

    # 취소 정보
    cancelled_at = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", back_populates="subscription")
    payments = relationship("Payment", back_populates="subscription")
    credit_usage = relationship("CreditUsage", back_populates="subscription")
```

#### Payment 테이블 (`backend/app/models/payment.py`)
```python
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base_class import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)

    # 결제 정보
    amount = Column(Integer, nullable=False)  # 원 단위
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)

    # 토스페이먼츠 정보
    payment_key = Column(String(200), nullable=True)
    order_id = Column(String(100), unique=True, nullable=False)

    # 카드 정보 (마스킹)
    card_company = Column(String(50), nullable=True)
    card_number = Column(String(20), nullable=True)  # 마지막 4자리만

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    # 관계
    subscription = relationship("Subscription", back_populates="payments")
```

#### CreditUsage 테이블 (`backend/app/models/credit_usage.py`)
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date

from app.db.base_class import Base


class CreditUsage(Base):
    __tablename__ = "credit_usage"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)

    # 기간 정보
    period_start = Column(Date, nullable=False)  # 월간 기간 시작
    period_end = Column(Date, nullable=False)    # 월간 기간 종료

    # 크레딧 정보
    total_credits = Column(Integer, default=300)    # 월간 총 크레딧
    used_credits = Column(Integer, default=0)       # 사용한 크레딧
    bonus_credits = Column(Integer, default=0)      # 추가 구매 크레딧

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    subscription = relationship("Subscription", back_populates="credit_usage")

    @property
    def remaining_credits(self) -> int:
        """남은 크레딧"""
        return (self.total_credits + self.bonus_credits) - self.used_credits

    @property
    def usage_percentage(self) -> float:
        """사용률 (0-100)"""
        total = self.total_credits + self.bonus_credits
        if total == 0:
            return 0.0
        return (self.used_credits / total) * 100
```

#### 마이그레이션 생성
```bash
alembic revision --autogenerate -m "add subscription and payment tables"
alembic upgrade head
```

---

### 1.3 구독 관리 API

#### 스키마 (`backend/app/schemas/subscription.py`)
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.subscription import SubscriptionPlan, SubscriptionStatus


class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan
    auth_key: str  # 토스페이먼츠 카드 등록 후 받은 키


class SubscriptionResponse(BaseModel):
    id: int
    plan: SubscriptionPlan
    status: SubscriptionStatus
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool

    # 크레딧 정보
    remaining_credits: int
    total_credits: int
    usage_percentage: float

    class Config:
        from_attributes = True


class SubscriptionCancel(BaseModel):
    cancel_immediately: bool = False  # True면 즉시 취소, False면 기간 종료 후
```

#### API 엔드포인트 (`backend/app/api/subscriptions.py`)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.credit_usage import CreditUsage
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionCancel
)
from app.services.toss_payments import toss_client

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# 가격 정보
PLAN_PRICES = {
    SubscriptionPlan.PREMIER: 19900,
    SubscriptionPlan.PREMIER_YEARLY: 179000,
}

PLAN_CREDITS = {
    SubscriptionPlan.FREE: 10,
    SubscriptionPlan.PREMIER: 300,
    SubscriptionPlan.PREMIER_YEARLY: 300,
}


@router.post("", response_model=SubscriptionResponse)
async def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    구독 생성 (업그레이드)
    1. 빌링키 발급
    2. 첫 결제 실행
    3. 구독 레코드 생성
    """
    # 기존 구독 확인
    existing = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if existing and existing.status == SubscriptionStatus.ACTIVE:
        if existing.plan != SubscriptionPlan.FREE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 유료 구독 중입니다."
            )

    # 1. 빌링키 발급
    customer_key = f"customer_{current_user.id}"
    try:
        billing_result = await toss_client.issue_billing_key(
            customer_key=customer_key,
            auth_key=data.auth_key
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"카드 등록 실패: {str(e)}"
        )

    # 2. 첫 결제 실행
    order_id = f"order_{uuid.uuid4().hex[:16]}"
    amount = PLAN_PRICES[data.plan]

    try:
        payment_result = await toss_client.request_billing_payment(
            billing_key=billing_result.billingKey,
            customer_key=customer_key,
            amount=amount,
            order_id=order_id,
            order_name=f"QA Labs {data.plan.value} 구독"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"결제 실패: {str(e)}"
        )

    # 3. 구독 레코드 생성/업데이트
    now = datetime.utcnow()
    period_days = 365 if data.plan == SubscriptionPlan.PREMIER_YEARLY else 30

    if existing:
        subscription = existing
        subscription.plan = data.plan
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.billing_key = billing_result.billingKey
        subscription.customer_key = customer_key
        subscription.current_period_start = now
        subscription.current_period_end = now + timedelta(days=period_days)
        subscription.cancelled_at = None
        subscription.cancel_at_period_end = False
    else:
        subscription = Subscription(
            user_id=current_user.id,
            plan=data.plan,
            status=SubscriptionStatus.ACTIVE,
            billing_key=billing_result.billingKey,
            customer_key=customer_key,
            current_period_start=now,
            current_period_end=now + timedelta(days=period_days)
        )
        db.add(subscription)

    db.commit()
    db.refresh(subscription)

    # 4. 크레딧 초기화
    _initialize_credits(db, subscription)

    return _build_subscription_response(db, subscription)


@router.get("/me", response_model=SubscriptionResponse)
async def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 구독 정보 조회"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        # 무료 플랜 반환
        return SubscriptionResponse(
            id=0,
            plan=SubscriptionPlan.FREE,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=None,
            current_period_end=None,
            cancel_at_period_end=False,
            remaining_credits=10,
            total_credits=10,
            usage_percentage=0.0
        )

    return _build_subscription_response(db, subscription)


@router.delete("/{subscription_id}")
async def cancel_subscription(
    subscription_id: int,
    data: SubscriptionCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    구독 취소
    - cancel_immediately=False: 기간 종료 후 취소 (기본)
    - cancel_immediately=True: 즉시 취소 + 환불
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="구독을 찾을 수 없습니다."
        )

    if subscription.status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 취소된 구독입니다."
        )

    if data.cancel_immediately:
        # 즉시 취소 + 환불 처리 (TODO: 부분 환불 로직)
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancelled_at = datetime.utcnow()
    else:
        # 기간 종료 후 취소
        subscription.cancel_at_period_end = True
        subscription.cancelled_at = datetime.utcnow()

    db.commit()

    return {"message": "구독이 취소되었습니다."}


def _initialize_credits(db: Session, subscription: Subscription):
    """크레딧 초기화"""
    from datetime import date

    today = date.today()
    period_end = today.replace(day=1) + timedelta(days=32)
    period_end = period_end.replace(day=1) - timedelta(days=1)  # 월말

    credit_usage = CreditUsage(
        subscription_id=subscription.id,
        period_start=today.replace(day=1),
        period_end=period_end,
        total_credits=PLAN_CREDITS.get(subscription.plan, 10),
        used_credits=0
    )
    db.add(credit_usage)
    db.commit()


def _build_subscription_response(
    db: Session,
    subscription: Subscription
) -> SubscriptionResponse:
    """구독 응답 빌드"""
    from datetime import date

    # 현재 기간의 크레딧 사용량 조회
    today = date.today()
    credit_usage = db.query(CreditUsage).filter(
        CreditUsage.subscription_id == subscription.id,
        CreditUsage.period_start <= today,
        CreditUsage.period_end >= today
    ).first()

    if credit_usage:
        remaining = credit_usage.remaining_credits
        total = credit_usage.total_credits + credit_usage.bonus_credits
        percentage = credit_usage.usage_percentage
    else:
        remaining = PLAN_CREDITS.get(subscription.plan, 10)
        total = remaining
        percentage = 0.0

    return SubscriptionResponse(
        id=subscription.id,
        plan=subscription.plan,
        status=subscription.status,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end,
        remaining_credits=remaining,
        total_credits=total,
        usage_percentage=percentage
    )
```

---

### 1.4 웹훅 처리 (`backend/app/api/webhooks.py`)

```python
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import hmac
import hashlib

from app.db.session import get_db
from app.core.config import settings
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.payment import Payment, PaymentStatus

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def verify_toss_signature(payload: bytes, signature: str) -> bool:
    """토스페이먼츠 웹훅 서명 검증"""
    expected = hmac.new(
        settings.TOSS_SECRET_KEY.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/tosspayments")
async def handle_toss_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    토스페이먼츠 웹훅 처리
    - BILLING_AUTO_EXECUTE: 정기결제 자동 실행
    - PAYMENT_STATUS_CHANGED: 결제 상태 변경
    """
    payload = await request.body()
    signature = request.headers.get("Toss-Signature", "")

    # 서명 검증 (프로덕션에서 활성화)
    # if not verify_toss_signature(payload, signature):
    #     raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()
    event_type = data.get("eventType")

    if event_type == "BILLING_AUTO_EXECUTE":
        # 정기결제 자동 실행 결과
        await _handle_billing_execute(db, data)

    elif event_type == "PAYMENT_STATUS_CHANGED":
        # 결제 상태 변경
        await _handle_payment_status_change(db, data)

    return {"status": "ok"}


async def _handle_billing_execute(db: Session, data: dict):
    """정기결제 자동 실행 처리"""
    payment_data = data.get("data", {})
    customer_key = payment_data.get("customerKey")
    status = payment_data.get("status")

    subscription = db.query(Subscription).filter(
        Subscription.customer_key == customer_key
    ).first()

    if not subscription:
        return

    if status == "DONE":
        # 결제 성공 - 구독 기간 연장
        from datetime import timedelta
        subscription.current_period_start = subscription.current_period_end
        subscription.current_period_end += timedelta(days=30)
        subscription.status = SubscriptionStatus.ACTIVE

        # 크레딧 리셋
        _reset_monthly_credits(db, subscription)

    elif status == "FAILED":
        # 결제 실패
        subscription.status = SubscriptionStatus.PAST_DUE

    db.commit()


async def _handle_payment_status_change(db: Session, data: dict):
    """결제 상태 변경 처리"""
    payment_data = data.get("data", {})
    order_id = payment_data.get("orderId")
    new_status = payment_data.get("status")

    payment = db.query(Payment).filter(
        Payment.order_id == order_id
    ).first()

    if payment:
        status_map = {
            "DONE": PaymentStatus.COMPLETED,
            "CANCELED": PaymentStatus.CANCELLED,
            "PARTIAL_CANCELED": PaymentStatus.REFUNDED,
        }
        payment.status = status_map.get(new_status, payment.status)
        db.commit()


def _reset_monthly_credits(db: Session, subscription: Subscription):
    """월간 크레딧 리셋"""
    from datetime import date, timedelta
    from app.models.credit_usage import CreditUsage

    today = date.today()
    period_end = today.replace(day=1) + timedelta(days=32)
    period_end = period_end.replace(day=1) - timedelta(days=1)

    credit_usage = CreditUsage(
        subscription_id=subscription.id,
        period_start=today.replace(day=1),
        period_end=period_end,
        total_credits=300,
        used_credits=0
    )
    db.add(credit_usage)
    db.commit()
```

---

## Week 2: 크레딧 시스템

### 2.1 크레딧 카운팅 미들웨어 (`backend/app/middleware/credit_counter.py`)

```python
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from datetime import date

from app.db.session import SessionLocal
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.credit_usage import CreditUsage


# 크레딧을 소비하는 엔드포인트 목록
CREDIT_ENDPOINTS = [
    "/api/coach/chat",      # AI 코칭 채팅
    "/api/analysis/deep",   # 심층 분석
]


class CreditCounterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 크레딧 소비 엔드포인트인지 확인
        if not self._is_credit_endpoint(request.url.path):
            return await call_next(request)

        # 사용자 정보 확인
        user_id = getattr(request.state, "user_id", None)
        if not user_id:
            return await call_next(request)

        # 크레딧 확인 및 차감
        db = SessionLocal()
        try:
            can_use, remaining = self._check_and_use_credit(db, user_id)

            if not can_use:
                return JSONResponse(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    content={
                        "error": "credit_exhausted",
                        "message": "이번 달 AI 코칭 크레딧을 모두 사용했습니다.",
                        "remaining_credits": 0,
                        "options": [
                            {"type": "wait", "label": "다음 달까지 기다리기"},
                            {"type": "upgrade", "label": "프리미어 구독하기"}
                        ]
                    }
                )

            # 요청 처리
            response = await call_next(request)

            # 응답 헤더에 크레딧 정보 추가
            response.headers["X-Credits-Remaining"] = str(remaining - 1)

            return response

        finally:
            db.close()

    def _is_credit_endpoint(self, path: str) -> bool:
        return any(path.startswith(ep) for ep in CREDIT_ENDPOINTS)

    def _check_and_use_credit(
        self,
        db: Session,
        user_id: int
    ) -> tuple[bool, int]:
        """
        크레딧 확인 및 차감
        Returns: (사용 가능 여부, 남은 크레딧)
        """
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()

        if not subscription:
            # 무료 사용자
            return self._check_free_credits(db, user_id)

        today = date.today()
        credit_usage = db.query(CreditUsage).filter(
            CreditUsage.subscription_id == subscription.id,
            CreditUsage.period_start <= today,
            CreditUsage.period_end >= today
        ).first()

        if not credit_usage:
            # 크레딧 레코드 없음 - 생성
            credit_usage = self._create_credit_usage(db, subscription)

        remaining = credit_usage.remaining_credits

        if remaining <= 0:
            return False, 0

        # 크레딧 차감
        credit_usage.used_credits += 1
        db.commit()

        return True, remaining

    def _check_free_credits(
        self,
        db: Session,
        user_id: int
    ) -> tuple[bool, int]:
        """무료 사용자 크레딧 확인"""
        from app.models.free_usage import FreeUsage

        today = date.today()
        month_start = today.replace(day=1)

        usage = db.query(FreeUsage).filter(
            FreeUsage.user_id == user_id,
            FreeUsage.month == month_start
        ).first()

        if not usage:
            usage = FreeUsage(
                user_id=user_id,
                month=month_start,
                used_count=0
            )
            db.add(usage)
            db.commit()

        remaining = 10 - usage.used_count  # 무료는 월 10회

        if remaining <= 0:
            return False, 0

        usage.used_count += 1
        db.commit()

        return True, remaining


from starlette.responses import JSONResponse
```

### 2.2 크레딧 서비스 (`backend/app/services/credit_service.py`)

```python
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional

from app.models.subscription import Subscription, SubscriptionPlan
from app.models.credit_usage import CreditUsage


class CreditService:
    def __init__(self, db: Session):
        self.db = db

    def get_current_credits(self, user_id: int) -> dict:
        """현재 크레딧 정보 조회"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()

        if not subscription or subscription.plan == SubscriptionPlan.FREE:
            return self._get_free_credits(user_id)

        today = date.today()
        credit_usage = self.db.query(CreditUsage).filter(
            CreditUsage.subscription_id == subscription.id,
            CreditUsage.period_start <= today,
            CreditUsage.period_end >= today
        ).first()

        if not credit_usage:
            credit_usage = self._create_credit_usage(subscription)

        return {
            "plan": subscription.plan.value,
            "total_credits": credit_usage.total_credits + credit_usage.bonus_credits,
            "used_credits": credit_usage.used_credits,
            "remaining_credits": credit_usage.remaining_credits,
            "usage_percentage": credit_usage.usage_percentage,
            "period_end": credit_usage.period_end.isoformat(),
            "daily_limit": 10,  # 매일 10회 기준
            "daily_used": self._get_daily_used(credit_usage)
        }

    def use_credit(self, user_id: int) -> tuple[bool, dict]:
        """
        크레딧 사용
        Returns: (성공 여부, 상세 정보)
        """
        credits = self.get_current_credits(user_id)

        if credits["remaining_credits"] <= 0:
            return False, {
                "error": "credit_exhausted",
                "message": "크레딧을 모두 사용했습니다.",
                **credits
            }

        # 크레딧 차감 로직
        # ... (미들웨어에서 처리)

        return True, credits

    def add_bonus_credits(
        self,
        user_id: int,
        amount: int,
        reason: str = "purchase"
    ) -> dict:
        """보너스 크레딧 추가 (크레딧 팩 구매 시)"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()

        if not subscription:
            raise ValueError("구독 정보가 없습니다.")

        today = date.today()
        credit_usage = self.db.query(CreditUsage).filter(
            CreditUsage.subscription_id == subscription.id,
            CreditUsage.period_start <= today,
            CreditUsage.period_end >= today
        ).first()

        if credit_usage:
            credit_usage.bonus_credits += amount
            self.db.commit()

        return self.get_current_credits(user_id)

    def _get_free_credits(self, user_id: int) -> dict:
        """무료 사용자 크레딧"""
        from app.models.free_usage import FreeUsage

        today = date.today()
        month_start = today.replace(day=1)

        usage = self.db.query(FreeUsage).filter(
            FreeUsage.user_id == user_id,
            FreeUsage.month == month_start
        ).first()

        used = usage.used_count if usage else 0

        return {
            "plan": "free",
            "total_credits": 10,
            "used_credits": used,
            "remaining_credits": max(0, 10 - used),
            "usage_percentage": (used / 10) * 100,
            "period_end": (month_start + timedelta(days=32)).replace(day=1).isoformat(),
            "daily_limit": 10,
            "daily_used": used  # 무료는 월간 = 일간
        }

    def _create_credit_usage(self, subscription: Subscription) -> CreditUsage:
        """크레딧 사용 레코드 생성"""
        today = date.today()
        period_end = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        credits = 300 if subscription.plan in [
            SubscriptionPlan.PREMIER,
            SubscriptionPlan.PREMIER_YEARLY
        ] else 10

        credit_usage = CreditUsage(
            subscription_id=subscription.id,
            period_start=today.replace(day=1),
            period_end=period_end,
            total_credits=credits,
            used_credits=0
        )
        self.db.add(credit_usage)
        self.db.commit()
        self.db.refresh(credit_usage)

        return credit_usage

    def _get_daily_used(self, credit_usage: CreditUsage) -> int:
        """오늘 사용한 크레딧 수"""
        # TODO: 일일 사용량 추적 구현
        return 0
```

### 2.3 월간 리셋 스케줄러 (`backend/app/tasks/credit_reset.py`)

```python
from celery import shared_task
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.subscription import Subscription, SubscriptionStatus, SubscriptionPlan
from app.models.credit_usage import CreditUsage


@shared_task(name="reset_monthly_credits")
def reset_monthly_credits():
    """
    월간 크레딧 리셋 (매월 1일 00:00 실행)
    - Celery Beat에서 스케줄링
    """
    db = SessionLocal()
    try:
        today = date.today()

        # 활성 구독 조회
        subscriptions = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.plan.in_([
                SubscriptionPlan.PREMIER,
                SubscriptionPlan.PREMIER_YEARLY
            ])
        ).all()

        for subscription in subscriptions:
            # 새 크레딧 기간 생성
            period_end = (today + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            credit_usage = CreditUsage(
                subscription_id=subscription.id,
                period_start=today,
                period_end=period_end,
                total_credits=300,
                used_credits=0
            )
            db.add(credit_usage)

        db.commit()

        return f"Reset credits for {len(subscriptions)} subscriptions"

    finally:
        db.close()


@shared_task(name="check_subscription_expiry")
def check_subscription_expiry():
    """
    구독 만료 체크 (매일 00:00 실행)
    - 기간 종료된 구독 상태 업데이트
    - 취소 예정 구독 처리
    """
    db = SessionLocal()
    try:
        today = date.today()

        # 기간 종료 + 취소 예정인 구독
        expired = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.cancel_at_period_end == True,
            Subscription.current_period_end <= today
        ).all()

        for subscription in expired:
            subscription.status = SubscriptionStatus.EXPIRED
            subscription.plan = SubscriptionPlan.FREE

        db.commit()

        return f"Expired {len(expired)} subscriptions"

    finally:
        db.close()
```

#### Celery Beat 설정 (`backend/app/celery_config.py`)
```python
from celery.schedules import crontab

beat_schedule = {
    "reset-monthly-credits": {
        "task": "reset_monthly_credits",
        "schedule": crontab(day_of_month=1, hour=0, minute=0),  # 매월 1일 00:00
    },
    "check-subscription-expiry": {
        "task": "check_subscription_expiry",
        "schedule": crontab(hour=0, minute=5),  # 매일 00:05
    },
}
```

---

## 구현 태스크 체크리스트

### Week 1: 결제 인프라
- [ ] 토스페이먼츠 테스트 계정 발급
- [ ] 환경 변수 설정 (.env)
- [ ] `TossPaymentsClient` 구현
- [ ] `Subscription` 모델 생성
- [ ] `Payment` 모델 생성
- [ ] `CreditUsage` 모델 생성
- [ ] DB 마이그레이션 실행
- [ ] 구독 생성 API 구현
- [ ] 구독 조회 API 구현
- [ ] 구독 취소 API 구현
- [ ] 웹훅 엔드포인트 구현
- [ ] 웹훅 시그니처 검증 구현

### Week 2: 크레딧 시스템
- [ ] `FreeUsage` 모델 생성 (무료 사용자용)
- [ ] 크레딧 카운팅 미들웨어 구현
- [ ] `CreditService` 구현
- [ ] 크레딧 조회 API 구현
- [ ] 월간 리셋 Celery task 구현
- [ ] 구독 만료 체크 Celery task 구현
- [ ] Celery Beat 스케줄 설정
- [ ] 크레딧 소진 응답 처리

---

## 의존성

### 필수 패키지
```
httpx>=0.24.0
celery[redis]>=5.3.0
```

### 환경 변수
```
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_API_URL=https://api.tosspayments.com
```

---

## 완료 기준

1. 토스페이먼츠 테스트 환경에서 결제 플로우 성공
2. 구독 생성/조회/취소 API 동작 확인
3. 크레딧 차감 및 잔량 표시 동작
4. 웹훅으로 정기결제 갱신 처리
5. 월간 크레딧 리셋 스케줄러 동작
