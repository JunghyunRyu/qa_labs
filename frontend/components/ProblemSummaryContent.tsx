"use client";

import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle, type LucideIcon } from "lucide-react";
import TagChips from "@/components/TagChips";
import CopyButton from "@/components/CopyButton";
import { toTagViewModels } from "@/lib/tagDefinitions";
import type { Problem, Submission } from "@/types/problem";

interface ProblemSummaryContentProps {
  problem: Problem;
  latestSubmission?: Submission | null;
  // AI 모드 토글 (M4 placeholder)
  aiModeEnabled?: boolean;
  onAiModeToggle?: (enabled: boolean) => void;
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

const submissionStatusConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  Icon: LucideIcon;
  animate?: boolean;
}> = {
  PENDING: {
    label: "대기 중",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    Icon: Clock,
  },
  RUNNING: {
    label: "채점 중",
    color: "text-blue-800",
    bgColor: "bg-blue-100",
    Icon: Loader2,
    animate: true,
  },
  SUCCESS: {
    label: "완료",
    color: "text-green-800",
    bgColor: "bg-green-100",
    Icon: CheckCircle,
  },
  FAILURE: {
    label: "실패",
    color: "text-red-800",
    bgColor: "bg-red-100",
    Icon: XCircle,
  },
  ERROR: {
    label: "오류",
    color: "text-orange-800",
    bgColor: "bg-orange-100",
    Icon: AlertTriangle,
  },
};

export default function ProblemSummaryContent({
  problem,
  latestSubmission,
  aiModeEnabled = false,
  onAiModeToggle,
}: ProblemSummaryContentProps) {
  const diffConfig = difficultyConfig[problem.difficulty] || difficultyConfig.Medium;
  const tags = problem.skills || [];

  return (
    <div className="space-y-4">
      {/* 난이도 */}
      <div>
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

      {/* 태그 */}
      {toTagViewModels(tags).length > 0 && (
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            태그
          </span>
          <div className="mt-2">
            <TagChips tags={tags} maxVisible={4} size="sm" />
          </div>
        </div>
      )}

      {/* 함수 시그니처 */}
      <div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          함수 시그니처
        </span>
        <div className="mt-2 flex items-start gap-2">
          <code className="flex-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-gray-800 dark:text-gray-200 break-all">
            {problem.function_signature}
          </code>
          <CopyButton
            value={problem.function_signature}
            label="함수 시그니처 복사"
            size="sm"
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* 최신 제출 상태 */}
      {latestSubmission && (
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            최신 제출
          </span>
          <div className="mt-2">
            {(() => {
              const statusConf = submissionStatusConfig[latestSubmission.status] || submissionStatusConfig.PENDING;
              const IconComponent = statusConf.Icon;
              return (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConf.bgColor}`}>
                  <IconComponent
                    className={`w-4 h-4 ${statusConf.color} ${statusConf.animate ? 'animate-spin' : ''}`}
                  />
                  <span className={`text-sm font-medium ${statusConf.color}`}>
                    {statusConf.label}
                  </span>
                  {latestSubmission.score !== undefined && latestSubmission.score !== null && (
                    <span className={`text-sm font-bold ${statusConf.color}`}>
                      {latestSubmission.score}점
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* AI 모드 토글 (M4 placeholder) */}
      <div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          AI 코치
        </span>
        <div className="mt-2">
          <button
            disabled={!onAiModeToggle}
            onClick={() => onAiModeToggle?.(!aiModeEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              !onAiModeToggle
                ? "bg-gray-200 dark:bg-gray-600 cursor-not-allowed opacity-50"
                : aiModeEnabled
                ? "bg-sky-500"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            aria-label="AI 코치 토글"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                aiModeEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {onAiModeToggle ? (aiModeEnabled ? "켜짐" : "꺼짐") : "준비 중"}
          </span>
        </div>
      </div>
    </div>
  );
}
