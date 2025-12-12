# Milestone 1: 게스트 지원 인프라

**우선순위**: P0 (구조적 변경, 최우선)
**의존성**: 없음
**예상 작업량**: 중~대

---

## 목표

비회원(게스트)도 문제 풀이와 채점이 가능하도록 인프라를 구축합니다.

---

## 배경

현재 코드베이스는 `create_submission()` API에서 `get_current_user` 의존성을 사용하여 **인증 없이 제출이 불가능**합니다.

```python
# 현재 코드 (backend/app/api/submissions.py)
@router.post("", ...)
async def create_submission(
    ...
    current_user: User = Depends(get_current_user),  # ← 인증 필수!
):
```

기획서 v0.2는 "학습/채점 자체는 게스트도 가능"을 명시하고 있어 **구조적 변경이 필요**합니다.

---

## Todo List

### 1. [BE] anonymous_id 쿠키 발급 미들웨어 구현

- [ ] **파일 생성**: `backend/app/middleware/anonymous.py`
- [ ] **미들웨어 구현**:
  - 요청에 `qa_anonymous_id` 쿠키가 없으면 새 UUID v4 생성
  - 응답에 쿠키 설정
- [ ] **쿠키 속성**:
  - 이름: `qa_anonymous_id`
  - 형식: UUID v4 (36자)
  - HttpOnly: True
  - SameSite: Lax
  - Secure: 프로덕션에서 True
  - 만료: 30일
- [ ] **main.py에 미들웨어 등록**

### 2. [DB] submissions 테이블 스키마 수정

- [ ] **마이그레이션 파일 생성**: `backend/alembic/versions/xxx_add_anonymous_support.py`
- [ ] **변경사항**:
  - `user_id` 컬럼을 nullable로 변경
  - `anonymous_id` 컬럼 추가 (VARCHAR(36), nullable)
  - CHECK 제약 추가: `user_id IS NOT NULL OR anonymous_id IS NOT NULL`
  - `anonymous_id` 인덱스 추가
- [ ] **롤백 스크립트 작성**

### 3. [BE] Submission 모델 수정

- [ ] **파일 수정**: `backend/app/models/submission.py`
- [ ] **변경사항**:
  ```python
  user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # nullable 변경
  anonymous_id = Column(String(36), nullable=True, index=True)  # 신규 추가
  ```
- [ ] **__table_args__에 CHECK 제약 추가**

### 4. [BE] Submission 스키마 수정

- [ ] **파일 수정**: `backend/app/schemas/submission.py`
- [ ] **SubmissionCreate 수정**: user_id/anonymous_id 옵션 처리
- [ ] **SubmissionResponse 수정**: anonymous_id 필드 추가

### 5. [BE] Submission API 수정

- [ ] **파일 수정**: `backend/app/api/submissions.py`
- [ ] **create_submission 함수 수정**:
  - `get_current_user` → `get_current_user_optional` 변경
  - 비회원 처리:
    ```python
    if current_user:
        submission.user_id = current_user.id
    else:
        anonymous_id = request.cookies.get("qa_anonymous_id")
        if not anonymous_id:
            raise HTTPException(400, "Anonymous ID required for guest submission")
        submission.anonymous_id = anonymous_id
    ```
- [ ] **get_submission 함수**: 변경 없음 (이미 인증 불필요)

### 6. [BE] 레이트리밋 게스트/회원 분리

- [ ] **파일 수정**: `backend/app/core/rate_limiter.py`
- [ ] **새 함수 생성**: `get_rate_limit_key(request, user)`
  - 회원: `user:{user_id}` 키 사용
  - 게스트: `guest:{ip}:{anonymous_id}` 키 사용
- [ ] **제한 값 설정**:
  - 게스트 제출: 분당 5회, 일 30회
  - 회원 제출: 분당 10회, 일 200회
- [ ] **config.py에 설정 추가**:
  ```python
  RATE_LIMIT_GUEST_SUBMISSIONS = "5/minute;30/day"
  RATE_LIMIT_MEMBER_SUBMISSIONS = "10/minute;200/day"
  ```

### 7. [FE] anonymous_id 쿠키 처리

- [ ] **파일 확인**: `frontend/lib/api.ts`
- [ ] **credentials 설정 확인**:
  ```typescript
  fetch(url, {
    credentials: 'include',  // 쿠키 포함 필수
    ...
  })
  ```
- [ ] **쿠키 자동 처리 확인** (백엔드에서 발급하면 브라우저가 자동 관리)

### 8. [BE] 회원 전환 시 데이터 마이그레이션

- [ ] **파일 수정**: `backend/app/api/auth.py` (github_callback 함수)
- [ ] **마이그레이션 로직 추가**:
  ```python
  # 로그인 성공 후
  anonymous_id = request.cookies.get("qa_anonymous_id")
  if anonymous_id:
      # 게스트 제출을 회원 계정에 연결
      db.query(Submission).filter(
          Submission.anonymous_id == anonymous_id,
          Submission.user_id.is_(None)
      ).update({"user_id": user.id, "anonymous_id": None})
      db.commit()
  ```
- [ ] **anonymous_id 쿠키 삭제** (로그인 후 불필요)

---

## 관련 파일

| 파일 | 작업 유형 |
|------|-----------|
| `backend/app/middleware/anonymous.py` | 신규 생성 |
| `backend/alembic/versions/xxx_add_anonymous_support.py` | 신규 생성 |
| `backend/app/models/submission.py` | 수정 |
| `backend/app/schemas/submission.py` | 수정 |
| `backend/app/api/submissions.py` | 수정 |
| `backend/app/core/rate_limiter.py` | 수정 |
| `backend/app/core/config.py` | 수정 |
| `backend/app/api/auth.py` | 수정 |
| `backend/app/main.py` | 수정 (미들웨어 등록) |
| `frontend/lib/api.ts` | 확인/수정 |

---

## 완료 조건

- [ ] 비로그인 상태에서 문제 제출 가능
- [ ] 제출 시 `qa_anonymous_id` 쿠키가 자동 발급됨
- [ ] 로그인 후 이전 게스트 제출이 계정에 연결됨
- [ ] 게스트/회원별 레이트리밋 정상 동작
- [ ] 기존 회원 제출 기능 정상 동작 (회귀 없음)

---

## 테스트 케이스

1. **게스트 제출 테스트**
   - 비로그인 상태에서 문제 제출 → 성공
   - `qa_anonymous_id` 쿠키 확인
   - 제출 결과 조회 → 성공

2. **회원 제출 테스트**
   - 로그인 상태에서 문제 제출 → 성공 (기존 동작)
   - `user_id` 연결 확인

3. **게스트 → 회원 전환 테스트**
   - 게스트로 제출 2건
   - 로그인
   - 이전 게스트 제출이 회원 계정에 연결됨 확인

4. **레이트리밋 테스트**
   - 게스트: 6번째 분당 제출 시 429
   - 회원: 11번째 분당 제출 시 429

---

## 주의사항

- DB 마이그레이션 전 **프로덕션 백업 필수**
- 기존 submissions 데이터는 영향 없음 (user_id가 이미 있음)
- anonymous_id는 개인정보가 아님 (UUID만 저장)
