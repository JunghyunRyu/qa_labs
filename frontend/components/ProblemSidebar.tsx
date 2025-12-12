"use client";

import { Code2, Info } from "lucide-react";
import TagChips from "@/components/TagChips";
import { toTagViewModels } from "@/lib/tagDefinitions";

interface ProblemSidebarProps {
  difficulty: string;
  tags: string[];
  onScrollToEditor: () => void;
  onOpenScoring: () => void;
  isEditorVisible: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

const difficultyConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  "Very Easy": {
    label: "아주쉬움",
    color: "text-blue-800 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  Easy: {
    label: "쉬움",
    color: "text-green-800 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  Medium: {
    label: "보통",
    color: "text-yellow-800 dark:text-yellow-300",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  Hard: {
    label: "어려움",
    color: "text-red-800 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

export default function ProblemSidebar({
  difficulty,
  tags,
  onScrollToEditor,
  onOpenScoring,
  isEditorVisible,
  onSubmit,
  isSubmitting,
  canSubmit,
}: ProblemSidebarProps) {
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.Medium;

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
      <div className="sticky top-24 space-y-4">
        {/* Card Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5">
          {/* Difficulty */}
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              난이도
            </span>
            <div className="mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${diffConfig.bgColor} ${diffConfig.color}`}
              >
                {diffConfig.label}
              </span>
            </div>
          </div>

          {/* Tags */}
          {toTagViewModels(tags).length > 0 && (
            <div className="mb-5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                태그
              </span>
              <div className="mt-2">
                <TagChips tags={tags} maxVisible={4} size="sm" />
              </div>
            </div>
          )}

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
