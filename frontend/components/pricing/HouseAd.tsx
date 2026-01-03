/**
 * HouseAd component for self-promotional upgrade banners.
 * PR5: UX/Pricing
 *
 * localStorage 기반 빈도 제어로 하루 1회만 노출
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, Zap, Trophy, TrendingUp } from "lucide-react";
import type { PlanKey } from "@/types/plan";
import { PLAN_CONFIGS } from "@/types/plan";

const STORAGE_KEY = "house_ad_dismissed";
const SHOW_INTERVAL_HOURS = 24;

interface HouseAdProps {
  variant?: "banner" | "sidebar" | "modal" | "floating";
  targetPlan?: PlanKey;
  placement?: string; // 어디서 노출되는지 (analytics용)
  className?: string;
  /** 빈도 제어 무시 (항상 표시) */
  alwaysShow?: boolean;
  /** 커스텀 메시지 */
  customMessage?: string;
  /** 커스텀 CTA 텍스트 */
  customCTA?: string;
}

interface DismissedData {
  timestamp: number;
  placement?: string;
}

/**
 * localStorage에서 dismissed 상태 확인
 */
function shouldShowAd(placement?: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;

    const data: DismissedData = JSON.parse(stored);
    const hoursElapsed = (Date.now() - data.timestamp) / (1000 * 60 * 60);

    return hoursElapsed >= SHOW_INTERVAL_HOURS;
  } catch {
    return true;
  }
}

/**
 * dismissed 상태 저장
 */
function setDismissed(placement?: string): void {
  if (typeof window === "undefined") return;

  try {
    const data: DismissedData = {
      timestamp: Date.now(),
      placement,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

/**
 * 광고 문구 랜덤 선택
 */
const AD_MESSAGES = [
  {
    icon: Zap,
    title: "AI 코치와 함께 더 빠르게 성장하세요",
    description: "심화 분석과 성공 패턴 분석으로 테스트 실력을 한 단계 업그레이드",
  },
  {
    icon: Trophy,
    title: "100점 달성의 비결을 알고 싶다면?",
    description: "심화 분석 기능으로 완벽한 테스트 코드 작성법을 배우세요",
  },
  {
    icon: TrendingUp,
    title: "더 많은 문제, 더 빠른 성장",
    description: "월 300개 이상의 토큰으로 제한 없이 학습하세요",
  },
];

export default function HouseAd({
  variant = "banner",
  targetPlan = "lite",
  placement,
  className = "",
  alwaysShow = false,
  customMessage,
  customCTA,
}: HouseAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // 빈도 제어 확인
    if (alwaysShow || shouldShowAd(placement)) {
      setIsVisible(true);
      // 랜덤 메시지 선택
      setMessageIndex(Math.floor(Math.random() * AD_MESSAGES.length));
    }
  }, [alwaysShow, placement]);

  const handleDismiss = () => {
    setDismissed(placement);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const plan = PLAN_CONFIGS[targetPlan];
  const message = AD_MESSAGES[messageIndex];
  const IconComponent = message.icon;

  // Banner variant (상단/하단 배너)
  if (variant === "banner") {
    return (
      <div
        className={`relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <IconComponent className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium truncate">
                {customMessage || message.title}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/problems?ref=${placement || "house_ad"}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold bg-white text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {customCTA || "시작하기"}
              </Link>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant (사이드바 카드)
  if (variant === "sidebar") {
    return (
      <div
        className={`relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 ${className}`}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            {plan.name} 트랙
          </span>
        </div>

        <h4 className="font-semibold text-[var(--text-primary)] mb-1">
          {customMessage || message.title}
        </h4>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          {message.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">
            무료로 시작하기
          </span>
          <Link
            href={`/problems?ref=${placement || "house_ad_sidebar"}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {customCTA || "시작하기"}
          </Link>
        </div>
      </div>
    );
  }

  // Floating variant (우하단 플로팅)
  if (variant === "floating") {
    return (
      <div
        className={`fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">{plan.name} 트랙 추천</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded text-white"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex-shrink-0">
              <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                {customMessage || message.title}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {message.description}
              </p>
            </div>
          </div>

          <Link
            href={`/problems?ref=${placement || "house_ad_floating"}`}
            className="block w-full text-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
          >
            {customCTA || "트랙 시작하기"}
          </Link>
        </div>
      </div>
    );
  }

  // Modal variant (모달 내 콘텐츠)
  return (
    <div className={`text-center p-6 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 mb-4">
        <IconComponent className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      </div>

      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {customMessage || message.title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        {message.description}
      </p>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-[var(--text-secondary)]">
          무료로 시작할 수 있어요
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href={`/problems?ref=${placement || "house_ad_modal"}`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {customCTA || "트랙 시작하기"}
        </Link>
        <button
          onClick={handleDismiss}
          className="w-full px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}

/**
 * 특정 위치에서 HouseAd 표시 여부 확인
 * (컴포넌트 외부에서 조건부 렌더링 시 사용)
 */
export function useHouseAdVisibility(): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setShouldShow(shouldShowAd());
  }, []);

  return shouldShow;
}

/**
 * HouseAd 수동 dismiss (외부에서 호출)
 */
export function dismissHouseAd(placement?: string): void {
  setDismissed(placement);
}
