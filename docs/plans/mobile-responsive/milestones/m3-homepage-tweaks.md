# M3: 홈페이지 미세 조정

> **상태**: ✅ 완료
> **예상 크기**: 소 (~50줄)
> **실제 크기**: 약 30줄

---

## 목표

홈페이지 Hero 섹션 및 CTA 버튼의 모바일 가독성/사용성 개선

---

## 태스크

### 3.1 Hero 섹션 텍스트 조정
- [x] 제목 폰트 크기: `text-5xl lg:text-7xl` → `text-3xl sm:text-5xl lg:text-7xl`
- [x] 부제목 폰트 크기: `text-lg lg:text-xl` → `text-base sm:text-lg lg:text-xl`
- [x] 줄바꿈 처리 (`break-keep` 유지)

### 3.2 CTA 버튼 터치 영역
- [x] 버튼 높이: 최소 48px 확보 (`min-h-[48px]`)
- [x] 버튼 간격: 모바일에서 `gap-3`

### 3.3 Proof Points 카드
- [x] 모바일: 1열 배치 (`grid-cols-1 md:grid-cols-3` 이미 적용됨)
- [x] 카드 패딩 유지 (`p-8`)

### 3.4 How It Works 섹션
- [x] 모바일에서 세로 배치 (`grid-cols-1 lg:grid-cols-12` 이미 적용됨)
- [x] 스텝 인디케이터 터치 영역 확대 (`p-2` 패딩 추가)

---

## 완료 조건

- [x] 390px 뷰포트에서 모든 텍스트 가독성 확보
- [x] CTA 버튼 터치 영역 44px 이상
- [x] 가로 스크롤 없음

---

## 구현 내용

### 변경 파일

1. **`frontend/app/page.tsx`** (Hero 섹션)
   - 제목: `text-3xl sm:text-5xl lg:text-7xl`
   - 부제목: `text-base sm:text-lg lg:text-xl`

2. **`frontend/components/landing/HeroCTA.tsx`** (CTA 버튼)
   - 버튼: `px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px]`
   - 폰트: `text-base sm:text-lg`

3. **`frontend/components/how-it-works/HowItWorksSection.tsx`** (스텝 인디케이터)
   - 버튼에 `p-2 -m-1` 패딩 추가로 터치 영역 확대

### 기존 모바일 대응 (수정 불필요)

- Proof Points: `grid-cols-1 md:grid-cols-3`
- How It Works: `grid-cols-1 lg:grid-cols-12`
- Target Audience: `grid-cols-1 md:grid-cols-3`
