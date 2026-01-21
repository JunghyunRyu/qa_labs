/**
 * AIBugDiscoveryToast component
 * FAILURE 제출 후 자동 표시되는 AI 버그 발견 토스트
 *
 * M7 AI 강제 경험: 오답 시 AI 사용 유도
 */

"use client";

import { Bug, X } from "lucide-react";

interface AIBugDiscoveryToastProps {
  isVisible: boolean;
  onOpenAICoach: () => void;
  onDismiss: () => void;
  bugCount?: number;
  isGuest?: boolean;
}

export default function AIBugDiscoveryToast({
  isVisible,
  onOpenAICoach,
  onDismiss,
  bugCount = 1,
  isGuest = false,
}: AIBugDiscoveryToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 max-w-md animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4">
        <div className="flex items-start gap-3">
          {/* Bug icon with pulse animation */}
          <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <Bug className="w-5 h-5 text-red-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Message */}
            <p className="text-sm text-slate-300 mb-3">
              AI가{" "}
              <span className="text-red-400 font-medium">
                {bugCount}개의 잠재적 버그
              </span>
              를 발견했습니다
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAICoach}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {isGuest ? "원인 분석하기 (무료)" : "원인 분석하기 (1토큰)"}
              </button>
              <button
                onClick={onDismiss}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700/50 transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
