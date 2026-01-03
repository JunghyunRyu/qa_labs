# P0: 클라이언트 결과 위조 방지 시스템

## 개요

클라이언트 사이드 실행 결과의 신뢰성을 보장하기 위한 P0 우선순위 보안/신뢰 시스템

---

## Phase 1: 테스트/스펙 정합성 (완료)

### 완료된 P0 수정 사항

| 항목 | 설명 | P0 사유 | 상태 |
|------|------|---------|------|
| 쿠키 이름 정정 | `anonymous_id` → `qa_anonymous_id` | 인증/세션 연동 파괴 방지 | ✅ 완료 |
| 문제 가시성 필드 | `is_visible`, `published_at` 강제 | 초안/비공개 문제 노출 방지 | ✅ 완료 |
| client_result 필수 | 서버 실행 비활성화 시 필수 | 채점 파이프라인 신뢰 보장 | ✅ 완료 |
| FK 삭제 순서 | cleanup_db 순서 정리 | CI/테스트 안정성 | ✅ 완료 |

### 완료된 P1-P2 수정 사항 (테스트 유지보수)

| 항목 | 설명 | 상태 |
|------|------|------|
| mock 대상 메서드 일치 | `use_reasoning=False` 추가 | ✅ 완료 |
| title 필드 추가 | GeneratedProblemSchema 정합성 | ✅ 완료 |
| 불가능 시나리오 스킵 | FK 제약으로 불가능한 테스트 | ✅ 스킵 처리 |

### 수정된 파일 목록

```
backend/tests/test_api_submissions.py
backend/tests/test_api_problems.py
backend/tests/test_integration.py
backend/tests/test_api_admin.py
backend/tests/test_ai_problem_designer.py
backend/tests/test_submission_service.py
```

---

## Phase 2: 클라이언트 조작 방지 UI (완료)

### P0-2-1: execution_mode UI 노출

**상태**: ✅ 완료

**구현 내용**:
- `ScoreDisplay.tsx`: execution_mode, verified, verificationStatus props 추가
- `renderVerificationBadge()`: 상태별 배지 렌더링
  - 서버 실행: "서버 실행 결과" (green)
  - 검증 완료: "서버 검증 완료" (green)
  - 검증 중: "검증 중..." (blue, spinner)
  - 불일치: "점수 확정 보류" (red)
  - 미검증: "로컬 실행 결과" (gray)

**관련 파일**:
- `frontend/components/ScoreDisplay.tsx` ✅
- `frontend/components/SubmissionResult.tsx` ✅ (props 전달)

### P0-2-2: 점수/통계 "학습용(베타)" 라벨

**상태**: ✅ 완료

**구현 내용**:
- `ScoreDisplay.tsx`: "학습용 지표 (베타)" 라벨 표시
- `dashboard/page.tsx`: 베타 안내 배너 추가
  - "점수와 통계는 학습 목적으로 제공됩니다. 일부 클라이언트 실행 결과는 서버 검증을 거칩니다."

**관련 파일**:
- `frontend/components/ScoreDisplay.tsx` ✅
- `frontend/app/dashboard/page.tsx` ✅

---

## Phase 3: 서버 재검증 시스템 (완료)

### P0-3-1: VerificationService 구현

**상태**: ✅ 완료

**구현 내용**:
- `VerificationService` 클래스 (`backend/app/services/verification_service.py`)
- `compute_code_hash()`: SHA256 코드 해시 생성
- `should_verify()`: 재검증 필요 여부 판단
- `_detect_repeated_high_scores()`: Redis 기반 반복 고득점 감지
- `_detect_duplicate_code_hash()`: Redis 기반 중복 코드 감지
- `mark_for_verification()`: 검증 대상 마킹
- `verify_submission()`: 검증 결과 처리

### P0-3-2: 재검증 트리거 조건

**상태**: ✅ 완료

**구현된 조건**:
| 조건 | 트리거 | 설명 | 상수 |
|------|--------|------|------|
| 고득점 | `score >= 90` | 90점 이상 | `HIGH_SCORE_THRESHOLD = 90` |
| 빠른 실행 | `execution_time < 1000ms` | 1초 미만 | `FAST_EXECUTION_THRESHOLD_MS = 1000` |
| 반복 고득점 | Redis 감지 | 1시간 내 80점+ 5회 | `HIGH_SCORE_COUNT_THRESHOLD = 5` |
| 중복 코드 | Redis 감지 | 24시간 내 동일 코드 3회 | `DUPLICATE_HASH_THRESHOLD = 3` |
| 랜덤 샘플 | `random() < 0.05` | 5% 확률 | `RANDOM_SAMPLE_RATE = 0.05` |

### P0-3-3: Celery 재검증 Task

**상태**: ✅ 완료

**구현 내용**:
- `verify_submission_task` Celery task (`backend/app/workers/tasks.py:207`)
- `submissions.py`에서 `verify_submission_task.delay()` 호출 (line 187)
- 결과 비교 및 `verified`/`mismatch` 상태 업데이트

---

## Phase 4: 고신뢰 기능 정책 (미완료)

### P0-4-1: 서버 검증 전용 기능

**상태**: 🔴 미완료 (정책 미정)

**권장 사항**:
- 공개 랭킹: 서버 검증 완료된 제출만 포함
- 공개 배지/성취: 서버 검증 필수
- 리더보드: `verified=True` 제출만 표시

---

## 구현 현황 요약

### ✅ 완료된 P0 항목

| Phase | 항목 | 상태 |
|-------|------|------|
| Phase 1 | 테스트/스펙 정합성 | ✅ 완료 |
| Phase 2 | execution_mode UI 노출 | ✅ 완료 |
| Phase 2 | "학습용(베타)" 라벨 | ✅ 완료 |
| Phase 3 | VerificationService 구현 | ✅ 완료 |
| Phase 3 | 재검증 트리거 조건 | ✅ 완료 |
| Phase 3 | Celery 재검증 Task | ✅ 완료 |

### 🔴 남은 P0 항목

| Phase | 항목 | 우선순위 |
|-------|------|----------|
| Phase 4 | 고신뢰 기능 정책 정의 | 기능 안정화 후 |

### 구현 완료율

**P0 완료율: 90% (9/10)**

- Phase 1-3: 100% 완료
- Phase 4: 정책 결정 대기 중

---

## 스킵된 테스트 관리

### 서버 실행 필요 테스트

| 테스트 | 파일 | 재활성화 조건 |
|--------|------|---------------|
| `test_create_submission_triggers_celery_task` | test_api_submissions.py | `ENABLE_SERVER_EXECUTION=true` |
| `test_full_submission_flow_success` | test_api_submissions.py | `ENABLE_SERVER_EXECUTION=true` |
| `test_full_submission_flow_failure` | test_api_submissions.py | `ENABLE_SERVER_EXECUTION=true` |
| `test_process_submission_problem_not_found` | test_submission_service.py | DB 스키마 변경 필요 |

### 재활성화 계획

서버 실행 기능이 다시 활성화되면:
1. `ENABLE_SERVER_EXECUTION=true` 환경 변수 설정
2. 스킵된 테스트의 `@pytest.mark.skip` 제거
3. CI에서 서버 실행 테스트 별도 실행

---

## 관련 문서

- [클라이언트 결과 위조 방지 구현 계획](../../../.claude/plans/transient-napping-piglet.md)
- [제출 상태 흐름](../SUBMISSION_STATUS_FLOW.md)
- [AI 안전 프로토콜](../AI_SAFETY_PROTOCOLS.md)
