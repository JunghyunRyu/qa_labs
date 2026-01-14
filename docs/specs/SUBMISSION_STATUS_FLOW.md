# Submission 상태 전이 규칙

> 작성일: 2025-12-06
> 최종 수정: 2026-01-14
> 목적: Submission 상태 전이 규칙 및 조건 문서화 (하이브리드 아키텍처 반영)

---

## 상태 정의

Submission은 다음 5가지 상태를 가질 수 있습니다:

- **PENDING**: 제출이 생성되었고, 서버 사이드 채점 대기 중 (Celery Task 큐에 추가됨)
  - *클라이언트 사이드 실행 시 이 상태를 거치지 않음*
- **RUNNING**: 서버 사이드 채점 진행 중 (Celery Task 실행 중)
  - *클라이언트 사이드 실행 시 이 상태를 거치지 않음*
- **SUCCESS**: 채점이 성공적으로 완료된 상태 (Golden Code 테스트 통과)
- **FAILURE**: Golden Code 테스트가 실패한 상태 (사용자 테스트 코드 문제)
- **ERROR**: 예외 발생 또는 최대 재시도 횟수 초과로 실패한 상태 (서버 사이드만 해당)

---

## 상태 전이 다이어그램

### 클라이언트 사이드 실행 경로 (기본)

> Pyodide 준비 완료 + buggy_implementations 존재 시

```
[제출 생성]
    │
    ├─ 프론트엔드에서 Pyodide로 채점 완료
    │
    ├─ Golden Code 테스트 성공
    │   │
    │   ▼
    │ [SUCCESS] (score 계산됨, execution_mode="client")
    │
    └─ Golden Code 테스트 실패
        │
        ▼
      [FAILURE] (score=0, execution_mode="client")
```

- PENDING, RUNNING 상태를 **거치지 않음**
- 제출 생성 시 바로 SUCCESS 또는 FAILURE로 설정

### 서버 사이드 실행 경로 (Fallback)

> Pyodide 미준비 또는 buggy_implementations 없을 시

```
[PENDING]
    │
    ├─ Celery Task 시작
    │
    ▼
[RUNNING]
    │
    ├─ Golden Code 테스트 실패
    │   │
    │   ▼
    │ [FAILURE] (score=0, execution_mode="server")
    │
    ├─ 예외 발생 또는 재시도 실패
    │   │
    │   ▼
    │ [ERROR] (execution_log에 에러 정보)
    │
    └─ 채점 성공
        │
        ▼
    [SUCCESS] (score 계산됨, execution_mode="server")
```

---

## 클라이언트 사이드 실행 경로 상세

### 실행 조건
- Pyodide 초기화 완료 (`isPyodideReady = true`)
- `buggy_implementations.length > 0`

### 상태 전이
- PENDING, RUNNING 상태를 **거치지 않음**
- 제출 생성 시 바로 SUCCESS 또는 FAILURE로 설정

### 코드 위치
- 프론트엔드: `frontend/app/problems/[id]/page.tsx:337-395` (doSubmit)
- 백엔드: `backend/app/api/submissions.py:102-162`

### execution_log 구조
```json
{
  "execution_mode": "client",
  "golden_code_passed": true,
  "total_execution_time_ms": 1234.56,
  "mutant_details": [
    {
      "mutant_id": "1",
      "killed": true,
      "test_output": "...",
      "execution_time": 100.5
    }
  ]
}
```

### 테스트 품질 분석 (Phase 2)
- SUCCESS인 경우에만 실행
- `TestQualityAnalyzer`로 AST 기반 분석
- 품질 점수/등급 Submission에 저장
- 분석 실패해도 채점 결과는 반환

### AI 피드백 생성
- 회원이고 SUCCESS인 경우에만
- `generate_feedback_task.delay()` 비동기 호출
- 채점 결과는 이미 저장되어 있음 (피드백 실패해도 결과 유지)

### 서버 실행 비활성화 옵션
- `ALLOW_SERVER_EXECUTION=false` 시 서버 사이드 실행 차단
- 클라이언트 결과 없이 제출 시 400 에러 반환
- 프로덕션 리소스 최적화 목적

---

## 서버 사이드 상태 전이 조건

### 1. PENDING → RUNNING

**조건**:
- Celery Task가 실행되기 시작할 때
- `SubmissionService.process_submission()` 메서드 시작 시

**코드 위치**:
- `backend/app/services/submission_service.py:47`
  ```python
  submission.status = "RUNNING"
  self.submission_repo.update(submission)
  ```

**트리거**:
- Celery Worker가 `process_submission_task`를 실행할 때

---

### 2. RUNNING → FAILURE

**조건**:
- Golden Code에 대한 테스트가 실패할 때
- 사용자가 작성한 테스트 코드가 정상 구현을 통과시키지 못할 때

**코드 위치**:
- `backend/app/services/submission_service.py:70-79`
  ```python
  if not golden_result.get("all_tests_passed", False):
      submission.status = "FAILURE"
      submission.score = 0
      submission.execution_log = {"golden": golden_result}
      self.submission_repo.update(submission)
      return
  ```

**결과**:
- `score = 0`
- `execution_log`에 Golden Code 테스트 결과 저장
- 채점 프로세스 종료 (Mutant 테스트 미실행)

---

### 3. RUNNING → SUCCESS

**조건**:
- Golden Code 테스트 성공
- 모든 Mutant에 대한 테스트 실행 완료
- 점수 계산 완료
- AI 피드백 생성 완료 (실패해도 채점은 완료로 처리)

**코드 위치**:
- `backend/app/services/submission_service.py:144-154`
  ```python
  submission.status = "SUCCESS"
  submission.score = score
  submission.killed_mutants = killed
  submission.total_mutants = total_weight
  submission.execution_log = {
      "golden": golden_result,
      "mutants": mutant_logs,
  }
  submission.feedback_json = feedback
  self.submission_repo.update(submission)
  ```

**결과**:
- `score`: 계산된 점수 (30 + kill_ratio * 70)
- `killed_mutants`: kill된 mutant의 총 weight
- `total_mutants`: 전체 mutant의 총 weight
- `execution_log`: Golden Code 및 Mutant 테스트 결과
- `feedback_json`: AI 피드백 (있는 경우)

---

### 4. RUNNING → ERROR

**조건**:
- 예외 발생 시
- 최대 재시도 횟수 초과 시

**코드 위치**:
- `backend/app/services/submission_service.py:156-160` (예외 발생 시)
  ```python
  except Exception as e:
      logger.error(f"Error processing submission {submission_id}: {e}", exc_info=True)
      submission.status = "ERROR"
      submission.execution_log = {"error": str(e)}
      self.submission_repo.update(submission)
  ```

- `backend/app/workers/tasks.py:45-59` (재시도 실패 시)
  ```python
  if self.request.retries >= self.max_retries:
      submission.status = "ERROR"
      submission.execution_log = {
          "error": f"Task failed after {self.max_retries} retries: {str(e)}"
      }
      submission_repo.update(submission)
  ```

**결과**:
- `score = 0` (기본값)
- `execution_log`에 에러 정보 저장
- 채점 프로세스 종료

---

### 5. PENDING → ERROR

**조건**:
- Celery Task 발행 실패 시

**코드 위치**:
- `backend/app/api/submissions.py:96-105`
  ```python
  except Exception as e:
      logger.error(f"Failed to queue submission {submission.id}: {e}", exc_info=True)
      submission.status = "ERROR"
      submission.execution_log = {"error": f"Failed to queue task: {str(e)}"}
      submission_repo.update(submission)
      raise HTTPException(...)
  ```

**결과**:
- Task가 큐에 추가되지 않음
- 즉시 ERROR 상태로 설정

---

## 재시도 로직

### Celery Task 재시도

**설정**:
- `max_retries = 3`: 최대 3회 재시도
- 재시도 간격: 지수 백오프 (60초, 120초, 240초)

**재시도 조건**:
- `process_submission()` 메서드에서 예외 발생 시
- `self.request.retries < self.max_retries`인 경우

**재시도 실패 시**:
- 상태를 `ERROR`로 변경
- `execution_log`에 에러 정보 저장

---

## 상태 전이 방지

현재 코드에서는 잘못된 상태 전이를 명시적으로 방지하는 로직이 없습니다.

**권장 사항** (향후 개선):
- 상태 전이 검증 로직 추가
- 예: `SUCCESS` → `RUNNING` 같은 역전이는 불가능하도록

---

## 참고

- 상태 전이는 단방향으로만 진행됩니다 (역전이 불가)
- 한 번 `SUCCESS` 또는 `FAILURE`가 되면 다시 `RUNNING`으로 변경되지 않습니다
- `ERROR` 상태는 재시도 실패 또는 예외 발생 시에만 설정됩니다 (서버 사이드만 해당)
- 클라이언트 사이드 실행에서는 ERROR 상태가 발생하지 않습니다 (에러 시 서버로 Fallback)

---

## 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12-06 | 초기 문서 생성 (Celery 기반) | AI Copilot |
| 2025-12-18 | 클라이언트 사이드 실행(Pyodide) 경로 추가, 하이브리드 아키텍처 반영 | AI Copilot |
| 2025-12-28 | 테스트 품질 분석(Phase 2), 서버 실행 비활성화 옵션 추가 | AI Copilot |
| 2026-01-14 | 문서 날짜 업데이트 | AI Copilot |

