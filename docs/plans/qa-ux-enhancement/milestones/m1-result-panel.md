# M1: 결과 패널 개선

> **프로젝트**: QA Arena UX 대폭 개선
> **크기**: 중
> **상태**: 대기

---

## 목표

채점 결과에서 **Kill Ratio(버그 탐지율)**를 핵심 지표로 시각화하고, pytest의 "Failed"를 **"Mutant Killed"** 긍정 피드백으로 치환하여 QA 엔지니어의 성취감을 극대화합니다.

---

## 범위

### 포함
- Kill Ratio 현황판 (Mutation Scoreboard) 컴포넌트
- 로컬 테스트 vs 채점하기 결과 이원화 UI
- pytest Failed → Mutant Killed 피드백 변환
- 색상 코딩 개선 (실패=초록, 성공=빨강 역전)

### 제외
- 기존 ScoreDisplay 완전 교체 (점진적 개선)
- 서버 채점 로직 변경

---

## 태스크 목록

| # | 태스크 | 파일 | 상태 |
|---|-------|------|------|
| 1 | MutationScoreboard 컴포넌트 생성 | `components/MutationScoreboard.tsx` | [x] |
| 2 | LocalTestResultPanel에 Golden Code 통과 표시 | `components/LocalTestResultPanel.tsx` | [x] |
| 3 | BottomTabs에 MutationScoreboard 통합 | `components/layout/BottomTabs.tsx` | [x] |
| 4 | pytest 결과 파싱에 mutation 정보 추가 | `lib/pytestParser.ts` | [ ] |
| 5 | 문제 페이지에 결과 이원화 UI 통합 | `app/problems/[id]/page.tsx` | [ ] |

---

## 관련 파일

### 수정 대상
- `frontend/components/LocalTestResultPanel.tsx` - 로컬 테스트 결과 표시
- `frontend/components/SubmissionResultPanel.tsx` - 채점 결과 표시
- `frontend/components/ScoreDisplay.tsx` - 점수 표시 (참조)
- `frontend/app/problems/[id]/page.tsx` - 레이아웃 통합

### 참조 파일
- `frontend/lib/pytestParser.ts` - pytest 출력 파싱
- `frontend/types/submission.ts` - 제출 결과 타입

---

## 기술 노트

### MutationScoreboard 컴포넌트 구조

```tsx
interface MutationScoreboardProps {
  goldenCodePassed: boolean;      // Golden Code 통과 여부
  killedMutants: number;          // 잡은 버그 수
  totalMutants: number;           // 전체 버그 수
  mutantDetails?: MutantResult[]; // 개별 뮤턴트 결과
}

// UI 구조
// ┌─────────────────────────────────────────┐
// │ ✅ Golden Code: Passed                   │
// │ 🐞 Bugs Caught: 3 / 5 (60%)             │
// │ ████████░░░░░░░░░░░░ 60%                │
// └─────────────────────────────────────────┘
```

### Mutant Killed 피드백 변환

```tsx
// 기존: pytest FAILED → 빨간색 에러
// 변경: pytest FAILED on buggy_impl → 초록색 "Mutant Killed!" 뱃지

// 조건: Golden Code가 PASSED이고, Buggy Impl이 FAILED인 경우
if (isGoldenCode && status === 'PASSED') {
  return <Badge color="blue">✅ Golden Passed</Badge>;
} else if (isBuggyImpl && status === 'FAILED') {
  return <Badge color="green">🎯 Mutant Killed!</Badge>;
} else if (isBuggyImpl && status === 'PASSED') {
  return <Badge color="red">🐛 Mutant Escaped</Badge>;
}
```

### 로컬 테스트 vs 채점 결과 이원화

| 영역 | 로컬 테스트 | 채점하기 |
|------|------------|---------|
| 대상 | Golden Code만 | Golden + Buggy 전체 |
| 목적 | 구문 검증 | 버그 탐지력 평가 |
| 표시 | "테스트 통과/실패" | "Kill Ratio + Scoreboard" |

---

## 의존성

### 선행 마일스톤
- 없음 (첫 번째 마일스톤)

### 후속 마일스톤
- M2: 에디터 UX 개선

---

## 완료 조건

- [ ] MutationScoreboard 컴포넌트 구현 및 렌더링
- [ ] 로컬 테스트 결과에 "Golden Code Passed" 표시
- [ ] 채점 결과에 Kill Ratio 현황판 표시
- [ ] Mutant Killed 긍정 피드백 (초록색 뱃지)
- [ ] Mutant Escaped 부정 피드백 (빨간색 뱃지)
- [ ] 기존 테스트 회귀 없음

---

## 테스트 체크리스트

### 단위 테스트
- [ ] Kill Ratio 계산 정확성 (0%, 50%, 100%)
- [ ] 색상 코딩 threshold (80%, 50%, 50% 미만)
- [ ] 뱃지 렌더링 조건

### 수동 검증
- [ ] Very Easy 문제로 전체 플로우 테스트
- [ ] 모든 뮤턴트 잡은 경우 (100%)
- [ ] 일부만 잡은 경우 (60%)
- [ ] 전혀 못 잡은 경우 (0%)

---

## 진행 기록

| 시간 | 작업 | 결과 |
|------|------|------|
| - | 마일스톤 시작 | - |

---

## 노트

- 기존 ScoreDisplay.tsx에 이미 Kill Ratio 계산 로직 있음 (재활용)
- 색상 팔레트: GitHub Dark 스타일 유지 (초록 #3fb950, 빨강 #f85149, 노랑 #d29922)
- 애니메이션: 점수 카운트업 효과 고려
