/**
 * HintPanel - 단계별 힌트 표시 컴포넌트 (M5-5)
 *
 * 3단계 힌트를 progressive disclosure 방식으로 표시합니다.
 * - Level 1: 방향성 힌트 (패널티 없음)
 * - Level 2: 구체적 접근법 (-10점)
 * - Level 3: 코드 예시 (-20점)
 */

"use client";

import { useState } from "react";
import { Lightbulb, Lock, Unlock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHints, HINT_LEVELS } from "@/hooks/useHints";

interface HintPanelProps {
  problemId: number;
  className?: string;
}

export default function HintPanel({ problemId, className = "" }: HintPanelProps) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [confirmingLevel, setConfirmingLevel] = useState<number | null>(null);

  const {
    hintData,
    isLoading,
    error,
    hintsAvailable,
    viewHint,
    maxPenalty,
    isLevelLocked,
    isLevelViewed,
  } = useHints({ problemId });

  // 힌트가 없는 문제
  if (!hintsAvailable) {
    return null;
  }

  // 로딩 중
  if (isLoading && !hintData) {
    return (
      <div className={`bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <Lightbulb className="w-5 h-5 animate-pulse" />
          <span>힌트 로딩 중...</span>
        </div>
      </div>
    );
  }

  const handleLevelClick = async (level: number) => {
    // 이미 본 힌트는 바로 토글
    if (isLevelViewed(level)) {
      setExpandedLevel(expandedLevel === level ? null : level);
      return;
    }

    // 잠긴 레벨
    if (isLevelLocked(level)) {
      return;
    }

    // 패널티가 있는 레벨은 확인 필요
    const hintInfo = HINT_LEVELS.find((h) => h.level === level);
    if (hintInfo && hintInfo.penalty > 0) {
      setConfirmingLevel(level);
      return;
    }

    // Level 1은 바로 보기
    await viewHint(level);
    setExpandedLevel(level);
  };

  const handleConfirmView = async () => {
    if (confirmingLevel === null) return;

    await viewHint(confirmingLevel);
    setExpandedLevel(confirmingLevel);
    setConfirmingLevel(null);
  };

  const handleCancelConfirm = () => {
    setConfirmingLevel(null);
  };

  return (
    <div className={`bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-amber-800 dark:text-amber-200">힌트</span>
        </div>
        {maxPenalty > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-800/50 px-2 py-1 rounded">
            최대 점수: {100 - maxPenalty}점
          </span>
        )}
      </div>

      {/* 힌트 레벨 버튼들 */}
      <div className="p-4 space-y-2">
        {HINT_LEVELS.map((hint) => {
          const isViewed = isLevelViewed(hint.level);
          const isLocked = isLevelLocked(hint.level);
          const isExpanded = expandedLevel === hint.level;
          const hintContent = hintData?.hints[hint.level]?.content;

          return (
            <div key={hint.level} className="space-y-1">
              {/* 레벨 버튼 */}
              <button
                onClick={() => handleLevelClick(hint.level)}
                disabled={isLocked || isLoading}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isLocked
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : isViewed
                    ? "bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800"
                    : "bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/30 border border-amber-200 dark:border-amber-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{hint.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{hint.label}</div>
                    <div className="text-xs opacity-70">{hint.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hint.penalty > 0 && !isViewed && (
                    <span className="text-xs text-red-500 dark:text-red-400">
                      -{hint.penalty}점
                    </span>
                  )}
                  {isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : isViewed ? (
                    isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* 힌트 내용 */}
              <AnimatePresence>
                {isExpanded && isViewed && hintContent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-9 p-3 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-amber-100 dark:border-amber-900">
                      {hintContent}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-4 pb-3">
          <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      <AnimatePresence>
        {confirmingLevel !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleCancelConfirm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  힌트 확인
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                이 힌트를 보면{" "}
                <span className="font-bold text-red-500">
                  -{HINT_LEVELS.find((h) => h.level === confirmingLevel)?.penalty || 0}점
                </span>{" "}
                패널티가 적용됩니다.
                <br />
                <span className="text-sm opacity-80">
                  (최대 점수: {100 - (HINT_LEVELS.find((h) => h.level === confirmingLevel)?.penalty || 0)}점)
                </span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmView}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  힌트 보기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
