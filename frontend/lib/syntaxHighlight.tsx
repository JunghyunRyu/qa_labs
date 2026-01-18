/**
 * Python 구문 강조 유틸리티
 *
 * HintPanel.tsx에서 추출한 공용 유틸리티
 * AI 코드 블록, 힌트 패널 등에서 재사용
 */

import React from "react";

/**
 * 코드 블록인지 감지 (Python 코드 패턴)
 */
export function isCodeBlock(text: string): boolean {
  const trimmed = text.trim();
  const codePatterns = [
    /^(def |class |import |from |@pytest|@)/m,
    /^(if |for |while |try:|except:|with )/m,
    /^(assert |return |yield |raise )/m,
    /^\s*(def |class )/m,
  ];
  return codePatterns.some(pattern => pattern.test(trimmed));
}

/**
 * 한글 라벨을 Python 주석으로 변환 (복사 시 주석으로 처리되도록)
 */
export function preprocessCodeForPython(code: string): string {
  return code
    .replace(/^(예시 코드|예시|코드 예시|힌트|참고):?\s*$/gm, '# $1')
    .trim();
}

/**
 * Python 구문 강조 (간단한 정규식 기반)
 */
export function highlightPythonSyntax(code: string): React.ReactNode {
  const preprocessed = preprocessCodeForPython(code);
  const lines = preprocessed.split('\n');

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let tokenKey = 0;

    // 들여쓰기 처리
    const indentMatch = remaining.match(/^(\s+)/);
    if (indentMatch) {
      const indent = indentMatch[1];
      tokens.push(<span key={tokenKey++} className="whitespace-pre">{indent}</span>);
      remaining = remaining.slice(indent.length);
    }

    // 토큰 패턴 (순서 중요)
    const patterns: { regex: RegExp; className: string }[] = [
      // 문자열 (큰따옴표, 작은따옴표, 삼중따옴표)
      { regex: /^("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/, className: "text-green-400" },
      // 주석
      { regex: /^(#.*)$/, className: "text-slate-500 italic" },
      // 데코레이터
      { regex: /^(@\w+)/, className: "text-yellow-400" },
      // 키워드
      { regex: /^(def|class|import|from|return|yield|raise|if|elif|else|for|while|try|except|finally|with|as|assert|pass|break|continue|lambda|and|or|not|in|is|None|True|False)\b/, className: "text-purple-400" },
      // 내장 함수
      { regex: /^(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr)\b/, className: "text-cyan-400" },
      // 숫자
      { regex: /^(\d+\.?\d*)/, className: "text-orange-400" },
      // 함수 호출 (이름 뒤에 괄호)
      { regex: /^(\w+)(?=\()/, className: "text-blue-400" },
      // 일반 식별자
      { regex: /^(\w+)/, className: "text-slate-300" },
      // 연산자 및 구두점
      { regex: /^([=+\-*/<>!&|%^~]+|[()[\]{},.:;])/, className: "text-slate-400" },
      // 공백
      { regex: /^(\s+)/, className: "" },
    ];

    while (remaining.length > 0) {
      let matched = false;

      for (const { regex, className } of patterns) {
        const match = remaining.match(regex);
        if (match) {
          const text = match[0];
          tokens.push(
            <span key={tokenKey++} className={className}>
              {text}
            </span>
          );
          remaining = remaining.slice(text.length);
          matched = true;
          break;
        }
      }

      // 매칭되지 않은 문자는 그대로 출력
      if (!matched) {
        tokens.push(<span key={tokenKey++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return (
      <div key={lineIdx} className="leading-relaxed">
        {tokens.length > 0 ? tokens : <span>&nbsp;</span>}
      </div>
    );
  });
}
