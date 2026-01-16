/**
 * LocalTestResultPanel - Pyodide를 통한 로컬 테스트 결과 표시
 */

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Loader2, Timer, Bug, Copy, Check, ArrowRight } from "lucide-react";
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
  /** 채점 제출 콜백 (바로 채점하기 버튼용) */
  onSubmit?: () => void;
  /** 채점 중 여부 */
  isSubmitting?: boolean;
}

export default function LocalTestResultPanel({
  result,
  isRunning,
  error,
  progressMessage,
  onRetry,
  onSubmit,
  isSubmitting = false,
}: LocalTestResultPanelProps) {
  // 실행 중
  if (isRunning) {
    return (
      <div className="p-4 bg-blue-900/20 border-t border-blue-800">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div>
            <p className="font-medium text-blue-300">
              로컬 테스트 실행 중...
            </p>
            {progressMessage && (
              <p className="text-sm text-blue-400">
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
      <div className="p-4 bg-red-900/20 border-t border-red-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-300">
              테스트 실행 오류
            </p>
            <pre className="mt-2 text-sm text-red-400 whitespace-pre-wrap font-mono bg-red-900/30 p-2 rounded">
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
          ? "bg-green-900/20 border-green-800"
          : "bg-amber-900/20 border-amber-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-400" />
          )}
          <span
            className={`font-semibold ${
              allPassed
                ? "text-green-300"
                : "text-amber-300"
            }`}
          >
            로컬 테스트 {allPassed ? "통과" : "실패"}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300"
            title="클라이언트(브라우저)에서 실행된 결과입니다"
          >
            로컬 실행 결과
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Timer className="w-4 h-4" />
          {result.executionTime.toFixed(0)}ms
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-green-400 font-medium">
            {result.passed}
          </span>
          <span className="text-slate-400">통과</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-400 font-medium">
            {result.failed}
          </span>
          <span className="text-slate-400">실패</span>
        </div>
        {result.errors > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-medium">
              {result.errors}
            </span>
            <span className="text-slate-400">에러</span>
          </div>
        )}
      </div>

      {/* Test Details - IDE 스타일 */}
      {result.testDetails && result.testDetails.length > 0 && (
        <div className="space-y-0.5 mb-3 font-mono text-sm">
          {result.testDetails.map((test, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {test.status === "passed" ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : test.status === "failed" ? (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <span
                  className={`truncate ${
                    test.status === "passed"
                      ? "text-slate-300"
                      : "text-red-400"
                  }`}
                >
                  {test.name.split("::").pop()}
                </span>
              </div>
              {/* 실행 시간 표시 */}
              <span className="text-slate-500 text-xs flex-shrink-0 ml-2">
                {test.duration !== undefined ? `${test.duration.toFixed(0)}ms` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Info message with CTA */}
      {allPassed && (
        <div className="flex items-center justify-between gap-3 p-3 bg-green-900/30 rounded-lg text-sm border border-green-800/50">
          <div className="flex items-start gap-2 min-w-0">
            <Bug className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">
              테스트가 정상 코드에서 통과했습니다. 버그 탐지 능력을 확인하세요!
            </p>
          </div>
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5
                         bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium
                         rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         animate-pulse"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  채점 중...
                </>
              ) : (
                <>
                  바로 채점하기
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {!allPassed && (
        <div className="flex items-start gap-2 p-2 bg-amber-900/30 rounded text-sm border border-amber-800/50">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300">
            테스트가 정상 코드에서 실패했습니다. 테스트 코드를 수정해주세요.
          </p>
        </div>
      )}

      {/* Output toggle (collapsible) */}
      {result.output && (
        <OutputSection output={result.output} />
      )}
    </div>
  );
}

/** 상세 출력 섹션 (복사 버튼 포함) */
function OutputSection({ output }: { output: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-200 flex items-center justify-between">
        <span>상세 출력 보기</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-700 rounded transition-colors"
          title="출력 복사"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-green-400" /> 복사됨</>
          ) : (
            <><Copy className="w-3 h-3" /> 복사</>
          )}
        </button>
      </summary>
      <pre className="mt-2 p-3 bg-slate-950 text-slate-100 text-xs font-mono rounded overflow-x-auto max-h-48 overflow-y-auto">
        {output}
      </pre>
    </details>
  );
}
