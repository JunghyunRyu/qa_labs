/**
 * FunctionContractCard - 함수 계약(시그니처) 카드
 * 문제 패널 상단에 함수 시그니처를 명확히 표시
 */

"use client";

import { Code2 } from "lucide-react";
import CopyButton from "@/components/CopyButton";

interface FunctionContractCardProps {
  /** 함수 시그니처 (예: "def is_positive(n: int) -> bool:") */
  signature: string;
  /** 추가 클래스 */
  className?: string;
}

export default function FunctionContractCard({
  signature,
  className = "",
}: FunctionContractCardProps) {
  if (!signature) return null;

  return (
    <div
      className={`bg-purple-900/20 border border-purple-700/50 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 border-b border-purple-700/30">
        <Code2 className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
          Function Contract
        </span>
      </div>

      {/* Code Block */}
      <div className="relative group">
        <pre className="px-3 py-2.5 bg-slate-950/50 font-mono text-sm text-purple-300 overflow-x-auto">
          <code>{signature}</code>
        </pre>
        <CopyButton
          text={signature}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
}
