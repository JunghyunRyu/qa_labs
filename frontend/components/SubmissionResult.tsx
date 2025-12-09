/** Submission result display component */

import type { Submission } from "@/types/problem";
import SubmissionStatus from "./SubmissionStatus";
import ScoreDisplay from "./ScoreDisplay";
import FeedbackDisplay from "./FeedbackDisplay";
import TestResultsList from "./TestResultsList";
import ErrorLogDisplay from "./ErrorLogDisplay";
import { parsePytestOutput } from "@/lib/pytestParser";
import { AlertCircle, FileText, Sparkles } from "lucide-react";

interface SubmissionResultProps {
  submission: Submission;
}

export default function SubmissionResult({ submission }: SubmissionResultProps) {
  // FAILURE 상태일 때 Golden Code 테스트 실패 정보 추출
  const getFailureInfo = () => {
    if (submission.status !== "FAILURE" || !submission.execution_log) return null;
    
    const golden = (submission.execution_log as any)?.golden;
    if (!golden) return null;

    return {
      exitCode: golden.exit_code,
      stdout: golden.stdout || "",
      stderr: golden.stderr || "",
      logs: golden.logs || "",
    };
  };

  const failureInfo = getFailureInfo();

  // Parse pytest output for FAILURE status
  const parsedGolden = submission.status === "FAILURE" && submission.execution_log
    ? parsePytestOutput(
        ((submission.execution_log as any)?.golden?.stdout || ""),
        ((submission.execution_log as any)?.golden?.stderr || "")
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Status - Always shown */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">제출 상태</h3>
        </div>
        <SubmissionStatus status={submission.status} createdAt={submission.created_at} />
      </div>

      {/* Score - Always shown in the same location */}
      {(submission.status === "SUCCESS" || submission.status === "FAILURE") && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            채점 결과
          </h3>
          <ScoreDisplay
            score={submission.score}
            killedMutants={submission.killed_mutants}
            totalMutants={submission.total_mutants}
          />
        </div>
      )}

      {/* FAILURE 상태 상세 정보 */}
      {submission.status === "FAILURE" && failureInfo && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">테스트 실패 상세</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-orange-800 mb-2">
                Golden Code 테스트가 실패했습니다.
              </p>
              <p className="text-sm text-orange-700">
                작성하신 테스트 코드가 정상 구현을 통과시키지 못했습니다.
                테스트 케이스를 다시 확인해주세요.
              </p>
            </div>

            {/* Test results breakdown */}
            {parsedGolden?.tests && parsedGolden.tests.length > 0 && (
              <div className="mt-4">
                <TestResultsList tests={parsedGolden.tests} />
              </div>
            )}

            {failureInfo.stderr && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-orange-800 hover:text-orange-900 mb-2">
                  에러 출력 보기
                </summary>
                <div className="mt-2 bg-white rounded p-3 border border-orange-200">
                  <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto font-mono">
                    {failureInfo.stderr}
                  </pre>
                </div>
              </details>
            )}

            {failureInfo.logs && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-orange-800 hover:text-orange-900 mb-2">
                  실행 로그 보기
                </summary>
                <div className="mt-2 bg-white rounded p-3 border border-orange-200">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto font-mono">
                    {failureInfo.logs}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Error Message - Shown when status is ERROR */}
      {submission.status === "ERROR" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-800">채점 에러</h4>
          </div>
          <ErrorLogDisplay executionLog={submission.execution_log} />
        </div>
      )}

      {/* AI Feedback - Only shown for SUCCESS status */}
      {submission.status === "SUCCESS" && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI 피드백</h3>
          </div>
          {submission.feedback_json ? (
            <FeedbackDisplay feedback={submission.feedback_json as any} />
          ) : (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
              <p className="text-sm text-gray-600">
                AI가 피드백을 생성하고 있습니다...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Execution Log (optional, collapsed by default) */}
      {submission.execution_log && submission.status !== "FAILURE" && (
        <details className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            실행 로그 보기 (디버깅용)
          </summary>
          <div className="mt-3 bg-white rounded p-3 border border-gray-200">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto font-mono">
              {JSON.stringify(submission.execution_log, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

