/**
 * MutantStatusBoard - 숨겨진 버그 현황판 (블라인드 스타일)
 * 버그 개수만 표시하고, 구체적 내용은 숨김 (스포일러 방지)
 */

"use client";

import { Bug, HelpCircle } from "lucide-react";

interface MutantStatusBoardProps {
  /** 숨겨진 버그 총 개수 */
  totalMutants: number;
  /** 컴팩트 모드 (한 줄 표시) */
  compact?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 숫자를 알파벳 라벨로 변환 (0 → A, 1 → B, ..., 25 → Z, 26 → AA)
 */
function getMutantLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A-Z
  }
  // 26 이상: AA, AB, ...
  const first = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const second = String.fromCharCode(65 + (index % 26));
  return first + second;
}

export default function MutantStatusBoard({
  totalMutants,
  compact = false,
  className = "",
}: MutantStatusBoardProps) {
  if (totalMutants <= 0) return null;

  // 컴팩트 모드: 한 줄 요약
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg ${className}`}
      >
        <Bug className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-slate-300">
          숨겨진 버그 <span className="font-bold text-amber-400">{totalMutants}</span>개
        </span>
        <span className="text-xs text-slate-500">• 테스트로 찾아보세요!</span>
      </div>
    );
  }

  // 풀 모드: 개별 뮤턴트 리스트
  return (
    <div
      className={`bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            숨겨진 버그
          </span>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">
          {totalMutants}개
        </span>
      </div>

      {/* Mutant List */}
      <div className="p-2 space-y-1">
        {Array.from({ length: totalMutants }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/50 rounded hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-500/70">🦠</span>
              <span className="text-sm font-mono text-slate-400">
                Mutant {getMutantLabel(index)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="text-xs">미발견</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Hint */}
      <div className="px-3 py-2 bg-slate-900/30 border-t border-slate-700">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>💡</span>
          <span>테스트 코드를 작성하여 숨겨진 버그를 모두 찾아보세요!</span>
        </p>
      </div>
    </div>
  );
}
