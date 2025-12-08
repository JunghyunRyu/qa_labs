# EC2 없이 진행 가능한 작업 목록

> 작성일: 2025-12-06  
> 목적: EC2 환경 재세팅 중에도 진행할 수 있는 작업 정리

---

## 1. 에러 핸들링 코드 검증 및 개선

### 1.1. Celery Task 재시도 로직 개선

**현재 상태**: ✅ 완료 - `retry_backoff` 및 `retry_jitter` 적용 완료

**작업 내용**:
- [x] `app/workers/tasks.py`의 재시도 로직 개선
  - [x] `retry_backoff=True` 추가 (지수 백오프)
  - [x] `retry_backoff_max=600` 추가 (최대 재시도 간격 10분)
  - [x] `retry_jitter=True` 추가 (재시도 시간 랜덤화)
  - [x] 재시도 간격 조정 (수동 계산 → Celery 자동 지수 백오프)

**검증 방법**:
- [x] 코드 리뷰 ✅ 완료
- [x] 단위 테스트 작성/실행 ✅ 완료

### 1.2. Docker 컨테이너 에러 처리 검증

**작업 내용**:
- [x] 타임아웃 처리 코드 확인 (`docker_service.py`에 구현됨)
- [x] 컨테이너 강제 종료 로직 확인 (`container.kill()` 사용)
- [x] 리소스 정리 보장 확인 (`finally` 블록 사용)
- [x] 에러 메시지 개선 (더 명확한 에러 메시지)
  - [x] 에러 타입 명시 (`type(e).__name__`)
  - [x] 컨텍스트 정보 추가 (컨테이너 ID, 타임아웃 값 등)
  - [x] 구체적인 원인 설명
  - [x] 해결 방법 제시 (가능한 경우)

**검증 방법**:
- [x] 코드 리뷰 ✅ 완료
- [x] 에러 메시지 개선 ✅ 완료

### 1.3. API 에러 응답 표준화 확인 및 개선

**현재 상태**: ✅ 완료 - 에러 타입 필드 추가 및 500 에러 응답 개선 완료

**작업 내용**:
- [x] HTTP 상태 코드 일관성 확인 (`app/main.py`에 구현됨)
- [x] 스택 트레이스 노출 방지 확인 (`DEBUG` 모드에 따라 분기)
- [x] 에러 타입 필드 추가
  - [x] `{"detail": "...", "type": "validation_error"}` 형식
  - [x] HTTP 에러 타입: `not_found`, `bad_request`, `unauthorized`, `forbidden`, `http_error`
  - [x] Validation 에러 타입: `validation_error`
  - [x] 서버 에러 타입: `internal_server_error`
- [x] 500 에러 응답 개선
  - [x] 프로덕션에서는 일반적인 메시지만 반환
  - [x] 에러 ID 추가 (프로덕션 모드에서 로그 추적용)
  - [x] 실제 에러는 로그에만 기록

**검증 방법**:
- [x] 코드 리뷰 ✅ 완료
- [x] API 테스트 (로컬 환경) ✅ 완료 (4/4 테스트 통과)

---

## 2. 데이터베이스 스키마 정리

### 2.1. Enum 값 및 제약조건 확인

**작업 내용**:
- [x] `difficulty` enum 값 확인
  - [x] 현재 값: `Very Easy`, `Easy`, `Medium`, `Hard`
  - [x] 마이그레이션 스크립트 확인 (`12f074c2cc50_add_very_easy_difficulty.py`)
  - [x] CHECK constraint 확인 (`problems_difficulty_check`)
- [x] `status` enum 값 확인 (submissions 테이블)
  - [x] 현재 값: `PENDING`, `RUNNING`, `SUCCESS`, `FAILURE`, `ERROR`
  - [x] CHECK constraint 추가 (`00581fcd8b47_add_status_check_constraint.py`)
  - [x] 상태 전이 규칙 문서화 (아래 참고)

**검증 방법**:
- 로컬 데이터베이스에서 확인
- 마이그레이션 파일 검토

### 2.2. 상태 전이 규칙 문서화

**작업 내용**:
- [x] Submission 상태 전이 다이어그램 작성
- [x] 각 상태 전이 조건 문서화
  - [x] `PENDING` → `RUNNING`: Celery Task 시작 시
  - [x] `RUNNING` → `SUCCESS`: 채점 성공 시
  - [x] `RUNNING` → `FAILURE`: Golden Code 테스트 실패 시
  - [x] `RUNNING` → `ERROR`: 예외 발생 시
  - [x] `PENDING` → `ERROR`: Celery Task 발행 실패 시
- [ ] 잘못된 상태 전이 방지 로직 검토 (선택사항)

**출력물**:
- [x] `docs/SUBMISSION_STATUS_FLOW.md` 문서 생성 (이미 존재)

### 2.3. Alembic 마이그레이션 스크립트 검토

**작업 내용**:
- [x] 모든 마이그레이션 파일 검토
  - [x] `backend/alembic/versions/` 디렉토리 확인
    - `aba1fde81f82_initial_migration_create_users_problems_.py`: 초기 마이그레이션
    - `12f074c2cc50_add_very_easy_difficulty.py`: Very Easy 난이도 추가
    - `00581fcd8b47_add_status_check_constraint.py`: status CHECK constraint 추가
  - [x] 각 마이그레이션의 up/down 메서드 확인
    - 모든 마이그레이션에 upgrade/downgrade 메서드 구현됨
    - 롤백 가능한 구조로 작성됨
- [x] 롤백 테스트 (로컬 환경)
  - [x] `alembic downgrade -1` 테스트 ✅ 성공
  - [x] 데이터 손실 없이 롤백되는지 확인 ✅ 확인 완료
  - [x] 재적용 테스트 (`alembic upgrade head`) ✅ 성공
  - [x] CHECK constraint 동작 확인 ✅ 검증 완료

**검증 방법**:
- 로컬 데이터베이스에서 마이그레이션 테스트 ✅ 완료

---

## 3. 코드 품질 개선

### 3.1. 로깅 개선

**작업 내용**:
- [x] 로그 레벨 일관성 확인 ✅ 완료
  - [x] INFO: 일반적인 이벤트 (제출 생성, 채점 시작/완료)
  - [x] WARNING: 경고 상황 (Golden Code 테스트 실패)
  - [x] ERROR: 에러 발생
  - [x] DEBUG: 상세 디버깅 정보 (Mutant kill 상세)
- [x] 중요한 이벤트 로깅 추가 ✅ 완료
  - [x] 제출 생성/완료: `[SUBMISSION_CREATED]`, `[SUBMISSION_QUEUED]`
  - [x] 채점 시작/완료: `[GRADING_START]`, `[GRADING_COMPLETE]`
  - [x] 상태 전이: `[STATUS_CHANGE]`
  - [x] Golden Code 테스트: `[GOLDEN_TEST_START]`, `[GOLDEN_TEST_FAILED]`
  - [x] Mutant 테스트: `[MUTANT_TEST_START]`, `[MUTANT_KILLED]`
  - [x] 점수 계산: `[SCORE_CALCULATED]`
  - [x] AI 피드백: `[AI_FEEDBACK_START]`, `[AI_FEEDBACK_SUCCESS]`, `[AI_FEEDBACK_ERROR]`
  - [x] 에러 발생: `[GRADING_ERROR]`, `[SUBMISSION_QUEUE_ERROR]`
- [x] 로그 메시지 형식 통일 ✅ 완료
  - [x] 통일된 형식: `[EVENT_NAME] key1=value1 key2=value2`
  - [x] 구조화된 로그로 파싱 및 분석 용이

**검증 방법**:
- [x] 코드 리뷰 ✅ 완료
- [x] 로컬 환경에서 로그 확인 ✅ 완료

### 3.2. 타입 힌트 개선

**작업 내용**:
- [ ] 함수 시그니처에 타입 힌트 추가/개선
- [ ] `mypy` 실행하여 타입 체크 (선택사항)

**검증 방법**:
- 코드 리뷰
- `mypy` 실행 (설치 필요)

### 3.3. 문서 문자열 개선

**작업 내용**:
- [ ] 함수/클래스 docstring 보완
- [ ] 예외 처리 문서화

**검증 방법**:
- 코드 리뷰

---

## 4. 테스트 코드 작성/실행

### 4.1. 에러 시나리오 테스트

**작업 내용**:
- [x] Celery Task 재시도 테스트 작성 ✅ 완료
  - [x] `test_process_submission_task_retry_on_exception`: 재시도 로직 테스트
  - [x] `test_process_submission_task_max_retries_reached`: 최대 재시도 횟수 초과 테스트
  - [x] `test_process_submission_task_retry_backoff_config`: retry_backoff 설정 확인
- [x] Docker 서비스 에러 처리 테스트 작성 ✅ 완료
  - [x] `test_timeout_handling`: 타임아웃 처리 테스트
  - [x] `test_run_container_failure`: 실패하는 pytest 실행 테스트
  - [x] `test_cleanup_container`: 컨테이너 정리 테스트
  - [x] `test_cleanup_container_with_none`: None 컨테이너 정리 테스트
  - [x] `test_cleanup_temp_dir_with_nonexistent_path`: 존재하지 않는 경로 정리 테스트
  - [x] `test_run_pytest_exception_handling`: run_pytest 예외 처리 테스트
- [x] API 에러 응답 테스트 작성 ✅ 완료
  - [x] `test_404_error_response_format`: 404 에러 응답 형식 테스트
  - [x] `test_validation_error_response_format`: Validation 에러 응답 형식 테스트
  - [x] `test_500_error_response_format_production`: 500 에러 응답 형식 테스트 (프로덕션)
  - [x] `test_400_error_response_format`: 400 에러 응답 형식 테스트

**검증 방법**:
- [x] 로컬 환경에서 테스트 실행 ✅ 완료
- [x] `pytest` 실행 ✅ 완료

### 4.2. 단위 테스트 커버리지 확인

**작업 내용**:
- [ ] 현재 테스트 커버리지 확인
- [ ] 누락된 테스트 케이스 추가

**검증 방법**:
- `pytest-cov` 사용하여 커버리지 확인

---

## 5. 문서화

### 5.1. 에러 처리 가이드 작성

**작업 내용**:
- [x] 에러 처리 전략 문서화 ✅ 완료
- [x] 각 에러 타입별 처리 방법 문서화 ✅ 완료
- [x] 디버깅 가이드 작성 ✅ 완료

**출력물**:
- [x] `docs/ERROR_HANDLING.md` 문서 생성 ✅ 완료

### 5.2. 개발 가이드 업데이트

**작업 내용**:
- [ ] 로컬 개발 환경 설정 가이드 업데이트
- [ ] 테스트 실행 가이드 업데이트

---

## 우선순위

### 높음 (즉시 진행 가능)
1. ✅ Celery Task 재시도 로직 개선 (`retry_backoff` 추가)
2. ✅ 상태 전이 규칙 문서화
3. ✅ 데이터베이스 스키마 확인 (로컬 DB)

### 중간 (시간 있을 때)
4. ✅ API 에러 응답 개선
5. ✅ 로깅 개선
6. ✅ 테스트 코드 작성
7. ✅ 에러 처리 가이드 작성

### 낮음 (선택사항)
7. 타입 힌트 개선
8. 문서 문자열 개선
9. 테스트 커버리지 확인

---

## 참고

- EC2 환경이 준비되면 이 문서의 항목들은 대부분 검증 단계로 넘어갈 수 있습니다.
- 코드 개선 작업은 EC2 환경과 무관하게 진행 가능합니다.

