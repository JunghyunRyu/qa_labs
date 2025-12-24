/**
 * TokenBalance component displays remaining AI tokens.
 * Shows in the header for authenticated users.
 */

"use client";

import { useEffect, useState } from "react";
import { getTokenStatus } from "@/lib/api/auth";
import type { TokenStatus } from "@/types/auth";
import { Coins } from "lucide-react";

interface TokenBalanceProps {
  className?: string;
}

export default function TokenBalance({ className = "" }: TokenBalanceProps) {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokenStatus = async () => {
      try {
        const status = await getTokenStatus();
        setTokenStatus(status);
      } catch (error) {
        console.error("Failed to fetch token status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenStatus();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1.5 text-sm ${className}`}>
        <div className="w-4 h-4 rounded-full bg-[var(--card-background)] animate-pulse" />
        <div className="w-8 h-4 rounded bg-[var(--card-background)] animate-pulse" />
      </div>
    );
  }

  if (!tokenStatus) {
    return null;
  }

  const totalRemaining = tokenStatus.tokens_remaining + tokenStatus.daily_bonus_remaining;
  const isLow = tokenStatus.tokens_remaining <= 10;
  const isExhausted = tokenStatus.tokens_remaining === 0;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm
        ${isExhausted
          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          : isLow
            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
        } ${className}`}
      title={`월간 토큰: ${tokenStatus.tokens_remaining}개 / 일일 보너스: ${tokenStatus.daily_bonus_remaining}회 남음`}
    >
      <Coins className="w-4 h-4" />
      <span className="font-medium">{totalRemaining}</span>
      {isExhausted && tokenStatus.daily_bonus_remaining > 0 && (
        <span className="text-xs opacity-75">+{tokenStatus.daily_bonus_remaining}</span>
      )}
    </div>
  );
}
