# M6-1: 회원 전환 모달 트리거 강화

> **우선순위**: P0 (월요일 배포)
> **목표 지표**: 비회원 제출 비율 52.3% → 40% 이하

---

## 배경

현재 비회원 제출 비율이 52.3%로 높음. 회원 전환 모달(`ConversionModal`)은 이미 구현되어 있으나, 적극적인 트리거 로직이 없어 전환율이 낮음.

## 구현 범위

### 1. 제출 횟수 트래킹

**파일**: `frontend/components/conversion/useGuestConversion.ts`

```typescript
// STORAGE_KEYS 추가
SUBMISSION_COUNT: "qa_guest_submission_count"

// 새 함수
incrementSubmissionCount(): number  // 제출 시 호출, 현재 횟수 반환
shouldShowConversionModal(): boolean  // 2회 이상이면 true
resetSubmissionCount(): void  // 로그인 후 리셋
```

### 2. 모달 트리거 로직

**파일**: `frontend/app/problems/[id]/page.tsx`

```typescript
// doSubmit 함수 내 비회원 로직
if (!isAuthenticated) {
  const count = incrementSubmissionCount();
  if (count >= 2) {
    setShowConversionModal(true);
  }
}
```

### 3. GA4 이벤트 추가

**파일**: `frontend/lib/analytics.ts`

```typescript
export const trackConversionModalTrigger = (params: {
  trigger: "submission_count" | "deep_feedback";
  problemId: string;
  submissionCount: number;
}) => {
  sendGAEvent("conversion_modal_trigger", {
    trigger: params.trigger,
    problem_id: params.problemId,
    submission_count: params.submissionCount,
  });
};
```

---

## 검증 방법

1. 비회원으로 문제 페이지 접속
2. 1회 제출 → 모달 미표시 확인
3. 2회 제출 → 모달 표시 확인
4. localStorage에 `qa_guest_submission_count` 값 확인
5. GA4 DebugView에서 `conversion_modal_trigger` 이벤트 확인

## 롤백 기준

- 이탈률 20% 이상 증가 시 threshold를 3회로 조정
- `shouldShowConversionModal()` 함수 조건 수정으로 즉시 롤백 가능

## 참고 파일

- `frontend/components/conversion/ConversionModal.tsx` - 기존 모달 컴포넌트
- `frontend/lib/analytics.ts` - GA4 이벤트 패턴 참고
