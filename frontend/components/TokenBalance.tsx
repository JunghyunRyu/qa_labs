/**
 * TokenBalance component displays remaining AI tokens.
 * Shows in the header for authenticated users.
 * Gold/yellow color scheme for "reward" feel.
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
        <div className="w-4 h-4 rounded-full bg-slate-800 animate-pulse" />
        <div className="w-8 h-4 rounded bg-slate-800 animate-pulse" />
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
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-help transition-all
        ${isExhausted
          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
          : isLow
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20"
        } ${className}`}
      title={`월간 토큰: ${tokenStatus.tokens_remaining}개 / 일일 보너스: ${tokenStatus.daily_bonus_remaining}회 남음`}
    >
      <Coins className="w-4 h-4 transition-transform group-hover:rotate-12" />
      <span>{totalRemaining}</span>
      {isExhausted && tokenStatus.daily_bonus_remaining > 0 && (
        <span className="text-xs opacity-75">+{tokenStatus.daily_bonus_remaining}</span>
      )}
    </div>
  );
}
