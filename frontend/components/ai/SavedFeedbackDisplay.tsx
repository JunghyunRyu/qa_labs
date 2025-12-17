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
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <MessageSquare className="w-5 h-5 text-purple-500" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          AI 피드백
        </span>
        {submissionScore !== undefined && (
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            점수: {submissionScore}점
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {feedback.summary}
        </p>
      </div>

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              잘한 점
            </span>
          </div>
          <ul className="space-y-1 pl-6">
            {feedback.strengths.map((strength, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 list-disc"
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
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              개선할 점
            </span>
          </div>
          <ul className="space-y-1 pl-6">
            {feedback.weaknesses.map((weakness, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 list-disc"
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
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              추가 테스트 제안
            </span>
          </div>
          <ul className="space-y-1 pl-6">
            {feedback.suggested_tests.map((test, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 list-disc"
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
