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
  const pathname = usePathname();

  // id로 buggy_code 찾기
  const getBuggyCode = (bugId: number): string | undefined => {
    const impl = buggyImplementations.find(b => b.id === bugId);
    return impl?.buggy_code;
  };

  // 버그 설명에서 힌트 생성 (실패 이유 요약)
  const getWhyFailed = (description: string): string => {
    // description에서 핵심 키워드 추출하여 힌트 생성
    const hints: Record<string, string> = {
      "경계": "경계값 케이스를 테스트하지 않았습니다",
      "빈": "빈 입력에 대한 처리를 확인하지 않았습니다",
      "null": "null/undefined 처리를 테스트하지 않았습니다",
      "음수": "음수 입력에 대한 테스트가 누락되었습니다",
      "0": "0 또는 특수값 처리를 확인하지 않았습니다",
      "타입": "입력 타입 검증 테스트가 부족합니다",
      "예외": "예외 상황에 대한 테스트가 없습니다",
      "오버플로우": "큰 값이나 오버플로우 케이스를 놓쳤습니다",
      "중복": "중복 데이터 처리를 테스트하지 않았습니다",
      "순서": "순서나 정렬 관련 테스트가 부족합니다",
    };

    for (const [keyword, hint] of Object.entries(hints)) {
      if (description.includes(keyword)) {
        return hint;
      }
    }
    return "이 버그를 잡기 위한 테스트 케이스가 부족합니다";
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
                <div className="px-3 pb-3 pl-9 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  {/* Why Failed - 사용자 친화적 설명 */}
                  <div className="flex items-start gap-2 p-2 rounded-md bg-orange-950/40 border border-orange-800/30">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-orange-400/80 font-medium uppercase tracking-wide">
                        Why Failed
                      </span>
                      <p className="text-xs text-orange-200 mt-0.5 leading-relaxed">
                        {getWhyFailed(bug.description)}
                      </p>
                    </div>
                  </div>

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
                      // 비회원: 블러 처리된 코드 + 회원가입 유도
                      <div className="relative">
                        {/* 블러 처리된 코드 미리보기 */}
                        <div className="bg-slate-900/80">
                          <div className="px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50 flex items-center gap-1.5">
                            <Code2 className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] text-slate-500 font-medium">버그가 있는 코드</span>
                          </div>
                          <pre className="p-2 text-xs text-slate-500 overflow-x-auto leading-relaxed blur-[6px] select-none">
                            <code>{buggyCode || "def buggy_function(x):\n    # 버그가 숨어있는 코드...\n    return result"}</code>
                          </pre>
                        </div>
                        {/* 잠금 해제 오버레이 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
                          <Lock className="w-5 h-5 text-slate-400 mb-2" />
                          <p className="text-xs text-slate-300 mb-2">버그 코드를 확인하려면</p>
                          <Link
                            href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500
                                       text-white text-xs font-medium rounded-md transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            회원가입
                          </Link>
                        </div>
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
