"use client";

/**
 * Hint Display Component.
 *
 * Phase 4-2: 테스트 개선 힌트를 표시.
 */

import { HelpCircle, ArrowRight, Sparkles } from "lucide-react";
import { HintGenerationResult, TestHint } from "@/types/test-quality";

interface HintDisplayProps {
  hints: HintGenerationResult;
}

const DIFFICULTY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  easy: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "쉬움",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "보통",
  },
  hard: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "어려움",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  value_type: "값 유형",
  diversity: "입력 다양성",
  purpose: "테스트 목적",
  antipattern: "안티패턴",
};

export default function HintDisplay({ hints }: HintDisplayProps) {
  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {hints.summary}
        </p>
      </div>

      {/* 힌트 목록 */}
      <div className="space-y-3">
        {hints.hints.map((hint, index) => (
          <HintCard key={index} hint={hint} index={index + 1} />
        ))}
      </div>

      {/* 격려 메시지 */}
      {hints.encouragement && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <Sparkles className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {hints.encouragement}
          </p>
        </div>
      )}

      {/* 다음 단계 */}
      {hints.next_step && (
        <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <ArrowRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
              다음 단계
            </span>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              {hints.next_step}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface HintCardProps {
  hint: TestHint;
  index: number;
}

function HintCard({ hint, index }: HintCardProps) {
  const difficultyStyle = DIFFICULTY_STYLES[hint.difficulty] || DIFFICULTY_STYLES.medium;
  const categoryLabel = CATEGORY_LABELS[hint.category] || hint.category;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start gap-3">
        {/* 인덱스 */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {index}
          </span>
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {categoryLabel}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${difficultyStyle.bg} ${difficultyStyle.text}`}
            >
              {difficultyStyle.label}
            </span>
          </div>

          {/* 힌트 텍스트 */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {hint.hint_text}
          </p>

          {/* 사고 유도 질문 */}
          {hint.question && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                {hint.question}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
