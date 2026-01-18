---
description: 문제 품질 자동 개선 파이프라인. Problem Curator와 pytest-problem-reviewer를 연동하여 이슈 발견 → 자동 수정 → 재검증 순환을 수행합니다.
triggers:
  - "/problem-quality"
  - "/pq"
  - "문제 품질 개선"
  - "auto heal problem"
inputs:
  - problem_id (예: FT-E01, M01, H01)
  - max_iterations (기본값: 3)
outputs:
  - final_problem_json (개선된 문제)
  - pipeline_report_md (전체 과정 리포트)
  - iteration_history (각 반복의 변경 이력)
---

# Problem Quality Pipeline v1.0

> Problem Curator Agent + pytest-problem-reviewer 자동 연동 시스템

## 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                    Problem Quality Pipeline                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐     ┌──────────────┐     ┌────────────────┐     │
│   │  INPUT   │────▶│   CURATOR    │────▶│   REVIEWER     │     │
│   │ problem  │     │   (Agent)    │     │   (Skill)      │     │
│   └──────────┘     └──────────────┘     └────────────────┘     │
│                           │                      │               │
│                           │                      ▼               │
│                           │              ┌──────────────┐       │
│                           │              │  PASS/FAIL?  │       │
│                           │              └──────────────┘       │
│                           │                 │       │           │
│                           │            PASS │       │ FAIL      │
│                           │                 ▼       │           │
│                           │          ┌──────────┐   │           │
│                           │          │  OUTPUT  │   │           │
│                           │          │ (Final)  │   │           │
│                           │          └──────────┘   │           │
│                           │                         │           │
│                           ◀─────────────────────────┘           │
│                        (feedback loop)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 실행 방법

### 단일 문제 개선
```
/problem-quality FT-E01
```

### 최대 반복 횟수 지정
```
/problem-quality M01 --max-iterations 5
```

### 여러 문제 일괄 처리
```
/problem-quality FT-E01,FT-E03,M01
```

---

## 파이프라인 단계

### Phase 1: 초기 분석 (Initial Analysis)

```python
# 1. 문제 파일 로드
problem = load_problem(f"backend/generated_problems/{problem_id}.json")

# 2. 현재 상태 스냅샷
initial_state = {
    "description_md": problem["description_md"],
    "buggy_count": len(problem["buggy_implementations"]),
    "difficulty": problem["difficulty"],
    "domain": problem["domain"]
}
```

### Phase 2: 큐레이션 (Curation)

Problem Curator Agent가 다음을 수행:
1. **시나리오 강화**: 추상적 설명 → 구체적 비즈니스 상황
2. **난이도 조정**: 템플릿 기반 description_md 재작성
3. **뮤턴트 검토**: buggy_implementations 다양성 확인

```python
# Curator Agent 호출
curated_problem = await curator_agent.improve(
    problem=problem,
    focus_areas=["scenario", "difficulty", "mutants"],
    apply_template=True
)
```

### Phase 3: 검증 (Validation)

pytest-problem-reviewer가 다음을 검증:
1. **계약 명확성**: 입출력, 예외 조건
2. **마크다운 무결성**: 렌더링 오류 없음
3. **채점 안정성**: 모호한 구현 허용 가능성

```python
# Reviewer 호출
review_result = await reviewer.validate(
    problem=curated_problem,
    checklist="references/checklist.md"
)

# 결과 구조
# {
#   "verdict": "PASS" | "FAIL",
#   "critical_issues": [...],
#   "warnings": [...],
#   "improved_description": "...",
#   "policy_questions": [...]
# }
```

### Phase 4: 피드백 루프 (Feedback Loop)

```python
iteration = 0
max_iterations = 3

while iteration < max_iterations:
    # 큐레이션
    curated = curator.improve(problem, feedback=previous_issues)

    # 검증
    result = reviewer.validate(curated)

    if result.verdict == "PASS":
        return curated  # 성공

    # 피드백 수집
    previous_issues = extract_actionable_feedback(result)
    iteration += 1

# 최대 반복 도달
return {
    "status": "MAX_ITERATIONS_REACHED",
    "best_version": best_so_far,
    "remaining_issues": result.critical_issues
}
```

---

## 자동 수정 매핑 (Auto-Heal Mapping)

### Critical 이슈 → Curator 액션

| Reviewer 이슈 | Curator 자동 수정 |
|--------------|------------------|
| 예외 타입 미정의 | `### 예외 처리` 섹션에 명시적 타입 추가 |
| 입력 범위 모호 | `### 입력 계약` 테이블 추가/보강 |
| 반환 구조 미정의 | `### 출력 계약` 섹션 추가 |
| 마크다운 깨짐 | 코드 블록 재포맷, 테이블 수정 |
| 구현 순서 강제 | "먼저/그 다음" 표현 제거, 결과만 명시 |
| 예시와 규칙 충돌 | 예시 수정 또는 규칙 명확화 |

### Warning 이슈 → Curator 권장 수정

| Reviewer 경고 | Curator 권장 조치 |
|--------------|------------------|
| 설명 너무 김 | 난이도별 템플릿 적용으로 압축 |
| 정보 중복 | 중복 제거, 통합 |
| 힌트 부족 | 테스트 힌트 섹션 보강 |
| 시나리오 추상적 | 도메인별 구체적 서비스명 추가 |

---

## 종료 조건 (Termination Conditions)

### 성공 종료 (PASS)
- Critical 이슈 0개
- 난이도 템플릿 적용됨
- 모든 계약(Contract) 명확

### 실패 종료 (FAIL with Report)
- 최대 반복 횟수 도달 (기본 3회)
- 해결 불가능한 정책 질문 존재
- 순환 감지 (같은 이슈 반복)

### 안전장치 (Safeguards)
- **원본 백업**: 수정 전 항상 `.bak` 파일 생성
- **Diff 제한**: 한 번에 description_md의 50% 이상 변경 금지
- **수동 확인 필요**: 정책 질문은 사람이 결정

---

## 출력 리포트 형식

### pipeline_report.md

```markdown
# Problem Quality Pipeline Report

## 대상 문제
- **ID**: {problem_id}
- **제목**: {title}
- **난이도**: {difficulty}
- **도메인**: {domain}

## 파이프라인 결과
- **최종 상태**: PASS / FAIL
- **총 반복**: {iterations}회
- **소요 시간**: {duration}

## 반복 이력

### Iteration 1
**Curator 수정 사항:**
- 시나리오: "간편 송금 앱" → "토스 송금 기능"
- 템플릿: Easy 템플릿 적용

**Reviewer 결과:** FAIL
- 🔴 Critical: 예외 타입 미정의 (ValueError vs TypeError)
- 🟡 Warning: 설명 42줄 (권장 25~40줄)

### Iteration 2
**Curator 수정 사항:**
- 예외 섹션에 TypeError/ValueError 구분 추가
- 불필요한 배경 설명 제거 (42줄 → 35줄)

**Reviewer 결과:** PASS
- 🟢 모든 계약 명확
- 🟢 마크다운 무결성 확인

## 최종 변경 요약
| 항목 | Before | After |
|------|--------|-------|
| description_md 줄 수 | 52 | 35 |
| 시나리오 구체성 | 추상적 | 구체적 (토스) |
| 예외 명세 | 없음 | 완전 |

## 정책 질문 (수동 확인 필요)
- [ ] bool 입력 처리 정책: TypeError vs 허용?
```

---

## 사용 예시

### 예시 1: 단일 문제 개선
```
사용자: /problem-quality FT-E01

Pipeline:
[1/3] 초기 분석 완료 - Easy, fintech
[1/3] Curator: 시나리오 강화, Easy 템플릿 적용
[1/3] Reviewer: FAIL - Critical 2개 (예외 타입, 입력 범위)
[2/3] Curator: 피드백 반영 수정
[2/3] Reviewer: PASS

✅ 완료: FT-E01 품질 개선 성공 (2회 반복)
```

### 예시 2: 정책 질문 발생
```
사용자: /problem-quality M01

Pipeline:
[1/3] Reviewer: FAIL - 정책 질문 발생
      "bool 입력 처리 정책이 플랫폼 전체에 영향"

⚠️ 수동 확인 필요:
Q: bool 입력 시 TypeError를 발생시킬까요, 허용할까요?
   - [A] TypeError 발생 (엄격)
   - [B] int로 취급하여 허용 (관대)

사용자 선택 후 파이프라인 재개...
```

---

## CLI 스크립트

### 파이프라인 실행
```bash
# 단일 문제
cd backend && python scripts/problem_quality_pipeline.py FT-E01

# 여러 문제
cd backend && python scripts/problem_quality_pipeline.py FT-E01,M01,H01

# 반복 횟수 조정
cd backend && python scripts/problem_quality_pipeline.py FT-E01 --max-iterations 5
```

### 검증 및 복원
```bash
# 단일 문제 검증
cd backend && python scripts/problem_quality_validator.py validate --problem-id FT-E01

# 일괄 검증
cd backend && python scripts/problem_quality_validator.py batch

# 백업에서 복원
cd backend && python scripts/problem_quality_validator.py restore --problem-id FT-E01
```

### 출력 디렉토리
- **백업**: `backend/problem_backups/`
- **리포트**: `backend/quality_reports/`

---

## 연관 도구

- **Problem Curator Agent**: `.claude/agents/problem-curator/agent.md`
- **pytest-problem-reviewer**: `.claude/skills/pytest-problem-reviewer/skill.md`
- **submission-test**: 최종 채점 테스트
- **CLI Pipeline**: `backend/scripts/problem_quality_pipeline.py`
- **CLI Validator**: `backend/scripts/problem_quality_validator.py`

---

## 제한 사항

- golden_code 로직 변경 불가
- 뮤턴트 삭제 불가 (추가/수정만)
- 정책 질문은 자동 결정 불가
- 최대 반복 횟수 초과 시 수동 개입 필요

---

*Problem Quality Pipeline v1.0 - 자동 품질 개선 시스템*
