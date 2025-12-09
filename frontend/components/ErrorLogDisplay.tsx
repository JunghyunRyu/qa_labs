/** Display formatted error logs with type badges and collapsible details */

interface ErrorLogDisplayProps {
  executionLog: any;
}

export default function ErrorLogDisplay({ executionLog }: ErrorLogDisplayProps) {
  const errorType = executionLog?.error_type || "unknown";
  const exitCode = executionLog?.golden?.exit_code;
  const stderr = executionLog?.golden?.stderr || "";
  const stdout = executionLog?.golden?.stdout || "";
  const errorMessage = executionLog?.error_message || executionLog?.error || "";

  return (
    <div className="space-y-4">
      {/* Error type badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          {errorType === "timeout" && "⏱️ Timeout"}
          {errorType === "syntax" && "📝 Syntax Error"}
          {errorType === "golden_code_error" && "⚠️ Golden Code Error"}
          {errorType === "system_error" && "🔧 System Error"}
          {errorType === "test_failure" && "❌ Test Failure"}
          {errorType === "unknown" && "⚠️ Error"}
        </span>
        {exitCode !== undefined && (
          <span className="text-xs text-gray-500">Exit code: {exitCode}</span>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <p className="text-sm text-red-800 font-medium mb-2">오류 메시지:</p>
          <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">
            {typeof errorMessage === "string"
              ? errorMessage
              : JSON.stringify(errorMessage, null, 2)}
          </pre>
        </div>
      )}

      {/* Stderr (collapsible) */}
      {stderr && (
        <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            표준 에러 출력 (stderr)
          </summary>
          <pre className="mt-2 text-xs text-gray-600 font-mono whitespace-pre-wrap">
            {stderr}
          </pre>
        </details>
      )}

      {/* Stdout (collapsible) */}
      {stdout && (
        <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            표준 출력 (stdout)
          </summary>
          <pre className="mt-2 text-xs text-gray-600 font-mono whitespace-pre-wrap">
            {stdout}
          </pre>
        </details>
      )}

      {/* Raw log (collapsed) */}
      <details>
        <summary className="cursor-pointer text-xs text-gray-500">
          전체 로그 보기 (디버깅용)
        </summary>
        <pre className="mt-2 text-xs text-gray-500 font-mono bg-gray-100 p-3 rounded overflow-x-auto">
          {JSON.stringify(executionLog, null, 2)}
        </pre>
      </details>
    </div>
  );
}
