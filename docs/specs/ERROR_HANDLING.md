# 에러 처리 가이드

> 작성일: 2025-12-07  
> 목적: QA-Arena 프로젝트의 에러 처리 전략 및 가이드 문서화

---

## 1. 에러 처리 전략 개요

QA-Arena는 다음과 같은 에러 처리 전략을 사용합니다:

1. **계층별 에러 처리**: API 레벨, 서비스 레벨, 인프라 레벨에서 각각 적절한 에러 처리
2. **구조화된 에러 응답**: 일관된 형식의 에러 응답으로 클라이언트 처리 용이
3. **상세한 로깅**: 디버깅 및 모니터링을 위한 구조화된 로그
4. **자동 재시도**: 일시적 오류에 대한 자동 재시도 메커니즘
5. **안전한 실패**: 에러 발생 시에도 시스템이 안정적으로 동작

---

## 2. API 레벨 에러 처리

### 2.1. 에러 응답 형식

모든 API 에러 응답은 다음 형식을 따릅니다:

```json
{
  "detail": "에러 메시지",
  "type": "에러 타입"
}
```

### 2.2. 에러 타입

| HTTP 상태 코드 | 에러 타입 | 설명 |
|---------------|----------|------|
| 400 | `bad_request` | 잘못된 요청 |
| 401 | `unauthorized` | 인증 필요 |
| 403 | `forbidden` | 권한 없음 |
| 404 | `not_found` | 리소스 없음 |
| 422 | `validation_error` | 요청 검증 실패 |
| 500 | `internal_server_error` | 서버 내부 오류 |

### 2.3. 예외 핸들러

**위치**: `backend/app/main.py`

#### HTTP 예외 핸들러

```python
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # 에러 타입 결정 및 로깅
    # 구조화된 에러 응답 반환
```

#### Validation 예외 핸들러

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 검증 에러 로깅
    # 에러 타입: validation_error
```

#### 일반 예외 핸들러

```python
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # 프로덕션: 일반적인 메시지만 반환 + 에러 ID
    # DEBUG 모드: 상세한 에러 정보 반환
    # 실제 에러는 로그에만 기록
```

### 2.4. 프로덕션 vs 개발 모드

- **프로덕션 모드** (`DEBUG=False`):
  - 일반적인 에러 메시지만 반환
  - 에러 ID 제공 (로그 추적용)
  - 상세한 스택 트레이스는 로그에만 기록

- **개발 모드** (`DEBUG=True`):
  - 상세한 에러 정보 반환
  - 스택 트레이스 포함

---

## 3. 서비스 레벨 에러 처리

### 3.1. Submission Service

**위치**: `backend/app/services/submission_service.py`

#### 주요 에러 시나리오

1. **Submission을 찾을 수 없음**
   - 로그: `[GRADING_ERROR] submission_id={id} reason=submission_not_found`
   - 처리: 조기 종료

2. **Problem을 찾을 수 없음**
   - 로그: `[GRADING_ERROR] submission_id={id} problem_id={id} reason=problem_not_found`
   - 처리: 상태를 ERROR로 변경 후 종료

3. **Golden Code 테스트 실패**
   - 로그: `[GOLDEN_TEST_FAILED] submission_id={id} exit_code={code} reason=golden_code_tests_failed`
   - 처리: 상태를 FAILURE로 변경, score=0

4. **예외 발생**
   - 로그: `[GRADING_ERROR] submission_id={id} error_type={type} error_message={msg}`
   - 처리: 상태를 ERROR로 변경, execution_log에 에러 정보 저장

### 3.2. Docker Service

**위치**: `backend/app/services/docker_service.py`

#### 주요 에러 시나리오

1. **Docker 클라이언트 초기화 실패**
   - 로그: 환경 정보 포함 (Windows, 컨테이너 내부 여부, DOCKER_HOST)
   - 처리: `RuntimeError` 발생

2. **컨테이너 생성 실패**
   - 로그: 이미지 이름, 타임아웃 값 포함
   - 처리: `RuntimeError` 발생, 임시 디렉토리 정리

3. **컨테이너 실행 타임아웃**
   - 로그: 컨테이너 ID, 타임아웃 값, 에러 정보
   - 처리: 컨테이너 강제 종료, exit_code=-1

4. **컨테이너 실행 중 예외**
   - 로그: 컨테이너 ID, 에러 타입, 실행 시간
   - 처리: 에러 정보를 stderr에 포함하여 반환

---

## 4. Celery Task 에러 처리

### 4.1. 재시도 로직

**위치**: `backend/app/workers/tasks.py`

#### 설정

```python
@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    retry_backoff=True,  # 지수 백오프
    retry_backoff_max=600,  # 최대 10분
    retry_jitter=True,  # 재시도 시간 랜덤화
)
```

#### 재시도 동작

- **재시도 간격**: 지수 백오프 (60초, 120초, 240초)
- **재시도 시간 랜덤화**: thundering herd 문제 방지
- **최대 재시도 횟수**: 3회
- **최대 재시도 간격**: 10분

#### 재시도 실패 시

- 상태를 `ERROR`로 변경
- `execution_log`에 에러 정보 저장
- 로그에 최대 재시도 횟수 초과 기록

### 4.2. 에러 로깅

- 재시도 시: `[GRADING_START]`, `[GRADING_ERROR]` 로그
- 최대 재시도 초과: `[GRADING_COMPLETE] status=ERROR` 로그

---

## 5. 로깅 전략

### 5.1. 로그 레벨

- **INFO**: 일반적인 이벤트 (제출 생성, 채점 시작/완료)
- **WARNING**: 경고 상황 (Golden Code 테스트 실패)
- **ERROR**: 에러 발생 (예외, 재시도 실패)
- **DEBUG**: 상세 디버깅 정보 (Mutant kill 상세)

### 5.2. 로그 메시지 형식

구조화된 로그 형식 사용:

```
[EVENT_NAME] key1=value1 key2=value2
```

**예시**:
```
[GRADING_START] submission_id=123e4567-e89b-12d3-a456-426614174000
[STATUS_CHANGE] submission_id=123e4567-e89b-12d3-a456-426614174000 status=PENDING->RUNNING
[GRADING_COMPLETE] submission_id=123e4567-e89b-12d3-a456-426614174000 status=SUCCESS score=85
```

### 5.3. 주요 이벤트

| 이벤트 | 설명 |
|--------|------|
| `[SUBMISSION_CREATE_START]` | 제출 생성 시작 |
| `[SUBMISSION_CREATED]` | 제출 생성 완료 |
| `[SUBMISSION_QUEUED]` | Celery Task 큐에 추가 |
| `[GRADING_START]` | 채점 시작 |
| `[STATUS_CHANGE]` | 상태 전이 |
| `[GOLDEN_TEST_START]` | Golden Code 테스트 시작 |
| `[GOLDEN_TEST_FAILED]` | Golden Code 테스트 실패 |
| `[MUTANT_TEST_START]` | Mutant 테스트 시작 |
| `[MUTANT_KILLED]` | Mutant kill |
| `[SCORE_CALCULATED]` | 점수 계산 완료 |
| `[AI_FEEDBACK_START]` | AI 피드백 생성 시작 |
| `[AI_FEEDBACK_SUCCESS]` | AI 피드백 생성 성공 |
| `[AI_FEEDBACK_ERROR]` | AI 피드백 생성 실패 |
| `[GRADING_COMPLETE]` | 채점 완료 |
| `[GRADING_ERROR]` | 채점 중 에러 발생 |

---

## 6. 디버깅 가이드

### 6.1. Submission 상태 확인

```python
# 데이터베이스에서 확인
SELECT id, status, score, execution_log 
FROM submissions 
WHERE id = 'submission_id';
```

### 6.2. 로그 확인

#### 로그 파일 위치
- 일반 로그: `backend/logs/app.log`
- 에러 로그: `backend/logs/error.log`

#### 로그 검색 예시

```bash
# 특정 submission의 로그 검색
grep "submission_id=123e4567" logs/app.log

# 에러만 검색
grep "ERROR" logs/app.log

# 특정 이벤트 검색
grep "\[GRADING_ERROR\]" logs/app.log
```

### 6.3. 일반적인 문제 해결

#### 1. Submission이 PENDING 상태에서 멈춤

**원인**:
- Celery Worker가 실행되지 않음
- Redis 연결 실패
- Task 발행 실패

**해결 방법**:
1. Celery Worker 상태 확인
2. Redis 연결 확인
3. 로그에서 `[SUBMISSION_QUEUE_ERROR]` 검색

#### 2. Submission이 ERROR 상태

**원인**:
- Docker 연결 실패
- 컨테이너 생성 실패
- 예외 발생

**해결 방법**:
1. `execution_log`에서 에러 정보 확인
2. 로그에서 `[GRADING_ERROR]` 검색
3. Docker 서비스 상태 확인

#### 3. Golden Code 테스트 실패

**원인**:
- 사용자 테스트 코드 문제
- 정상적인 실패 (의도된 동작)

**해결 방법**:
1. `execution_log.golden`에서 테스트 결과 확인
2. 로그에서 `[GOLDEN_TEST_FAILED]` 검색

---

## 7. 에러 처리 체크리스트

### 7.1. 새 기능 개발 시

- [ ] 적절한 예외 타입 사용
- [ ] 구조화된 로그 메시지 작성
- [ ] 에러 응답에 `type` 필드 포함
- [ ] 프로덕션 모드 고려 (상세 정보 노출 방지)
- [ ] 리소스 정리 (finally 블록)

### 7.2. 에러 처리 검증

- [ ] 단위 테스트 작성
- [ ] 에러 시나리오 테스트
- [ ] 로그 메시지 확인
- [ ] 에러 응답 형식 확인

---

## 8. 참고 자료

- [Submission 상태 전이 규칙](./SUBMISSION_STATUS_FLOW.md)
- [데이터베이스 스키마 정리 결과](./DATABASE_SCHEMA_REVIEW.md)
- [검증 결과](./VERIFICATION_RESULTS.md)

---

## 9. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12-07 | 초기 문서 생성 | AI Copilot |

