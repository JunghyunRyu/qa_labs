/**
 * Daily Bounty Banner - 일일 현상금 배너
 *
 * Mission Control 최상단에 표시되어 오늘의 미션을 안내합니다.
 * - 오늘의 문제 정보
 * - 스트릭 프로그레스 (3개 도트) + Pulse 애니메이션
 * - 남은 시간 카운트다운
 * - 보상 정보 (+5, 3일 연속 +50)
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Target,
  Flame,
  CheckCircle2,
  ChevronRight,
  Coins,
  Zap,
  Trophy,
} from "lucide-react";
import { getDailyBountyStatus } from "@/lib/api/daily-bounty";
import type { DailyBountyStatus } from "@/types/daily-bounty";
import { useAuth } from "@/lib/auth/AuthContext";

// 시간 포맷팅
function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}


export default function DailyBountyBanner() {
  const { isAuthenticated, user, refreshAuth } = useAuth();

  const [status, setStatus] = useState<DailyBountyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasRefreshedAuth, setHasRefreshedAuth] = useState(false);

  // 상태 가져오기
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDailyBountyStatus();
      setStatus(data);
      setTimeRemaining(data.time_remaining_seconds);
      setError(null);
    } catch {
      setError("일일 현상금 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 완료 상태일 때 user 정보 갱신 (토큰 반영)
  useEffect(() => {
    if (status?.is_completed && !hasRefreshedAuth) {
      setHasRefreshedAuth(true);
      refreshAuth();
    }
  }, [status?.is_completed, hasRefreshedAuth, refreshAuth]);

  // 카운트다운 타이머
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // 자정이 되면 새로운 문제 가져오기
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, fetchStatus]);

  // 로딩 스켈레톤 (Slim Ribbon)
  if (loading) {
    return (
      <div className="mb-6 bg-gradient-to-r from-amber-900/20 to-slate-900 border border-amber-500/20 rounded-xl px-4 py-3 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-amber-500/20 rounded" />
              <div className="h-4 w-48 bg-amber-500/10 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block h-8 w-16 bg-amber-500/10 rounded-full" />
            <div className="h-9 w-20 bg-amber-500/20 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 또는 문제 없음
  if (error || !status?.problem) {
    return null; // 에러 시 배너 숨김
  }

  const { problem, is_completed, user_streak, streak_progress, rewards } = status;
  const streakDots = [0, 1, 2]; // 3일 기준

  // 스트릭 활성 상태 (1일 이상 연속)
  const hasActiveStreak = user_streak >= 1;
  // 보너스 직전 상태 (2일 연속 = 오늘 완료하면 3일)
  const isNearBonus = streak_progress === rewards.streak_threshold - 1 && !is_completed;

  // ============================================
  // Slim Ribbon 스타일 - 1줄 좌우 배치
  // ============================================
  return (
    <div
      className={`mb-6 relative overflow-hidden rounded-xl border transition-all ${
        is_completed
          ? "bg-gradient-to-r from-emerald-900/20 to-slate-900 border-emerald-500/30"
          : "bg-gradient-to-r from-amber-900/20 to-slate-900 border-amber-500/20"
      }`}
    >
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* [Left] 미션 정보 그룹 */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 아이콘 */}
            <div
              className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                is_completed
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {is_completed ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <Target className="w-5 h-5" />
              )}
            </div>

            {/* 텍스트 정보 (2줄 압축) */}
            <div className="flex flex-col min-w-0">
              {/* Row 1: 라벨 + 타이머 */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-semibold ${
                  is_completed ? "text-emerald-400" : "text-amber-500"
                }`}>
                  {is_completed ? "미션 완료!" : "오늘의 미션"}
                </span>
                <span className={`w-1 h-1 rounded-full ${
                  is_completed ? "bg-emerald-500/50" : "bg-amber-500/50"
                }`} />
                <span className={`font-mono ${
                  is_completed ? "text-emerald-400/70" : "text-amber-400/80"
                }`}>
                  {formatTimeRemaining(timeRemaining)} 남음
                </span>
              </div>
              {/* Row 2: 제목 (truncate) */}
              <div className="font-bold text-slate-100 truncate text-sm">
                {problem.title}
              </div>
            </div>
          </div>

          {/* [Right] 보상 & 액션 그룹 */}
          <div className="flex items-center gap-3 shrink-0">
            {/* 보상 칩 */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${
                is_completed
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>+{rewards.base_reward}</span>
              {is_completed && status.completion?.streak_bonus_granted && (
                <span className="text-emerald-300">+{rewards.streak_bonus}</span>
              )}
            </div>

            {/* 스트릭 (데스크탑에서만) */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs">
                <Flame
                  className={`w-4 h-4 ${
                    hasActiveStreak ? "text-orange-400 animate-pulse" : "text-slate-600"
                  }`}
                />
                {/* 보너스 게이지 (3일 주기) */}
                <div className="flex items-center gap-0.5">
                  {streakDots.map((i) => {
                    // 보너스 달성 직후(오늘 완료 + 보너스 지급됨) → 모든 도트 채움
                    // 그 외 → streak_progress 기준 (새 사이클 진행도)
                    const isFilled = (is_completed && status.completion?.streak_bonus_granted)
                      ? true
                      : i < streak_progress;
                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          isFilled ? "bg-orange-400" : "bg-slate-600"
                        }`}
                      />
                    );
                  })}
                </div>
                <span className={hasActiveStreak ? "text-orange-300" : "text-slate-500"}>
                  {user_streak > 0 ? `${user_streak}일` : "시작"}
                </span>
                {/* 보너스 직전 힌트 */}
                {isNearBonus && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold rounded">
                    <Zap className="w-3 h-3" />
                    +{rewards.streak_bonus}
                  </span>
                )}
              </div>
            )}

            {/* CTA 버튼 */}
            {is_completed ? (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">완료</span>
              </div>
            ) : (
              <Link
                href={`/problems/${problem.slug}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition-colors"
              >
                <span>도전</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
