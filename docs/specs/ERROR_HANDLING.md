# 에러 처리 가이드

> 작성일: 2025-12-07
> 최종 수정: 2026-01-14
> 목적: QA Arena 프로젝트의 에러 처리 전략 및 가이드 문서화 (하이브리드 아키텍처 반영)

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
| 429 | `rate_limit_exceeded` | 요청 빈도 초과 |
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

#### Rate Limit 예외 핸들러

```python
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    # 429 상태 코드 반환
    # Retry-After 헤더 포함
    # 에러 타입: rate_limit_exceeded
```

### 2.4. 프로덕션 vs 개발 모드

- **프로덕션 모드** (`DEBUG=False`):
  - 일반적인 에러 메시지만 반환
  - 에러 ID 제공 (로그 추적용)
  - 상세한 스택 트레이스는 로그에만 기록
  - Sentry로 에러 자동 보고

- **개발 모드** (`DEBUG=True`):
  - 상세한 에러 정보 반환
  - 스택 트레이스 포함

### 2.5. Sentry 에러 모니터링

**위치**: `backend/app/core/sentry.py`, `backend/app/main.py`

#### 설정

- 환경 변수: `SENTRY_DSN`
- 프로덕션 환경에서만 활성화

#### 에러 보고

```python
from app.core.sentry import capture_exception_with_context

sentry_event_id = capture_exception_with_context(
    exc,
    context={"request": {"method": method, "url": url}},
    tags={"error_type": "unhandled_exception"}
)
```

#### Sentry에서 확인 가능한 정보

- 에러 스택 트레이스
- 요청 정보 (method, URL, path)
- 에러 ID (API 응답의 `error_id`와 매칭)
- 커스텀 태그 및 컨텍스트

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

## 4. Celery Task 에러 처리 (서버 사이드)

> **참고**: 클라이언트 사이드 실행(Pyodide)을 사용하는 경우,
> 아래 Celery Task 에러 처리는 적용되지 않습니다.
> 클라이언트 사이드 에러 처리는 Section 10을 참조하세요.

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

## 9. Rate Limit 에러 처리

> 제출 및 AI 기능에 대한 요청 빈도 제한 에러 처리입니다.

### 9.1. Rate Limit 종류

**위치**: `backend/app/core/rate_limiter.py`

| 제한 대상 | 회원 | 게스트 |
|----------|------|--------|
| 제출 (분당) | 10/minute | 5/minute |
| 제출 (일당) | 200/day | 30/day |
| AI 채팅 (분당) | 10/minute | 5/minute |
| AI 채팅 (일당) | 200/day | 30/day |
| AI 채팅 IP 일당 (게스트만) | - | 15/day |

> **게스트 IP 제한**: `RATE_LIMIT_AI_GUEST_IP_DAILY` 설정으로 쿠키 삭제를 통한 우회 방지

### 9.2. 커스텀 예외 클래스

```python
class SubmissionRateLimitExceeded(Exception):
    """제출 rate limit 초과 예외."""
    def __init__(self, limit_str: str, retry_after: int):
        self.limit_str = limit_str
        self.retry_after = retry_after

class AIRateLimitExceeded(Exception):
    """AI rate limit 초과 예외."""
    def __init__(self, limit_str: str, retry_after: int):
        self.limit_str = limit_str
        self.retry_after = retry_after
```

### 9.3. Rate Limit 키 생성

- **회원**: `user:{user_id}`
- **게스트**: `guest:{ip}:{anonymous_id}`

IP 추출 우선순위:
1. `X-Real-IP` 헤더 (Nginx 설정)
2. `X-Forwarded-For` 헤더 (첫 번째 IP)
3. 직접 연결 IP

### 9.4. 에러 응답 형식

```json
{
  "detail": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  "type": "rate_limit_exceeded",
  "retry_after": "60"
}
```

헤더: `Retry-After: 60`

---

## 10. 클라이언트 사이드 에러 처리

> 클라이언트 사이드 실행(Pyodide)에서 발생하는 에러에 대한 처리 전략입니다.

### 10.1. 에러 처리 계층

```
레이어 1 (Worker): 저수준 실행 에러
  - Pyodide 초기화 실패 (CDN, 브라우저 호환성)
  - Python 코드 실행 에러
  → error 메시지 전송

레이어 2 (Store): 메시지 처리
  - Worker 에러 → state 업데이트 (status: "error")
  - Promise reject

레이어 3 (Hook): 비즈니스 로직
  - 테스트 결과 변환
  - 콜백 실행 (onError, onComplete)

레이어 4 (Page): 데이터 흐름
  - Fallback 결정 (Pyodide 실패 → 서버 실행)

레이어 5 (UI): 시각화
  - LocalTestResultPanel: 빨간 알림 + 재시도 버튼
  - SubmissionResultPanel: 에러 메시지 + 재제출 버튼
```

### 10.2. Pyodide 초기화 실패

**가능한 원인**:
- 네트워크 문제 (CDN 접근 불가)
- 브라우저 호환성 (SharedArrayBuffer 미지원)
- pytest 설치 실패

**처리 방식**:
- 로컬 테스트 버튼 비활성화
- 제출 시 자동으로 서버 사이드 Fallback

**코드 위치**:
- `frontend/stores/pyodideStore.ts:98-112`
- `frontend/hooks/useCodeRunner.ts:134-140`

### 10.3. 클라이언트 실행 중 에러

**가능한 에러**:
- 문법 오류 (SyntaxError)
- ImportError (존재하지 않는 모듈)
- 런타임 에러 (TypeError, ValueError 등)

**처리 방식**:
- 구조화된 에러 결과 반환 (`success: false`, `error: message`)
- UI에서 에러 메시지 표시

**코드 위치**:
- `frontend/workers/pyodide.worker.ts:186-257`
- `frontend/hooks/useCodeRunner.ts:157-206`

### 10.4. generate_feedback_task 에러

> 클라이언트 실행 후 AI 피드백을 비동기로 생성할 때 발생하는 에러

**위치**: `backend/app/workers/tasks.py`

**설정**:
```python
@celery_app.task(
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    retry_backoff=True,
)
def generate_feedback_task(self, submission_id: str):
```

**특징**:
- 클라이언트 실행 후 비동기로 호출됨
- 채점 결과는 이미 저장되어 있음
- 피드백 생성 실패해도 채점 결과는 유지됨
- 최대 2회 재시도 (30초, 60초 간격)
- **게스트 유저 스킵**: `user_id`가 없으면 피드백 생성 건너뜀
- **중복 방지**: 이미 `feedback_json`이 있으면 스킵

### 10.5. Fallback 메커니즘

**Pyodide 실패 시 자동 Fallback**:
```typescript
// frontend/app/problems/[id]/page.tsx (doSubmit)
if (isPyodideReady && problem.buggy_implementations?.length > 0) {
  // 클라이언트 사이드 실행
} else {
  // 서버 사이드로 자동 Fallback
}
```

**Fallback이 발생하는 조건**:
- Pyodide 초기화 실패
- `buggy_implementations` 없음
- SharedArrayBuffer 미지원 브라우저

---

## 11. 민감정보 마스킹 (Sensitive Data Masking)

> 프로덕션 환경에서 로그 및 에러 응답에 민감정보가 노출되지 않도록 보호합니다.

### 11.1. 마스킹 유틸리티

**위치**: `backend/app/core/security_utils.py`

#### sanitize_log_message()

로그 메시지에서 민감정보를 자동 마스킹합니다.

| 패턴 | 마스킹 결과 | 예시 |
|------|------------|------|
| 이메일 | `[EMAIL]` | `user@example.com` → `[EMAIL]` |
| 휴대폰 | `[PHONE]` | `010-1234-5678` → `[PHONE]` |
| API 키 파라미터 | `[MASKED]` | `api_key=sk_123` → `api_key=[MASKED]` |
| Bearer 토큰 | `[MASKED]` | `Bearer eyJ...` → `Bearer [MASKED]` |
| JWT 토큰 | `[JWT_TOKEN]` | `eyJhbG...` → `[JWT_TOKEN]` |
| 신용카드 | `[CARD_NUMBER]` | `1234-5678-9012-3456` → `[CARD_NUMBER]` |

#### sanitize_url_path()

URL 쿼리 파라미터에서 민감정보를 마스킹합니다.

```
입력: /api/v1/auth?password=secret123&name=john
출력: /api/v1/auth?password=[MASKED]&name=john
```

### 11.2. 예외 핸들러 적용

**위치**: `backend/app/main.py`

모든 예외 핸들러에서 로깅 시 마스킹 적용:

```python
from app.core.security_utils import sanitize_log_message, sanitize_url_path

# Rate Limit 예외
logger.warning(
    sanitize_log_message(
        f"Rate limit exceeded: {request.client.host} - "
        f"Path: {sanitize_url_path(str(request.url))}"
    )
)

# HTTP 예외
logger.warning(
    sanitize_log_message(
        f"HTTP {exc.status_code} error: {exc.detail} - "
        f"Path: {sanitize_url_path(str(request.url))}"
    )
)
```

### 11.3. Validation 에러 프로덕션 단순화

프로덕션 환경에서 검증 에러 응답을 단순화하여 내부 정보 노출 방지:

```python
# 개발 모드 (DEBUG=True)
{
    "detail": [{"loc": ["body", "email"], "msg": "invalid email", "type": "value_error"}],
    "type": "validation_error"
}

# 프로덕션 모드 (DEBUG=False)
{
    "detail": "요청 형식이 올바르지 않습니다.",
    "type": "validation_error",
    "fields": ["email"]
}
```

### 11.4. Sentry PII 필터

**위치**: `backend/app/core/sentry.py`

Sentry로 전송되는 데이터에서 민감정보 필터링:

#### 필터링 대상 필드

| 카테고리 | 필드 |
|----------|------|
| 인증/보안 | password, token, api_key, secret, authorization, access_token, refresh_token, jwt, bearer |
| PII | email, username, phone, mobile, address, ssn, social_security, credit_card, card_number |

#### 필터링 대상 헤더

- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`

### 11.5. 체크리스트

- [x] 로그 메시지 마스킹 함수 구현
- [x] 모든 예외 핸들러에 마스킹 적용
- [x] Validation 에러 프로덕션 단순화
- [x] Sentry PII 필터 확장
- [x] 요청 로깅 미들웨어 마스킹 적용

---

## 12. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12-07 | 초기 문서 생성 | AI Copilot |
| 2025-12-13 | Sentry 에러 모니터링 섹션 추가 | AI Copilot |
| 2025-12-18 | 클라이언트 사이드 에러 처리(Pyodide) 섹션 추가 | AI Copilot |
| 2025-12-28 | Section 9 Rate Limit 에러 처리 추가, 429 상태 코드 추가, generate_feedback_task 상세 설명 보완 | AI Copilot |
| 2025-12-28 | Section 11 민감정보 마스킹 추가 (security_utils, Sentry PII 필터, Validation 단순화) | AI Copilot |
| 2026-01-14 | Rate Limit 구체적인 수치 업데이트, 게스트 IP 제한 설명 추가 | AI Copilot |

