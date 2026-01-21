# M3: 문제 페이지 통합

> **상태**: ✅ 완료
> **예상 크기**: 소 (~20줄)
> **실제 크기**: ~35줄 추가

---

## 목표

문제 상세 페이지에서 온보딩 쿼리 파라미터 감지 및 모달 표시

---

## 태스크

### 3.1 쿼리 파라미터 처리
- [x] `useSearchParams`로 `onboarding` 파라미터 읽기
- [x] `onboarding=new` 또는 `onboarding=returning` 감지

### 3.2 모달 표시
- [x] `OnboardingModal` import
- [x] 조건부 렌더링
- [x] 모달 닫힌 후 URL에서 쿼리 파라미터 제거

---

## 파일 변경

- `frontend/app/problems/[id]/page.tsx`

---

## 완료 조건

- [x] `?onboarding=new`일 때 모달 표시
- [x] `?onboarding=returning`일 때 모달 표시
- [x] 모달 닫힌 후 정상 문제 풀이 가능
- [x] URL 정리 (history.replaceState)

---

## 구현 내용

**Import 추가**:
```typescript
import OnboardingModal from "@/components/OnboardingModal";
```

**상태 추가**:
```typescript
const onboardingType = searchParams.get("onboarding") as "new" | "returning" | null;
const [showOnboardingModal, setShowOnboardingModal] = useState(false);
```

**Effect 추가**:
```typescript
useEffect(() => {
  if (problem && onboardingType) {
    setTimeout(() => setShowOnboardingModal(true), 500);
  }
}, [problem, onboardingType]);
```

**핸들러 추가**:
```typescript
const handleCloseOnboarding = useCallback(() => {
  setShowOnboardingModal(false);
  const url = new URL(window.location.href);
  url.searchParams.delete("onboarding");
  window.history.replaceState({}, "", url.toString());
}, []);
```

**렌더링** (Desktop & Mobile 모두):
```tsx
{onboardingType && (
  <OnboardingModal
    isOpen={showOnboardingModal}
    onClose={handleCloseOnboarding}
    type={onboardingType}
    problemTitle={problem.title}
  />
)}
```
