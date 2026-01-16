/**
 * MissedBugAccordion - 놓친 버그 아코디언 UI
 * 접고 펼칠 수 있는 상세 정보 + 회원/비회원 차별화
 */

"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Lock, Code2, Bug, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

// 현재 submission에서 추출하는 missed bug 타입
interface MissedBug {
  id: number;
  description: string;
  testOutput?: string;
}

// Problem에서 가져오는 buggy implementation (코드 포함)
interface BuggyImplementation {
  id: number;
  bug_description: string;
  buggy_code?: string;
}

interface MissedBugAccordionProps {
  bugs: MissedBug[];
  /** Problem의 buggy_implementations (코드 스니펫 표시용) */
  buggyImplementations?: BuggyImplementation[];
  className?: string;
}

export default function MissedBugAccordion({ bugs, className = "" }: MissedBugAccordionProps) {
  const { isAuthenticated } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

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
                  {bug.bug_description}
                </span>
              </button>

              {/* Accordion Content - Expanded only */}
              {isExpanded && (
                <div className="px-3 pb-3 pl-9 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  {/* 상세 설명 (힌트가 있으면 표시) */}
                  {bug.hint && (
                    <div className="text-xs text-orange-300/80 leading-relaxed">
                      <span className="text-orange-400 font-medium">힌트: </span>
                      {bug.hint}
                    </div>
                  )}

                  {/* 코드 스니펫 영역 */}
                  <div className="rounded-md overflow-hidden border border-orange-800/30">
                    {isAuthenticated ? (
                      // 회원: 코드 스니펫 표시
                      bug.buggy_code ? (
                        <div className="bg-slate-900/80">
                          <div className="px-2 py-1 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-1.5">
                            <Code2 className="w-3 h-3 text-orange-400" />
                            <span className="text-[10px] text-slate-400 font-medium">버그 코드 예시</span>
                          </div>
                          <pre className="p-2 text-xs text-slate-300 overflow-x-auto">
                            <code>{bug.buggy_code}</code>
                          </pre>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-900/50 text-xs text-slate-500 text-center">
                          코드 예시가 없습니다
                        </div>
                      )
                    ) : (
                      // 비회원: 잠금 표시
                      <div className="p-3 bg-slate-900/50 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          예시 코드 보기
                          <span className="ml-1 px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded text-[10px] font-medium">
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
