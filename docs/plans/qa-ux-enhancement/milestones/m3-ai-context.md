# M3: AI 코치 컨텍스트 강화

> **프로젝트**: QA Arena UX 대폭 개선
> **크기**: 소
> **상태**: 대기

---

## 목표

AI 코치가 사용자의 현재 상황(에러 로그, 테스트 결과)을 자동으로 파악하여 더 맥락에 맞는 답변을 제공하도록 컨텍스트 주입을 강화합니다.

---

## 범위

### 포함
- 로컬 테스트 에러 로그 자동 컨텍스트 추가
- 채점 결과 (Kill Ratio) 컨텍스트 추가
- AI 빠른 질문 버튼에 상황별 동적 질문 추가

### 제외
- AI 시스템 프롬프트 대폭 변경
- 토큰 정책 변경
- 코드 삽입 기능 (onInsertCode)

---

## 태스크 목록

| # | 태스크 | 파일 | 상태 |
|---|-------|------|------|
| 1 | PromptContext 타입에 에러 로그 필드 추가 | `types/ai.ts` | [ ] |
| 2 | AICoachPanel에 에러 로그 자동 포함 로직 | `components/AICoachPanel.tsx` | [ ] |
| 3 | Backend ai_coach_service에 에러 로그 처리 추가 | `app/services/ai_coach_service.py` | [ ] |
| 4 | 빠른 질문 버튼 동적화 (에러 있을 때 "왜 실패했나요?") | `components/AICoachPanel.tsx` | [ ] |

---

## 관련 파일

### 수정 대상
- `frontend/components/AICoachPanel.tsx` - AI 코치 패널
- `frontend/types/ai.ts` - AI 관련 타입
- `backend/app/services/ai_coach_service.py` - AI 서비스

### 참조 파일
- `frontend/components/LocalTestResultPanel.tsx` - 에러 로그 소스
- `frontend/app/problems/[id]/page.tsx` - 상태 관리

---

## 기술 노트

### PromptContext 확장

```typescript
// 기존
interface PromptContext {
  codeContext?: string;
}

// 확장
interface PromptContext {
  codeContext?: string;
  errorLog?: string;           // pytest 에러 메시지
  testResult?: {
    passed: number;
    failed: number;
    errors: number;
  };
  killRatio?: number;          // 채점 결과 Kill Ratio
  lastAction?: 'local_test' | 'submit' | 'none';
}
```

### 에러 로그 자동 포함 로직

```typescript
// page.tsx에서 상태 관리
const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);

// AICoachPanel로 전달
<AICoachPanel
  promptContext={{
    codeContext: code,
    errorLog: lastTestResult?.error?.slice(0, 500),  // 최대 500자
    testResult: lastTestResult?.summary,
    lastAction: lastTestResult ? 'local_test' : 'none',
  }}
/>
```

### Backend 에러 로그 처리

```python
# ai_coach_service.py

ERROR_CONTEXT_TEMPLATE = """
[최근 테스트 결과]
- 통과: {passed}개
- 실패: {failed}개
- 에러: {errors}개

[에러 로그 (최근)]
```
{error_log}
```
"""

def generate_response(..., error_log: Optional[str] = None, ...):
    context_parts = []

    if code_context:
        context_parts.append(f"현재 코드:\n```python\n{code_context}\n```")

    if error_log:
        context_parts.append(f"테스트 에러:\n```\n{error_log[:300]}\n```")

    # 합쳐서 전달
```

### 동적 빠른 질문 버튼

```typescript
const quickQuestions = useMemo(() => {
  const base = [
    { label: "힌트 주세요", prompt: "이 문제를 어떻게 접근해야 할까요?" },
    { label: "핵심 개념", prompt: "이 문제의 핵심 개념이 뭐야?" },
  ];

  // 에러가 있을 때 추가
  if (promptContext?.errorLog) {
    base.unshift({
      label: "왜 실패했나요?",
      prompt: "내 테스트가 왜 실패했는지 설명해줘",
    });
  }

  // Kill Ratio가 낮을 때 추가
  if (promptContext?.killRatio !== undefined && promptContext.killRatio < 50) {
    base.push({
      label: "더 많은 버그 잡기",
      prompt: "어떤 경계값을 더 테스트해야 할까요?",
    });
  }

  return base;
}, [promptContext]);
```

---

## 의존성

### 선행 마일스톤
- M1: 결과 패널 개선 (Kill Ratio 정보 필요)

### 후속 마일스톤
- M4: Pyodide 최적화

---

## 완료 조건

- [ ] 로컬 테스트 에러 발생 시 AI 컨텍스트에 자동 포함
- [ ] "왜 실패했나요?" 동적 버튼 표시
- [ ] Kill Ratio 기반 동적 질문 표시
- [ ] 기존 토큰 비용 유지 (과도한 컨텍스트 방지)
- [ ] 기존 테스트 회귀 없음

---

## 테스트 체크리스트

### 단위 테스트
- [ ] 에러 로그 truncation (500자 제한)
- [ ] 동적 버튼 조건 로직

### 수동 검증
- [ ] 에러 발생 후 AI에게 "왜 실패했나요?" 질문
- [ ] AI가 에러 내용을 언급하는지 확인
- [ ] Kill Ratio 낮을 때 힌트 버튼 표시

---

## 진행 기록

| 시간 | 작업 | 결과 |
|------|------|------|
| - | 마일스톤 시작 | - |

---

## 노트

- 에러 로그는 최대 300~500자로 제한 (토큰 절약)
- AI 시스템 프롬프트는 변경하지 않음 (이미 "질문 유도" 원칙 적용됨)
- 게스트 사용자도 동일하게 적용
