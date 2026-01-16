# M6-4: 주말 랭킹 챌린지 배너

> **우선순위**: P2 (금요일 배포)
> **목표 지표**: 주말 트래픽 -70% 급감 완화

---

## 배경

주말 트래픽이 평일 대비 70% 급감. 학습 동기 부재가 주요 원인. 게이미피케이션 요소(랭킹 챌린지)로 주말 접속 유도.

## 구현 범위

### 1. 주말 판별 유틸리티

```typescript
// frontend/lib/dateUtils.ts 또는 컴포넌트 내부

/**
 * 주말 챌린지 기간 여부 확인
 * 금요일 15:00 ~ 일요일 23:59 (KST)
 */
export function isWeekendChallengePeriod(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0: 일, 5: 금, 6: 토
  const hour = now.getHours();

  // 금요일 15시 이후
  if (day === 5 && hour >= 15) return true;
  // 토요일 전체
  if (day === 6) return true;
  // 일요일 전체
  if (day === 0) return true;

  return false;
}
```

### 2. 배너 컴포넌트 (신규)

**파일**: `frontend/components/WeekendChallengeBanner.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { Trophy, X, TrendingUp } from "lucide-react";

interface WeekendChallengeBannerProps {
  className?: string;
}

export function WeekendChallengeBanner({ className }: WeekendChallengeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // SSR 방어 + 주말 체크
    if (typeof window === "undefined") return;

    const dismissed = sessionStorage.getItem("qa_weekend_banner_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    setIsVisible(isWeekendChallengePeriod());
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("qa_weekend_banner_dismissed", "true");
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 border-amber-300/50
                     dark:border-amber-700/50 bg-gradient-to-r from-amber-50 via-orange-50
                     to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30
                     dark:to-yellow-950/30 p-5 ${className}`}>
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30
                      dark:bg-amber-800/20 rounded-full blur-2xl
                      -translate-y-1/2 translate-x-1/2" />

      {/* 닫기 버튼 */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-amber-600/50
                   hover:text-amber-600 dark:text-amber-400/50
                   dark:hover:text-amber-400 transition-colors"
        aria-label="배너 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100
                        dark:bg-amber-900/50 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-neutral-900
                         dark:text-neutral-100 mb-1 flex items-center gap-2">
            주말 랭킹 챌린지
            <span className="px-2 py-0.5 text-xs bg-amber-200 dark:bg-amber-800
                           text-amber-800 dark:text-amber-200 rounded-full">
              진행중
            </span>
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            이번 주말 최고 점수에 도전하세요!
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Hard 문제
            </span>로 실력을 증명해보세요.
          </p>
        </div>

        <a
          href="/problems?difficulty=hard"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5
                     bg-amber-600 dark:bg-amber-500 text-white rounded-lg
                     hover:bg-amber-700 dark:hover:bg-amber-600
                     transition-colors font-medium text-sm shadow-sm"
        >
          <TrendingUp className="w-4 h-4" />
          도전하기
        </a>
      </div>

      {/* 미니 랭킹 (선택적) */}
      <div className="relative mt-4 pt-4 border-t border-amber-200/50
                      dark:border-amber-800/50">
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2 font-medium">
          이번 주말 Top 3
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-amber-500">🥇</span> user1*** (950점)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-neutral-400">🥈</span> dev2*** (920점)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-amber-700">🥉</span> test*** (890점)
          </span>
        </div>
      </div>
    </div>
  );
}

function isWeekendChallengePeriod(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return (day === 5 && hour >= 15) || day === 6 || day === 0;
}
```

### 3. 문제 목록 페이지 통합

**파일**: `frontend/app/problems/page.tsx`

```tsx
import { WeekendChallengeBanner } from "@/components/WeekendChallengeBanner";

// 기존 ComingSoonBanner 위에 배치
<WeekendChallengeBanner className="mb-4" />
<ComingSoonBanner nextProblem={nextProblem} />
```

---

## UI 디자인

```
┌─────────────────────────────────────────────────────────────┐
│ 🏆 주말 랭킹 챌린지                              [진행중]  ✕ │
│                                                             │
│ 이번 주말 최고 점수에 도전하세요!                            │
│ Hard 문제로 실력을 증명해보세요.              [ 도전하기 → ] │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ 이번 주말 Top 3                                             │
│ 🥇 user1*** (950점)  🥈 dev2*** (920점)  🥉 test*** (890점) │
└─────────────────────────────────────────────────────────────┘
```

---

## 검증 방법

1. 브라우저 시간을 금요일 15시 이후로 조작
2. `/problems` 페이지 접속 → 배너 표시 확인
3. X 버튼 클릭 → 배너 숨김 + sessionStorage 확인
4. 페이지 새로고침 → 배너 미표시 확인 (세션 동안 유지)
5. 평일(월~금 14시)에는 배너 미표시 확인

## 향후 개선 (Optional)

1. **실시간 랭킹 API 연동**
   - `GET /api/v1/leaderboard/weekend` 엔드포인트 추가
   - 실제 주말 Top 3 데이터 표시

2. **GA4 이벤트 추가**
   ```typescript
   trackWeekendBannerImpression()
   trackWeekendBannerClick()
   ```

3. **토큰 보상 시스템** (백엔드 작업 필요)
   - 주말 Hard 문제 풀이 시 토큰 2배 지급

## 참고 파일

- `frontend/components/ComingSoonBanner.tsx` - 배너 스타일 패턴
- `frontend/components/conversion/GuestConversionBanner.tsx` - dismiss 로직 패턴
