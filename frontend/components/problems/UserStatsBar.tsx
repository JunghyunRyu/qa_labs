"use client";

/**
 * UserStatsBar Component
 *
 * 문제 목록 상단에 표시되는 사용자 통계 바 (Mission Control)
 * - 해결한 문제 수 (진행률 바 포함)
 * - 나의 랭크 (클릭 시 가이드 팝오버)
 * - 보유 토큰
 */

import { useAuth } from "@/lib/auth/AuthContext";
import { usePathname } from "next/navigation";
import { Zap, Target } from "lucide-react";
import Link from "next/link";
import RankBadge from "@/components/RankBadge";

interface UserStatsBarProps {
  totalProblems: number;
}

export default function UserStatsBar({ totalProblems }: UserStatsBarProps) {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();

  // 비로그인 사용자는 강조된 CTA 표시
  if (!isAuthenticated) {
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;

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
            href={loginUrl}
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
  const monthlyTokens = user?.token_balance || 0;
  const dailyBonus = user?.daily_bonus_remaining || 0;
  const totalTokens = monthlyTokens + dailyBonus;
  const progressPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  // 슬림한 한 줄 띠 형태
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 mb-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 text-sm">
        {/* 통계 아이템들 */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* 해결한 문제 */}
          <div
            className="flex items-center gap-1.5 cursor-help"
            title={`해결한 문제: ${solvedCount}개 / 전체 ${totalProblems}개`}
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">{solvedCount}</span>
            <span className="text-slate-500">/ {totalProblems}</span>
            <span className="text-slate-600 text-xs">({progressPercent}%)</span>
          </div>

          {/* 구분선 */}
          <div className="hidden sm:block w-px h-4 bg-slate-700" />

          {/* 나의 랭크 (클릭 가능한 RankBadge) */}
          <RankBadge
            solvedCount={solvedCount}
            showProgress={true}
            showNextHint={true}
          />

          {/* 구분선 */}
          <div className="hidden sm:block w-px h-4 bg-slate-700" />

          {/* 보유 토큰 */}
          <div
            className="flex items-center gap-1.5 cursor-help"
            title={`월간 토큰: ${monthlyTokens}개 / 일간 보너스: ${dailyBonus}개`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-amber-400">{totalTokens}</span>
          </div>
        </div>

        {/* 대시보드 링크 */}
        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-md transition-colors border border-slate-700"
        >
          상세 통계
          <span className="text-slate-500">→</span>
        </Link>
      </div>
    </div>
  );
}
