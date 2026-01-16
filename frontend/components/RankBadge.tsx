"use client";

/**
 * RankBadge Component
 *
 * 사용자의 랭크를 표시하고, 클릭 시 전체 랭크 가이드를 보여줍니다.
 * SDET Career Path 시각화의 핵심 컴포넌트입니다.
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trophy } from "lucide-react";
import { getUserRank, getAllRanks, type UserRankResult, type RankInfo } from "@/lib/rank";

interface RankBadgeProps {
  solvedCount: number;
  accuracy?: number;
  showProgress?: boolean;      // 프로그레스 바 표시 여부
  showNextHint?: boolean;      // "Next: SDET (3 left)" 표시 여부
  compact?: boolean;           // 컴팩트 모드 (아이콘만)
  className?: string;
}

export default function RankBadge({
  solvedCount,
  accuracy = 0,
  showProgress = false,
  showNextHint = false,
  compact = false,
  className = "",
}: RankBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const rankResult = getUserRank(solvedCount, accuracy);
  const { current, next, progress, solvedToNext, isMaxRank } = rankResult;

  // 컴팩트 모드 (아이콘만)
  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors ${className}`}
          title={`${current.icon} ${current.name}`}
        >
          <span className="text-sm">{current.icon}</span>
        </button>
        {isOpen && typeof document !== "undefined" && createPortal(
          <RankPopover
            rankResult={rankResult}
            solvedCount={solvedCount}
            onClose={() => setIsOpen(false)}
          />,
          document.body
        )}
      </>
    );
  }

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* 랭크 뱃지 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer`}
      >
        <span className="text-sm">{current.icon}</span>
        <span className={`font-semibold text-sm ${current.color}`}>
          {current.name}
        </span>
      </button>

      {/* 프로그레스 바 */}
      {showProgress && !isMaxRank && (
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${current.bgColor} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {showNextHint && next && (
            <span className="text-xs text-slate-500">
              Next: {next.name} ({solvedToNext} left)
            </span>
          )}
        </div>
      )}

      {/* 최고 랭크 표시 */}
      {showProgress && isMaxRank && (
        <span className="text-xs text-purple-400">🎉 Max Rank!</span>
      )}

      {/* 팝오버 - Portal로 body에 렌더링하여 z-index 문제 해결 */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <RankPopover
          rankResult={rankResult}
          solvedCount={solvedCount}
          onClose={() => setIsOpen(false)}
        />,
        document.body
      )}
    </div>
  );
}

// 랭크 가이드 팝오버
interface RankPopoverProps {
  rankResult: UserRankResult;
  solvedCount: number;
  onClose: () => void;
}

const RankPopover = ({ rankResult, solvedCount, onClose }: RankPopoverProps) => {
  const allRanks = getAllRanks();
  const { current, next, solvedToNext } = rankResult;
  const scrollAccumulator = useRef(0);

  // 스크롤 시 자동 닫기 (일정량 스크롤하면 닫기 의도로 해석)
  useEffect(() => {
    const SCROLL_THRESHOLD = 150; // 150px 이상 스크롤하면 닫기

    // wheel 이벤트를 캡처 단계에서 감지 (팝오버 내부 스크롤도 포함)
    const handleWheel = (e: WheelEvent) => {
      scrollAccumulator.current += Math.abs(e.deltaY);
      if (scrollAccumulator.current > SCROLL_THRESHOLD) {
        onClose();
      }
    };

    // 터치 스크롤 감지 (모바일)
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      scrollAccumulator.current += deltaY;
      touchStartY = e.touches[0].clientY;
      if (scrollAccumulator.current > SCROLL_THRESHOLD) {
        onClose();
      }
    };

    // 캡처 단계에서 이벤트 감지 (내부 스크롤도 감지)
    document.addEventListener("wheel", handleWheel, { capture: true, passive: true });
    document.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
    document.addEventListener("touchmove", handleTouchMove, { capture: true, passive: true });

    return () => {
      document.removeEventListener("wheel", handleWheel, { capture: true });
      document.removeEventListener("touchstart", handleTouchStart, { capture: true } as EventListenerOptions);
      document.removeEventListener("touchmove", handleTouchMove, { capture: true } as EventListenerOptions);
    };
  }, [onClose]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />

      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[85vw] sm:w-80 max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 헤더 */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100">SDET Career Path</h3>
            </div>
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            문제를 풀며 QA 전문가로 성장하세요
          </p>
        </div>

      {/* 랭크 목록 */}
      <div className="p-2 max-h-[50vh] overflow-y-auto">
        {allRanks.map((rank) => {
          const isCurrent = rank.level === current.level;
          const isAchieved = rank.level <= current.level;
          const isNext = rank.level === next?.level;

          return (
            <div
              key={rank.level}
              className={`relative flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                isCurrent
                  ? "bg-slate-800 border border-slate-600"
                  : isAchieved
                  ? "opacity-60"
                  : "opacity-40"
              }`}
            >
              {/* 레벨 연결선 */}
              {rank.level < allRanks.length && (
                <div className="absolute left-[22px] top-12 w-0.5 h-4 bg-slate-700" />
              )}

              {/* 아이콘 */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                  isCurrent ? "bg-slate-700 ring-2 ring-offset-2 ring-offset-slate-900" : "bg-slate-800"
                } ${isCurrent ? rank.color.replace("text-", "ring-") : ""}`}
              >
                {rank.icon}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${rank.color}`}>
                    {rank.name}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded">
                      현재
                    </span>
                  )}
                  {isNext && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-900/50 text-emerald-400 rounded">
                      다음
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-0.5">
                  {rank.description}
                </p>

                {/* 조건 */}
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                  <span>📝 {rank.minSolved}문제</span>
                  {rank.minAccuracy && (
                    <span>🎯 정답률 {rank.minAccuracy}%</span>
                  )}
                </div>

                {/* 다음 랭크까지 진행도 */}
                {isNext && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${current.bgColor}`}
                        style={{
                          width: `${Math.round(
                            (solvedCount / rank.minSolved) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {solvedCount}/{rank.minSolved}
                    </span>
                  </div>
                )}
              </div>

              {/* 달성 체크 */}
              {isAchieved && !isCurrent && (
                <div className="flex-shrink-0 text-emerald-400 text-sm">✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 푸터 */}
      {next && (
        <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">다음 승급까지</span>
            <span className="font-medium text-slate-200">
              {solvedToNext}문제 남음
            </span>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
