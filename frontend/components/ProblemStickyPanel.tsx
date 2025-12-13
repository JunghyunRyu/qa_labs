"use client";

import { Code2, Info } from "lucide-react";
import ProblemSummaryContent from "@/components/ProblemSummaryContent";
import type { Problem, Submission } from "@/types/problem";

interface ProblemStickyPanelProps {
  problem: Problem;
  latestSubmission?: Submission | null;
  onScrollToEditor: () => void;
  onOpenScoring: () => void;
  isEditorVisible: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  // AI 모드 토글 (M4 placeholder)
  aiModeEnabled?: boolean;
  onAiModeToggle?: (enabled: boolean) => void;
}

export default function ProblemStickyPanel({
  problem,
  latestSubmission,
  onScrollToEditor,
  onOpenScoring,
  isEditorVisible,
  onSubmit,
  isSubmitting,
  canSubmit,
  aiModeEnabled,
  onAiModeToggle,
}: ProblemStickyPanelProps) {
  const handlePrimaryClick = () => {
    if (isEditorVisible) {
      onSubmit();
    } else {
      onScrollToEditor();
    }
  };

  const primaryLabel = isEditorVisible ? "채점하기" : "테스트 코드 작성";
  const primaryDisabled = isEditorVisible && (!canSubmit || isSubmitting);

  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Card Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
          {/* 요약 정보 */}
          <ProblemSummaryContent
            problem={problem}
            latestSubmission={latestSubmission}
            aiModeEnabled={aiModeEnabled}
            onAiModeToggle={onAiModeToggle}
          />

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

          {/* CTA Buttons */}
          <div className="space-y-3">
            {/* Primary CTA */}
            <button
              onClick={handlePrimaryClick}
              disabled={primaryDisabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                primaryDisabled
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  제출 중...
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  {primaryLabel}
                </>
              )}
            </button>

            {/* Secondary CTA */}
            <button
              onClick={onOpenScoring}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Info className="w-4 h-4" />
              채점 방식 보기
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
