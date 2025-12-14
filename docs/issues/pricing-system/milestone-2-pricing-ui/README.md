# Milestone 2: 요금제 UI/UX

## 목표
사용자 facing 인터페이스 완성 (Week 2-3)

## 범위
- 요금제 페이지 (Free vs Premier 비교)
- 업그레이드 플로우 (토스페이먼츠 결제창 연동)
- 크레딧 잔량 표시 UI
- 마이페이지 구독 관리 섹션
- 크레딧 소진 시 안내 모달

---

## 페이지 구조

```
frontend/
├── app/
│   ├── pricing/
│   │   └── page.tsx              # 요금제 페이지
│   ├── settings/
│   │   └── subscription/
│   │       └── page.tsx          # 구독 관리 페이지
│   └── components/
│       ├── subscription/
│       │   ├── PricingCard.tsx         # 요금제 카드
│       │   ├── SubscriptionBadge.tsx   # 구독 배지
│       │   ├── CreditIndicator.tsx     # 크레딧 잔량 표시
│       │   ├── CreditExhaustedModal.tsx # 크레딧 소진 모달
│       │   └── PaymentModal.tsx        # 결제 모달
│       └── layout/
│           └── Header.tsx              # 헤더 (크레딧 표시 포함)
├── lib/
│   └── api/
│       └── subscription.ts       # 구독 API 클라이언트
└── types/
    └── subscription.ts           # 타입 정의
```

---

## 결제 플로우 시퀀스

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │    │ Frontend│    │ Backend │    │  Toss   │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     │ 1. 구독 버튼 클릭           │              │
     │─────────────>│              │              │
     │              │              │              │
     │ 2. 결제창 표시              │              │
     │<─────────────│              │              │
     │              │              │              │
     │ 3. 카드 정보 입력           │              │
     │─────────────>│              │              │
     │              │              │              │
     │              │ 4. 카드 등록 요청            │
     │              │─────────────────────────────>│
     │              │              │              │
     │              │ 5. authKey 반환              │
     │              │<─────────────────────────────│
     │              │              │              │
     │              │ 6. 구독 생성 요청            │
     │              │─────────────>│              │
     │              │              │              │
     │              │              │ 7. 빌링키 발급│
     │              │              │─────────────>│
     │              │              │              │
     │              │              │ 8. 첫 결제   │
     │              │              │─────────────>│
     │              │              │              │
     │              │ 9. 구독 완료 │              │
     │              │<─────────────│              │
     │              │              │              │
     │ 10. 성공 화면               │              │
     │<─────────────│              │              │
```

---

## 1. 타입 정의 (`frontend/types/subscription.ts`)

```typescript
export type SubscriptionPlan = 'free' | 'premier' | 'premier_yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  remainingCredits: number;
  totalCredits: number;
  usagePercentage: number;
}

export interface CreditInfo {
  plan: SubscriptionPlan;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  usagePercentage: number;
  periodEnd: string;
  dailyLimit: number;
  dailyUsed: number;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number;
  yearlyPrice?: number;
  features: string[];
  credits: number;
  recommended?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '기본 코드 분석',
      'AI 코칭 월 10회',
      '문제 풀이 무제한',
    ],
    credits: 10,
  },
  {
    id: 'premier',
    name: 'Premier',
    price: 19900,
    yearlyPrice: 179000,
    features: [
      'GPT-5.2 심층 분석',
      'AI 코칭 매일 10회 (월 300회)',
      '통계 기반 맞춤 추천',
      '우선 고객 지원',
    ],
    credits: 300,
    recommended: true,
  },
];
```

---

## 2. API 클라이언트 (`frontend/lib/api/subscription.ts`)

```typescript
import { api } from './client';
import type { Subscription, CreditInfo } from '@/types/subscription';

export const subscriptionApi = {
  /**
   * 내 구독 정보 조회
   */
  getMySubscription: async (): Promise<Subscription> => {
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  /**
   * 구독 생성 (업그레이드)
   */
  createSubscription: async (data: {
    plan: 'premier' | 'premier_yearly';
    authKey: string;
  }): Promise<Subscription> => {
    const response = await api.post('/subscriptions', {
      plan: data.plan,
      auth_key: data.authKey,
    });
    return response.data;
  },

  /**
   * 구독 취소
   */
  cancelSubscription: async (
    subscriptionId: number,
    immediately: boolean = false
  ): Promise<void> => {
    await api.delete(`/subscriptions/${subscriptionId}`, {
      data: { cancel_immediately: immediately },
    });
  },

  /**
   * 크레딧 정보 조회
   */
  getCredits: async (): Promise<CreditInfo> => {
    const response = await api.get('/credits/me');
    return response.data;
  },
};
```

---

## 3. 요금제 페이지 (`frontend/app/pricing/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PLANS, type SubscriptionPlan } from '@/types/subscription';
import { PricingCard } from '@/components/subscription/PricingCard';
import { PaymentModal } from '@/components/subscription/PaymentModal';

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }

    if (planId === 'free') {
      return; // 무료는 이미 사용 중
    }

    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    router.push('/settings/subscription?success=true');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            요금제 선택
          </h1>
          <p className="text-lg text-gray-600">
            AI 코칭으로 코딩 실력을 한 단계 업그레이드하세요
          </p>
        </div>

        {/* 결제 주기 토글 */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연간 결제
              <span className="ml-1 text-green-600 text-xs">25% 할인</span>
            </button>
          </div>
        </div>

        {/* 요금제 카드 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              currentPlan={user?.subscription?.plan}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>

        {/* FAQ 섹션 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <FaqItem
              question="크레딧을 다 쓰면 어떻게 되나요?"
              answer="다음 달 1일에 크레딧이 자동으로 리셋됩니다. 급하시다면 추가 크레딧 팩을 구매하거나, 직접 API 키를 연결해서 사용하실 수도 있습니다."
            />
            <FaqItem
              question="언제든 취소할 수 있나요?"
              answer="네, 언제든 취소 가능합니다. 취소하시면 현재 결제 기간이 끝날 때까지는 계속 사용하실 수 있습니다."
            />
            <FaqItem
              question="환불 정책은 어떻게 되나요?"
              answer="결제 후 7일 이내에 요청하시면 전액 환불해드립니다. 7일 이후에는 남은 기간에 대해 일할 계산하여 환불해드립니다."
            />
          </div>
        </div>
      </div>

      {/* 결제 모달 */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan === 'premier' ? (
            billingCycle === 'yearly' ? 'premier_yearly' : 'premier'
          ) : selectedPlan}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}
```

---

## 4. 요금제 카드 컴포넌트 (`frontend/components/subscription/PricingCard.tsx`)

```tsx
import type { PlanInfo, SubscriptionPlan } from '@/types/subscription';

interface PricingCardProps {
  plan: PlanInfo;
  billingCycle: 'monthly' | 'yearly';
  currentPlan?: SubscriptionPlan;
  onSelect: () => void;
}

export function PricingCard({
  plan,
  billingCycle,
  currentPlan,
  onSelect,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isPremier = plan.id !== 'free';

  const displayPrice = isPremier && billingCycle === 'yearly'
    ? Math.floor((plan.yearlyPrice || 0) / 12)
    : plan.price;

  const totalPrice = isPremier && billingCycle === 'yearly'
    ? plan.yearlyPrice
    : plan.price;

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
        plan.recommended
          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
          : 'border-gray-200'
      }`}
    >
      {/* 추천 배지 */}
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            추천
          </span>
        </div>
      )}

      {/* 플랜 이름 */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>

      {/* 가격 */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            {displayPrice.toLocaleString()}
          </span>
          <span className="text-gray-600 ml-1">원</span>
          {isPremier && (
            <span className="text-gray-500 ml-1">/월</span>
          )}
        </div>
        {isPremier && billingCycle === 'yearly' && (
          <p className="text-sm text-gray-500 mt-1">
            연 {totalPrice?.toLocaleString()}원 (25% 할인)
          </p>
        )}
      </div>

      {/* 기능 목록 */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA 버튼 */}
      <button
        onClick={onSelect}
        disabled={isCurrentPlan}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : plan.recommended
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {isCurrentPlan ? '현재 플랜' : isPremier ? '시작하기' : '무료로 시작'}
      </button>
    </div>
  );
}
```

---

## 5. 결제 모달 (`frontend/components/subscription/PaymentModal.tsx`)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { subscriptionApi } from '@/lib/api/subscription';
import type { SubscriptionPlan } from '@/types/subscription';

interface PaymentModalProps {
  plan: SubscriptionPlan;
  onSuccess: () => void;
  onClose: () => void;
}

declare global {
  interface Window {
    TossPayments: any;
  }
}

export function PaymentModal({ plan, onSuccess, onClose }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tossPaymentsRef = useRef<any>(null);

  const planNames: Record<SubscriptionPlan, string> = {
    free: 'Free',
    premier: 'Premier 월간',
    premier_yearly: 'Premier 연간',
  };

  const planPrices: Record<SubscriptionPlan, number> = {
    free: 0,
    premier: 19900,
    premier_yearly: 179000,
  };

  useEffect(() => {
    // 토스페이먼츠 SDK 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    script.onload = () => {
      tossPaymentsRef.current = new window.TossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      );
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!tossPaymentsRef.current) {
      setError('결제 시스템을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 카드 등록 (빌링키 발급용)
      const result = await tossPaymentsRef.current.requestBillingAuth('카드', {
        customerKey: `customer_${Date.now()}`, // 실제로는 유저 ID 사용
        successUrl: `${window.location.origin}/api/payment/success?plan=${plan}`,
        failUrl: `${window.location.origin}/api/payment/fail`,
      });

      // successUrl로 리다이렉트됨
      // 성공 페이지에서 authKey를 받아 구독 생성 API 호출

    } catch (err: any) {
      if (err.code === 'USER_CANCEL') {
        onClose();
      } else {
        setError(err.message || '결제 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">구독 결제</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6">
          {/* 플랜 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">플랜</span>
              <span className="font-medium text-gray-900">{planNames[plan]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">결제 금액</span>
              <span className="text-xl font-bold text-gray-900">
                {planPrices[plan].toLocaleString()}원
              </span>
            </div>
            {plan === 'premier_yearly' && (
              <p className="text-sm text-green-600 mt-2">
                월 14,917원 (25% 할인 적용)
              </p>
            )}
          </div>

          {/* 안내 문구 */}
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>결제 후 즉시 Premier 기능을 사용할 수 있습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                {plan === 'premier_yearly' ? '1년' : '매월'} 자동 갱신되며,
                언제든 취소할 수 있습니다.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>결제 후 7일 이내 전액 환불 가능합니다.</span>
            </li>
          </ul>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : `${planPrices[plan].toLocaleString()}원 결제하기`}
          </button>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            결제 진행 시 <a href="/terms" className="text-blue-500 hover:underline">이용약관</a> 및{' '}
            <a href="/privacy" className="text-blue-500 hover:underline">개인정보처리방침</a>에
            동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. 크레딧 잔량 표시 (`frontend/components/subscription/CreditIndicator.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { subscriptionApi } from '@/lib/api/subscription';
import type { CreditInfo } from '@/types/subscription';

interface CreditIndicatorProps {
  variant?: 'header' | 'sidebar' | 'full';
}

export function CreditIndicator({ variant = 'header' }: CreditIndicatorProps) {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const data = await subscriptionApi.getCredits();
        setCredits(data);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, []);

  if (isLoading || !credits) {
    return <CreditSkeleton variant={variant} />;
  }

  const { remainingCredits, totalCredits, usagePercentage, plan } = credits;
  const isLow = usagePercentage >= 80;
  const isExhausted = remainingCredits <= 0;

  // 헤더용 간단한 표시
  if (variant === 'header') {
    return (
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isExhausted
              ? 'bg-red-500'
              : isLow
                ? 'bg-yellow-500'
                : 'bg-green-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {remainingCredits}/{totalCredits}
        </span>
      </div>
    );
  }

  // 사이드바용
  if (variant === 'sidebar') {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">AI 코칭 크레딧</span>
          <span className="text-sm font-medium text-gray-900">
            {remainingCredits} 남음
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isExhausted
                ? 'bg-red-500'
                : isLow
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${100 - usagePercentage}%` }}
          />
        </div>
        {plan === 'free' && remainingCredits <= 3 && (
          <a
            href="/pricing"
            className="block mt-2 text-xs text-blue-500 hover:underline"
          >
            Premier로 업그레이드 →
          </a>
        )}
      </div>
    );
  }

  // 전체 표시 (설정 페이지용)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        AI 코칭 크레딧
      </h3>

      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-4xl font-bold text-gray-900">
            {remainingCredits}
          </span>
          <span className="text-gray-500 ml-1">/ {totalCredits}</span>
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${
            isExhausted
              ? 'bg-red-100 text-red-700'
              : isLow
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
          }`}
        >
          {isExhausted
            ? '소진됨'
            : isLow
              ? '거의 소진'
              : '사용 가능'}
        </span>
      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all ${
            isExhausted
              ? 'bg-red-500'
              : isLow
                ? 'bg-yellow-500'
                : 'bg-green-500'
          }`}
          style={{ width: `${100 - usagePercentage}%` }}
        />
      </div>

      <p className="text-sm text-gray-500">
        {new Date(credits.periodEnd).toLocaleDateString('ko-KR')}에 리셋됩니다
      </p>

      {isLow && !isExhausted && plan !== 'free' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            크레딧이 얼마 남지 않았습니다. 추가 크레딧 팩을 구매하거나
            다음 달까지 기다려주세요.
          </p>
        </div>
      )}

      {isExhausted && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800 mb-2">
            이번 달 크레딧을 모두 사용했습니다.
          </p>
          <div className="flex space-x-2">
            {plan === 'free' ? (
              <a
                href="/pricing"
                className="text-sm text-blue-500 hover:underline"
              >
                Premier 구독하기 →
              </a>
            ) : (
              <button className="text-sm text-blue-500 hover:underline">
                크레딧 팩 구매하기 →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreditSkeleton({ variant }: { variant: string }) {
  if (variant === 'header') {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-12 h-4 bg-gray-300 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2" />
      <div className="h-2 bg-gray-300 rounded w-full" />
    </div>
  );
}
```

---

## 7. 크레딧 소진 모달 (`frontend/components/subscription/CreditExhaustedModal.tsx`)

```tsx
'use client';

import { useRouter } from 'next/navigation';

interface CreditExhaustedModalProps {
  plan: 'free' | 'premier' | 'premier_yearly';
  periodEnd: string;
  onClose: () => void;
}

export function CreditExhaustedModal({
  plan,
  periodEnd,
  onClose,
}: CreditExhaustedModalProps) {
  const router = useRouter();
  const isFree = plan === 'free';

  const options = [
    {
      id: 'wait',
      title: '다음 달까지 기다리기',
      description: `${new Date(periodEnd).toLocaleDateString('ko-KR')}에 크레딧이 리셋됩니다.`,
      action: onClose,
      primary: false,
    },
    ...(isFree
      ? [
          {
            id: 'upgrade',
            title: 'Premier 구독하기',
            description: '월 19,900원으로 매달 300 크레딧 제공',
            action: () => router.push('/pricing'),
            primary: true,
          },
        ]
      : [
          {
            id: 'pack',
            title: '크레딧 팩 구매하기',
            description: '5,000원에 200 크레딧 추가',
            action: () => {/* TODO: 크레딧 팩 구매 */},
            primary: true,
          },
          {
            id: 'byo',
            title: '내 API 키 연결하기',
            description: '직접 OpenAI API 키를 연결해서 무제한 사용',
            action: () => router.push('/settings/api-key'),
            primary: false,
          },
        ]),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            이번 달 크레딧을 모두 사용했어요
          </h2>
          <p className="text-gray-600">
            아래 옵션 중 하나를 선택해주세요
          </p>
        </div>

        {/* 옵션들 */}
        <div className="px-6 pb-6 space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                option.primary
                  ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{option.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 8. 구독 관리 페이지 (`frontend/app/settings/subscription/page.tsx`)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { subscriptionApi } from '@/lib/api/subscription';
import { CreditIndicator } from '@/components/subscription/CreditIndicator';
import type { Subscription } from '@/types/subscription';

export default function SubscriptionSettingsPage() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionApi.getMySubscription();
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleCancel = async () => {
    if (!subscription) return;

    try {
      await subscriptionApi.cancelSubscription(subscription.id);
      setSubscription({
        ...subscription,
        cancelAtPeriodEnd: true,
      });
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  if (isLoading) {
    return <div className="p-6">로딩 중...</div>;
  }

  const isPremier = subscription?.plan !== 'free';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">구독 관리</h1>

      {/* 성공 메시지 */}
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          구독이 완료되었습니다! 이제 Premier 기능을 사용하실 수 있습니다.
        </div>
      )}

      {/* 현재 플랜 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {subscription?.plan === 'premier_yearly'
                ? 'Premier 연간'
                : subscription?.plan === 'premier'
                  ? 'Premier'
                  : 'Free'}
            </h2>
            {subscription?.cancelAtPeriodEnd && (
              <span className="inline-block mt-1 text-sm text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                취소 예정
              </span>
            )}
          </div>
          {isPremier && (
            <span className="text-2xl font-bold text-gray-900">
              {subscription?.plan === 'premier_yearly'
                ? '179,000원/년'
                : '19,900원/월'}
            </span>
          )}
        </div>

        {isPremier && subscription?.currentPeriodEnd && (
          <p className="text-sm text-gray-600">
            {subscription.cancelAtPeriodEnd
              ? `${new Date(subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}에 구독이 종료됩니다.`
              : `다음 결제일: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('ko-KR')}`}
          </p>
        )}

        {/* 액션 버튼 */}
        <div className="mt-4 flex space-x-3">
          {isPremier ? (
            subscription?.cancelAtPeriodEnd ? (
              <button
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                onClick={() => {/* TODO: 취소 철회 */}}
              >
                취소 철회하기
              </button>
            ) : (
              <button
                className="text-red-500 hover:text-red-600 text-sm font-medium"
                onClick={() => setShowCancelConfirm(true)}
              >
                구독 취소
              </button>
            )
          ) : (
            <a
              href="/pricing"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
            >
              Premier 구독하기
            </a>
          )}
        </div>
      </div>

      {/* 크레딧 정보 */}
      <CreditIndicator variant="full" />

      {/* 결제 내역 */}
      {isPremier && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 내역</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">날짜</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">내용</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* TODO: 실제 결제 내역 표시 */}
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">2024.01.15</td>
                  <td className="px-4 py-3 text-sm text-gray-900">Premier 월간 구독</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">19,900원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              구독을 취소하시겠습니까?
            </h3>
            <p className="text-gray-600 mb-4">
              현재 결제 기간({new Date(subscription!.currentPeriodEnd!).toLocaleDateString('ko-KR')})까지는
              계속 사용하실 수 있습니다.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600"
              >
                구독 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 구현 태스크 체크리스트

### 타입 및 API
- [ ] `types/subscription.ts` 생성
- [ ] `lib/api/subscription.ts` 생성
- [ ] 환경 변수 설정 (`NEXT_PUBLIC_TOSS_CLIENT_KEY`)

### 요금제 페이지
- [ ] `app/pricing/page.tsx` 구현
- [ ] `PricingCard.tsx` 컴포넌트 구현
- [ ] FAQ 섹션 구현
- [ ] 반응형 디자인 적용

### 결제 플로우
- [ ] `PaymentModal.tsx` 구현
- [ ] 토스페이먼츠 SDK 연동
- [ ] 결제 성공/실패 페이지 구현
- [ ] 에러 핸들링

### 크레딧 표시
- [ ] `CreditIndicator.tsx` 구현 (header, sidebar, full 변형)
- [ ] 헤더에 크레딧 표시 추가
- [ ] 실시간 크레딧 갱신 훅

### 크레딧 소진 처리
- [ ] `CreditExhaustedModal.tsx` 구현
- [ ] API 402 응답 처리 훅
- [ ] 옵션별 액션 구현

### 구독 관리
- [ ] `settings/subscription/page.tsx` 구현
- [ ] 구독 취소 플로우
- [ ] 결제 내역 표시
- [ ] 취소 철회 기능

---

## 의존성

### 패키지
```json
{
  "dependencies": {
    "@tosspayments/payment-sdk": "^1.0.0"
  }
}
```

### 환경 변수
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
```

---

## 완료 기준

1. 요금제 페이지에서 플랜 비교 및 선택 가능
2. 토스페이먼츠 결제창 정상 표시
3. 결제 성공 후 구독 상태 업데이트
4. 크레딧 잔량이 헤더/사이드바에 표시
5. 크레딧 소진 시 안내 모달 표시
6. 구독 취소 플로우 정상 동작
