"use client";

import { useLayoutStore } from "@/stores/layoutStore";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { Problem } from "@/types/problem";
import ProblemDescription from "@/components/ProblemDescription";
import TagChips from "@/components/TagChips";
import CopyButton from "@/components/CopyButton";

// Difficulty color mapping
const difficultyColors: Record<string, string> = {
  "Very Easy": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Easy": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Hard": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface ProblemPanelProps {
  problem: Problem;
}

export default function ProblemPanel({ problem }: ProblemPanelProps) {
  const { isProblemCollapsed, toggleProblemPanel } = useLayoutStore();

  // Collapsed state - narrow vertical bar
  if (isProblemCollapsed) {
    return (
      <div className="h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={toggleProblemPanel}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="문제 패널 펼치기"
          title="문제 패널 펼치기 (Ctrl+B)"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="mt-4 writing-mode-vertical">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical whitespace-nowrap">
          문제
        </div>
      </div>
    );
  }

  // Expanded state - full problem display
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {problem.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  difficultyColors[problem.difficulty] || difficultyColors["Medium"]
                }`}
              >
                {problem.difficulty}
              </span>
              {problem.skills && problem.skills.length > 0 && (
                <TagChips tags={problem.skills} maxVisible={3} size="sm" />
              )}
            </div>
          </div>
          <button
            onClick={toggleProblemPanel}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2 flex-shrink-0"
            aria-label="문제 패널 접기"
            title="문제 패널 접기 (Ctrl+B)"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Function Signature */}
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              함수 시그니처
            </span>
          </div>
          <CopyButton text={problem.function_signature} />
        </div>
        <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {problem.function_signature}
        </pre>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ProblemDescription description_md={problem.description_md} />
      </div>
    </div>
  );
}
