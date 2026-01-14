# W03 구현 계획 인덱스

> **기간**: 2026-01-13 (월) ~ 2026-01-17 (금)
> **기반 문서**: `2026-01-12-report.md`

---

## Milestone 목록

| ID | 제목 | 우선순위 | 배포일 | 문서 |
|----|------|---------|--------|------|
| M6-1 | 회원 전환 모달 트리거 강화 | P0 | 월요일 | [M6-1-guest-conversion-trigger.md](./M6-1-guest-conversion-trigger.md) |
| M6-2 | Error Sanitizer (에러 힌트) | P0 | 월요일 | [M6-2-error-sanitizer.md](./M6-2-error-sanitizer.md) |
| M6-3 | AI 질문하기 버튼 강조 | P1 | 화요일 | [M6-3-ai-ask-button.md](./M6-3-ai-ask-button.md) |
| M6-4 | 주말 랭킹 챌린지 배너 | P2 | 금요일 | [M6-4-weekend-challenge-banner.md](./M6-4-weekend-challenge-banner.md) |

---

## 목표 지표

| 지표 | 현재 | 목표 | 관련 Milestone |
|------|------|------|----------------|
| 비회원 제출 비율 | 52.3% | 40% 이하 | M6-1 |
| Very Easy 실패율 | 12-16% | 5% 미만 | M6-2 |
| 주간 토큰 사용량 | 16회 | 100회+ | M6-3 |
| 주말 트래픽 | -70% | 완화 | M6-4 |

---

## 파일 변경 요약

### 신규 파일 (3개)

| 파일 | Milestone | 설명 |
|------|-----------|------|
| `frontend/lib/errorSanitizer.ts` | M6-2 | 에러 파싱 유틸리티 |
| `frontend/components/SyntaxHintCard.tsx` | M6-2 | 에러 힌트 카드 UI |
| `frontend/components/WeekendChallengeBanner.tsx` | M6-4 | 주말 배너 컴포넌트 |

### 수정 파일 (4개)

| 파일 | Milestone | 변경 내용 |
|------|-----------|----------|
| `frontend/components/conversion/useGuestConversion.ts` | M6-1 | 제출 횟수 트래킹 함수 추가 |
| `frontend/app/problems/[id]/page.tsx` | M6-1 | 모달 트리거 로직 |
| `frontend/components/SubmissionResult.tsx` | M6-2, M6-3 | 힌트 카드 + AI 버튼 |
| `frontend/lib/analytics.ts` | M6-1, M6-3 | GA4 이벤트 추가 |

---

## 배포 일정

```
월요일 (1/13) - P0 배포
├── M6-1: useGuestConversion.ts + page.tsx
├── M6-2: errorSanitizer.ts + SyntaxHintCard.tsx + SubmissionResult.tsx
└── 검증: /submission-test --full

화요일 (1/14) - P1 배포
├── M6-3: SubmissionResult.tsx AI 버튼 + analytics.ts
└── 검증: FAILURE 케이스 테스트

금요일 (1/17) - P2 배포
├── M6-4: WeekendChallengeBanner.tsx + problems/page.tsx
└── 검증: 시간 조작 테스트
```

---

## 의존성 그래프

```
M6-1 (회원 전환)     M6-2 (Error Sanitizer)
      │                     │
      └──────┬──────────────┘
             │
             ▼
    SubmissionResult.tsx 수정
             │
             ▼
      M6-3 (AI 버튼)

M6-4 (주말 배너) ← 독립적
```

---

## 롤백 기준

| Milestone | 조건 | 액션 |
|-----------|------|------|
| M6-1 | 이탈률 +20% | threshold 3회로 조정 |
| M6-2 | 파싱 실패 10%+ | 힌트 카드 조건부 숨김 |
| M6-3 | 토큰 부족 불만 | 버튼 문구 조정 |
| M6-4 | 효과 없음 | 다음 주 전략 변경 |

---

## 참고

- **콘텐츠 QA (Mutant 강화)**: 코드 변경 없음, 별도 콘텐츠 작업으로 진행
- **Very Easy 지문 재검증**: 별도 콘텐츠 리뷰로 진행
