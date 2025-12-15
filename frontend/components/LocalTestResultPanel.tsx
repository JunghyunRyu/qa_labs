/**
 * LocalTestResultPanel - Pyodide를 통한 로컬 테스트 결과 표시
 */

import { CheckCircle, XCircle, AlertCircle, Loader2, Timer, Bug } from "lucide-react";
import type { PytestResult } from "@/workers/pyodide-worker-types";

interface LocalTestResultPanelProps {
  /** 테스트 결과 */
  result: PytestResult | null;
  /** 실행 중 여부 */
  isRunning: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 진행률 메시지 */
  progressMessage?: string;
  /** 다시 실행 콜백 */
  onRetry?: () => void;
}

export default function LocalTestResultPanel({
  result,
  isRunning,
  error,
  progressMessage,
  onRetry,
}: LocalTestResultPanelProps) {
  // 실행 중
  if (isRunning) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-300">
              로컬 테스트 실행 중...
            </p>
            {progressMessage && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {progressMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700 dark:text-red-300">
              테스트 실행 오류
            </p>
            <pre className="mt-2 text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
              {error}
            </pre>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                다시 실행
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 결과 없음
  if (!result) {
    return null;
  }

  const allPassed = result.failed === 0 && result.errors === 0;

  return (
    <div
      className={`p-4 border-t ${
        allPassed
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-500" />
          )}
          <span
            className={`font-semibold ${
              allPassed
                ? "text-green-700 dark:text-green-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
          >
            로컬 테스트 {allPassed ? "통과" : "실패"}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            Golden Code 기준
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Timer className="w-4 h-4" />
          {result.executionTime.toFixed(0)}ms
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-green-600 dark:text-green-400 font-medium">
            {result.passed}
          </span>
          <span className="text-gray-500 dark:text-gray-400">통과</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-600 dark:text-red-400 font-medium">
            {result.failed}
          </span>
          <span className="text-gray-500 dark:text-gray-400">실패</span>
        </div>
        {result.errors > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {result.errors}
            </span>
            <span className="text-gray-500 dark:text-gray-400">에러</span>
          </div>
        )}
      </div>

      {/* Test Details */}
      {result.testDetails && result.testDetails.length > 0 && (
        <div className="space-y-1 mb-3">
          {result.testDetails.map((test, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm font-mono"
            >
              {test.status === "passed" ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : test.status === "failed" ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span
                className={
                  test.status === "passed"
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {test.name.split("::").pop()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Info message */}
      {allPassed && (
        <div className="flex items-start gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm">
          <Bug className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 dark:text-green-300">
            테스트가 정상 코드에서 통과했습니다.
            <strong> &quot;채점하기&quot;</strong>를 클릭하여 버그 탐지 능력을 확인하세요.
          </p>
        </div>
      )}

      {!allPassed && (
        <div className="flex items-start gap-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 dark:text-amber-300">
            테스트가 정상 코드에서 실패했습니다. 테스트 코드를 수정해주세요.
          </p>
        </div>
      )}

      {/* Output toggle (collapsible) */}
      {result.output && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            상세 출력 보기
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs font-mono rounded overflow-x-auto max-h-48 overflow-y-auto">
            {result.output}
          </pre>
        </details>
      )}
    </div>
  );
}
