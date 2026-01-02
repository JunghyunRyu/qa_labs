/**
 * FeatureGate component for soft gating features.
 * PR5: UX/Pricing
 *
 * 유료 기능에 대해 Soft Gating (버튼 비활성화 + 툴팁) 제공
 */

"use client";

import { useState, useEffect, ReactNode } from "react";
import { Lock } from "lucide-react";
import type { FeatureKey, PlanKey } from "@/types/plan";
import { hasFeature } from "@/lib/api/plans";
import Link from "next/link";

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  tooltipText?: string;
  fallback?: ReactNode;
  showTooltip?: boolean;
}

export default function FeatureGate({
  feature,
  children,
  tooltipText = "이 기능은 유료 플랜에서 사용할 수 있습니다.",
  fallback,
  showTooltip = true,
}: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await hasFeature(feature);
      setHasAccess(access);
    };
    checkAccess();
  }, [feature]);

  // 로딩 중일 때는 children 표시 (깜빡임 방지)
  if (hasAccess === null) {
    return <>{children}</>;
  }

  // 접근 권한이 있으면 children 표시
  if (hasAccess) {
    return <>{children}</>;
  }

  // fallback이 있으면 fallback 표시
  if (fallback) {
    return <>{fallback}</>;
  }

  // 권한이 없으면 비활성화된 상태로 표시 (Soft Gating)
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* 비활성화된 children */}
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>

      {/* Lock 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="p-1.5 rounded-full bg-gray-900/70">
          <Lock className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* 툴팁 */}
      {showTooltip && showTip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
            <p className="mb-2">{tooltipText}</p>
            <Link
              href="/pricing"
              className="inline-block text-blue-400 hover:text-blue-300 underline"
            >
              플랜 업그레이드 →
            </Link>
          </div>
          {/* 툴팁 화살표 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * FeatureGateButton - 기능 게이팅이 적용된 버튼
 */
interface FeatureGateButtonProps {
  feature: FeatureKey;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function FeatureGateButton({
  feature,
  onClick,
  disabled = false,
  className = "",
  children,
}: FeatureGateButtonProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await hasFeature(feature);
      setHasAccess(access);
    };
    checkAccess();
  }, [feature]);

  const isDisabled = disabled || hasAccess === false;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => !hasAccess && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <button
        onClick={hasAccess ? onClick : undefined}
        disabled={isDisabled}
        className={`${className} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {children}
        {hasAccess === false && (
          <Lock className="w-3 h-3 ml-1 inline-block" />
        )}
      </button>

      {/* 툴팁 */}
      {showTip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
            <p className="mb-2">이 기능은 유료 플랜에서 사용할 수 있습니다.</p>
            <Link
              href="/pricing"
              className="inline-block text-blue-400 hover:text-blue-300 underline"
            >
              플랜 업그레이드 →
            </Link>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
