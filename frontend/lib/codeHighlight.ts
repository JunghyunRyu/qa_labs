/**
 * 시맨틱 코드 하이라이팅 유틸리티
 * 인라인 코드 내용에 따라 적절한 색상 클래스 반환
 */

type CodeColorConfig = {
  bg: string;
  text: string;
  border?: string;
};

/**
 * 코드 내용에 따른 시맨틱 색상 결정
 * - True/통과 → 초록색
 * - False/실패 → 분홍/빨간색
 * - Exception/Error → 빨간색
 * - 숫자/값 → 노란색
 * - 연산자/비교 → 파란색
 * - 기본 → 회색
 */
export function getCodeColorClass(content: string): CodeColorConfig {
  const text = content.trim();

  // True, 통과, 성공 계열 - 어두운 초록 배경
  if (/^(True|true|Pass|pass|성공|통과|OK|ok)$/.test(text)) {
    return {
      bg: "bg-emerald-950",
      text: "text-emerald-400",
      border: "border-emerald-800",
    };
  }

  // False, 실패 계열 - 어두운 분홍 배경
  if (/^(False|false|Fail|fail|실패)$/.test(text)) {
    return {
      bg: "bg-rose-950",
      text: "text-rose-400",
      border: "border-rose-800",
    };
  }

  // Exception, Error 계열 - 어두운 빨강 배경
  if (/(Error|Exception|에러|오류|raise|Raise)/.test(text)) {
    return {
      bg: "bg-red-950",
      text: "text-red-400",
      border: "border-red-800",
    };
  }

  // None, null 계열 - 어두운 보라 배경
  if (/^(None|null|Null|NULL|nil)$/.test(text)) {
    return {
      bg: "bg-purple-950",
      text: "text-purple-400",
      border: "border-purple-800",
    };
  }

  // 비교 연산자/조건 - 어두운 하늘색 배경
  if (/^[<>=!]+$/.test(text) || /^(<=|>=|==|!=|<|>)$/.test(text)) {
    return {
      bg: "bg-sky-950",
      text: "text-sky-400",
      border: "border-sky-800",
    };
  }

  // 범위 표현 (0 ≤ x ≤ 100 형태)
  if (/[≤≥<>].*[≤≥<>]/.test(text) || /^\d+\s*[<≤].*[<≤]\s*\d+$/.test(text)) {
    return {
      bg: "bg-sky-950",
      text: "text-sky-400",
      border: "border-sky-800",
    };
  }

  // 순수 숫자 - 어두운 노란색 배경
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return {
      bg: "bg-amber-950",
      text: "text-amber-400",
      border: "border-amber-800",
    };
  }

  // 할당문 (x = value)
  if (/=/.test(text) && !/[<>!=]/.test(text.replace(/=/g, ""))) {
    return {
      bg: "bg-amber-950",
      text: "text-amber-400",
      border: "border-amber-800",
    };
  }

  // 기본 스타일 (일반 코드) - 기존 스타일 유지
  return {
    bg: "bg-slate-700",
    text: "text-slate-200",
    border: "border-slate-600",
  };
}

/**
 * Tailwind 클래스 문자열로 반환
 */
export function getCodeClassName(content: string): string {
  const config = getCodeColorClass(content);
  return `px-1.5 py-0.5 ${config.bg} ${config.text} rounded text-xs font-mono border ${config.border || "border-transparent"}`;
}
