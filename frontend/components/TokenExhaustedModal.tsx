/**
 * TokenExhaustedModal component shows when AI tokens are exhausted.
 * Explains the situation and provides reset date information.
 */

"use client";

import { X, Coins, Calendar } from "lucide-react";

interface TokenExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokensRemaining: number;
  dailyBonusRemaining: number;
  nextReset: string | null;
}

export default function TokenExhaustedModal({
  isOpen,
  onClose,
  tokensRemaining,
  dailyBonusRemaining,
  nextReset,
}: TokenExhaustedModalProps) {
  if (!isOpen) return null;

  const formatResetDate = (dateStr: string | null) => {
    if (!dateStr) return "다음 달 1일";
    try {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch {
      return "다음 달 1일";
    }
  };

  const isFullyExhausted = tokensRemaining === 0 && dailyBonusRemaining === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--background)] border border-[var(--card-border)] rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--card-background)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--muted)]" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Coins className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-2">
          {isFullyExhausted ? "토큰이 모두 소진되었습니다" : "월간 토큰이 소진되었습니다"}
        </h2>

        {/* Description */}
        <p className="text-[var(--muted)] text-center mb-6">
          {isFullyExhausted ? (
            <>
              이번 달 AI 토큰과 일일 보너스를 모두 사용했습니다.
              <br />
              {formatResetDate(nextReset)}에 토큰이 리셋됩니다.
            </>
          ) : (
            <>
              이번 달 AI 토큰이 모두 소진되었습니다.
              <br />
              오늘 {dailyBonusRemaining}회의 보너스 사용이 가능합니다.
            </>
          )}
        </p>

        {/* Info box */}
        <div className="bg-[var(--card-background)] rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
            <div>
              <p className="font-medium">다음 리셋</p>
              <p className="text-[var(--muted)]">{formatResetDate(nextReset)}</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="text-sm text-[var(--muted)] space-y-2">
          <p className="font-medium text-[var(--foreground)]">AI 기능 사용 팁:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>AI 피드백은 무료입니다 (제출 시 자동 제공)</li>
            <li>AI 코치와 힌트 기능은 토큰을 사용합니다</li>
            <li>매월 1일에 100개의 토큰이 리셋됩니다</li>
          </ul>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 px-4 bg-[var(--accent)] text-white rounded-lg font-medium
                     hover:opacity-90 transition-opacity"
        >
          확인
        </button>
      </div>
    </div>
  );
}
