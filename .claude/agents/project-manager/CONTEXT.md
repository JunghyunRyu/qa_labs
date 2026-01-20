# Project Manager Agent - 컨텍스트 가이드

> 이 문서는 Project Manager Agent가 작업 시 참조해야 하는 컨텍스트 정보를 제공합니다.

---

## 프로젝트 구조 이해

### 표준 프로젝트 레이아웃

```
docs/plans/{project-slug}/
├── spec.md                    # 사양서 (필수)
├── milestones/
│   ├── m1-{name}.md          # 마일스톤 1
│   ├── m2-{name}.md          # 마일스톤 2
│   └── m3-{name}.md          # 마일스톤 3
└── final-report.md           # 완료 시 생성
```

### 코드베이스 구조

```
qa_labs/
├── backend/
│   ├── app/
│   │   ├── services/         # 비즈니스 로직
│   │   ├── routers/          # API 엔드포인트
│   │   ├── models/           # DB 모델
│   │   └── core/             # 설정, 의존성
│   └── tests/                # pytest 테스트
├── frontend/
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   ├── pages/            # Next.js 페이지
│   │   └── services/         # API 클라이언트
│   └── workers/              # Pyodide Web Worker
└── docs/
    ├── specs/                # 기능 명세
    ├── plans/                # 진행 중 프로젝트
    └── issues/               # 이슈/마일스톤
```

---

## 마일스톤 상태 관리

### 상태 값

| 상태 | 설명 | 표시 |
|------|------|------|
| `대기` | 아직 시작하지 않음 | 기본 상태 |
| `진행 중` | 현재 작업 중 | 마일스톤 헤더에 표시 |
| `완료` | 모든 태스크 및 테스트 통과 | 체크마크 |
| `블록됨` | 에스컬레이션 대기 | 경고 표시 |

### 상태 업데이트 방법

마일스톤 파일의 헤더에서 상태 변경:

```markdown
# M1: 기능명

> **프로젝트**: 프로젝트명
> **크기**: 소
> **상태**: 진행 중    <-- 이 부분 업데이트
```

### 태스크 체크리스트 업데이트

```markdown
| # | 태스크 | 파일 | 상태 |
|---|-------|------|------|
| 1 | 서비스 함수 추가 | `app/services/x.py` | [x] |  <-- 완료
| 2 | API 엔드포인트 | `app/routers/x.py` | [ ] |  <-- 미완료
```

---

## QA Engineer Agent 호출 가이드

### 언제 호출하는가?

1. **마일스톤 태스크 구현 완료 후**
   - 모든 태스크가 구현된 후 테스트 요청

2. **수정 후 재검증**
   - 테스트 실패 수정 후 재테스트

### 호출 방법

```
Task 도구 사용:
- subagent_type: "qa-engineer"
- prompt: |
    다음 기능에 대한 테스트를 작성하고 실행해주세요.

    [대상 기능]
    - {기능 설명}

    [변경 파일]
    - backend/app/services/{file}.py
    - backend/app/routers/{file}.py

    [테스트 요구사항]
    - 정상 케이스 테스트
    - 경계값 테스트
    - 에러 핸들링 테스트

    [기존 테스트]
    - backend/tests/test_{관련}.py 회귀 테스트도 실행해주세요
```

### 결과 해석

QA Engineer Agent 결과에서 확인:

```
[테스트 결과]
✅ 통과: 15개   <-- 모두 통과 시 마일스톤 완료
❌ 실패: 2개    <-- 실패 시 수정 사이클
⏭️ 스킵: 1개
```

---

## 코딩 규칙

### Python (Backend)

```python
# 타입 힌트 필수
def create_item(data: ItemCreate) -> Item:
    pass

# docstring 권장
def complex_function(param: str) -> dict:
    """
    복잡한 함수에 대한 설명.

    Args:
        param: 파라미터 설명

    Returns:
        반환값 설명
    """
    pass

# 예외 처리
from app.core.exceptions import ValidationError

if not valid:
    raise ValidationError("잘못된 입력")
```

### TypeScript (Frontend)

```typescript
// 인터페이스 정의
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// 컴포넌트
export function MyComponent({ value, onChange }: ComponentProps) {
  return <div>{value}</div>;
}
```

---

## 테스트 실행 명령어

### Backend

```bash
# 전체 테스트
cd backend && pytest tests/ -v

# 특정 파일 테스트
pytest tests/test_submission.py -v

# 키워드로 필터링
pytest tests/ -k "validate" -v

# 커버리지 포함
pytest tests/ --cov=app -v
```

### Frontend

```bash
# Jest 테스트
cd frontend && npm test

# 특정 파일
npm test -- component.test.tsx
```

---

## 에스컬레이션 체크리스트

에스컬레이션 전 확인:

- [ ] 최소 3회 시도했는가?
- [ ] 각 시도의 접근법이 다른가?
- [ ] 실패 원인을 명확히 파악했는가?
- [ ] 권장 조치를 준비했는가?

에스컬레이션 보고서 필수 항목:
1. 문제 설명
2. 시도한 접근법 (3가지)
3. 각 실패 원인
4. 권장 조치 옵션

---

## 변경 크기 가이드라인

### 200줄 이상 변경 시

변경이 200줄을 초과하면 사용자 확인을 요청해야 합니다.

```
========================================
⚠️ 대규모 변경 확인 요청
========================================

변경 예정:
- backend/app/services/xxx.py: +150줄
- frontend/src/components/xxx.tsx: +80줄
- 합계: +230줄

계속 진행하시겠습니까?
```

### 마일스톤 크기 초과 시

마일스톤이 원래 크기를 초과하면 분할을 제안합니다.

```
마일스톤 M2가 예상보다 큽니다.
- 원래 크기: 중 (100-300줄)
- 현재 예상: 450줄

권장: M2를 M2a, M2b로 분할
```

---

## 관련 문서 참조

| 문서 | 경로 | 내용 |
|------|------|------|
| AI 안전 수칙 | `docs/specs/AI_SAFETY_PROTOCOLS.md` | 필독 - 금지 사항 |
| API 명세 | `docs/claude-context/api-reference.md` | 엔드포인트 정보 |
| DB 스키마 | `docs/claude-context/db-schema.md` | 테이블 구조 |
| 에러 처리 | `docs/specs/ERROR_HANDLING.md` | 에러 코드 |

---

## 빠른 참조

### 자주 사용하는 패턴

**서비스 함수 추가:**
```python
# backend/app/services/{name}.py
from app.models import Model
from app.schemas import Schema

def new_function(data: Schema) -> Model:
    # 구현
    pass
```

**API 엔드포인트 추가:**
```python
# backend/app/routers/{name}.py
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/endpoint")
async def endpoint(data: Schema):
    return await service.function(data)
```

**테스트 추가:**
```python
# backend/tests/test_{name}.py
import pytest
from app.services.{name} import function

class TestFunction:
    def test_normal_case(self):
        result = function(valid_input)
        assert result == expected
```

---

*Project Manager Agent Context v1.0*
