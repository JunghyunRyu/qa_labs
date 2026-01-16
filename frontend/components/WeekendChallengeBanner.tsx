/**
 * WeekendChallengeBanner component
 * 주말 랭킹 챌린지 배너 - 금요일 15:00 ~ 일요일 23:59 (KST) 동안 표시
 *
 * M6-4: 주말 트래픽 -70% 급감 완화를 위한 게이미피케이션 요소
 *
 * 디자인: 다크모드 최적화 - 어두운 골드 톤 + 빛나는 테두리
 */

"use client";

import { useState, useEffect } from "react";
import { Trophy, X, TrendingUp } from "lucide-react";
import Link from "next/link";

interface WeekendChallengeBannerProps {
  className?: string;
}

/**
 * 주말 챌린지 기간 여부 확인
 * 금요일 15:00 ~ 일요일 23:59 (KST)
 */
function isWeekendChallengePeriod(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0: 일, 5: 금, 6: 토
  const hour = now.getHours();

  // 금요일 15시 이후
  if (day === 5 && hour >= 15) return true;
  // 토요일 전체
  if (day === 6) return true;
  // 일요일 전체
  if (day === 0) return true;

  return false;
}

export function WeekendChallengeBanner({ className }: WeekendChallengeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // SSR 방어 + 주말 체크
    if (typeof window === "undefined") return;

    const dismissed = sessionStorage.getItem("qa_weekend_banner_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    setIsVisible(isWeekendChallengePeriod());
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("qa_weekend_banner_dismissed", "true");
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-yellow-500/30
                  bg-gradient-to-br from-yellow-900/20 via-slate-950 to-slate-950
                  shadow-[0_0_15px_-3px_rgba(234,179,8,0.15)]
                  h-full ${className}`}
    >
      {/* 배경 Glow 효과 - 좌상단에서 금빛 퍼짐 */}
      <div
        className="absolute top-0 left-0 w-40 h-40 bg-yellow-500/10
                   rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4"
      />

      <div className="relative px-4 py-3 h-full flex items-center">
        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-yellow-500/40
                     hover:text-yellow-400 transition-colors z-10"
          aria-label="배너 닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 아이콘 */}
        <div
          className="shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10
                     flex items-center justify-center mr-3"
        >
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-0.5">
            <span className="font-semibold text-yellow-500">주말 랭킹 챌린지</span>
            <span
              className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20
                         text-yellow-400 rounded font-bold"
            >
              진행중
            </span>
          </div>
          <p className="text-sm text-slate-300 truncate">
            <span className="font-bold text-yellow-400">Hard</span> 문제로 실력을 증명하세요
          </p>
        </div>

        {/* CTA 버튼 */}
        <Link
          href="/problems?difficulty=hard"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2
                     bg-yellow-500 hover:bg-yellow-400 text-slate-950
                     font-bold rounded-lg text-sm transition-colors ml-3"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">도전하기</span>
        </Link>
      </div>
    </div>
  );
}

export default WeekendChallengeBanner;
