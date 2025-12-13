/** Submission result panel - always displays in the same location */

import type { Submission } from "@/types/problem";
import SubmissionResult from "./SubmissionResult";
import SubmissionStatus from "./SubmissionStatus";
import CopyButton from "./CopyButton";

/** submission ID를 표시하는 헬퍼 컴포넌트 */
function SubmissionIdDisplay({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <span>제출 ID:</span>
      <code
        className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700"
        title={id}
      >
        {id.slice(0, 8)}...
      </code>
      <CopyButton
        value={id}
        label="제출 ID 복사"
        size="sm"
        className="bg-gray-100 hover:bg-gray-200 text-gray-600"
      />
    </div>
  );
}

interface SubmissionResultPanelProps {
  submission: Submission | null;
  isSubmitting?: boolean;
  submissionError: string | null;
  onRetry?: () => void;
}

export default function SubmissionResultPanel({
  submission,
  isSubmitting = false,
  submissionError,
  onRetry,
}: SubmissionResultPanelProps) {
  // 제출 전 상태
  if (!submission && !isSubmitting && !submissionError) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            채점하기 버튼을 클릭하여 테스트 코드를 제출하세요.
          </p>
        </div>
      </div>
    );
  }

  // 제출 중 상태
  if (isSubmitting || (submission && (submission.status === "PENDING" || submission.status === "RUNNING"))) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">채점 결과</h3>
          {submission && <SubmissionIdDisplay id={submission.id} />}
          <div className="py-8">
            <SubmissionStatus
              status={submission?.status || "PENDING"}
              createdAt={submission?.created_at}
              progress={submission?.progress}
            />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 (제출 에러 - API 호출 실패 등)
  if (submissionError) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">채점 결과</h3>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">제출 에러</h4>
            <p className="text-sm text-red-700">{submissionError}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 제출하기
            </button>
          )}
        </div>
      </div>
    );
  }

  // 채점 에러 상태 (ERROR)
  if (submission && submission.status === "ERROR") {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">채점 결과</h3>
        <SubmissionIdDisplay id={submission.id} />
        <div className="space-y-4">
          <SubmissionResult submission={submission} />
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 제출하기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 결과 표시 (항상 같은 레이아웃)
  if (submission) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-md p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">채점 결과</h3>
        <SubmissionIdDisplay id={submission.id} />
        <SubmissionResult submission={submission} />
      </div>
    );
  }

  // 기본 상태 (fallback)
  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-8">
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          채점하기 버튼을 클릭하여 테스트 코드를 제출하세요.
        </p>
      </div>
    </div>
  );
}

