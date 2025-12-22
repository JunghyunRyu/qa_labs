"use client";

import { useState } from "react";
import {
  FlaskConical,
  FileText,
  ScrollText,
  History,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  Target,
  Copy,
  Check,
} from "lucide-react";
import LocalTestResultPanel from "@/components/LocalTestResultPanel";
import type { PytestResult } from "@/workers/pyodide-worker-types";
import type { Submission, SubmissionProgress } from "@/types/problem";

// Core loop tabs: 로컬 테스트 → 채점 결과 → 로그, with 히스토리 as 4th
export type TabId = "local" | "result" | "logs" | "history";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "local", label: "로컬 테스트", icon: <FlaskConical className="w-4 h-4" /> },
  { id: "result", label: "채점 결과", icon: <FileText className="w-4 h-4" /> },
  { id: "logs", label: "로그", icon: <ScrollText className="w-4 h-4" /> },
  { id: "history", label: "히스토리", icon: <History className="w-4 h-4" /> },
];

interface BottomTabsProps {
  className?: string;
  /** Controlled active tab */
  activeTab?: TabId;
  /** Tab change callback */
  onTabChange?: (tab: TabId) => void;
  /** Controlled expanded state */
  isExpanded?: boolean;
  /** Expand toggle callback */
  onExpandToggle?: (expanded: boolean) => void;
  /** Local test props */
  localTestResult?: PytestResult | null;
  localTestError?: string | null;
  isLocalTesting?: boolean;
  localTestProgress?: string;
  onLocalTestRetry?: () => void;
  /** Submission props */
  submission?: Submission | null;
  submissionError?: string | null;
  isSubmitting?: boolean;
  onSubmitRetry?: () => void;
}

export default function BottomTabs({
  className = "",
  activeTab: controlledActiveTab,
  onTabChange,
  isExpanded: controlledIsExpanded,
  onExpandToggle,
  localTestResult,
  localTestError,
  isLocalTesting = false,
  localTestProgress,
  onLocalTestRetry,
  submission,
  submissionError,
  isSubmitting = false,
  onSubmitRetry,
}: BottomTabsProps) {
  // Internal state for uncontrolled mode
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>("local");
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [logsCopied, setLogsCopied] = useState(false);

  // Use controlled or uncontrolled mode
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const isExpanded = controlledIsExpanded ?? internalIsExpanded;

  const handleTabChange = (tab: TabId) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handleExpandToggle = () => {
    const newExpanded = !isExpanded;
    if (onExpandToggle) {
      onExpandToggle(newExpanded);
    } else {
      setInternalIsExpanded(newExpanded);
    }
  };

  // Check if local test has content to show
  const hasLocalTestContent = isLocalTesting || localTestResult || localTestError;

  // Check submission state
  const isJudging = isSubmitting || (submission && (submission.status === "PENDING" || submission.status === "RUNNING"));
  const hasSubmissionResult = submission && (submission.status === "SUCCESS" || submission.status === "FAILURE");
  const hasSubmissionError = submissionError || (submission && submission.status === "ERROR");
  const hasSubmissionContent = isJudging || hasSubmissionResult || hasSubmissionError;

  // Get logs content
  const getLogsContent = (): string => {
    if (submissionError) return submissionError;
    if (submission?.execution_log) {
      return JSON.stringify(submission.execution_log, null, 2);
    }
    if (localTestError) return localTestError;
    if (localTestResult?.output) return localTestResult.output;
    return "";
  };

  const logsContent = getLogsContent();
  const hasLogs = logsContent.length > 0;

  // Copy logs to clipboard
  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logsContent);
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  // Get result tab indicator
  const getResultIndicator = () => {
    if (isJudging) {
      return <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />;
    }
    if (submission?.status === "SUCCESS") {
      return <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />;
    }
    if (submission?.status === "FAILURE" || submission?.status === "ERROR" || submissionError) {
      return <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />;
    }
    return null;
  };

  // Get logs tab indicator
  const getLogsIndicator = () => {
    if (hasSubmissionError) {
      return <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />;
    }
    if (hasLogs) {
      return <span className="ml-1 w-2 h-2 bg-gray-400 rounded-full" />;
    }
    return null;
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Tab Headers */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 -mb-px bg-sky-50 dark:bg-sky-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            {tab.icon}
            {tab.label}
            {/* Indicator dots */}
            {tab.id === "local" && isLocalTesting && (
              <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
            {tab.id === "local" && !isLocalTesting && localTestResult && (
              <span className={`ml-1 w-2 h-2 rounded-full ${
                localTestResult.failed === 0 && localTestResult.errors === 0
                  ? "bg-green-500"
                  : "bg-amber-500"
              }`} />
            )}
            {tab.id === "local" && !isLocalTesting && localTestError && (
              <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
            {tab.id === "result" && getResultIndicator()}
            {tab.id === "logs" && getLogsIndicator()}
          </button>
        ))}

        {/* Expand/Collapse Toggle */}
        <button
          onClick={handleExpandToggle}
          className="ml-auto px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={isExpanded ? "패널 축소" : "패널 확장"}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Local Test Tab */}
        {activeTab === "local" && (
          <div className="h-full">
            {hasLocalTestContent ? (
              <LocalTestResultPanel
                result={localTestResult ?? null}
                isRunning={isLocalTesting}
                error={localTestError ?? null}
                progressMessage={localTestProgress}
                onRetry={onLocalTestRetry}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">로컬 테스트 결과 없음</p>
                  <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                    <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      Shift+Enter
                    </kbd>
                    {" 또는 '로컬 테스트' 버튼을 클릭하세요"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Tab */}
        {activeTab === "result" && (
          <div className="h-full">
            {hasSubmissionContent ? (
              <ResultTabContent
                submission={submission}
                isSubmitting={isSubmitting}
                submissionError={submissionError}
                onRetry={onSubmitRetry}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">채점 결과 없음</p>
                  <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                    <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      Ctrl+Enter
                    </kbd>
                    {" 또는 '채점하기' 버튼을 클릭하세요"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="h-full">
            {hasLogs ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    실행 로그
                  </span>
                  <button
                    onClick={handleCopyLogs}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded transition-colors"
                    title="로그 복사"
                  >
                    {logsCopied ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        복사
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-gray-900 text-gray-100 text-xs font-mono rounded overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                  {logsContent}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">로그 없음</p>
                  <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                    테스트 실행 또는 채점 후 상세 로그가 여기에 표시됩니다
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab - Placeholder */}
        {activeTab === "history" && (
          <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">제출 히스토리 없음</p>
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
                이전 제출 기록이 여기에 표시됩니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Result Tab Content Component
function ResultTabContent({
  submission,
  isSubmitting,
  submissionError,
  onRetry,
}: {
  submission?: Submission | null;
  isSubmitting?: boolean;
  submissionError?: string | null;
  onRetry?: () => void;
}) {
  // Submitting / Pending / Running state
  if (isSubmitting || (submission && (submission.status === "PENDING" || submission.status === "RUNNING"))) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-300">
              채점 중...
            </p>
            {submission?.progress && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {submission.progress.message}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${submission.progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {submission.progress.percent}% 완료
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // API Error state
  if (submissionError) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700 dark:text-red-300">
              제출 에러
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {submissionError}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                다시 제출하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Execution Error state
  if (submission?.status === "ERROR") {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-700 dark:text-orange-300">
              채점 오류
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              채점 중 오류가 발생했습니다. 로그 탭에서 상세 내용을 확인하세요.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                다시 제출하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Failure state (test failed on golden code)
  if (submission?.status === "FAILURE") {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-700 dark:text-amber-300">
              테스트 실패
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              작성하신 테스트 코드가 정상 구현에서 실패했습니다.
              테스트 케이스를 다시 확인해주세요.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              로그 탭에서 상세 실패 내용을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submission?.status === "SUCCESS") {
    const killRatio = submission.total_mutants && submission.total_mutants > 0
      ? ((submission.killed_mutants || 0) / submission.total_mutants) * 100
      : 0;

    return (
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Score */}
          <div className="flex items-center gap-2">
            <Trophy className={`w-6 h-6 ${
              submission.score >= 90 ? "text-green-500" :
              submission.score >= 70 ? "text-blue-500" :
              submission.score >= 50 ? "text-yellow-500" : "text-red-500"
            }`} />
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {submission.score}
              </div>
              <div className="text-xs text-gray-500">점</div>
            </div>
          </div>

          {/* Kill ratio */}
          {submission.total_mutants && submission.total_mutants > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  결함 검출률
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      killRatio >= 80 ? "bg-green-500" :
                      killRatio >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${killRatio}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                  {killRatio.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {submission.killed_mutants}/{submission.total_mutants}개 결함 발견
              </p>
            </div>
          )}

          {/* Success badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">완료</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
