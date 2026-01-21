# M1: 온보딩 모달 컴포넌트

> **상태**: ✅ 완료
> **예상 크기**: 소 (~80줄)
> **실제 크기**: 136줄

---

## 목표

로그인 직후 표시되는 온보딩 안내 모달 생성

---

## 태스크

### 1.1 OnboardingModal 컴포넌트 생성
- [x] `frontend/components/OnboardingModal.tsx` 생성
- [x] 신규 사용자용 메시지 ("첫 번째 미션!")
- [x] 기존 사용자용 메시지 ("다시 오셨네요!")
- [x] "시작하기" 버튼 (모달 닫기)
- [x] "나중에 할게요" 링크 (/problems로 이동)

### 1.2 스타일링
- [x] 다크 테마 (slate-900 배경)
- [x] 애니메이션 (framer-motion fade-in + scale)
- [x] 모바일 반응형 (max-w-md + mx-4)

---

## 완료 조건

- [x] 모달이 올바르게 렌더링됨
- [x] onboarding 타입에 따라 메시지 변경
- [x] 버튼 클릭 시 모달 닫힘
- [x] ESC 키로 닫기 지원
- [x] Body 스크롤 방지

---

## 구현 내용

**파일**: `frontend/components/OnboardingModal.tsx`

**주요 기능**:
- 타입별 메시지 분기 (`new` / `returning`)
- framer-motion AnimatePresence 애니메이션
- 터치 영역 52px 확보 (min-h-[52px])
