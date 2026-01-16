# M6-2: Error Sanitizer (에러 힌트 시스템)

> **우선순위**: P0 (월요일 배포)
> **목표 지표**: Very Easy 실패율 12-16% → 5% 미만

---

## 배경

Very Easy 난이도에서 12-16%의 실패율 발생. 주요 원인은 문법 오류와 테스트 프레임워크 오용. 실패 시 즉각적인 한글 가이드(Syntax Hint) 제공으로 초심자 이탈 방지.

## 구현 범위

### 1. 에러 파싱 유틸리티 (신규)

**파일**: `frontend/lib/errorSanitizer.ts`

```typescript
interface SanitizedError {
  type: string;
  originalMessage: string;
  hint: string;
  suggestion?: string;
}

const ERROR_PATTERNS: Record<string, { hint: string; suggestion?: string }> = {
  SyntaxError: {
    hint: "문법 오류입니다. 괄호, 콜론(:), 들여쓰기를 확인하세요.",
    suggestion: "def 뒤에 콜론(:)이 있는지 확인해보세요."
  },
  IndentationError: {
    hint: "들여쓰기 오류입니다. 공백 4칸을 일관되게 사용하세요.",
    suggestion: "탭과 공백을 섞어 사용하지 않았는지 확인해보세요."
  },
  NameError: {
    hint: "정의되지 않은 변수입니다. 변수명 오타를 확인하세요.",
    suggestion: "변수를 사용하기 전에 먼저 정의했는지 확인해보세요."
  },
  TypeError: {
    hint: "타입 오류입니다. 함수 인자 타입을 확인하세요.",
    suggestion: "문자열과 숫자를 더하려고 하지 않았는지 확인해보세요."
  },
  AssertionError: {
    hint: "assert 실패입니다. 예상값과 실제값을 비교해보세요.",
    suggestion: "assert 문의 좌변과 우변 값을 print로 확인해보세요."
  },
  ModuleNotFoundError: {
    hint: "import 오류입니다. pytest만 사용 가능합니다.",
    suggestion: "외부 라이브러리는 사용할 수 없습니다."
  },
  AttributeError: {
    hint: "존재하지 않는 속성/메서드입니다.",
    suggestion: "객체의 타입과 사용 가능한 메서드를 확인해보세요."
  }
};

export function sanitizeError(stderr: string): SanitizedError | null {
  for (const [errorType, info] of Object.entries(ERROR_PATTERNS)) {
    if (stderr.includes(errorType)) {
      // 에러 메시지에서 상세 정보 추출
      const match = stderr.match(new RegExp(`${errorType}: (.+)`));
      return {
        type: errorType,
        originalMessage: match?.[1] || stderr,
        hint: info.hint,
        suggestion: info.suggestion
      };
    }
  }
  return null; // 알 수 없는 에러
}
```

### 2. 힌트 카드 컴포넌트 (신규)

**파일**: `frontend/components/SyntaxHintCard.tsx`

```tsx
import { Lightbulb, ChevronDown } from "lucide-react";
import { SanitizedError } from "@/lib/errorSanitizer";

interface SyntaxHintCardProps {
  error: SanitizedError;
  originalStderr?: string;
}

export function SyntaxHintCard({ error, originalStderr }: SyntaxHintCardProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            {error.type}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {error.hint}
          </p>
          {error.suggestion && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Tip: {error.suggestion}
            </p>
          )}
        </div>
      </div>

      {originalStderr && (
        <details className="mt-3">
          <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">
            원본 에러 메시지 보기
          </summary>
          <pre className="mt-2 text-xs bg-white dark:bg-neutral-900 p-2 rounded overflow-x-auto">
            {originalStderr}
          </pre>
        </details>
      )}
    </div>
  );
}
```

### 3. SubmissionResult 통합

**파일**: `frontend/components/SubmissionResult.tsx`

Line 175 (수정 가이드 섹션) 이후에 추가:

```tsx
import { sanitizeError } from "@/lib/errorSanitizer";
import { SyntaxHintCard } from "./SyntaxHintCard";

// FAILURE 상태 섹션 내부
{failureInfo?.stderr && (() => {
  const sanitized = sanitizeError(failureInfo.stderr);
  return sanitized ? (
    <SyntaxHintCard
      error={sanitized}
      originalStderr={failureInfo.stderr}
    />
  ) : null;
})()}
```

---

## 검증 방법

1. 의도적으로 SyntaxError 발생 코드 제출
   ```python
   def test_example()  # 콜론 누락
       assert True
   ```
2. SyntaxHintCard 표시 확인
3. 다양한 에러 타입별 힌트 메시지 확인:
   - IndentationError
   - NameError
   - AssertionError
   - TypeError

## 모니터링

- Sentry에서 미인식 에러 패턴 수집
- 힌트 제공 후 재시도 성공률 추적 (GA4)

## 참고 파일

- `frontend/components/SubmissionResult.tsx:143-211` - FAILURE 섹션
- `backend/app/services/submission_service.py` - 기존 에러 메시지 정의
