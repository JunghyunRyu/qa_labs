/**
 * Error Sanitizer - 에러 메시지를 파싱하여 초보자 친화적인 힌트 제공
 * M6-2: Very Easy 실패율 감소를 위한 한글 가이드 시스템
 */

export interface SanitizedError {
  type: string;
  originalMessage: string;
  hint: string;
  suggestion?: string;
}

interface ErrorPattern {
  hint: string;
  suggestion?: string;
}

const ERROR_PATTERNS: Record<string, ErrorPattern> = {
  SyntaxError: {
    hint: "문법 오류입니다. 괄호, 콜론(:), 들여쓰기를 확인하세요.",
    suggestion: "def 뒤에 콜론(:)이 있는지 확인해보세요.",
  },
  IndentationError: {
    hint: "들여쓰기 오류입니다. 공백 4칸을 일관되게 사용하세요.",
    suggestion: "탭과 공백을 섞어 사용하지 않았는지 확인해보세요.",
  },
  NameError: {
    hint: "정의되지 않은 변수입니다. 변수명 오타를 확인하세요.",
    suggestion: "변수를 사용하기 전에 먼저 정의했는지 확인해보세요.",
  },
  TypeError: {
    hint: "타입 오류입니다. 함수 인자 타입을 확인하세요.",
    suggestion: "문자열과 숫자를 더하려고 하지 않았는지 확인해보세요.",
  },
  AssertionError: {
    hint: "assert 실패입니다. 예상값과 실제값을 비교해보세요.",
    suggestion: "assert 문의 좌변과 우변 값을 print로 확인해보세요.",
  },
  ModuleNotFoundError: {
    hint: "import 오류입니다. pytest만 사용 가능합니다.",
    suggestion: "외부 라이브러리는 사용할 수 없습니다.",
  },
  ImportError: {
    hint: "import 오류입니다. 모듈 이름을 확인하세요.",
    suggestion: "pytest와 target 모듈만 import 가능합니다.",
  },
  AttributeError: {
    hint: "존재하지 않는 속성/메서드입니다.",
    suggestion: "객체의 타입과 사용 가능한 메서드를 확인해보세요.",
  },
  ValueError: {
    hint: "잘못된 값입니다. 함수에 전달한 값을 확인하세요.",
    suggestion: "함수가 기대하는 값의 범위와 형식을 확인해보세요.",
  },
  ZeroDivisionError: {
    hint: "0으로 나눌 수 없습니다.",
    suggestion: "나누기 연산 전에 분모가 0이 아닌지 확인하세요.",
  },
  IndexError: {
    hint: "인덱스 범위 오류입니다.",
    suggestion: "리스트의 길이를 초과하는 인덱스를 사용하지 않았는지 확인하세요.",
  },
  KeyError: {
    hint: "딕셔너리에 해당 키가 없습니다.",
    suggestion: "딕셔너리에 키가 존재하는지 먼저 확인해보세요.",
  },
};

/**
 * stderr에서 에러를 파싱하여 사용자 친화적인 힌트 반환
 * @param stderr - 테스트 실행 결과의 stderr
 * @returns 파싱된 에러 정보 또는 null (알 수 없는 에러)
 */
export function sanitizeError(stderr: string): SanitizedError | null {
  if (!stderr || stderr.trim() === "") {
    return null;
  }

  for (const [errorType, info] of Object.entries(ERROR_PATTERNS)) {
    if (stderr.includes(errorType)) {
      // 에러 메시지에서 상세 정보 추출
      const regex = new RegExp(`${errorType}:\\s*(.+?)(?:\\n|$)`);
      const match = stderr.match(regex);
      const originalMessage = match?.[1]?.trim() || extractLastLine(stderr);

      return {
        type: errorType,
        originalMessage,
        hint: info.hint,
        suggestion: info.suggestion,
      };
    }
  }

  return null; // 알 수 없는 에러
}

/**
 * stderr의 마지막 의미 있는 줄 추출
 */
function extractLastLine(stderr: string): string {
  const lines = stderr.trim().split("\n").filter(line => line.trim());
  return lines[lines.length - 1] || stderr.slice(0, 100);
}

/**
 * 에러 타입만 추출 (로깅/분석용)
 */
export function getErrorType(stderr: string): string | null {
  for (const errorType of Object.keys(ERROR_PATTERNS)) {
    if (stderr.includes(errorType)) {
      return errorType;
    }
  }
  return null;
}
