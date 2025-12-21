# 테스트 품질 평가 시스템 - 테크 스펙

> **문서 버전**: 1.0
> **최종 수정**: 2024-12
> **관련 마일스톤**: [test-quality-milestones.md](./test-quality-milestones.md)

---

## 1. 시스템 개요

테스트 코드 품질을 정량화하는 시스템. **두 가지 독립적인 지표**로 분리:

| 지표 | 대상 | 목적 | 사용자 |
|------|------|------|--------|
| **Problem Rubric Score** | 문제 자체 (mutant/bug set) | 문제가 의도한 스킬을 평가 가능한가? | Admin |
| **Submission Test Quality** | 사용자 제출 코드 | 사용자 테스트 설계 품질 | 사용자/AI 코치 |

### 1.1 핵심 원칙

- **분석 대상 분리**: Problem Rubric ≠ Submission Quality
- **AI 코드 제공**: Admin-only, 사용자에게는 텍스트 힌트만
- **DB 경량화**: test_case_code 저장 안 함, submission.code 참조
- **신뢰도 표시**: confidence_score로 분석 확신도 표시

---

## 2. 분류 체계 (Enums)

### 2.1 ValueType (값 유형)

| 값 | 설명 | 예시 |
|----|------|------|
| `NORMAL` | 정상 값 | `5`, `"hello"`, `[1,2,3]` |
| `BOUNDARY` | 경계값 | `0`, `1`, `-1`, `MAX_INT` |
| `EDGE` | 극단 케이스 | `""`, `None`, `[]` |
| `NEGATIVE` | 음수/유효하지 않은 값 | `-5`, `"invalid"` |
| `EXTREME` | 매우 큰/작은 값 | `10**18`, `"a"*10000` |

### 2.2 InputDiversity (입력 다양성)

| 값 | 설명 | 예시 |
|----|------|------|
| `SINGLE` | 단일 요소 | `[1]` |
| `MULTIPLE` | 다중 요소 | `[1,2,3,4,5]` |
| `EMPTY` | 빈 입력 | `[]`, `""`, `{}` |
| `DUPLICATE` | 중복 포함 | `[1,1,2,2]` |
| `MIXED_TYPES` | 혼합 타입 | `[1, "a", None]` |

### 2.3 TestPurpose (테스트 목적)

| 값 | 설명 | 감지 방법 |
|----|------|----------|
| `HAPPY_PATH` | 정상 흐름 | 키워드: happy, normal, basic |
| `ERROR_HANDLING` | 에러 처리 | `pytest.raises`, 키워드: error, exception |
| `BOUNDARY_CHECK` | 경계값 확인 | 키워드: boundary, edge, limit, max, min |
| `EQUIVALENCE_PARTITION` | 동치 분할 | 키워드: partition, class |
| `STATE_TRANSITION` | 상태 전이 | 키워드: state, transition (선택적) |

### 2.4 AntiPattern (안티패턴) - 감점 항목

| 값 | 감점 | 설명 |
|----|------|------|
| `NO_ASSERTION` | -10 | assertion 없음 |
| `EXCEPTION_SWALLOWED` | -15 | try/except로 예외 삼킴 |
| `EXTERNAL_DEPENDENCY` | -5 | 외부 의존 (requests 등) |
| `NON_DETERMINISTIC` | -10 | random, time 사용 |
| `EXCESSIVE_NESTING` | -5 | 과도한 중첩 (depth > 3) |
| `LOOP_INSTEAD_PARAM` | 경고 | loop 대신 parametrize 권장 |

---

## 3. DB 스키마

### 3.1 submissions 테이블 확장

```python
# 추가 필드
test_quality_score = Column(Float)           # 종합 점수 (0-100)
test_quality_grade = Column(String(1))       # A/B/C/D/F
test_quality_analysis = Column(JSONB)        # 상세 분석 결과
```

**test_quality_analysis 구조:**
```json
{
  "parsed_test_count": 5,
  "confidence": 0.85,
  "value_types": {
    "covered": ["NORMAL", "BOUNDARY"],
    "missing": ["EDGE", "EXTREME"],
    "score": 70
  },
  "input_diversity": {
    "covered": ["SINGLE", "MULTIPLE"],
    "missing": ["EMPTY"],
    "score": 60
  },
  "test_purposes": {
    "covered": ["HAPPY_PATH", "ERROR_HANDLING"],
    "missing": ["BOUNDARY_CHECK"],
    "score": 70
  },
  "antipatterns": [
    {"type": "NO_ASSERTION", "penalty": -10, "location": "test_foo"}
  ],
  "recommendations": ["경계값 테스트 추가 권장"]
}
```

### 3.2 analysis_runs 테이블 (신규)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | |
| submission_id | FK → submissions | 제출 분석 시 (nullable) |
| problem_id | FK → problems | 문제 루브릭 분석 시 (nullable) |
| scope | String(20) | `submission` / `problem_rubric` |
| parser_version | String(10) | 파서 버전 (예: "1.0.0") |
| scoring_version | String(10) | 점수 모델 버전 |
| source_hash | String(32) | 분석 대상 코드의 MD5 |
| status | String(20) | PENDING/RUNNING/SUCCESS/ERROR |
| confidence_score | Float | 분석 신뢰도 (0.0~1.0) |
| result | JSONB | 분석 결과 |
| created_at | DateTime | |

### 3.3 problems 테이블 확장

```python
# 추가 필드
rubric_score = Column(Float)                 # 문제 루브릭 점수
rubric_analysis = Column(JSONB)              # 상세 분석
```

**rubric_analysis 구조:**
```json
{
  "mutant_diversity": 0.8,
  "skill_coverage": 0.9,
  "golden_code_quality": 0.85,
  "warnings": []
}
```

---

## 4. 점수 계산

### 4.1 포화 함수

초반 카테고리가 더 가치 있음 (중복 가산 방지):

```python
def saturation_score(covered_count: int) -> float:
    saturation_map = {0: 0, 1: 40, 2: 70, 3: 85, 4: 95, 5: 100}
    return saturation_map.get(min(covered_count, 5), 100)
```

### 4.2 중복 가산 방지

각 카테고리가 인정되려면 **최소 2개 이상의 고유 테스트**가 커버해야 함:

```python
def calculate_axis_score(test_cases: list) -> float:
    unique_tests_per_category = defaultdict(set)

    for tc in test_cases:
        for category in tc.classifications:
            unique_tests_per_category[category].add(tc.name)

    # 최소 2개 이상의 고유 테스트가 커버해야 인정
    valid_covered = {
        cat for cat, tests in unique_tests_per_category.items()
        if len(tests) >= 2
    }

    return saturation_score(len(valid_covered))
```

### 4.3 최종 점수 공식

```
base_score = (값유형 × 0.35) + (입력다양성 × 0.30) + (테스트목적 × 0.35)
penalty = sum(antipattern.penalty)  # 음수 값
final_score = max(0, base_score + penalty)
```

### 4.4 등급 체계

| 등급 | 점수 범위 | 상태 |
|------|----------|------|
| A | 90-100 | 우수 |
| B | 75-89 | 양호 |
| C | 60-74 | 보통 (경고 시작) |
| D | 40-59 | 미흡 |
| F | 0-39 | 부족 |

---

## 5. API 엔드포인트

### 5.1 Admin 전용

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/admin/test-quality/problems/{id}/analyze-rubric` | POST | 문제 루브릭 분석 |
| `/api/admin/test-quality/warnings` | GET | 경고 문제 목록 |
| `/api/admin/test-quality/problems/{id}/generate-tests` | POST | AI 테스트 생성 |

### 5.2 사용자

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/submissions/{id}/test-quality` | GET | 제출 테스트 품질 조회 |

> 제출 채점 시 자동으로 분석 수행, 별도 호출 불필요

---

## 6. AI 코드 제공 정책

| 대상 | 코드 제공 | 텍스트 힌트 |
|------|----------|------------|
| Admin (문제 관리) | O | O |
| 사용자 (제출 피드백) | X | O |
| 연습 모드 (향후) | O | O |

### 6.1 사용자용 힌트 예시 (코드 없음)

```json
{
  "missing_coverage": ["BOUNDARY", "EMPTY"],
  "hints": [
    "경계값(0, 최대값 등)에 대한 테스트를 추가해 보세요.",
    "빈 입력을 처리하는 테스트가 없습니다."
  ],
  "priority": "high"
}
```

### 6.2 Admin용 AI 생성 (코드 포함)

```json
{
  "generated_tests": [
    {
      "name": "test_boundary_zero",
      "code": "def test_boundary_zero():\n    assert func(0) == expected",
      "targets": ["BOUNDARY", "BOUNDARY_CHECK"]
    }
  ],
  "explanation": "경계값 0에 대한 테스트를 추가했습니다."
}
```

---

## 7. 파일 구조

### 7.1 Backend

```
backend/app/
├── services/
│   ├── test_case_parser.py          # AST 파싱 + parametrize 지원
│   ├── test_quality_classifier.py   # 분류 로직
│   ├── test_quality_analyzer.py     # 통합 분석 엔진
│   ├── ai_test_generator.py         # AI 테스트 생성 (Admin)
│   └── test_hint_generator.py       # 텍스트 힌트 생성 (사용자)
├── models/
│   └── test_quality.py              # 모델 정의
├── schemas/
│   └── test_quality.py              # Pydantic 스키마
├── repositories/
│   └── test_quality_repository.py   # Repository
├── api/
│   └── test_quality.py              # API 엔드포인트
└── scripts/
    └── coverage_spike.py            # 스파이크 실행 스크립트
```

### 7.2 Frontend

```
frontend/
├── types/
│   └── test-quality.ts              # 타입 정의
├── lib/
│   └── test-quality-api.ts          # API 클라이언트
├── components/test-quality/
│   ├── QualityGauge.tsx             # 점수 게이지
│   ├── BreakdownChart.tsx           # 카테고리별 분석
│   └── AntiPatternList.tsx          # 안티패턴 경고
└── app/admin/test-quality/
    └── page.tsx                     # Admin 대시보드
```

---

## 8. 참고 문서

| 문서 | 용도 |
|------|------|
| [test-quality-milestones.md](./test-quality-milestones.md) | 진행 상황 추적 |
| [qa-arena-spec.md](./qa-arena-spec.md) | 전체 시스템 사양 |
| [AI_SAFETY_PROTOCOLS.md](./AI_SAFETY_PROTOCOLS.md) | 안전 프로토콜 |
| [backup_restore.md](./backup_restore.md) | 마이그레이션 전 백업 |
