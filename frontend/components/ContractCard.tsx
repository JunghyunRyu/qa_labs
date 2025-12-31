/**
 * ContractCard - 함수 Contract(시그니처 + 반환 인터페이스) 표시
 *
 * M5-1: 좌측 Contract 고정 노출
 */

"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, FileCode, Copy, Check } from "lucide-react";
import type { ContractInfo, InterfaceDefinition } from "@/lib/contractParser";

interface ContractCardProps {
  contract: ContractInfo;
  defaultExpanded?: boolean;
}

/**
 * Python 구문 강조를 위한 토큰화
 */
function tokenizePython(code: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];

  // 간단한 토큰화 (정규식 기반)
  const pattern = /("[^"]*"|'[^']*')|(\b(?:def|class|return|if|else|for|while|import|from|as|None|True|False)\b)|(\b(?:int|float|str|bool|list|dict|tuple|set|Any|Optional|Union|List|Dict|Tuple|Set)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|(\b[a-z_][a-zA-Z0-9_]*\b)|(->|:|\(|\)|\[|\]|,|=)|(\s+)|(.)/g;

  let match;
  while ((match = pattern.exec(code)) !== null) {
    const [, string, keyword, builtin, className, identifier, operator, whitespace, other] = match;

    if (string) {
      tokens.push({ type: 'string', value: string });
    } else if (keyword) {
      tokens.push({ type: 'keyword', value: keyword });
    } else if (builtin) {
      tokens.push({ type: 'builtin', value: builtin });
    } else if (className) {
      tokens.push({ type: 'class', value: className });
    } else if (identifier) {
      tokens.push({ type: 'identifier', value: identifier });
    } else if (operator) {
      tokens.push({ type: 'operator', value: operator });
    } else if (whitespace) {
      tokens.push({ type: 'whitespace', value: whitespace });
    } else if (other) {
      tokens.push({ type: 'other', value: other });
    }
  }

  return tokens;
}

/**
 * 토큰을 JSX로 렌더링
 */
function renderTokens(tokens: Array<{ type: string; value: string }>) {
  return tokens.map((token, i) => {
    const colorClass = {
      keyword: 'text-pink-400',
      builtin: 'text-cyan-400',
      class: 'text-yellow-300',
      string: 'text-green-400',
      identifier: 'text-blue-300',
      operator: 'text-gray-400',
      whitespace: '',
      other: 'text-gray-300',
    }[token.type] || 'text-gray-300';

    return (
      <span key={i} className={colorClass}>
        {token.value}
      </span>
    );
  });
}

/**
 * 구문 강조된 코드 블록
 */
function SyntaxHighlightedCode({ code }: { code: string }) {
  const tokens = useMemo(() => tokenizePython(code), [code]);

  return (
    <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
      {renderTokens(tokens)}
    </pre>
  );
}

/**
 * 인터페이스 정의 표시 컴포넌트
 */
function InterfaceDisplay({ iface }: { iface: InterfaceDefinition }) {
  const code = useMemo(() => {
    const lines: string[] = [];
    lines.push(`class ${iface.name}:`);

    if (iface.docstring) {
      // 짧은 docstring은 한 줄로
      if (iface.docstring.length < 50 && !iface.docstring.includes('\n')) {
        lines.push(`    """${iface.docstring}"""`);
      } else {
        lines.push(`    """`);
        lines.push(`    ${iface.docstring}`);
        lines.push(`    """`);
      }
    }

    for (const field of iface.fields) {
      lines.push(`    ${field.name}: ${field.type}`);
    }

    return lines.join('\n');
  }, [iface]);

  return <SyntaxHighlightedCode code={code} />;
}

/**
 * 복사 버튼 (내부용)
 */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-slate-700 transition-colors"
      title="복사"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
      )}
    </button>
  );
}

/**
 * ContractCard - 메인 컴포넌트
 */
export default function ContractCard({ contract, defaultExpanded = true }: ContractCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 요약 문자열 (접힘 상태에서 표시)
  const summaryText = useMemo(() => {
    const { functionName, returnType } = contract;
    if (returnType) {
      return `${functionName}(...) → ${returnType}`;
    }
    return `${functionName}(...)`;
  }, [contract]);

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">함수 Contract</span>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <code className="text-xs text-slate-400 font-mono truncate max-w-[180px]">
              {summaryText}
            </code>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* 내용 */}
      {isExpanded && (
        <div className="border-t border-slate-700">
          {/* 함수 시그니처 */}
          <div className="p-3 bg-slate-800/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 overflow-x-auto">
                <SyntaxHighlightedCode code={contract.rawSignature} />
              </div>
              <CopyBtn text={contract.rawSignature} />
            </div>
          </div>

          {/* 반환 인터페이스 (있는 경우) */}
          {contract.returnInterface && (
            <div className="p-3 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs text-purple-400 font-medium">반환 타입</span>
                <span className="text-xs text-slate-500">|</span>
                <span className="text-xs text-slate-400">{contract.returnType}</span>
              </div>
              <div className="bg-slate-800/30 rounded p-2 overflow-x-auto">
                <InterfaceDisplay iface={contract.returnInterface} />
              </div>
            </div>
          )}

          {/* 파라미터 요약 (옵션) */}
          {contract.parameters.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-800/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs text-purple-400 font-medium">파라미터</span>
                <span className="text-xs text-slate-500">({contract.parameters.length}개)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contract.parameters.map((param, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono
                      ${param.optional
                        ? 'bg-slate-700/50 text-slate-300'
                        : 'bg-purple-900/30 text-purple-300'
                      }`}
                    title={param.default ? `기본값: ${param.default}` : undefined}
                  >
                    <span className="text-blue-300">{param.name}</span>
                    <span className="text-slate-500 mx-0.5">:</span>
                    <span className="text-cyan-400">{param.type}</span>
                    {param.optional && (
                      <span className="text-slate-500 ml-0.5">?</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
