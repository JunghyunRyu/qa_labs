/**
 * HintPanel - 단계별 힌트 표시 컴포넌트 (M5-5)
 *
 * 3단계 힌트를 progressive disclosure 방식으로 표시합니다.
 * - Level 1: 방향성 힌트 (패널티 없음)
 * - Level 2: 구체적 접근법 (-10점)
 * - Level 3: 코드 예시 (-20점)
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { Lightbulb, Lock, Unlock, ChevronDown, ChevronUp, AlertTriangle, Clipboard, Check, Compass, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHints, HINT_LEVELS } from "@/hooks/useHints";
import { useAuth } from "@/lib/auth/AuthContext";
import { ConversionModal } from "@/components/conversion";

/**
 * 코드 블록인지 감지 (Python 코드 패턴)
 */
function isCodeBlock(text: string): boolean {
  const trimmed = text.trim();
  // Python 코드 시작 패턴
  const codePatterns = [
    /^(def |class |import |from |@pytest|@)/m,  // 함수, 클래스, import, 데코레이터
    /^(if |for |while |try:|except:|with )/m,   // 제어문
    /^(assert |return |yield |raise )/m,        // 키워드
    /^\s*(def |class )/m,                        // 들여쓰기된 정의
  ];
  return codePatterns.some(pattern => pattern.test(trimmed));
}

/**
 * 한글 라벨을 Python 주석으로 변환 (복사 시 주석으로 처리되도록)
 */
function preprocessCodeForPython(code: string): string {
  return code
    .replace(/^(예시 코드|예시|코드 예시|힌트|참고):?\s*$/gm, '# $1')
    .trim();
}

/**
 * Python 구문 강조 (간단한 정규식 기반)
 */
function highlightPythonSyntax(code: string): React.ReactNode {
  const preprocessed = preprocessCodeForPython(code);
  const lines = preprocessed.split('\n');

  return lines.map((line, lineIdx) => {
    // 각 라인을 토큰화하여 구문 강조 적용
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let tokenKey = 0;

    // 들여쓰기 처리
    const indentMatch = remaining.match(/^(\s+)/);
    if (indentMatch) {
      const indent = indentMatch[1];
      // 4스페이스를 pl-4로 변환
      const indentLevel = Math.floor(indent.length / 4);
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

/**
 * 코드 블록 컴포넌트 (구문 강조 + 복사 버튼)
 */
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // 전처리된 코드 복사 (한글 라벨이 주석으로 변환됨)
      const processedCode = preprocessCodeForPython(code);
      await navigator.clipboard.writeText(processedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [code]);

  return (
    <div className="relative group mt-2">
      {/* 코드 컨테이너 - Github Dark Dimmed 스타일 */}
      <div className="p-3 bg-[#0d1117] rounded-lg border border-amber-500/20 font-mono text-xs overflow-x-auto">
        {highlightPythonSyntax(code)}
      </div>

      {/* 복사 버튼 (호버 시 등장) */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-md opacity-0 group-hover:opacity-100 transition-all border border-slate-700"
        title={copied ? "복사됨!" : "코드 복사"}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Clipboard className="w-4 h-4" />
        )}
      </button>

      {/* 복사됨 툴팁 */}
      {copied && (
        <span className="absolute top-2 right-10 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg">
          복사됨!
        </span>
      )}
    </div>
  );
}

/**
 * 코드 블록 렌더링 (syntax highlighting 스타일)
 */
function renderCodeBlock(code: string): React.ReactNode {
  return <CodeBlock code={code} />;
}

/**
 * 힌트 내용을 포맷팅하여 가독성 향상
 * - 코드 블록 감지 및 코드 스타일 렌더링
 * - (1), (2)... 패턴을 리스트로 분리
 * - 인라인 코드 하이라이팅
 */
function formatHintContent(content: string): React.ReactNode {
  // 1. 트리플 백틱으로 감싸진 코드 블록 처리
  if (content.includes("```")) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <div className="space-y-3">
        {parts.map((part, idx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            // 코드 블록 - 언어 태그 제거
            const codeContent = part.slice(3, -3).replace(/^python\n?/i, "").trim();
            return <div key={idx}>{renderCodeBlock(codeContent)}</div>;
          }
          // 일반 텍스트
          const trimmed = part.trim();
          if (!trimmed) return null;
          return <div key={idx}>{formatTextContent(trimmed)}</div>;
        })}
      </div>
    );
  }

  // 2. 전체가 코드처럼 보이면 코드 블록으로 렌더링
  if (isCodeBlock(content)) {
    return renderCodeBlock(content);
  }

  // 3. 일반 텍스트 포맷팅
  return formatTextContent(content);
}

/**
 * 코드처럼 보이는 라인인지 감지 (비교 연산, 표현식 등)
 */
function isCodeLikeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // 비교 연산자 패턴: 0 < age, age <= 120, x == y 등
  const comparisonPattern = /\b\w+\s*[<>=!]+\s*\w+/;
  // vs 패턴으로 두 표현식 비교: 0 < age vs 0 <= age
  const vsComparisonPattern = /\S+\s+vs\s+\S+/i;
  // 함수 호출 패턴: func(arg)
  const functionCallPattern = /\w+\([^)]*\)/;
  // 변수 할당 패턴: x = value
  const assignmentPattern = /^\w+\s*=\s*.+/;

  return (
    comparisonPattern.test(trimmed) ||
    vsComparisonPattern.test(trimmed) ||
    functionCallPattern.test(trimmed) ||
    assignmentPattern.test(trimmed)
  );
}

/**
 * 코드 패턴 추출 (줄 내에서 코드 부분 찾기)
 */
function extractCodePattern(text: string): { before: string; code: string; after: string } | null {
  // vs 패턴: "0 < age vs 0 <= age" 형태
  const vsMatch = text.match(/(\S+\s*[<>=!]+\s*\S+\s+vs\s+\S+\s*[<>=!]+\s*\S+)/i);
  if (vsMatch) {
    const idx = text.indexOf(vsMatch[1]);
    return {
      before: text.slice(0, idx).trim(),
      code: vsMatch[1].trim(),
      after: text.slice(idx + vsMatch[1].length).trim()
    };
  }

  // 비교 표현식이 문장 끝에 있는 경우: "테스트해보세요. x < y"
  const endComparisonMatch = text.match(/[.!?]\s*(\w+\s*[<>=!]+\s*\w+(?:\s*[<>=!]+\s*\w+)*)$/);
  if (endComparisonMatch) {
    const idx = text.lastIndexOf(endComparisonMatch[1]);
    return {
      before: text.slice(0, idx).replace(/[.!?]\s*$/, '').trim(),
      code: endComparisonMatch[1].trim(),
      after: ''
    };
  }

  return null;
}

/**
 * 텍스트와 코드라인을 분리하여 렌더링
 */
function renderMixedContent(content: string): React.ReactNode {
  const segments: { type: 'text' | 'code'; content: string }[] = [];

  // 먼저 줄 단위로 분리
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 전체가 코드 라인인 경우
    if (isCodeLikeLine(trimmedLine) && !trimmedLine.includes('테스트') && !trimmedLine.includes('확인')) {
      segments.push({ type: 'code', content: trimmedLine });
      continue;
    }

    // 줄 내에서 코드 패턴 추출 시도
    const extracted = extractCodePattern(trimmedLine);
    if (extracted) {
      if (extracted.before) {
        segments.push({ type: 'text', content: extracted.before });
      }
      segments.push({ type: 'code', content: extracted.code });
      if (extracted.after) {
        segments.push({ type: 'text', content: extracted.after });
      }
    } else {
      // 텍스트만 있는 경우 - 이전 텍스트 세그먼트와 병합
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.type === 'text') {
        lastSegment.content += '\n' + trimmedLine;
      } else {
        segments.push({ type: 'text', content: trimmedLine });
      }
    }
  }

  // 코드 세그먼트가 없으면 null 반환 (기존 방식 사용)
  if (!segments.some(s => s.type === 'code')) {
    return null;
  }

  return (
    <div className="space-y-2">
      {segments.map((segment, idx) => (
        segment.type === 'code' ? (
          <div
            key={idx}
            className="px-3 py-2 bg-[#0d1117] rounded-lg border border-amber-500/20 font-mono text-sm text-slate-300"
          >
            {segment.content}
          </div>
        ) : (
          <div key={idx} className="text-slate-300">
            {highlightInlineCode(segment.content)}
          </div>
        )
      ))}
    </div>
  );
}

/**
 * 텍스트 내용 포맷팅 (번호 리스트 + 인라인 코드)
 */
function formatTextContent(content: string): React.ReactNode {
  // 먼저 코드라인 분리 시도
  const mixedContent = renderMixedContent(content);
  if (mixedContent) {
    return mixedContent;
  }

  // 번호 패턴으로 분리: (1), (2), (3) 등
  const parts = content.split(/(\(\d+\))/g).filter(Boolean);

  if (parts.length <= 1) {
    // 번호 패턴이 없으면 인라인 코드 하이라이팅만 적용
    return <span>{highlightInlineCode(content)}</span>;
  }

  const items: { number: string; content: string }[] = [];
  let currentItem: { number: string; content: string } | null = null;

  for (const part of parts) {
    if (/^\(\d+\)$/.test(part)) {
      if (currentItem) {
        items.push(currentItem);
      }
      currentItem = { number: part, content: "" };
    } else if (currentItem) {
      currentItem.content += part;
    } else {
      items.push({ number: "", content: part });
    }
  }
  if (currentItem) {
    items.push(currentItem);
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className={item.number ? "flex gap-2" : ""}>
          {item.number && (
            <span className="font-semibold text-amber-500 shrink-0">
              {item.number}
            </span>
          )}
          <span className={item.number ? "flex-1" : "block mb-2 font-medium text-slate-300"}>
            {highlightInlineCode(item.content.trim())}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 인라인 코드 하이라이팅 (backtick 감지)
 */
function highlightInlineCode(text: string): React.ReactNode {
  return text.split(/(`[^`]+`)/).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 mx-0.5 bg-slate-700/50 text-amber-300 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * 힌트 레벨별 아이콘 렌더링
 */
function HintLevelIcon({ iconName, className = "" }: { iconName: string; className?: string }) {
  switch (iconName) {
    case "lightbulb":
      return <Lightbulb className={className} />;
    case "compass":
      return <Compass className={className} />;
    case "code":
      return <Code className={className} />;
    default:
      return <Lightbulb className={className} />;
  }
}

interface HintPanelProps {
  problemId: number;
  className?: string;
}

export default function HintPanel({ problemId, className = "" }: HintPanelProps) {
  const [isHintPanelOpen, setIsHintPanelOpen] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [confirmingLevel, setConfirmingLevel] = useState<number | null>(null);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

  const {
    hintData,
    isLoading,
    error,
    hintsAvailable,
    viewHint,
    maxPenalty,
    isLevelLocked,
    isLevelViewed,
  } = useHints({ problemId });

  // 힌트가 없는 문제
  if (!hintsAvailable) {
    return null;
  }

  // 로딩 중
  if (isLoading && !hintData) {
    return (
      <div className={`bg-slate-900 border-t border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-amber-500">
          <Lightbulb className="w-4 h-4 animate-pulse" />
          <span className="text-sm">힌트 로딩 중...</span>
        </div>
      </div>
    );
  }

  const handleLevelClick = async (level: number) => {
    // 이미 본 힌트는 바로 토글
    if (isLevelViewed(level)) {
      setExpandedLevel(expandedLevel === level ? null : level);
      return;
    }

    // 잠긴 레벨
    if (isLevelLocked(level)) {
      return;
    }

    // 패널티가 있는 레벨은 확인 필요
    const hintInfo = HINT_LEVELS.find((h) => h.level === level);
    if (hintInfo && hintInfo.penalty > 0) {
      setConfirmingLevel(level);
      return;
    }

    // Level 1은 바로 보기
    await viewHint(level);
    setExpandedLevel(level);
  };

  const handleConfirmView = async () => {
    if (confirmingLevel === null) return;

    await viewHint(confirmingLevel);
    setExpandedLevel(confirmingLevel);
    setConfirmingLevel(null);
  };

  const handleCancelConfirm = () => {
    setConfirmingLevel(null);
  };

  // 힌트 상태 요약 계산
  const viewedCount = HINT_LEVELS.filter(h => isLevelViewed(h.level)).length;
  const hasAnyViewed = viewedCount > 0;

  return (
    <div className={`bg-slate-900 border-t border-slate-700 ${className}`}>
      {/* 헤더: 심플한 Amber 포인트 */}
      <button
        onClick={() => setIsHintPanelOpen(!isHintPanelOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-500">
            힌트 ({viewedCount}/3)
          </span>
        </div>
        <div className="flex items-center gap-3">
          {maxPenalty > 0 && (
            <span className="text-xs text-slate-500">
              최대 {100 - maxPenalty}점 가능
            </span>
          )}
          <motion.div
            animate={{ rotate: isHintPanelOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </motion.div>
        </div>
      </button>

      {/* 펼쳐지는 힌트 패널 */}
      <AnimatePresence>
        {isHintPanelOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* 힌트 레벨 버튼들 */}
            <div className="px-4 pb-4 space-y-2">
              {HINT_LEVELS.map((hint) => {
                const isViewed = isLevelViewed(hint.level);
                const isLocked = isLevelLocked(hint.level);
                const isExpanded = expandedLevel === hint.level;
                const hintContent = hintData?.hints[hint.level]?.content;

                return (
                  <div key={hint.level}>
                    {/* 레벨 버튼 - Flat & Clean 스타일 */}
                    <button
                      onClick={() => handleLevelClick(hint.level)}
                      disabled={isLoading}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        isExpanded && isViewed
                          ? "bg-slate-800 border border-amber-500/30"
                          : isViewed
                          ? "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                          : isLocked
                          ? "bg-slate-800/30 border border-slate-700/50 text-slate-500"
                          : "bg-slate-800/50 border border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HintLevelIcon
                          iconName={hint.iconName}
                          className={`w-4 h-4 ${isExpanded && isViewed ? "text-amber-400" : isLocked ? "text-slate-600" : "text-slate-400"}`}
                        />
                        <span className={`text-sm ${isExpanded && isViewed ? "font-bold text-amber-400" : isLocked ? "text-slate-500" : "text-slate-300"}`}>
                          {hint.label}
                        </span>
                        {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                      </div>

                      <div className="flex items-center gap-2">
                        {hint.penalty > 0 && isViewed && (
                          <span className="text-xs text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-500/20">
                            -{hint.penalty}점 적용됨
                          </span>
                        )}
                        {hint.penalty > 0 && !isViewed && !isLocked && (
                          <span className="text-xs text-slate-500">
                            -{hint.penalty}점
                          </span>
                        )}
                        {isViewed ? (
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""} ${isExpanded ? "text-amber-400" : "text-slate-500"}`} />
                        ) : !isLocked ? (
                          <Unlock className="w-4 h-4 text-slate-500" />
                        ) : null}
                      </div>
                    </button>

                    {/* 힌트 내용 - 열린 상태 */}
                    <AnimatePresence>
                      {isExpanded && isViewed && hintContent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 p-3 bg-slate-800/80 rounded-b-lg text-sm text-slate-300 border border-t-0 border-amber-500/20 leading-relaxed">
                            {formatHintContent(hintContent)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 블러 티저 - 잠긴 힌트 */}
                    {isLocked && (
                      <div className="mt-1 relative rounded-lg border border-slate-700/50 bg-slate-900/50 overflow-hidden">
                        {/* 블러 처리된 미리보기 */}
                        <div className="p-3 opacity-30 blur-[2px] select-none font-mono text-xs text-slate-400 leading-relaxed">
                          <div>def test_example():</div>
                          <div className="ml-4">result = function(...)</div>
                          <div className="ml-4">assert result == expected</div>
                        </div>
                        {/* 잠금 오버레이 */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                          <div className="text-center">
                            <Lock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                            <span className="text-xs text-slate-500">이전 힌트를 먼저 확인하세요</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 블러 티저 - 잠금 해제 가능한 힌트 (안 본 경우) */}
                    {!isViewed && !isLocked && hint.penalty > 0 && (
                      <div className="mt-1 relative rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden">
                        {/* 블러 처리된 미리보기 */}
                        <div className="p-3 opacity-30 blur-[2px] select-none font-mono text-xs text-slate-400 leading-relaxed">
                          <div>def test_example():</div>
                          <div className="ml-4">result = function(...)</div>
                          <div className="ml-4">assert result == expected</div>
                        </div>
                        {/* 잠금 해제 버튼 */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                          <button
                            onClick={() => handleLevelClick(hint.level)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all active:scale-95"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>잠금 해제 (-{hint.penalty}점)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="px-4 pb-3">
                {error === "AUTH_REQUIRED" ? (
                  <div className="flex items-center justify-between gap-2 text-sm text-amber-300 bg-amber-900/20 p-3 rounded-lg border border-amber-500/20">
                    <span>힌트를 보려면 로그인이 필요합니다</span>
                    <button
                      onClick={() => setIsConversionModalOpen(true)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      로그인하기
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-500/20">
                    {error}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ConversionModal for hint feature */}
      <ConversionModal
        isOpen={isConversionModalOpen}
        onClose={() => setIsConversionModalOpen(false)}
        feature="hint"
      />

      {/* 확인 모달 */}
      <AnimatePresence>
        {confirmingLevel !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={handleCancelConfirm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-xl p-6 max-w-sm mx-4 shadow-xl border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-900/30 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200">
                  힌트 확인
                </h3>
              </div>

              <p className="text-slate-400 mb-6">
                이 힌트를 보면{" "}
                <span className="font-bold text-red-400">
                  -{HINT_LEVELS.find((h) => h.level === confirmingLevel)?.penalty || 0}점
                </span>{" "}
                패널티가 적용됩니다.
                <br />
                <span className="text-sm text-slate-500">
                  (최대 점수: {100 - (HINT_LEVELS.find((h) => h.level === confirmingLevel)?.penalty || 0)}점)
                </span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmView}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                >
                  힌트 보기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
