/**
 * PricingCard component for displaying plan information.
 * PR5: UX/Pricing
 */

"use client";

import { Check, X } from "lucide-react";
import type { PlanConfig, PlanKey } from "@/types/plan";
import { formatPrice } from "@/types/plan";

interface PricingCardProps {
  plan: PlanConfig;
  currentPlan?: PlanKey;
  isYearly?: boolean;
  onSelect?: (planKey: PlanKey) => void;
}

export default function PricingCard({
  plan,
  currentPlan,
  isYearly = false,
  onSelect,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.key;
  const price = isYearly ? plan.price_yearly : plan.price_monthly;
  const monthlyPrice = isYearly ? Math.floor(plan.price_yearly / 12) : plan.price_monthly;

  const handleClick = () => {
    if (!isCurrentPlan && onSelect) {
      onSelect(plan.key);
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all
        ${plan.is_popular
          ? "border-blue-500 shadow-lg shadow-blue-500/20"
          : "border-[var(--border-primary)]"
        }
        ${isCurrentPlan
          ? "bg-[var(--card-background)] ring-2 ring-emerald-500"
          : "bg-[var(--bg-primary)]"
        }
      `}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">
          {plan.name}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-[var(--text-primary)]">
            {formatPrice(monthlyPrice)}
          </span>
          {monthlyPrice > 0 && (
            <span className="text-sm text-[var(--text-secondary)]">/월</span>
          )}
        </div>
        {isYearly && price > 0 && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            연 {formatPrice(price)} (2개월 무료)
          </p>
        )}
      </div>

      {/* Limits */}
      <div className="mb-6 p-4 rounded-lg bg-[var(--bg-secondary)]">
        {plan.limits.map((limit) => (
          <div
            key={limit.key}
            className="flex justify-between items-center py-1 text-sm"
          >
            <span className="text-[var(--text-secondary)]">{limit.name}</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {limit.value.toLocaleString()}{limit.unit}
            </span>
          </div>
        ))}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li key={feature.key} className="flex items-start gap-2">
            {feature.included ? (
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <span
              className={`text-sm ${
                feature.included
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] line-through"
              }`}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleClick}
        disabled={isCurrentPlan}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors
          ${isCurrentPlan
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default"
            : plan.is_popular
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
          }
        `}
      >
        {isCurrentPlan ? "현재 플랜" : plan.price_monthly === 0 ? "시작하기" : "업그레이드"}
      </button>
    </div>
  );
}
