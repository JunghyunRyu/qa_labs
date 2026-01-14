# M6-3: AI 질문하기 버튼 강조

> **우선순위**: P1 (화요일 배포)
> **목표 지표**: 주간 토큰 사용량 16회 → 100회+

---

## 배경

현재 주간 토큰 사용량이 16회로 매우 낮음. 원인 분석: 사용자가 "언제 AI를 써야 할지 모름". 실패 시점에 맥락적 넛지(Contextual Nudge) 제공으로 AI 기능 활성화.

## 구현 범위

### 1. AI 질문 버튼 추가

**파일**: `frontend/components/SubmissionResult.tsx`

Line 175 (수정 가이드 섹션) 이후, FAILURE/ERROR 상태에서 표시:

```tsx
{/* AI 질문하기 버튼 */}
{(submission.status === "FAILURE" || submission.status === "ERROR") && (
  <button
    onClick={() => handleAskAI()}
    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600
               text-white rounded-lg font-medium
               animate-pulse hover:animate-none hover:from-purple-700 hover:to-blue-700
               transition-all duration-200 shadow-lg shadow-purple-500/25"
  >
    <div className="flex items-center justify-center gap-2">
      <Sparkles className="w-5 h-5" />
      <span>이 에러의 원인을 AI에게 물어보세요</span>
      <span className="text-purple-200 text-sm">(1토큰)</span>
    </div>
  </button>
)}
```

### 2. AI 패널 연동

```tsx
const handleAskAI = () => {
  // GA4 이벤트
  trackAIAskFromError({
    problemId: problemId || "",
    errorType: failureInfo?.stderr?.match(/(\w+Error)/)?.[1] || "unknown",
    submissionStatus: submission.status
  });

  // AI 패널 열기 + 컨텍스트 프리필
  const context = `테스트 실행 결과:\n${failureInfo?.stderr || submission.execution_log?.error_message || "에러 발생"}`;

  // layoutStore 또는 props를 통해 AI 패널 제어
  setAIChatPrefillMessage(context);
  setShowAIPanel(true);
};
```

### 3. GA4 이벤트 추가

**파일**: `frontend/lib/analytics.ts`

```typescript
/**
 * 에러 화면에서 AI 질문 버튼 클릭 이벤트
 */
export const trackAIAskFromError = (params: {
  problemId: string;
  errorType: string;
  submissionStatus: "FAILURE" | "ERROR";
}) => {
  sendGAEvent("ai_ask_from_error", {
    problem_id: params.problemId,
    error_type: params.errorType,
    submission_status: params.submissionStatus,
  });
};
```

---

## UI 디자인

```
┌─────────────────────────────────────────────────┐
│ ⚠️ 테스트 실패 상세                               │
│                                                  │
│ 테스트 실행에 실패했습니다                          │
│ 작성하신 테스트가 정답 코드를 통과시키지 못했습니다.    │
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 💡 어떻게 수정할까요?                          ││
│ │ • 테스트가 정상 동작하는 코드를 통과해야 합니다    ││
│ │ • assert 문의 기대값이 올바른지 확인하세요        ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │  ✨ 이 에러의 원인을 AI에게 물어보세요 (1토큰)   ││
│ │                              [PULSE 애니메이션] ││
│ └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Pulse 애니메이션 CSS

```css
/* Tailwind 기본 animate-pulse 사용 또는 커스텀 */
@keyframes gentle-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(147, 51, 234, 0);
  }
}

.animate-gentle-pulse {
  animation: gentle-pulse 2s ease-in-out infinite;
}
```

---

## 검증 방법

1. FAILURE 상태 제출 생성
2. Pulse 버튼 애니메이션 확인
3. 버튼 클릭 → AI 패널 열림 확인
4. AI 패널에 에러 컨텍스트 프리필 확인
5. GA4 이벤트 `ai_ask_from_error` 확인

## 예상 효과

- 실패 → AI 질문 전환율: 15% 이상 목표
- 주간 토큰 사용량: 16회 → 100회+

## 참고 파일

- `frontend/components/SubmissionResult.tsx` - 버튼 추가 위치
- `frontend/components/AICoachPanel.tsx` - AI 패널 컴포넌트
- `frontend/stores/layoutStore.ts` - AI 패널 상태 관리
