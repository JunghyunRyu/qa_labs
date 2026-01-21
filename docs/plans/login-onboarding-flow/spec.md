# 로그인 직후 경로 최적화 (Onboarding Flow)

> **프로젝트**: login-onboarding-flow
> **생성일**: 2026-01-21
> **완료일**: 2026-01-21
> **상태**: ✅ 완료
> **우선순위**: P2

---

## 1. 개요

### 배경
- `/auth/callback` 조회수 31회로 높음 - 로그인 후 경로가 중요
- 현재: 기존 사용자는 `/`로, 신규 사용자는 `/problems?welcome=true`로 이동
- 문제: 텅 빈 대시보드나 문제 목록으로 던져지면 이탈 가능성 높음

### 목표
**'강제적 첫 경험(Forced First Experience)'** 설계:
1. 로그인 직후 추천 문제(VE03 양수 판별)로 즉시 리다이렉트
2. 온보딩 모달로 "일단 이것부터 풀어보세요" 안내
3. Daily Bounty 연계로 오늘의 목표 즉시 제시

### 범위

| 대상 | 변경 내용 |
|------|----------|
| 신규 가입자 | 약관 동의 → VE03 문제 페이지 + 온보딩 모달 |
| 기존 사용자 (첫 로그인 후) | VE03 문제 페이지 + Daily Bounty 안내 |
| 재방문 사용자 | 기존 동작 유지 (저장된 redirect 또는 /) |

---

## 2. 현황 분석

### 현재 로그인 흐름 (`app/auth/callback/page.tsx`)

```
OAuth 콜백 → refreshAuth()
    ├─ 신규 사용자 (is_new=true) → 약관 모달 → /problems?welcome=true
    └─ 기존 사용자 → sessionStorage.auth_redirect || "/"
```

### 기존 구현물

| 컴포넌트 | 위치 | 상태 |
|---------|------|------|
| DailyBountyBanner | `components/DailyBountyBanner.tsx` | 완료 |
| 약관 동의 모달 | `components/TermsModal.tsx` | 완료 |
| 문제 페이지 | `app/problems/[id]/page.tsx` | 완료 |

### 추천 문제

- **VE03**: 양수 판별 함수 테스트
  - 난이도: Very Easy
  - 적당히 도전적 (0 경계값, 음수 처리 등 함정)
  - slug: `problem-ve03`

---

## 3. 기술 명세

### 온보딩 리다이렉트 로직

```typescript
// 신규 사용자
약관 동의 후 → /problems/problem-ve03?onboarding=new

// 기존 사용자 (첫 로그인 세션)
로그인 후 → /problems/problem-ve03?onboarding=returning
           (단, sessionStorage.auth_redirect가 없는 경우만)

// 재방문 사용자
로그인 후 → sessionStorage.auth_redirect || "/"
```

### 온보딩 모달 표시 조건

| 파라미터 | 표시 내용 |
|---------|----------|
| `?onboarding=new` | "첫 번째 미션! 30초 만에 버그를 잡아보세요" |
| `?onboarding=returning` | "다시 오셨네요! 오늘의 미션부터 시작해볼까요?" |

### 온보딩 모달 UI

```
┌─────────────────────────────────────┐
│  🎯 첫 번째 미션                      │
│                                     │
│  "양수 판별 함수 테스트"              │
│                                     │
│  30초 만에 첫 버그를 잡아보세요.      │
│  간단한 함수지만 숨겨진 함정이 있어요! │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    🚀 시작하기                 │  │
│  └───────────────────────────────┘  │
│                                     │
│  나중에 할게요                       │
└─────────────────────────────────────┘
```

---

## 4. 마일스톤

| # | 마일스톤 | 예상 크기 | 주요 작업 |
|---|----------|----------|----------|
| M1 | 온보딩 모달 컴포넌트 | 소 (~80줄) | OnboardingModal.tsx 생성 |
| M2 | 리다이렉트 로직 수정 | 소 (~30줄) | callback/page.tsx 수정 |
| M3 | 문제 페이지 통합 | 소 (~20줄) | 쿼리 파라미터 기반 모달 표시 |

---

## 5. 성공 지표

- [x] 신규 가입자가 VE03 문제 페이지로 이동
- [x] 온보딩 모달이 표시됨
- [x] 기존 사용자도 첫 로그인 시 VE03으로 이동 (재방문 제외)

---

## 6. 관련 문서

- `frontend/app/auth/callback/page.tsx` - 로그인 콜백
- `frontend/components/DailyBountyBanner.tsx` - 일일 현상금
- `backend/generated_problems/VE03.json` - 추천 문제
