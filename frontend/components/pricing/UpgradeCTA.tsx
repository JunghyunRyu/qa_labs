/**
 * UpgradeCTA component for upgrade call-to-action.
 * PR5: UX/Pricing
 *
 * 토큰 부족 시 또는 기능 제한 시 업그레이드 유도
 */

"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import type { PlanKey } from "@/types/plan";
import { PLAN_CONFIGS, formatPrice } from "@/types/plan";

interface UpgradeCTAProps {
  variant?: "inline" | "banner" | "modal";
  targetPlan?: PlanKey;
  reason?: "token_exhausted" | "feature_locked" | "daily_cap";
  onDismiss?: () => void;
  className?: string;
}

export default function UpgradeCTA({
  variant = "inline",
  targetPlan = "lite",
  reason = "token_exhausted",
  onDismiss,
  className = "",
}: UpgradeCTAProps) {
  const plan = PLAN_CONFIGS[targetPlan];

  const getMessage = () => {
    switch (reason) {
      case "token_exhausted":
        return "토큰을 모두 사용했습니다. 더 많은 AI 기능을 사용하려면 업그레이드하세요.";
      case "feature_locked":
        return "이 기능은 유료 플랜에서만 사용할 수 있습니다.";
      case "daily_cap":
        return "일일 사용 한도에 도달했습니다. 더 많이 사용하려면 업그레이드하세요.";
      default:
        return "더 많은 기능을 사용하려면 업그레이드하세요.";
    }
  };

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link
          href={`/pricing?plan=${targetPlan}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          업그레이드
        </Link>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`relative bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 ${className}`}
      >
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded"
          >
            ✕
          </button>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-medium">{getMessage()}</p>
              <p className="text-sm text-white/80">
                {plan.name} 플랜: 월 {formatPrice(plan.price_monthly)}부터
              </p>
            </div>
          </div>
          <Link
            href={`/pricing?plan=${targetPlan}`}
            className="flex-shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
          >
            업그레이드
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // modal variant
  return (
    <div className={`text-center p-6 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
        <Sparkles className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        더 많은 기능을 원하시나요?
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        {getMessage()}
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href={`/pricing?plan=${targetPlan}`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          플랜 보기
        </Link>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            나중에
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * TokenExhaustedBanner - 토큰 소진 시 배너
 */
export function TokenExhaustedBanner({
  onDismiss,
  className = "",
}: {
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <UpgradeCTA
      variant="banner"
      reason="token_exhausted"
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * DailyCapBanner - 일일 한도 도달 시 배너
 */
export function DailyCapBanner({
  onDismiss,
  className = "",
}: {
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <UpgradeCTA
      variant="banner"
      reason="daily_cap"
      targetPlan="pro"
      onDismiss={onDismiss}
      className={className}
    />
  );
}
