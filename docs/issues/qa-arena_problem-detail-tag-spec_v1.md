# QA-Arena 문제 상세 페이지 정보 구조/카피/태그 체계 개선 스펙 (v1.0)

본 문서는 현재 QA-Arena 문제 상세 페이지에서 발생하는 **난이도/태그/카피의 일관성 문제**를 해결하고, 사용자가 “이 문제를 통해 무엇을 배우고 무엇을 테스트하는지”를 즉시 이해할 수 있도록 **데이터 모델 + UI 노출 규칙 + 라벨 매핑**을 정의합니다.

---

## 0. 목표

1. **신뢰성 확보**
   - 동일 문제에서 난이도/메타가 위치별로 달라 보이는 현상 제거.
2. **가독성/이해도 향상**
   - 태그를 “의미 있는 그룹(환경/개념/도메인)”으로 보여주기.
3. **CTA/용어 정확화**
   - “코드 작성”이 아닌 “테스트 작성” 중심으로 문구 정리.
4. **확장 가능성**
   - 태그/라벨을 점진적으로 표준화(운영 중 추가/변경 가능).

---

## 1. 현재 이슈 요약 (스크린샷 기준)

### P0 (즉시 수정 필요)
- **난이도 표시 불일치**
  - 상단 배지와 우측 패널의 난이도가 다르게 표시됨.
- **난이도 태그 중복 노출**
  - `easy/medium/hard`가 “난이도 필드” 외에 “태그 칩”으로도 노출되어 혼선을 유발.

### P1 (UX/정보구조 개선)
- 태그가 한 줄에 혼재되어 **무슨 성격의 태그인지 구분 불가**
  - 예: `python`, `pytest`(환경) + `dependency-injection`(개념) + `datetime`(도메인) + `testability`(광범위) 섞임
- CTA가 “코드 작성 시작”으로 되어 있어 **사용자의 행동(테스트 작성)**과 불일치

---

## 2. 데이터 모델 (권장: 2단계 적용)

### 2.1 Phase 1: “프론트에서 분류” (빠른 적용)
- 서버 응답은 기존처럼 `tags: string[]` 유지
- 프론트에서 `TagDefinitionMap`으로 분류/라벨링
- 난이도는 `difficulty` 단일 필드만 사용하여 렌더링 (우측 패널 포함)

> 장점: DB 변경 없이 빠르게 개선 가능  
> 단점: 태그 정의(라벨/카테고리)가 프론트 코드에 존재

### 2.2 Phase 2: “태그 메타를 서버에서 관리” (운영 안정화)
#### (A) TagDefinition 테이블(또는 설정 파일) 추가
- `tag_definitions`
  - `slug` (PK): `dependency-injection`
  - `label_ko`: `의존성 주입`
  - `label_en`: `Dependency Injection` (선택)
  - `category`: `ENV | CONCEPT | DOMAIN | CONTEXT | OTHER`
  - `priority`: number (노출 우선순위)
  - `is_active`: boolean (폐기 태그 숨김 용도)

#### (B) Problem 응답 확장 (하위호환 유지)
- 기존: `tags: string[]`
- 확장: `tag_objects: {slug, label_ko, category, priority}[]` (선택)
- 프론트는 `tag_objects`가 있으면 우선 사용, 없으면 `tags`+로컬 매핑으로 폴백.

---

## 3. 표시 정책 (UX 규칙)

### 3.1 난이도 표시 정책 (단일 소스)
- 난이도는 오직 `problem.difficulty`로만 렌더링
- 어디에도 `easy/medium/hard`를 “태그 칩”으로 노출하지 않음

#### 난이도 한글 라벨
- easy → `쉬움`
- medium → `보통`
- hard → `어려움`

#### 수용 기준(AC)
- 동일 문제에서 상단/우측 패널 난이도 텍스트가 100% 일치해야 함.

---

### 3.2 CTA(버튼) 문구 정책
- Primary CTA: `테스트 작성 시작`
- Secondary CTA: `채점 방식 보기`
- “코드 작성” 표현은 사용하지 않음 (사용자 행동과 불일치)

---

### 3.3 태그 분류(카테고리) 정의
- **ENV (환경/형식)**: 언어/프레임워크/테스트 도구
  - 예: `python`, `pytest`, `unit-test`
- **CONCEPT (테스트 개념/기법)**: 테스트 전략/품질 개념/패턴
  - 예: `dependency-injection`, `deterministic-test`, `flaky-test`, `exception-handling`, `error-propagation`
- **DOMAIN (도메인/데이터 유형)**: 다루는 데이터 구조/영역
  - 예: `dictionary`, `datetime`, `random`, `number`, `string`
- **CONTEXT (실무 맥락/비즈니스)**: 사용 시나리오/업무 맥락
  - 예: `business-logic`
- **OTHER (기타/미분류)**: 상기 분류에 속하지 않거나 운영 중 임시 태그

#### 태그 정리 정책
- `qa`, `testing`처럼 너무 광범위한 태그는 **기본 노출에서 제외**(또는 폐기) 권장
- 중복/모호 태그(예: `testability`)는 CONCEPT로 분류하되, 기본 노출 우선순위를 낮춤

---

### 3.4 태그 노출 규칙 (상단 + 우측 패널)

#### 상단(메인 콘텐츠 영역)
1) **요약 라인(텍스트)**: 사용자가 즉시 이해할 수 있게 “형식/환경”을 문장 형태로 표기
- 예: `환경: Python · Pytest`
- 예: `주제: 비결정성 제어 · 의존성 주입`

2) **태그 칩(Chips)**: 카테고리별로 정렬하여 노출
- 노출 순서: ENV → CONCEPT → DOMAIN → CONTEXT → OTHER
- 각 카테고리 최대 노출 개수: 4개 (기본값)
- 전체 최대 노출 개수: 10개 (기본값)
- 초과분은 `+N` 칩으로 접기 (클릭 시 전체 태그 팝오버/모달)

3) **칩 라벨은 한글 우선**
- 기본: `의존성 주입`
- 보조: 필요 시 툴팁/상세 팝오버에서 영문 병기

#### 우측 패널(Sticky Summary)
- 태그를 “그대로 반복”하지 않음 (중복 제거)
- 우측 패널은 다음만 표시:
  - 난이도
  - 예상 소요 시간(선택)
  - 환경(ENV 요약)
  - 핵심 학습 포인트 2~3줄(선택)
  - CTA(테스트 작성 시작 / 채점 방식 보기)

> 태그 전체는 메인 영역에서만 풍부하게 보여주는 방향 권장.

---

## 4. 라벨 매핑 테이블 (초기 제공안)

> 운영 단계에서는 TagDefinition을 서버에서 관리하는 것이 이상적입니다. Phase 1에서는 프론트 상수로 시작합니다.

### 4.1 ENV (환경/형식)
| slug | label_ko | 비고 |
|---|---|---|
| python | Python | 언어 |
| pytest | Pytest | 프레임워크 |
| unit-test | 단위 테스트 | 형식 |
| integration-test | 통합 테스트 | (추가 가능) |

### 4.2 CONCEPT (테스트 개념/기법)
| slug | label_ko | 비고 |
|---|---|---|
| dependency-injection | 의존성 주입 | 비결정성 제어와 연계 |
| deterministic-test | 결정적 테스트 | non-deterministic 대응 |
| flaky-test | 불안정 테스트(Flaky) | “플래키” 용어 툴팁 제공 권장 |
| exception-handling | 예외 처리 | |
| error-propagation | 오류 전파 | |
| multi-layer-validation | 다층 검증 | |
| boundary-value-analysis | 경계값 분석 | (추가 가능) |
| type-coercion | 타입 변환 | (추가 가능) |
| testability | 테스트 용이성 | 우선순위 낮게 |

### 4.3 DOMAIN (도메인/데이터)
| slug | label_ko | 비고 |
|---|---|---|
| dictionary | 딕셔너리 | |
| dictionary-operations | 딕셔너리 연산 | dictionary와 중복 가능(정리 대상) |
| key-validation | 키 검증 | |
| datetime | 날짜/시간 | |
| random | 랜덤 | |
| number | 숫자 | |
| string | 문자열 | |
| arithmetic-operations | 산술 연산 | `basic-math`와 병합 고려 |
| basic-math | 기본 수학 | 태그 통폐합 권장 |

### 4.4 CONTEXT (실무 맥락)
| slug | label_ko | 비고 |
|---|---|---|
| business-logic | 비즈니스 로직 | |
| validation | 입력 검증 | (추가 가능) |

### 4.5 폐기/미노출 권장
| slug | 처리 | 사유 |
|---|---|---|
| easy / medium / hard | 태그로 노출 금지 | 난이도 필드와 중복 |
| qa | 미노출 또는 폐기 | 정보량 낮음 |
| testing | 미노출 또는 폐기 | 정보량 낮음 |

---

## 5. 프론트엔드 구현 스펙

### 5.1 타입 정의(예시)
```ts
type Difficulty = "easy" | "medium" | "hard";

type TagCategory = "ENV" | "CONCEPT" | "DOMAIN" | "CONTEXT" | "OTHER";

type TagDefinition = {
  slug: string;
  labelKo: string;
  labelEn?: string;
  category: TagCategory;
  priority?: number; // 낮을수록 먼저 노출
  hidden?: boolean;  // qa/testing 같은 태그 숨김
};
```

### 5.2 매핑/분류 함수(예시)
```ts
function toTagViewModel(slugs: string[], defs: Record<string, TagDefinition>) {
  return slugs
    .map((slug) => defs[slug] ?? { slug, labelKo: slug, category: "OTHER" as const })
    .filter((t) => !t.hidden)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}
```

### 5.3 칩 노출 알고리즘(예시 규칙)
1. 카테고리 순서로 그룹핑
2. 그룹별 최대 4개, 전체 최대 10개
3. 초과는 `+N`로 표시 → 클릭 시 전체 리스트

---

## 6. 백엔드/API 구현 스펙

### 6.1 즉시 수정(P0)
- `difficulty`는 단일 값으로 관리하고, 상세 응답에서 항상 동일하게 내려줌
- 우측 패널이 참조하는 값도 동일하게 맞추기 (프론트 버그 가능성이 높음)

### 6.2 (선택) 문제 응답 확장(Phase 2)
- `tag_objects` 제공 시 프론트가 라벨/카테고리를 서버 기반으로 렌더링 가능
- TagDefinition을 운영자가 추가/수정 가능하게 하면 운영 효율 상승

---

## 7. 카피(문구) 최종안

### 7.1 상세 페이지 버튼
- Primary: `테스트 작성 시작`
- Secondary: `채점 방식 보기`

### 7.2 (있다면) “정답 코드 보기” 대체 문구
- 버튼: `기준 구현 보기 (Reference)`
- 설명(툴팁): `제출한 테스트는 기준 구현을 반드시 통과해야 합니다.`

---

## 8. 수용 기준(Acceptance Criteria)

### AC-01 난이도
- [x] 동일 문제에서 상단/우측 패널 난이도 라벨이 항상 일치한다.
  - `ProblemSidebar.tsx`의 `difficultyConfig` 키를 API 응답 형식과 일치시킴 (Very Easy, Easy, Medium, Hard)

### AC-02 난이도 태그 제거
- [x] `easy/medium/hard`가 태그 칩으로 노출되지 않는다.
  - `page.tsx`에서 태그 전달 시 난이도 값 필터링 추가

### AC-03 태그 분류
- [x] 태그 칩이 카테고리(ENV/CONCEPT/DOMAIN/CONTEXT) 순서로 정렬되어 노출된다.
  - `frontend/lib/tagDefinitions.ts` 생성 (TagDefinitionMap + 분류/정렬 함수)
  - `page.tsx`, `ProblemSidebar.tsx`에서 `toTagViewModels()` 사용

### AC-04 태그 접기
- [x] 태그가 많아도 화면이 과밀해지지 않으며 `+N`으로 접힌다.
  - `sliceTags()` 함수로 최대 노출 개수 제한 (헤더: 6개, 사이드바: 4개)
  - 초과분 `+N` 칩으로 표시

### AC-05 CTA 정확성
- [x] "코드 작성" 문구가 "테스트 작성"으로 변경되어 사용자 행동과 일치한다.
  - `ProblemSidebar.tsx:62`, `ProblemCTA.tsx:30` 수정 완료

---

## 9. 권장 작업 순서(실행 플랜)

### Sprint A (반나절~1일)
1) 난이도 불일치 버그 수정 (P0)
2) 난이도 태그 제거 (P0)
3) CTA 문구 변경 (P1)
4) 프론트 TagDefinitionMap 도입 + 카테고리 정렬/접기 (P1)

### Sprint B (1~2일)
1) TagDefinition을 서버로 이관(Phase 2)
2) 태그 통폐합 정책 적용 (`basic-math` vs `arithmetic-operations`, `dictionary` vs `dictionary-operations` 등)
3) 우측 패널 “핵심 학습 포인트/예상 시간” 자동화(선택)

---

## 10. 부록: 예상 소요 시간(선택) 산정 규칙 (간단 룰)
- easy: 10~15분
- medium: 20~30분
- hard: 35~60분

> 운영하면서 실제 제출 데이터 기반으로 튜닝 권장.
