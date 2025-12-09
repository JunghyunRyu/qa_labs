---
description: 제출(submission) 테스트를 대화형으로 진행합니다
---

# 제출 테스트 자동화

사용자가 제공한 정보로 제출을 생성하고 결과를 자동으로 확인합니다.

## 워크플로우

### 1. 정보 수집
AskUserQuestion 도구를 사용하여 다음 정보를 요청합니다:
- **problem_id**: 테스트할 문제 번호
- **test_code**: 테스트 코드 (직접 입력 또는 파일 경로)

### 2. JSON 생성
수집한 정보를 올바른 JSON 형식으로 변환합니다:
```json
{
  "problem_id": 1,
  "code": "def test_example():\n    ..."
}
```

**주의:**
- 개행 문자는 `\n`으로 이스케이프
- 따옴표는 `\"`로 이스케이프

### 3. 제출 API 호출
```bash
curl -X POST http://localhost:8001/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d @/tmp/submission.json
```

### 4. submission_id 추출
API 응답에서 `"id"` 필드 값을 자동으로 추출합니다.

### 5. 결과 확인
5초 대기 후 결과 API를 호출합니다:
```bash
curl http://localhost:8001/api/v1/submissions/{submission_id}
```

### 6. 결과 요약
다음 정보를 사용자에게 보기 좋게 표시합니다:
- **status**: PENDING, RUNNING, SUCCESS, ERROR, FAILURE
- **score**: 점수 (0-100)
- **killed_mutants / total_mutants**: 잡은 mutant 개수
- **Golden 테스트 결과**: 통과/실패
- **주요 에러 메시지** (실패 시)

## 예시 출력
```
✅ 제출 완료!
Submission ID: 2a18dc78-3740-4d9a-88bb-9b1b87744eca
Status: SUCCESS
Score: 100/100
Killed Mutants: 19/19

Golden Code: ✅ 통과 (4 tests passed)
Buggy Code: ✅ 19개 mutant 모두 탐지
```

**장점:**
- JSON 작성 오류 방지
- submission_id 수동 복사 불필요
- 결과 자동 추적
- 빠른 피드백 루프
