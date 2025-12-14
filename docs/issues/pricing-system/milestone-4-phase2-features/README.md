# Milestone 4: Phase 2 기능

## 목표
데이터 기반 기능 확장 (런칭 후 1-2개월)

## 범위
- 크레딧 팩 추가 구매
- BYO-Key (Bring Your Own Key) 연동
- Lite 플랜 도입 검토
- 연간 구독 옵션

---

## 도입 조건 및 의사결정 기준

### Phase 2 기능 도입 시점

| 기능 | 도입 조건 | 우선순위 |
|------|----------|---------|
| 크레딧 팩 | 크레딧 소진 사용자 10% 이상 | P0 (필수) |
| BYO-Key | 크레딧 팩 반복 구매자 5% 이상 | P1 |
| Lite 플랜 | 전환율 < 2% 지속 시 | P2 (조건부) |
| 연간 구독 | MRR 200만원 이상 | P1 |

### KPI 기반 의사결정

```
전환율 분석 (런칭 3개월 후)
━━━━━━━━━━━━━━━━━━━━━━━━

IF 전환율 >= 4%:
   → 현 가격 유지
   → 연간 구독 프로모션 강화

ELIF 전환율 2-4%:
   → 가치 전달 개선에 집중
   → 크레딧 팩 + BYO-Key 도입

ELSE 전환율 < 2%:
   → Lite 플랜(9,900원) 도입 검토
   → 무료 체험 강화
```

---

## 1. 크레딧 팩 추가 구매

### 1.1 상품 구성

| 팩 이름 | 크레딧 | 가격 | 단가 |
|--------|--------|------|------|
| 기본 팩 | 100 | 3,000원 | 30원/크레딧 |
| 표준 팩 | 200 | 5,000원 | 25원/크레딧 |
| 대용량 팩 | 500 | 10,000원 | 20원/크레딧 |

### 1.2 DB 스키마

```python
# backend/app/models/credit_pack.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base_class import Base


class CreditPackType(str, enum.Enum):
    BASIC = "basic"       # 100 크레딧
    STANDARD = "standard" # 200 크레딧
    LARGE = "large"       # 500 크레딧


class CreditPackPurchase(Base):
    __tablename__ = "credit_pack_purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)

    # 팩 정보
    pack_type = Column(Enum(CreditPackType), nullable=False)
    credits = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)

    # 결제 정보
    payment_key = Column(String(200), nullable=True)
    order_id = Column(String(100), unique=True, nullable=False)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    user = relationship("User")
    subscription = relationship("Subscription")
```

### 1.3 API 엔드포인트

```python
# backend/app/api/credit_packs.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.credit_pack import CreditPackPurchase, CreditPackType
from app.services.credit_service import CreditService
from app.services.toss_payments import toss_client

router = APIRouter(prefix="/credit-packs", tags=["credit-packs"])

PACK_INFO = {
    CreditPackType.BASIC: {"credits": 100, "price": 3000},
    CreditPackType.STANDARD: {"credits": 200, "price": 5000},
    CreditPackType.LARGE: {"credits": 500, "price": 10000},
}


@router.get("")
async def list_credit_packs():
    """크레딧 팩 목록 조회"""
    return [
        {
            "type": pack_type.value,
            "credits": info["credits"],
            "price": info["price"],
            "unit_price": info["price"] / info["credits"]
        }
        for pack_type, info in PACK_INFO.items()
    ]


@router.post("/{pack_type}/purchase")
async def purchase_credit_pack(
    pack_type: CreditPackType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """크레딧 팩 구매"""
    # 구독 확인
    subscription = current_user.subscription
    if not subscription or subscription.plan == "free":
        raise HTTPException(
            status_code=400,
            detail="크레딧 팩은 Premier 구독자만 구매할 수 있습니다."
        )

    # 빌링키 확인
    if not subscription.billing_key:
        raise HTTPException(
            status_code=400,
            detail="등록된 결제 수단이 없습니다."
        )

    pack_info = PACK_INFO[pack_type]
    order_id = f"pack_{uuid.uuid4().hex[:16]}"

    # 결제 요청
    try:
        payment_result = await toss_client.request_billing_payment(
            billing_key=subscription.billing_key,
            customer_key=subscription.customer_key,
            amount=pack_info["price"],
            order_id=order_id,
            order_name=f"QA Labs 크레딧 팩 ({pack_info['credits']})"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"결제 실패: {str(e)}")

    # 구매 기록
    purchase = CreditPackPurchase(
        user_id=current_user.id,
        subscription_id=subscription.id,
        pack_type=pack_type,
        credits=pack_info["credits"],
        price=pack_info["price"],
        payment_key=payment_result.paymentKey,
        order_id=order_id
    )
    db.add(purchase)

    # 크레딧 추가
    credit_service = CreditService(db)
    credit_service.add_bonus_credits(
        current_user.id,
        amount=pack_info["credits"],
        reason="pack_purchase"
    )

    db.commit()

    return {
        "success": True,
        "credits_added": pack_info["credits"],
        "total_credits": credit_service.get_current_credits(current_user.id)
    }
```

### 1.4 프론트엔드 컴포넌트

```tsx
// frontend/components/subscription/CreditPackPurchase.tsx

'use client';

import { useState } from 'react';
import { creditPackApi } from '@/lib/api/creditPack';

const PACKS = [
  { type: 'basic', credits: 100, price: 3000, label: '기본 팩' },
  { type: 'standard', credits: 200, price: 5000, label: '표준 팩', popular: true },
  { type: 'large', credits: 500, price: 10000, label: '대용량 팩' },
];

export function CreditPackPurchase({ onSuccess }: { onSuccess: () => void }) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPack) return;

    setIsLoading(true);
    try {
      await creditPackApi.purchase(selectedPack);
      onSuccess();
    } catch (error) {
      console.error('Failed to purchase pack:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">크레딧 팩 구매</h3>

      <div className="space-y-3 mb-6">
        {PACKS.map((pack) => (
          <button
            key={pack.type}
            onClick={() => setSelectedPack(pack.type)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
              selectedPack === pack.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {pack.label}
                  {pack.popular && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                      인기
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {pack.credits} 크레딧
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{pack.price.toLocaleString()}원</div>
                <div className="text-xs text-gray-500">
                  {(pack.price / pack.credits).toFixed(0)}원/크레딧
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handlePurchase}
        disabled={!selectedPack || isLoading}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? '처리 중...' : '구매하기'}
      </button>
    </div>
  );
}
```

---

## 2. BYO-Key (Bring Your Own Key)

### 2.1 개념

사용자가 자신의 OpenAI API 키를 등록하여 크레딧 제한 없이 AI 코칭을 사용할 수 있는 기능.

**장점:**
- 헤비 유저의 비용 부담 해소
- 무제한 사용 가능
- 서비스 비용 통제

**주의사항:**
- API 키 보안 관리
- 사용량 모니터링
- 에러 처리 (키 만료, 잔액 부족 등)

### 2.2 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     BYO-Key 플로우                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [사용자]                                                   │
│      │                                                       │
│      ▼                                                       │
│   1. API 키 등록                                            │
│      │                                                       │
│      ▼                                                       │
│   [Backend]                                                  │
│      │                                                       │
│      ├─► 키 유효성 검증 (OpenAI API 호출)                   │
│      │                                                       │
│      ├─► 암호화 후 저장 (AES-256)                           │
│      │                                                       │
│      └─► 사용 시 복호화하여 OpenAI 호출                     │
│                                                              │
│   [AI 코칭 요청 시]                                         │
│      │                                                       │
│      ├─► BYO-Key 등록 여부 확인                             │
│      │                                                       │
│      ├─► IF BYO-Key 있음:                                   │
│      │      └─► 사용자 키로 API 호출                        │
│      │                                                       │
│      └─► ELSE:                                               │
│             └─► 크레딧 차감 후 서비스 키로 호출             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 DB 스키마

```python
# backend/app/models/api_key.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from cryptography.fernet import Fernet

from app.db.base_class import Base
from app.core.config import settings


class UserApiKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # 암호화된 API 키
    encrypted_key = Column(String(500), nullable=False)
    key_prefix = Column(String(10), nullable=False)  # 표시용 (sk-...xxx)

    # 상태
    is_valid = Column(Boolean, default=True)
    last_validated_at = Column(DateTime, nullable=True)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    user = relationship("User", back_populates="api_key")

    @staticmethod
    def encrypt_key(api_key: str) -> str:
        """API 키 암호화"""
        fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        return fernet.encrypt(api_key.encode()).decode()

    def decrypt_key(self) -> str:
        """API 키 복호화"""
        fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        return fernet.decrypt(self.encrypted_key.encode()).decode()

    @staticmethod
    def mask_key(api_key: str) -> str:
        """API 키 마스킹 (sk-...xxxx)"""
        if len(api_key) < 10:
            return "***"
        return f"{api_key[:7]}...{api_key[-4:]}"
```

### 2.4 API 엔드포인트

```python
# backend/app/api/api_keys.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.api_key import UserApiKey

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("")
async def register_api_key(
    data: dict,  # {"api_key": "sk-..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """API 키 등록"""
    api_key = data.get("api_key", "").strip()

    # 형식 검증
    if not api_key.startswith("sk-"):
        raise HTTPException(status_code=400, detail="올바른 OpenAI API 키 형식이 아닙니다.")

    # 유효성 검증 (실제 API 호출)
    is_valid = await _validate_openai_key(api_key)
    if not is_valid:
        raise HTTPException(status_code=400, detail="유효하지 않은 API 키입니다.")

    # 기존 키 확인
    existing = db.query(UserApiKey).filter(
        UserApiKey.user_id == current_user.id
    ).first()

    if existing:
        # 업데이트
        existing.encrypted_key = UserApiKey.encrypt_key(api_key)
        existing.key_prefix = UserApiKey.mask_key(api_key)
        existing.is_valid = True
    else:
        # 새로 생성
        user_api_key = UserApiKey(
            user_id=current_user.id,
            encrypted_key=UserApiKey.encrypt_key(api_key),
            key_prefix=UserApiKey.mask_key(api_key),
            is_valid=True
        )
        db.add(user_api_key)

    db.commit()

    return {"success": True, "key_prefix": UserApiKey.mask_key(api_key)}


@router.get("/me")
async def get_my_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 API 키 조회"""
    api_key = db.query(UserApiKey).filter(
        UserApiKey.user_id == current_user.id
    ).first()

    if not api_key:
        return {"has_key": False}

    return {
        "has_key": True,
        "key_prefix": api_key.key_prefix,
        "is_valid": api_key.is_valid,
        "created_at": api_key.created_at.isoformat()
    }


@router.delete("/me")
async def delete_my_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 API 키 삭제"""
    api_key = db.query(UserApiKey).filter(
        UserApiKey.user_id == current_user.id
    ).first()

    if api_key:
        db.delete(api_key)
        db.commit()

    return {"success": True}


async def _validate_openai_key(api_key: str) -> bool:
    """OpenAI API 키 유효성 검증"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0
            )
            return response.status_code == 200
    except Exception:
        return False
```

### 2.5 AI 코칭 서비스 수정

```python
# backend/app/services/ai_coach.py (수정)

from app.models.api_key import UserApiKey


class AICoachService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self._api_key = None

    async def get_api_key(self) -> str:
        """사용할 API 키 결정 (BYO-Key 또는 서비스 키)"""
        if self._api_key:
            return self._api_key

        # BYO-Key 확인
        user_api_key = self.db.query(UserApiKey).filter(
            UserApiKey.user_id == self.user_id,
            UserApiKey.is_valid == True
        ).first()

        if user_api_key:
            self._api_key = user_api_key.decrypt_key()
            self._using_byo_key = True
        else:
            self._api_key = settings.OPENAI_API_KEY
            self._using_byo_key = False

        return self._api_key

    def should_use_credits(self) -> bool:
        """크레딧을 사용해야 하는지 여부"""
        return not getattr(self, '_using_byo_key', False)

    async def chat(self, message: str) -> str:
        """AI 코칭 채팅"""
        api_key = await self.get_api_key()

        # 크레딧 사용 여부 확인
        if self.should_use_credits():
            # 크레딧 차감 로직
            credit_service = CreditService(self.db)
            can_use, _ = credit_service.use_credit(self.user_id)
            if not can_use:
                raise CreditExhaustedException()

        # OpenAI API 호출
        response = await self._call_openai(api_key, message)
        return response
```

---

## 3. Lite 플랜 (조건부)

### 3.1 도입 조건

```
전환율 분석 (런칭 3개월 후)
━━━━━━━━━━━━━━━━━━━━━━━━━━

IF 무료→Premier 전환율 < 2% AND
   무료 사용자 중 "가격 문제" 이탈 > 30%:

   → Lite 플랜 도입 검토
```

### 3.2 플랜 구성

| 플랜 | 가격 | 주요 기능 |
|------|------|----------|
| Free | 0원 | 기본 분석, 코칭 10회/월 |
| **Lite (신규)** | 9,900원/월 | GPT-5.2 심층분석만 (코칭 제외) |
| Premier | 19,900원/월 | 심층분석 + 코칭 300회 |

### 3.3 Lite 플랜 특징

- **포함**: GPT-5.2 심층 분석 (무제한)
- **제외**: AI 코칭 챗봇 (또는 월 50회 제한)
- **타겟**: 코칭보다 분석 결과만 필요한 사용자

### 3.4 구현 시 고려사항

```python
# SubscriptionPlan 확장
class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    LITE = "lite"           # 신규
    PREMIER = "premier"
    PREMIER_YEARLY = "premier_yearly"

# 기능 접근 제어
PLAN_FEATURES = {
    "free": {
        "deep_analysis": False,
        "coach_credits": 10,
    },
    "lite": {
        "deep_analysis": True,
        "coach_credits": 50,  # 또는 0
    },
    "premier": {
        "deep_analysis": True,
        "coach_credits": 300,
    },
}
```

---

## 4. 연간 구독 옵션

### 4.1 가격 정책

| 플랜 | 월간 | 연간 | 할인율 |
|------|------|------|-------|
| Lite | 9,900원 | 89,000원 | 25% |
| Premier | 19,900원 | 179,000원 | 25% |

### 4.2 연간 구독 혜택

- 25% 할인
- 연간 전용 배지/뱃지
- 우선 고객 지원
- (선택) 추가 보너스 크레딧

### 4.3 프로모션 전략

```
런칭 후 프로모션 단계
━━━━━━━━━━━━━━━━━━━

Phase 1 (런칭 직후):
• 연간 30% 할인 (한정 기간)
• 얼리버드 혜택 강조

Phase 2 (1개월 후):
• 연간 25% 할인 (정상가)
• 월간 → 연간 전환 유도 팝업

Phase 3 (3개월 후):
• 연간 갱신 시 추가 할인 (5%)
• 충성 고객 리텐션 강화
```

---

## 구현 태스크 체크리스트

### 크레딧 팩
- [ ] `CreditPackPurchase` 모델 생성
- [ ] 크레딧 팩 목록 API
- [ ] 크레딧 팩 구매 API
- [ ] 크레딧 팩 UI 컴포넌트
- [ ] 크레딧 소진 모달에 팩 구매 옵션 추가

### BYO-Key
- [ ] `UserApiKey` 모델 생성
- [ ] API 키 등록/조회/삭제 API
- [ ] API 키 암호화 유틸리티
- [ ] AI 코칭 서비스에 BYO-Key 로직 추가
- [ ] 설정 페이지 UI

### Lite 플랜 (조건부)
- [ ] 전환율 데이터 수집 및 분석
- [ ] Lite 플랜 결정 시 DB 스키마 수정
- [ ] 기능 접근 제어 로직 수정
- [ ] 요금제 페이지 UI 수정

### 연간 구독
- [ ] 연간 플랜 가격 정책 확정
- [ ] 연간 결제 로직 구현
- [ ] 연간 갱신 알림 시스템
- [ ] 프로모션 코드 시스템

---

## 완료 기준

### Phase 2-1: 크레딧 팩 + BYO-Key
1. 크레딧 팩 구매 플로우 정상 동작
2. BYO-Key 등록 및 사용 정상 동작
3. API 키 암호화 보안 검증

### Phase 2-2: Lite 플랜 + 연간 구독
1. 전환율 데이터 기반 Lite 플랜 결정
2. 연간 구독 결제/갱신 정상 동작
3. 프로모션 코드 시스템 동작

---

## 의사결정 타임라인

```
런칭
  │
  ▼
1개월 후: 크레딧 팩 도입
  │        • 크레딧 소진 사용자 피드백 수집
  │        • 팩 구매 전환율 측정
  │
  ▼
2개월 후: BYO-Key 도입
  │        • 크레딧 팩 반복 구매자 분석
  │        • 헤비 유저 피드백 수집
  │
  ▼
3개월 후: Lite 플랜 결정
  │        • 전환율 분석
  │        • 이탈 사유 분석
  │        • A/B 테스트 (필요시)
  │
  ▼
4개월 후: 연간 구독 강화
           • 연간 전환 프로모션
           • 충성 고객 리텐션 프로그램
```
