/**
 * MissedBugAccordion - 놓친 버그 아코디언 UI
 * 접고 펼칠 수 있는 상세 정보 + 회원/비회원 차별화
 *
 * UX 전략:
 * - 비회원: 버그 설명 + 블러 처리된 코드 (회원가입 유도)
 * - 회원: 버그 설명 + 코드 예시 표시
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, Lock, Code2, Bug, AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { BuggyImplementation } from "@/types/problem";

// submission.execution_log에서 추출한 놓친 버그
interface MissedBug {
  id: number;
  description: string;
  testOutput?: string;  // 더 이상 표시하지 않음 (raw pytest log)
}

interface MissedBugAccordionProps {
  /** 놓친 버그 목록 (submission에서 추출) */
  bugs: MissedBug[];
  /** Problem의 buggy_implementations (코드 스니펫 매칭용) */
  buggyImplementations?: BuggyImplementation[];
  className?: string;
}

export default function MissedBugAccordion({
  bugs,
  buggyImplementations = [],
  className = ""
}: MissedBugAccordionProps) {
  const { isAuthenticated } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // id로 buggy_code 찾기
  const getBuggyCode = (bugId: number): string | undefined => {
    const impl = buggyImplementations.find(b => b.id === bugId);
    return impl?.buggy_code;
  };

  const toggleBug = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (bugs.length === 0) return null;

  return (
    <div className={`rounded-lg border border-orange-800/50 bg-orange-900/20 ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-orange-800/50">
        <div className="flex items-center gap-2 text-orange-300">
          <Bug className="w-4 h-4" />
          <span className="font-medium text-sm">놓친 버그 ({bugs.length}개)</span>
        </div>
      </div>

      {/* Bug Accordion List */}
      <div className="divide-y divide-orange-800/30">
        {bugs.map((bug) => {
          const isExpanded = expandedIds.has(bug.id);
          const buggyCode = getBuggyCode(bug.id);

          return (
            <div key={bug.id} className="group">
              {/* Accordion Header - Always visible */}
              <button
                onClick={() => toggleBug(bug.id)}
                className="w-full px-3 py-2.5 flex items-start gap-2 text-left hover:bg-orange-900/30 transition-colors"
              >
                {/* Expand/Collapse Icon */}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5 transition-transform" />
                )}

                {/* Bug Title */}
                <span className={`text-sm flex-1 ${isExpanded ? "text-orange-200 font-medium" : "text-orange-300"}`}>
                  {bug.description}
                </span>
              </button>

              {/* Accordion Content - Expanded only */}
              {isExpanded && (
                <div className="px-3 pb-3 pl-9 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {/* 테스트 출력이 있으면 표시 */}
                  {bug.testOutput && (
                    <div className="text-xs text-orange-300/70 leading-relaxed bg-orange-950/30 rounded px-2 py-1.5">
                      <span className="text-orange-400/80 font-medium">테스트 출력: </span>
                      <span className="font-mono">{bug.testOutput}</span>
                    </div>
                  )}

                  {/* 코드 스니펫 영역 - 회원/비회원 차별화 */}
                  <div className="rounded-md overflow-hidden border border-orange-800/30">
                    {isAuthenticated ? (
                      // 회원: 코드 스니펫 표시
                      buggyCode ? (
                        <div className="bg-slate-900/80">
                          <div className="px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-1.5">
                            <Code2 className="w-3 h-3 text-orange-400" />
                            <span className="text-[10px] text-slate-400 font-medium">버그가 있는 코드</span>
                          </div>
                          <pre className="p-2 text-xs text-slate-300 overflow-x-auto leading-relaxed">
                            <code>{buggyCode}</code>
                          </pre>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-900/50 text-xs text-slate-500 text-center">
                          코드 예시가 제공되지 않습니다
                        </div>
                      )
                    ) : (
                      // 비회원: 잠금 표시 + Premium 유도
                      <div className="p-3 bg-slate-900/50 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-800/50 transition-colors">
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          예시 코드 보기
                          <span className="ml-1.5 px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded text-[10px] font-medium">
                            Premium
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
