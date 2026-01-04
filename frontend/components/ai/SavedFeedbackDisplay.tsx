"use client";

import { CheckCircle, AlertCircle, Lightbulb, MessageSquare } from "lucide-react";

export interface SavedFeedback {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggested_tests: string[];
  score_adjustment?: number;
}

interface SavedFeedbackDisplayProps {
  feedback: SavedFeedback;
  submissionScore?: number;
  className?: string;
}

export default function SavedFeedbackDisplay({
  feedback,
  submissionScore,
  className = "",
}: SavedFeedbackDisplayProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
        <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          AI 피드백
        </span>
        {submissionScore !== undefined && (
          <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
            점수: {submissionScore}점
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-purple-50/80 dark:bg-purple-950/30 rounded-lg">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {feedback.summary}
        </p>
      </div>

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              잘한 점
            </span>
          </div>
          <ul className="space-y-1 pl-6">
            {feedback.strengths.map((strength, index) => (
              <li
                key={index}
                className="text-sm text-neutral-600 dark:text-neutral-400 list-disc"
              >
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {feedback.weaknesses && feedback.weaknesses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              개선할 점
            </span>
          </div>
          <ul className="space-y-1 pl-6">
            {feedback.weaknesses.map((weakness, index) => (
              <li
                key={index}
                className="text-sm text-neutral-600 dark:text-neutral-400 list-disc"
              >
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Tests */}
      {feedback.suggested_tests && feedback.suggested_tests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              추가 테스트 제안
            </span>
          </div>
          <ul className="space-y-1 pl-6">
            {feedback.suggested_tests.map((test, index) => (
              <li
                key={index}
                className="text-sm text-neutral-600 dark:text-neutral-400 list-disc"
              >
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
