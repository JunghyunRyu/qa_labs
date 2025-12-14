# QA-Arena 채점 결과 UI/UX 개선 기획서 (Submission Result UX Spec)

## 목표
채점 결과 화면이 “읽는 화면”에서 “다음 제출을 바로 개선하는 화면”으로 작동하도록 UI/UX를 재구성한다.

핵심 성과 지표(예시):
- 평균 재제출률 증가
- 제출 후 다음 액션(추천 테스트 복사/삽입, 결함 상세 열람) 클릭률 증가
- 점수/등급에 대한 사용자 납득도(이탈률 감소)

---

## 현재 화면에서 부실한 지점
### 1) 점수의 의미가 불명확
- “30/100”은 보이지만 **왜 30점인지(기본점수 기준)**, **결함 검출 점수가 어떻게 계산되는지(공식/가중치)**가 직관적이지 않음.
- “미흡” 등급은 강하지만 **다음 목표(어디를 개선하면 점수/등급이 오르는지)**가 없음.

### 2) 결함 검출률이 행동으로 이어지지 않음
- “0/16(0.0%)”은 결과 요약일 뿐
  - 살아남은 결함(뮤턴트)의 리스트/원인/추천 테스트로 연결되지 않음.
- 사용자는 “엣지 케이스 고려” 문구를 읽어도 **구체적으로 무엇을 추가할지** 막막함.

### 3) AI 피드백이 실행 가능한 도구가 아님
- 텍스트 품질은 좋으나
  - 우선순위(Top3)
  - 원클릭 복사/에디터 삽입
  - “이 테스트가 잡는 결함” 매핑
  이 없어 “읽고 끝”이 되기 쉬움.

### 4) 제출 상태/메타데이터 노출이 얇음
- “완료”만으로는 디버깅/신뢰에 부족:
  - SUCCESS/FAILURE/ERROR/RUNNING 구분
  - runtime, environment, submission_id(복사)
  등이 얇게라도 노출되어야 운영/CS 대응이 쉬움.

### 5) 실행 로그 접근성이 낮음
- 실제로 막히는 지점은 로그/실패 요약인데, 현재는 하단에 약하게 위치.
- “요약 + 드릴다운” 구조가 필요.

---

## 개선 설계(정보 구조, IA)
### 레이아웃
- **좌측(메인)**: 요약 → 결함(뮤턴트) → AI 피드백 → 로그
- **우측(Sticky 패널)**: 문제 메타 + “현재 제출 요약” + 빠른 액션

### 탭 구조(메인 상단)
- `개요(Overview)` / `결함 분석(Mutants)` / `AI 피드백` / `로그(Logs)`
- 기본 진입: Overview
- 결함 검출이 낮으면 Mutants 탭에 배지/강조 제공

---

## 컴포넌트 트리(React + Tailwind 기준)
### Page
- `SubmissionResultPage(problemId, submissionId)`

### ResultHeader (P0, 최우선)
- `SubmissionStatusPill(status)` — RUNNING/SUCCESS/FAILURE/ERROR
- `ScoreCard(totalScore, grade)`
- `BreakdownChips()`
  - Golden: pass/fail
  - Mutation: killed/total, ratio
  - Runtime, SubmittedAt
- `PrimaryActions()`
  - “추천 테스트 Top3 적용하기”
  - “살아남은 결함 보기”
  - “로그 요약 보기”
- `MetaRow()`
  - submission_id 복사 버튼
  - env 배지(파이썬/pytest/judge 이미지 등)

### Tabs
- `ResultTabs()`
  - `OverviewTab`
    - `ScoreBreakdownPanel` (점수 산정 근거: 접기/툴팁)
    - `ProgressNextGoals` (다음 목표: Kill ratio 0% → 30% 등)
  - `MutantsTab`
    - `MutantSummaryBar` (0/16, 카테고리 분포)
    - `MutantTable`
      - Row 클릭 → `MutantDetailDrawer`
        - 결함 의미(한 줄)
        - 왜 놓쳤는지(한 줄)
        - 추천 테스트 1개(코드 블록) + 복사/삽입
        - 관련 로그 스니펫(옵션)
  - `AIFeedbackTab`
    - `FeedbackPriorityChecklist` (Top3~Top5)
    - `SuggestedTestsList`
      - `TestSuggestionCard` (복사/삽입 + catches_mutants 태그)
    - `FeedbackDetailsAccordion` (잘한 점/개선점/추가 제안 접기)
  - `LogsTab`
    - `LogSummary` (Golden/Mutants/System 탭)
    - `FullLogViewer` (전체 로그, 복사/다운로드)

### Right Sticky Panel (P1)
- `StickySidePanel`
  - `ProblemMetaCard(difficulty, tags)`
  - `SubmissionMiniSummary(score, grade, killRatio, goldenPass)`
  - `QuickLinks` (Mutants/Logs로 이동, 채점 방식 보기, 재제출 CTA)

---

## 상태별 UX 설계(필수)
### RUNNING
- 진행 단계 표시(예: `Golden 실행 중 → Mutants 3/16 실행 중`)
- 탭은 부분 활성(로그는 가능하면 스트리밍)
- PrimaryActions 비활성 + 툴팁(완료 후 활성)

### FAILURE (Golden 실패)
- 최상단에 강한 경고 블록:
  - “정답(레퍼런스) 기준을 통과하지 못했습니다”
  - 실패 테스트 1~3개 즉시 노출
- Mutants/AI 피드백은 “Golden 통과 후 제공” 안내(혼란 방지)

### ERROR
- 사용자 에러(런타임/타임아웃/메모리) vs 시스템 에러 구분
- 재시도 버튼 + 에러 ID(지원용) 제공
- 시스템 로그는 요약 우선(필요시 상세 펼치기)

### SUCCESS
- 전체 기능 노출(Overview/Mutants/AI/Logs)

---

## 데이터 모델(프론트 친화 형태)
### SubmissionSummary
- `submission_id: str`
- `problem_id: int`
- `status: RUNNING|SUCCESS|FAILURE|ERROR`
- `submitted_at: ISOString`
- `runtime_ms: int`
- `env: { python: str, pytest: str, judge_image: str }`

### Scoring
- `total_score: int`
- `grade: str`
- `breakdown: { base: int, mutation: int, golden?: int }`
- `rules: { base_rule: str, mutation_rule: str }` (UI: “자세히 보기”)

### MutationResult
- `total_mutants: int`
- `killed: int`
- `ratio: float`
- `mutants: Array<{
    id: str,
    category: boundary|format|exception|time|...,
    weight: float,
    status: KILLED|SURVIVED,
    hint: str,
    recommendation?: { title: str, test_code: str, catches: str[] }
  }>`

### AIFeedback
- `summary: str`
- `strengths: str[]`
- `improvements: str[]` (우선순위 포함 가능)
- `suggested_tests: Array<{ title: str, code: str, catches_mutants?: str[] }>`

### Logs
- `golden_log: str`
- `mutation_log: str`
- `system_log: str`
- (옵션) `log_snippets_by_mutant: Record<mutantId, str[]>`

---

## API 엔드포인트(최소 세트)
- `GET /api/submissions/{id}/summary`
- `GET /api/submissions/{id}/scoring`
- `GET /api/submissions/{id}/mutations`
- `GET /api/submissions/{id}/ai-feedback`
- `GET /api/submissions/{id}/logs?type=golden|mutations|system`

옵션(UX 극대화):
- “에디터에 삽입”은 프론트 기능만으로도 가능(추천 테스트 코드 블록을 클립보드/에디터로 주입)
- 서버 저장이 필요하면:
  - `POST /api/submissions/{id}/suggestions/apply` (선택)

---

## 점수/규칙 노출 방식(신뢰 강화)
- 점수 breakdown 항목마다 **툴팁/접기** 제공
  - 기본점수: 어떤 조건(예: Golden 통과)에서 부여되는지
  - 결함점수: Kill ratio → 점수 변환 공식, 가중치 합 여부
- “채점 방식 보기”는 별도 모달/페이지로 유지하되, 결과 화면에서 **핵심만 요약** 노출

---

## 우선순위 구현 티켓(권장)
### P0 (즉시 체감)
1. **ResultHeader(요약 + 액션 + submission_id 복사 + 상태)**
2. **MutantsTab: Survived 리스트 + Drawer + 추천 테스트(1개)**
3. **LogsTab: Golden/Mutants/System 요약 탭 + 전체 보기**

### P1 (완성도)
4. **AI 피드백: 우선순위 Top3 체크리스트 + 복사/삽입 + catches_mutants 매핑**
5. **우측 Sticky 패널에 제출 요약/바로가기 추가**

### P2 (운영/신뢰)
6. **FAILURE/ERROR/RUNNING 상태별 UX 정교화**
7. **점수 산정 “자세히 보기” 문구/툴팁 정리**
8. (옵션) 로그 스니펫을 뮤턴트 상세에 매핑해 디버깅 효율 향상

---

## 체크리스트(릴리즈 기준)
- [ ] submission_id 복사 가능
- [ ] status별(성공/실패/에러/진행중) 상단 메시지 일관성
- [ ] Mutants 탭에서 Survived 항목을 “행동(추천 테스트)”으로 연결
- [ ] AI 추천 테스트는 “복사/삽입” 버튼 포함
- [ ] 로그는 “요약 → 전체”로 자연스럽게 드릴다운 가능
- [ ] 모바일/태블릿에서도 Sticky/Drawer가 사용 가능한 인터랙션 제공

---

## 문구 가이드(간단)
- “미흡” 같은 등급은 유지하되, 반드시 **다음 목표 문구**를 동반
  - 예: “다음 제출 목표: 결함 5개 이상 검출(Kill ratio 30% 달성)”
- “엣지 케이스 더 고려” → 반드시 **구체 테스트 1~3개**로 즉시 연결
- 오류 메시지는 “무엇이 문제인지 + 다음 행동(재시도/문의/가이드)” 3요소로 구성
