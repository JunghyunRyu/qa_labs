---
description: 제출 시스템의 end-to-end 테스트를 자동화합니다
---

# Submission Test Skill

제출 시스템 전체 흐름을 테스트하여 Golden/Buggy 코드 동작, judge 컨테이너, pytest 실행을 검증합니다.

## E2E 테스트 워크플로우

### 1. 테스트 준비

#### 문제 선택
```bash
# 사용 가능한 문제 목록
curl http://localhost:8001/api/v1/problems

# 특정 문제 상세 정보
curl http://localhost:8001/api/v1/problems/1
```

문제 정보에서 확인:
- `function_signature`: 테스트할 함수 시그니처
- `golden_code`: 정답 코드
- 버그 유형 힌트 (description)

#### 테스트 코드 작성
문제에 맞는 pytest 테스트 코드 작성:

```python
def test_validate_age_boundaries():
    from target import validate_age
    # 하한 경계
    assert validate_age(-1) == False
    assert validate_age(0) == True
    assert validate_age(1) == True
    # 상한 경계
    assert validate_age(149) == True
    assert validate_age(150) == True
    assert validate_age(151) == False

def test_validate_age_special_cases():
    from target import validate_age
    assert validate_age(None) == False
    assert validate_age(-100) == False
    assert validate_age(10000) == False
```

### 2. 제출 실행
```bash
# JSON 파일 생성
cat > /tmp/submission.json << 'EOF'
{
  "problem_id": 1,
  "code": "def test_validate_age_boundaries():\n    from target import validate_age\n    assert validate_age(-1) == False\n    assert validate_age(0) == True\n    ..."
}
EOF

# 제출
curl -X POST http://localhost:8001/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d @/tmp/submission.json
```

응답에서 `submission_id` 추출

### 3. 실시간 모니터링
celery_worker 로그를 실시간으로 확인:

```bash
docker compose -f docker-compose.prod.yml logs -f celery_worker
```

**확인 포인트:**
```
[GRADING_START] submission_id=...
[STATUS_CHANGE] status=PENDING->RUNNING
[GOLDEN_TEST_START] ...
컨테이너 생성 완료: ...
컨테이너 실행 완료: ..., 성공: True/False
[BUGGY_TEST_START] ...
[GRADING_COMPLETE] status=SUCCESS/ERROR
```

### 4. 결과 확인
5-10초 대기 후 결과 조회:

```bash
curl http://localhost:8001/api/v1/submissions/{submission_id}
```

### 5. 상세 분석

#### Golden Code 결과
```json
{
  "golden": {
    "success": true,
    "exit_code": 0,
    "stdout": "....  [100%]\n4 passed, 1 warning in 0.01s",
    "all_tests_passed": true
  }
}
```

**검증:**
- ✅ success: true
- ✅ exit_code: 0
- ✅ all_tests_passed: true
- ✅ stdout에 "passed" 확인

#### Buggy Code 결과
```json
{
  "mutants": [
    {
      "mutant_id": 1,
      "result": {
        "success": false,
        "stdout": "...FAILED...",
        "any_test_failed": true
      },
      "bug_description": "상한 경계값 포함 오류: ..."
    }
  ]
}
```

**검증:**
- ✅ 각 mutant에서 any_test_failed: true
- ✅ bug_description과 실제 실패한 테스트 일치
- ✅ killed_mutants == total_mutants

### 6. Judge 컨테이너 검증

#### 볼륨 마운트 확인
celery_worker 로그에서:
```
컨테이너 생성 완료: dc4104311f25...
```

임시 컨테이너가 정상 생성/실행/삭제되는지 확인

#### 파일 접근 확인
로그에서 다음 에러가 **없어야** 함:
- ❌ `ERROR: file or directory not found: test_user.py`
- ❌ `ERROR: file or directory not found: target.py`

### 7. 성능 측정
```json
{
  "golden": {
    "execution_time": 0.77
  },
  "mutants": [
    {
      "result": {
        "execution_time": 0.80
      }
    }
  ]
}
```

**기준:**
- Golden: < 2초
- 각 Mutant: < 2초
- 전체 제출: < 30초 (mutant 개수에 따라)

### 8. 종합 리포트

```
========================================
제출 테스트 리포트
========================================

Problem: 나이 범위 검증 함수 테스트 (ID: 1)
Submission ID: 2a18dc78-3740-4d9a-88bb-9b1b87744eca

[Golden Code 테스트]
✅ 통과 (4 tests passed in 0.77s)

[Buggy Code 테스트]
✅ 19/19 mutants killed (100%)

Mutant 세부 결과:
- Mutant #1 (상한 경계값 포함 오류): ✅ FAILED
- Mutant #2 (하한 경계값 포함 오류): ✅ FAILED
- Mutant #3 (상한 경계 초과 허용): ✅ FAILED
- Mutant #4 (None 처리 오류): ✅ FAILED
- Mutant #5 (음수 처리 오류): ✅ FAILED
- ... (14 more)

[Judge 시스템]
✅ 컨테이너 생성/실행/정리 정상
✅ 볼륨 마운트 정상 (test_user.py, target.py 접근 성공)
✅ pytest 실행 정상

[성능]
Golden: 0.77s ✅
평균 Mutant: 0.82s ✅
전체 실행: 18.5s ✅

[최종 점수]
Score: 100/100 ✅

========================================
✅ 모든 테스트 통과!
========================================
```

## 에러 케이스 테스트

### 케이스 1: Golden Code 실패
테스트 코드가 잘못되어 Golden Code에서 실패하는 경우

**예상 결과:**
```json
{
  "status": "ERROR",
  "execution_log": {
    "golden": {
      "success": false,
      "error_type": "golden_code_error"
    }
  }
}
```

### 케이스 2: 일부 Mutant만 탐지
테스트가 충분하지 않아 일부 mutant를 놓치는 경우

**예상 결과:**
```json
{
  "status": "SUCCESS",
  "score": 50,
  "killed_mutants": 10,
  "total_mutants": 19
}
```

### 케이스 3: JSON 파싱 오류
잘못된 JSON 형식 제출

**예상 결과:**
```json
{
  "detail": [
    {
      "type": "json_invalid",
      "msg": "JSON decode error"
    }
  ]
}
```

### 케이스 4: 타임아웃
무한 루프 등으로 타임아웃 발생

**예상 결과:**
```
celery_worker 로그에:
Judge 컨테이너 실행 타임아웃: 컨테이너 ID=..., 타임아웃=5초
```

## 사용 시점
- 제출 시스템 기능 변경 후
- judge 컨테이너 설정 변경 후
- Docker-in-Docker 관련 수정 후
- 새로운 문제 추가 후
- 정기 smoke test
