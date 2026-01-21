# M2: 문제 목록 필터 바 개선

> **상태**: ✅ 완료
> **예상 크기**: 중 (~200줄)
> **실제 크기**: 약 350줄

---

## 목표

모바일에서 필터 UI를 간소화하고, 터치 영역을 확대하여 사용성 개선

---

## 태스크

### 2.1 모바일 필터 UI 설계
- [x] 필터 버튼 1개로 통합 (Bottom Sheet)
- [x] 검색창은 상단 유지
- [x] 정렬 드롭다운은 컴팩트 표시

### 2.2 Bottom Sheet 필터 구현
- [x] `MobileFilterSheet.tsx` 컴포넌트 생성
- [x] 도메인 필터 (칩 형태)
- [x] 난이도 필터 (칩 형태 + 색상 도트)
- [x] 기타 필터 (NEW, 북마크, 안 푼 문제)
- [x] "적용하기" / "초기화" 버튼

### 2.3 조건부 렌더링
- [x] desktop: 기존 인라인 필터 (2줄 레이아웃)
- [x] mobile: 필터 버튼 + Bottom Sheet

### 2.4 터치 영역 확대 (모바일)
- [x] 필터 칩: `px-4 py-3 min-h-[44px]`
- [x] 버튼: `min-h-[44px]` ~ `min-h-[48px]`

---

## 완료 조건

- [x] 390px 뷰포트에서 가로 스크롤 없음
- [x] 필터 선택/해제 정상 동작
- [x] 터치 영역 44px 이상
- [x] 적용된 필터 개수 배지 표시

---

## 구현 내용

### 변경 파일

1. **신규 파일**: `frontend/components/problems/MobileFilterSheet.tsx` (283줄)
   - Bottom Sheet UI (framer-motion 애니메이션)
   - 도메인/난이도/기타 필터 섹션
   - Body 스크롤 방지
   - 핸들 바 + 헤더 + 콘텐츠 + 하단 버튼 구조

2. **수정 파일**: `frontend/app/problems/page.tsx` (~70줄 추가)
   - `useMediaQuery` import
   - `MobileFilterSheet` import
   - `showMobileFilterSheet` 상태 추가
   - `activeFilterCount` 계산 로직 추가
   - Control Bar를 모바일/데스크톱 분기 렌더링

### 주요 기능

- **모바일 레이아웃**: 검색창 + 필터 버튼 + 정렬 드롭다운 (한 줄)
- **Bottom Sheet**: 스프링 애니메이션 (damping 30, stiffness 300)
- **필터 배지**: 적용된 필터 개수 표시 (indigo-600 배경)
- **오버레이**: 60% 검정 + backdrop-blur-sm
