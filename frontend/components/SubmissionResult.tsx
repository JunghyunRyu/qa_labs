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
      {/* Status - Always shown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">제출 상태</h3>
        <SubmissionStatus status={submission.status} />
      </div>

      {/* Score - Always shown in the same location */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">점수</h3>
        {(submission.status === "SUCCESS" || submission.status === "FAILURE") ? (
          <ScoreDisplay
            score={submission.score}
            killedMutants={submission.killed_mutants}
            totalMutants={submission.total_mutants}
          />
        ) : (
          <div className="text-gray-500 text-sm">채점 중...</div>
        )}
      </div>

      {/* Error Message - Shown when status is ERROR */}
      {submission.status === "ERROR" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">채점 에러</h4>
          <p className="text-sm text-red-700 mb-2">
            채점 중 오류가 발생했습니다. 코드를 확인하고 다시 제출해주세요.
          </p>
          {submission.execution_log && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                상세 에러 정보 보기
              </summary>
              <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(submission.execution_log, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* AI Feedback - Always shown in the same location */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 피드백</h3>
        {submission.feedback_json ? (
          <FeedbackDisplay feedback={submission.feedback_json as any} />
        ) : (
          <div className="text-gray-500 text-sm">
            {submission.status === "SUCCESS" || submission.status === "FAILURE"
              ? "피드백을 생성하는 중..."
              : "채점 완료 후 피드백이 표시됩니다."}
          </div>
        )}
      </div>

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

