# 데이터베이스 스키마 정리 결과

> 작성일: 2025-12-06  
> 목적: 데이터베이스 스키마의 Enum 값 및 제약조건 정리 결과 문서화

---

## 1. Enum 값 및 제약조건 확인 결과

### 1.1. `difficulty` 필드 (problems 테이블)

**현재 값**:
- `Very Easy`
- `Easy`
- `Medium`
- `Hard`

**CHECK Constraint**:
- 이름: `problems_difficulty_check`
- 위치: `backend/app/models/problem.py:24`
- 마이그레이션: `12f074c2cc50_add_very_easy_difficulty.py`

**상태**: ✅ 완료

---

### 1.2. `status` 필드 (submissions 테이블)

**현재 값**:
- `PENDING`
- `RUNNING`
- `SUCCESS`
- `FAILURE`
- `ERROR`

**CHECK Constraint**:
- 이름: `submissions_status_check`
- 위치: `backend/app/models/submission.py:18-22`
- 마이그레이션: `00581fcd8b47_add_status_check_constraint.py` (새로 추가됨)

**상태**: ✅ 완료 (CHECK constraint 추가 완료)

---

## 2. 마이그레이션 파일 목록

### 2.1. 초기 마이그레이션
- **파일**: `aba1fde81f82_initial_migration_create_users_problems_.py`
- **내용**: 
  - users, problems, buggy_implementations, submissions 테이블 생성
  - difficulty CHECK constraint (초기: 'Easy', 'Medium', 'Hard')
- **롤백**: ✅ 가능 (downgrade 메서드 구현됨)

### 2.2. Very Easy 난이도 추가
- **파일**: `12f074c2cc50_add_very_easy_difficulty.py`
- **내용**: 
  - difficulty CHECK constraint에 'Very Easy' 추가
- **롤백**: ✅ 가능 (downgrade 메서드 구현됨)

### 2.3. Status CHECK Constraint 추가
- **파일**: `00581fcd8b47_add_status_check_constraint.py`
- **내용**: 
  - submissions.status 필드에 CHECK constraint 추가
  - 허용 값: 'PENDING', 'RUNNING', 'SUCCESS', 'FAILURE', 'ERROR'
- **롤백**: ✅ 가능 (downgrade 메서드 구현됨)

---

## 3. 상태 전이 규칙

상세한 상태 전이 규칙은 `docs/SUBMISSION_STATUS_FLOW.md` 문서를 참고하세요.

**주요 상태 전이**:
1. `PENDING` → `RUNNING`: Celery Task 시작 시
2. `RUNNING` → `SUCCESS`: 채점 성공 시
3. `RUNNING` → `FAILURE`: Golden Code 테스트 실패 시
4. `RUNNING` → `ERROR`: 예외 발생 시
5. `PENDING` → `ERROR`: Celery Task 발행 실패 시

---

## 4. 검증 결과

### 4.1. Enum 값 확인
- ✅ `difficulty`: CHECK constraint 확인 완료
- ✅ `status`: CHECK constraint 추가 완료

### 4.2. 마이그레이션 파일 검토
- ✅ 모든 마이그레이션 파일에 upgrade/downgrade 메서드 구현됨
- ✅ 롤백 가능한 구조로 작성됨
- ✅ 마이그레이션 체인 정상 (aba1fde81f82 → 12f074c2cc50 → 00581fcd8b47)

### 4.3. 모델 파일 업데이트
- ✅ `backend/app/models/submission.py`에 CHECK constraint 추가
- ✅ `backend/app/models/problem.py`에 CHECK constraint 확인

---

## 5. 남은 작업

### 5.1. 롤백 테스트 (로컬 환경)
- [ ] `alembic downgrade -1` 테스트
- [ ] 데이터 손실 없이 롤백되는지 확인

**참고**: EC2 환경이 준비되면 실제 데이터베이스에서 테스트 가능

---

## 6. 참고 사항

- 모든 CHECK constraint는 데이터베이스 레벨과 모델 레벨 모두에 적용됨
- 상태 전이는 단방향으로만 진행됨 (역전이 불가)
- 한 번 `SUCCESS` 또는 `FAILURE`가 되면 다시 `RUNNING`으로 변경되지 않음

