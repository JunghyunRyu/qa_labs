"use client";

import { Code2, Info } from "lucide-react";

interface ProblemCTAProps {
  onScrollToEditor: () => void;
  onOpenScoring: () => void;
  isEditorVisible: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export default function ProblemCTA({
  onScrollToEditor,
  onOpenScoring,
  isEditorVisible,
  onSubmit,
  isSubmitting,
  canSubmit,
}: ProblemCTAProps) {
  const handlePrimaryClick = () => {
    if (isEditorVisible) {
      onSubmit();
    } else {
      onScrollToEditor();
    }
  };

  const primaryLabel = isEditorVisible ? "채점하기" : "테스트 작성 시작";
  const primaryDisabled = isEditorVisible && (!canSubmit || isSubmitting);

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
      {/* Primary CTA */}
      <button
        onClick={handlePrimaryClick}
        disabled={primaryDisabled}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 select-none ${
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
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors select-none"
      >
        <Info className="w-4 h-4" />
        채점 방식 보기
      </button>
    </div>
  );
}
