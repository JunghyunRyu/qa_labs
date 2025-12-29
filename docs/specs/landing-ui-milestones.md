# 랜딩 페이지 UI 개선 - 마일스톤

> **관련 파일**: `frontend/app/page.tsx`
> **최종 업데이트**: 2025-12-29

---

## 문제 진단

### 핵심 문제 3가지

| # | 문제 | 현상 | 영향 |
|---|------|------|------|
| 1 | 섹션 톤 불일치 | 6개 이상의 서로 다른 배경 시스템 혼재 | "이어붙인 느낌", 조잡한 인상 |
| 2 | 정적 설명 반복 | HowItWorks/AI Feedback이 인터랙티브하지 않음 | 설득력 부족 |
| 3 | 시그니처 비주얼 부재 | 차별점을 보여주는 패널 없음 | "그냥 코딩 테스트 사이트" |

### 현재 배경 시스템 (불일치)

| 섹션 | 현재 배경 | 문제점 |
|------|----------|--------|
| Hero | 이미지 + `bg-black/50` 오버레이 + 글래스 | 유일하게 적절함 |
| Proof Points | `bg-slate-50` / `bg-gray-900/50` | 다른 섹션과 톤 불일치 |
| Showcase | 인라인 `style={{ backgroundColor: '#0f172a' }}` | 하드코딩, 다크모드 미대응 |
| Features | `bg-[var(--background)]` | CSS 변수 (적절) |
| Guest Mode | `bg-blue-50` / `bg-blue-900/20` | 돌출된 파란색 |
| Final CTA | `bg-gradient-to-br from-sky-500 to-blue-600` | 강한 그라데이션 |

### "조잡함"의 추가 원인: 리듬 불일치

| 요소 | 현재 상태 | 문제점 |
|------|----------|--------|
| 섹션 패딩 | `py-12`, `py-16`, `py-20` 혼재 | 수직 리듬 불규칙 |
| 컨테이너 폭 | `max-w-4xl`, `max-w-6xl` 혼재 | 콘텐츠 폭 불일치 |
| 헤더 마진 | `mb-4`, `mb-10`, `mb-12` 혼재 | 섹션 내 여백 불규칙 |
| 카드 스타일 | 보더/섀도/라운드가 제각각 | 카드 계층 불명확 |

---

## 진행 상황 요약

| Phase | 상태 | 완료율 |
|-------|------|--------|
| Phase 0: 디자인 토큰 + 리듬 통일 | ✅ 완료 | 4/4 |
| Phase 1: 시그니처 비주얼 (HeroResultPanel) | ✅ 완료 | 5/5 |
| Phase 1.5: HowItWorks 최소 인터랙션 | ⬜ 대기 | 0/4 |
| Phase 2: HowItWorks 정교화 | ⬜ 대기 | 0/4 |

---

## 확정된 결정 사항

### 결정 1: HeroResultPanel 배치 위치
> **선택: A) Hero 섹션 내부 (첫 화면)**

- "차별화 시각화"는 스크롤 내려서 보는 순간 효용이 크게 떨어짐
- 구현 레이아웃:
  - **데스크톱**: Hero 2컬럼 (좌: 카피/CTA, 우: ResultPanel)
  - **모바일**: CTA 아래에 ResultPanel → Featured Problem 카드

### 결정 2: AI Feedback Sample 섹션
> **선택: A) HeroResultPanel에 통합 후 제거**

- 랜딩에서 "HowItWorks"와 "AI 피드백"이 분리되면 "설명 페이지" 인상이 강해짐
- 통합 방식:
  - ResultPanel의 3번째 카드("AI 요약")를 기존 샘플 내용으로 구성
  - 별도 섹션 제거 (또는 스크린샷 수준 카드 1장만 유지)

### 결정 3: HowItWorks 동작 방식
> **선택: B) 수동 클릭만 (자동재생 제거)**

- 자동재생은 "산만함/부하/모션 피로" 리스크가 큼
- 대신: 기본 활성 Step을 **04(탐지율)** 또는 **05(피드백)**로 설정하여 첫 인상 강화
- 자동재생이 필요하면 Phase 2에서 "1회만 천천히 진행 후 멈춤" 형태로 제한적 도입

---

## Phase 0: 디자인 토큰 + 서페이스/리듬 통일 (PR 1)

> **목적**: "이어붙인 느낌" 완전 제거
> **범위**: 배경 + 카드 계층 + 수직 리듬 + Showcase 인라인 style 제거
> **산출물**: CSS 변수 정의, 통일된 랜딩 페이지

### 체크리스트

- [x] **P0-1**: CSS 변수 정의 (3단 서페이스 계층) ✅
  ```css
  :root {
    --surface: #f8fafc;              /* slate-50: 섹션 바닥 */
    --surface-elevated: #ffffff;     /* white: 일반 카드 */
    --surface-float: #ffffff;        /* white: 강조 카드 (shadow 추가) */
    --border-subtle: #e2e8f0;        /* slate-200: 카드 보더 */
  }
  .dark {
    --surface: #0f172a;              /* slate-900 */
    --surface-elevated: #1e293b;     /* slate-800 */
    --surface-float: #1e293b;
    --border-subtle: #334155;        /* slate-700 */
  }
  ```
  - 파일: `frontend/app/globals.css`

- [x] **P0-2**: 카드 베이스 클래스 정의 ✅
  ```css
  .card-base {
    border-radius: 1rem;
    border: 1px solid var(--border-subtle);
    background-color: var(--surface-elevated);
    padding: 1.5rem;
    transition: all 0.2s ease;
  }
  .card-float {
    /* card-base + shadow-lg */
  }
  .card-dark {
    /* Showcase용 다크 카드 */
  }
  ```
  - 파일: `frontend/app/globals.css`

- [x] **P0-3**: 섹션 리듬 규칙 통일 ✅
  - [x] 섹션 패딩: `.section-base` (py-16 sm:py-20)
  - [x] 컨테이너 폭: `.section-container` (max-w-6xl mx-auto px-4 sm:px-6)
  - [x] 섹션 헤더 마진: `.section-header` (mb-12)
  - [x] 섹션 타이틀/서브타이틀: `.section-title`, `.section-subtitle`

- [x] **P0-4**: 섹션별 배경 + 카드 수정 ✅
  | 섹션 | 배경 수정 | 카드 수정 |
  |------|----------|----------|
  | Proof Points | `bg-[var(--surface)]` ✅ | `.card-base` 적용 ✅ |
  | Showcase | 인라인 style 제거 → `bg-slate-900 dark:bg-slate-950` ✅ | `.card-dark` 적용 ✅ |
  | Features | 유지 (`bg-[var(--background)]`) ✅ | `.card-base` 적용 ✅ |
  | Guest Mode | `bg-[var(--surface)]` (파란색 제거) ✅ | - |
  | Audience | 유지 ✅ | `.card-base` 적용 ✅ |
  | HowItWorks | `section-base bg-[var(--surface)]` ✅ | - |

  - 파일: `frontend/app/page.tsx`, `frontend/components/how-it-works/HowItWorksSection.tsx`

### 완료 기준
- [x] 페이지 스크롤 시 "이어붙인 느낌" 해소 ✅
- [x] 다크모드 전환 시 모든 섹션이 자연스럽게 변경됨 ✅
- [x] 카드 스타일이 시각적으로 통일됨 ✅
- [x] 수직 리듬이 일정함 (섹션 간격, 헤더 간격) ✅
- [x] Showcase 섹션에 인라인 style 없음 ✅

---

## Phase 1: 시그니처 비주얼 패널 (PR 2)

> **선행 조건**: Phase 0 완료
> **목적**: Hero 첫 화면에 "탐지율 + 품질 + AI 요약" 노출
> **핵심**: 이 패널이 곧 "QA-Arena의 제품 정의(시그니처)"

### HeroResultPanel 콘텐츠 스펙

```
┌─────────────────────────────────────────────────────────────┐
│                    HeroResultPanel                          │
├───────────────┬───────────────┬─────────────────────────────┤
│  버그 탐지율   │  테스트 품질   │       AI 요약              │
│   (킬 비율)   │    등급       │                            │
├───────────────┼───────────────┼─────────────────────────────┤
│  Killed 3/4   │     B+        │  "음수/빈 리스트 누락       │
│     75%       │               │   → 우선순위 1"            │
│  ◉ 게이지     │  ┌─────────┐  │                            │
│               │  │경계값    │  │  추가 필요:                │
│               │  │예외처리  │  │  • 빈 리스트 테스트        │
│               │  │다중케이스│  │  • 음수 값 테스트          │
│               │  └─────────┘  │                            │
└───────────────┴───────────────┴─────────────────────────────┘
│            "실제 채점 결과 예시입니다"                       │
└─────────────────────────────────────────────────────────────┘
```

**각 카드 상세:**

| 카드 | 표시 항목 | 차별화 포인트 |
|------|----------|--------------|
| 버그 탐지율 | `Killed 3/4` + `75%` (숫자/비율 동시) | Mutation Testing 고유 개념 |
| 테스트 품질 | `B+` 등급 + 칩 3개 (경계값/예외처리/다중케이스) | 품질 분석 시스템 |
| AI 요약 | 1-2줄 요약 + 우선순위 제안 | AI 피드백 차별점 |

### 체크리스트

- [x] **P1-1**: Hero 섹션 레이아웃 변경 ✅
  - [x] 데스크톱: 2컬럼 (좌: 카피/CTA, 우: ResultPanel)
  - [x] 모바일: 1컬럼 (카피 → CTA → ResultPanel → Featured Problem)
  - [x] 기존 Featured Problem 카드 위치 조정
  - 파일: `frontend/app/page.tsx`

- [x] **P1-2**: HeroResultPanel 컴포넌트 구현 ✅
  - [x] 탐지율 카드: 원형 게이지 + "Killed 3/4" + "75%"
  - [x] 품질 등급 카드: 등급 뱃지 + 커버리지 칩 3개
  - [x] AI 요약 카드: 1-2줄 요약 + 개선 제안
  - [x] "실제 채점 결과 예시입니다" 라벨
  - 파일: `frontend/components/hero/HeroResultPanel.tsx` (신규)

- [x] **P1-3**: 반응형 스타일링 ✅
  - [x] 데스크톱: 가로 3칸 그리드
  - [x] 태블릿: 가로 3칸 또는 1+2 레이아웃
  - [x] 모바일: 세로 스택

- [x] **P1-4**: AI Feedback Sample 섹션 제거 ✅
  - [x] 기존 섹션 삭제
  - [x] Header 네비게이션에서 "AI 피드백" 링크 제거
  - 파일: `frontend/app/page.tsx`, `frontend/components/Header.tsx`

- [x] **P1-5**: 다크모드 대응 ✅
  - [x] 게이지 색상 다크모드 변형 (Hero는 이미 다크 배경)
  - [x] 카드 배경/보더 다크모드 변형

### 완료 기준
- [x] Hero 첫 화면에서 "탐지율 + 품질 + AI 요약" 3가지가 즉시 보임 ✅
- [x] 스크롤 없이 제품 차별점 인지 가능 ✅
- [x] AI Feedback Sample 섹션 제거로 랜딩 길이 단축 ✅
- [x] 모바일에서도 자연스러운 레이아웃 ✅

---

## Phase 1.5: HowItWorks 최소 인터랙션 (PR 3-1)

> **선행 조건**: Phase 1 완료
> **목적**: "클릭 → 프리뷰 변경" 최소 인터랙션 구현
> **핵심**: 자동재생 없음, 프리뷰 1패널, 리스크 최소화

### 변경 방향

**현재:**
```
┌──────────────────────────────────────┐
│  StepCard 목록  │  MutationDiagram   │
│  (하이라이트만) │  (자동재생)        │
└──────────────────────────────────────┘
```

**변경 후:**
```
┌──────────────────────────────────────┐
│  StepCard 목록  │  PreviewPanel      │
│  (클릭 가능)    │  (클릭 시 변경)    │
│                 │  기본: Step 04     │
└──────────────────────────────────────┘
```

### 체크리스트

- [ ] **P1.5-1**: StepCard 클릭 기능 추가
  - [ ] onClick 핸들러 추가
  - [ ] 활성 상태 스타일 강화 (보더/배경 변경)
  - [ ] 커서 포인터 추가
  - 파일: `frontend/components/how-it-works/StepCard.tsx`

- [ ] **P1.5-2**: 기본 활성 Step 변경
  - [ ] 기본값: Step 04 (탐지율) 또는 Step 05 (피드백)
  - [ ] 첫 인상에서 "결과"가 보이도록
  - 파일: `frontend/components/how-it-works/HowItWorksSection.tsx`

- [ ] **P1.5-3**: MutationDiagram → PreviewPanel 교체
  - [ ] 자동재생 로직 제거
  - [ ] 클릭 시 해당 Step 프리뷰 렌더링
  - [ ] 단계별 프리뷰: 간단한 설명 + 아이콘/일러스트 (정교화는 P2)
  - 파일: `frontend/components/how-it-works/HowItWorksSection.tsx`

- [ ] **P1.5-4**: 전환 애니메이션 (간단)
  - [ ] fade-in 또는 slide 전환
  - [ ] framer-motion 활용 (기존 의존성)

### 완료 기준
- [ ] StepCard 클릭 시 오른쪽 프리뷰가 해당 단계로 변경됨
- [ ] 자동재생 없음 (사용자 제어)
- [ ] 기본 활성 Step이 04 또는 05로 설정됨
- [ ] 모바일에서도 탭/터치로 동작

---

## Phase 2: HowItWorks 정교화 (PR 3-2)

> **선행 조건**: Phase 1.5 완료
> **목적**: 프리뷰 콘텐츠 정교화, 선택적 자동재생
> **리스크**: 높음 (범위 확장 주의)

### 체크리스트

- [ ] **P2-1**: 단계별 프리뷰 컴포넌트 정교화
  - [ ] Step 1 (Write Tests): 코드 에디터 스냅샷
  - [ ] Step 2 (Validate): "정상 코드 통과" 비주얼
  - [ ] Step 3 (Mutants): 뮤턴트 생성 일러스트
  - [ ] Step 4 (Detection): 탐지 결과 표 (탐지됨/미탐지)
  - [ ] Step 5 (Score): HeroResultPanel 축약 버전
  - 디렉토리: `frontend/components/how-it-works/previews/`

- [ ] **P2-2**: 프리뷰-품질 칩 연동
  - [ ] QualityChips와 PreviewPanel 연동
  - [ ] Step 선택 시 관련 칩 하이라이트

- [ ] **P2-3**: 선택적 자동재생 (옵션)
  - [ ] "1회만 천천히 진행 후 멈춤" 형태
  - [ ] 사용자가 클릭하면 자동재생 중단
  - [ ] 접근성: prefers-reduced-motion 존중

- [ ] **P2-4**: 애니메이션 정교화
  - [ ] 단계 간 전환 애니메이션 개선
  - [ ] 프리뷰 내부 마이크로 인터랙션

### 완료 기준
- [ ] 각 단계 프리뷰가 제품 경험을 명확히 전달함
- [ ] 자동재생 시 모션 피로 없음 (1회 제한)
- [ ] 전체적으로 "설득력 있는" 데모 경험

---

## 보강된 로드맵

```
PR 1 (P0)          PR 2 (P1)           PR 3-1 (P1.5)       PR 3-2 (P2)
┌──────────────┐   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 배경/서페이스│   │ HeroResult   │    │ HowItWorks   │    │ HowItWorks   │
│ 카드/리듬    │──▶│ Panel        │───▶│ 최소 인터랙션│───▶│ 정교화       │
│ 통일         │   │ (첫 화면)    │    │ (클릭만)     │    │ (애니메이션) │
└──────────────┘   └──────────────┘    └──────────────┘    └──────────────┘
     3-4h              4-5h                3-4h                5-6h

     ↓                  ↓                   ↓                   ↓
"이어붙인 느낌"    "차별화 시각화"     "체험형 데모"      "설득력 강화"
   완전 해소         첫 화면 노출         리스크 최소          점진적 확장
```

### PR별 리스크 분석

| PR | 범위 | 리스크 | 롤백 가능성 |
|----|------|--------|------------|
| PR 1 | CSS + 클래스 변경 | **낮음** | 쉬움 |
| PR 2 | 신규 컴포넌트 + 레이아웃 변경 | **중간** | 중간 |
| PR 3-1 | 기존 컴포넌트 수정 (제한적) | **낮음** | 쉬움 |
| PR 3-2 | 다수 신규 컴포넌트 | **높음** | 어려움 |

---

## 우선순위 매트릭스 (보강)

| Phase | 영향도 | 난이도 | 예상 시간 | 우선순위 | 비고 |
|-------|--------|--------|----------|----------|------|
| 0 (PR 1) | 높음 (첫인상) | 낮음 | 3-4h | **P0** | 즉시 개선 체감 |
| 1 (PR 2) | 높음 (차별화) | 중간 | 4-5h | **P1** | 전환율 직접 기여 |
| 1.5 (PR 3-1) | 높음 (설득력) | 낮음 | 3-4h | **P1.5** | 리스크 분산 |
| 2 (PR 3-2) | 중간 (정교화) | 높음 | 5-6h | **P2** | 점진적 확장 |

**핵심 변경:**
- "인터랙티브 데모"를 P1.5/P2로 분리하여 리스크 분산
- P1.5는 "최소 인터랙션"으로 빠르게 체험 효과 확보
- P2는 정교화 단계로, 필요시 스킵 가능

---

## 작업 로그

> 세션별 진행 상황 기록

### 2025-12-29 (세션 1)
- [x] 문제 진단 완료
  - 섹션 톤 불일치 확인 (6개 이상 배경 시스템)
  - 리듬 불일치 추가 확인 (패딩/마진/컨테이너 폭)
  - HowItWorks 인터랙티브 부재 확인
  - 시그니처 비주얼 부재 확인
- [x] 결정 사항 확정
  - HeroResultPanel: Hero 섹션 내부 (A)
  - AI Feedback Sample: 통합 후 제거 (A)
  - HowItWorks: 수동 클릭만 (B)
- [x] 마일스톤 문서 작성 및 보강
  - Phase 0-2 체크리스트 정의
  - P1.5 추가 (리스크 분산)
  - HeroResultPanel 콘텐츠 스펙 구체화
- [x] **Phase 0 (PR1) 완료** ✅
  - CSS 변수 정의 (3단 서페이스 계층)
  - 카드 클래스 정의 (.card-base, .card-float, .card-dark)
  - 섹션 리듬 규칙 통일 (.section-base, .section-container, .section-header 등)
  - 섹션별 배경 + 카드 수정 완료
  - 개발 서버 테스트 통과 (라이트/다크모드)
  - 빌드 테스트 통과

### 2025-12-29 (세션 2)
- [x] **Phase 1 (PR2) 완료** ✅
  - HeroResultPanel 컴포넌트 구현 (`frontend/components/hero/HeroResultPanel.tsx`)
    - 탐지율 카드 (원형 게이지 + Killed 3/4 + 75%)
    - 품질 등급 카드 (B+ 뱃지 + 칩 3개)
    - AI 요약 카드 (요약 + 개선 제안)
  - Hero 섹션 2컬럼 레이아웃 적용
    - 데스크톱: 좌(카피/CTA) + 우(ResultPanel)
    - 모바일: 세로 스택
  - AI Feedback Sample 섹션 제거
  - Header 네비게이션 "AI 피드백" 링크 제거
  - 반응형 테스트 통과 (데스크톱/모바일)
  - 다크모드 테스트 통과

---

## 참고

### 세션 재개 시 확인 사항
1. 이 파일의 체크리스트 상태 확인
2. 현재 Phase의 미완료 항목 파악
3. PR 단위로 커밋/머지 상태 확인

### 관련 파일
```
frontend/
├── app/
│   ├── page.tsx                    # 메인 랜딩 페이지
│   └── globals.css                 # 글로벌 스타일 (P0에서 수정)
├── components/
│   ├── hero/
│   │   └── HeroResultPanel.tsx     # 시그니처 비주얼 패널 (P1에서 생성)
│   ├── how-it-works/
│   │   ├── HowItWorksSection.tsx   # How It Works 섹션
│   │   ├── StepCard.tsx            # 단계 카드 (P1.5에서 수정)
│   │   ├── MutationDiagram.tsx     # 현재 다이어그램 (P1.5에서 교체)
│   │   └── previews/               # (P2에서 생성)
│   └── test-quality/
│       └── QualityGauge.tsx        # (재사용 가능)
```

### 관련 명령어
```bash
# 개발 서버 실행
cd frontend && npm run dev

# 타입 체크
cd frontend && npx tsc --noEmit

# 빌드 테스트
cd frontend && npm run build

# Lighthouse 성능 체크 (선택)
npx lighthouse http://localhost:3000 --view
```

### 디자인 토큰 참조 (P0 완료 후)
```css
/* 서페이스 계층 */
--surface            /* 섹션 바닥 (slate-50 / slate-900) */
--surface-elevated   /* 일반 카드 (white / slate-800) */
--surface-float      /* 강조 카드 (white+shadow / slate-800+shadow) */

/* 섹션 리듬 */
py-16 sm:py-20       /* 섹션 상하 패딩 */
max-w-6xl mx-auto    /* 컨테이너 폭 */
px-4 sm:px-6         /* 컨테이너 좌우 패딩 */
mb-12                /* 섹션 헤더 하단 마진 */

/* 카드 클래스 */
.card-base           /* 기본 카드 */
.card-float          /* 강조 카드 (shadow 추가) */
```
