"use client";

/**
 * UserStatsBar Component
 *
 * 문제 목록 상단에 표시되는 사용자 통계 바
 * - 해결한 문제 수 (진행률 바 포함)
 * - 나의 랭크
 * - 보유 토큰
 */

import { useAuth } from "@/lib/auth/AuthContext";
import { Trophy, Zap, Target } from "lucide-react";
import Link from "next/link";

// 랭크 정의
const RANKS = [
  { min: 0, max: 2, name: "Rookie", color: "text-slate-400" },
  { min: 3, max: 9, name: "Junior SDET", color: "text-emerald-400" },
  { min: 10, max: 19, name: "SDET", color: "text-blue-400" },
  { min: 20, max: 34, name: "Senior SDET", color: "text-purple-400" },
  { min: 35, max: Infinity, name: "QA Master", color: "text-amber-400" },
];

function getRank(solvedCount: number) {
  return RANKS.find((r) => solvedCount >= r.min && solvedCount <= r.max) || RANKS[0];
}

interface UserStatsBarProps {
  totalProblems: number;
}

export default function UserStatsBar({ totalProblems }: UserStatsBarProps) {
  const { isAuthenticated, user } = useAuth();

  // 비로그인 사용자는 강조된 CTA 표시
  if (!isAuthenticated) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/50 to-slate-900/50 border border-indigo-500/30 rounded-xl px-6 py-4 mb-6 backdrop-blur-sm shadow-lg shadow-indigo-500/5">
        {/* 배경 글로우 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-200 font-medium">로그인하고 성장 기록을 시작하세요</p>
              <p className="text-xs text-slate-400">풀이 기록, AI 분석, 랭킹 시스템 이용 가능</p>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            시작하기
          </Link>
        </div>
      </div>
    );
  }

  // 로그인 사용자 통계
  const solvedCount = user?.solved_count || 0;
  const tokenBalance = user?.token_balance || 0;
  const rank = getRank(solvedCount);
  const progressPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-6 py-4 mb-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 해결한 문제 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">해결한 문제</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{solvedCount}</span>
                <span className="text-sm text-slate-500">/ {totalProblems}</span>
              </div>
            </div>
          </div>
          {/* 진행률 바 */}
          <div className="hidden sm:block w-32">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 text-right">{progressPercent}%</p>
          </div>
        </div>

        {/* 나의 랭크 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">나의 랭크</p>
            <p className={`text-sm font-bold ${rank.color}`}>{rank.name}</p>
          </div>
        </div>

        {/* 보유 토큰 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">보유 토큰</p>
            <p className="text-lg font-bold text-amber-400">{tokenBalance}</p>
          </div>
        </div>

        {/* 대시보드 링크 */}
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
        >
          상세 통계 보기
        </Link>
      </div>
    </div>
  );
}
