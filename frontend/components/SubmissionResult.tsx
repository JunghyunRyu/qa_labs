/** Submission result display component */

import type { Submission } from "@/types/problem";
import SubmissionStatus from "./SubmissionStatus";
import ScoreDisplay from "./ScoreDisplay";
import FeedbackDisplay from "./FeedbackDisplay";

interface SubmissionResultProps {
  submission: Submission;
}

export default function SubmissionResult({ submission }: SubmissionResultProps) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">제출 상태</h3>
        <SubmissionStatus status={submission.status} />
      </div>

      {/* Score */}
      {(submission.status === "SUCCESS" || submission.status === "FAILURE") && (
        <ScoreDisplay
          score={submission.score}
          killedMutants={submission.killed_mutants}
          totalMutants={submission.total_mutants}
        />
      )}

      {/* Error Message */}
      {submission.status === "ERROR" && submission.execution_log && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">에러 정보</h4>
          <pre className="text-xs text-red-700 whitespace-pre-wrap">
            {JSON.stringify(submission.execution_log, null, 2)}
          </pre>
        </div>
      )}

      {/* AI Feedback */}
      {submission.feedback_json && (
        <FeedbackDisplay feedback={submission.feedback_json as any} />
      )}

      {/* Execution Log (optional, collapsed by default) */}
      {submission.execution_log && (
        <details className="bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            실행 로그 보기
          </summary>
          <pre className="mt-3 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(submission.execution_log, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

