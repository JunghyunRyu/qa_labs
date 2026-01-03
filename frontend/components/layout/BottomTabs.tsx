"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  FileText,
  ScrollText,
  History,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  Target,
  Copy,
  Check,
  Bot,
  Lightbulb,
  ArrowRight,
  Clock,
  Code,
  Terminal,
  Search,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import LocalTestResultPanel from "@/components/LocalTestResultPanel";
import { useLayoutStore } from "@/stores/layoutStore";
import { getMySubmissions } from "@/lib/api/users";
import { applyTemplate } from "@/lib/promptTemplates";
import type { PytestResult } from "@/workers/pyodide-worker-types";
import type { Submission, SubmissionProgress, Problem } from "@/types/problem";
import type { SubmissionListItem } from "@/types/submission";

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
  /** Controlled expanded state (legacy - use isCollapsed instead) */
  isExpanded?: boolean;
  /** Expand toggle callback (legacy) */
  onExpandToggle?: (expanded: boolean) => void;
  /** New: Collapsed state for minimal view */
  isCollapsed?: boolean;
  /** New: Collapse toggle callback */
  onCollapseToggle?: () => void;
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
  /** Problem data for displaying missed bug details */
  problem?: Problem;
  /** History props */
  problemId?: number;
  onLoadSubmission?: (submission: Submission) => void;
  /** Session-based history for non-authenticated users */
  sessionHistory?: Submission[];
}

export default function BottomTabs({
  className = "",
  activeTab: controlledActiveTab,
  onTabChange,
  isExpanded: controlledIsExpanded,
  onExpandToggle,
  isCollapsed = false,
  onCollapseToggle,
  localTestResult,
  localTestError,
  isLocalTesting = false,
  localTestProgress,
  onLocalTestRetry,
  submission,
  submissionError,
  isSubmitting = false,
  onSubmitRetry,
  problem,
  problemId,
  onLoadSubmission,
  sessionHistory = [],
}: BottomTabsProps) {
  // Internal state for uncontrolled mode
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>("local");
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);

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
    // Check if there's any log content
    const hasLogs = !!(
      submissionError ||
      submission?.execution_log ||
      localTestError ||
      localTestResult?.output
    );
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
            data-testid={`tab-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            title={tab.label}
            className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? "text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 -mb-px bg-sky-50 dark:bg-sky-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            {tab.icon}
            <span className="hidden xl:inline">{tab.label}</span>
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

        {/* Collapse Toggle */}
        <button
          data-testid="btn-toggle-bottom-panel"
          onClick={onCollapseToggle ?? handleExpandToggle}
          className="ml-auto px-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={isCollapsed ? "패널 펼치기" : "패널 접기"}
        >
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Tab Content - Hidden when collapsed */}
      {!isCollapsed && (
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
                problem={problem}
                onTabChange={handleTabChange}
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
          <div className="h-full overflow-y-auto">
            <LogsTabContent
              localTestResult={localTestResult}
              localTestError={localTestError}
              submission={submission}
              submissionError={submissionError}
            />
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="h-full overflow-y-auto">
            <HistoryTabContent
              problemId={problemId}
              sessionHistory={sessionHistory}
              onLoadSubmission={onLoadSubmission}
              onTabChange={handleTabChange}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// Result Tab Content Component
function ResultTabContent({
  submission,
  isSubmitting,
  submissionError,
  onRetry,
  problem,
  onTabChange,
}: {
  submission?: Submission | null;
  isSubmitting?: boolean;
  submissionError?: string | null;
  onRetry?: () => void;
  problem?: Problem;
  onTabChange?: (tab: TabId) => void;
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
      <div className="p-4 space-y-4">
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
          </div>
        </div>

        {/* 수정 가이드 */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">어떻게 수정할까요?</p>
              <ul className="text-blue-700 dark:text-blue-400 space-y-0.5 list-disc list-inside text-xs">
                <li>테스트가 <strong>정상 동작하는 코드</strong>를 통과해야 합니다</li>
                <li>assert 문의 기대값이 올바른지 확인하세요</li>
                <li>함수 이름, 파라미터가 문제 설명과 일치하는지 확인하세요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            코드 수정 후 다시 제출
          </button>
        )}

        <p className="text-xs text-gray-500 text-center">
          로그 탭에서 상세 실패 내용을 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  // Success state
  if (submission?.status === "SUCCESS") {
    const killRatio = submission.total_mutants && submission.total_mutants > 0
      ? ((submission.killed_mutants || 0) / submission.total_mutants) * 100
      : 0;

    const survivedCount = (submission.total_mutants || 0) - (submission.killed_mutants || 0);

    // Extract missed bugs from execution_log
    const getMissedBugs = (): Array<{ id: number; description: string; testOutput?: string }> => {
      const executionLog = submission.execution_log as {
        mutant_details?: Array<{
          mutant_id: number | string;  // Can be string from Pyodide client-side execution
          killed: boolean;
          test_output?: string;
        }>;
      } | undefined;

      if (!executionLog?.mutant_details || !problem?.buggy_implementations) {
        return [];
      }

      return executionLog.mutant_details
        .filter(m => !m.killed)
        .map(m => {
          // Compare as strings to handle both number and string mutant_ids
          const mutantIdStr = String(m.mutant_id);
          const buggyImpl = problem.buggy_implementations.find(b => String(b.id) === mutantIdStr);
          return {
            id: typeof m.mutant_id === 'number' ? m.mutant_id : parseInt(mutantIdStr, 10),
            description: buggyImpl?.bug_description || `버그 #${m.mutant_id}`,
            testOutput: m.test_output,
          };
        });
    };

    const missedBugs = getMissedBugs();

    // Determine result type based on kill ratio
    const getResultType = () => {
      if (killRatio >= 90) return "excellent" as const;
      if (killRatio >= 70) return "good" as const;
      if (killRatio >= 50) return "moderate" as const;
      return "needs_improvement" as const;
    };

    const type = getResultType();

    return (
      <SuccessResultContent
        submission={submission}
        killRatio={killRatio}
        survivedCount={survivedCount}
        missedBugs={missedBugs}
        type={type}
        onTabChange={onTabChange}
      />
    );
  }

  return null;
}

// Verification Badge Component for P0 Security
function VerificationBadge({ submission }: { submission: Submission }) {
  const executionMode = submission.execution_mode || "client";
  const verified = submission.verified || false;
  const verificationStatus = submission.verification_status;

  // 서버 실행은 기본적으로 신뢰
  if (executionMode === "server") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
        <ShieldCheck className="w-3 h-3" />
        서버 실행
      </span>
    );
  }

  // 클라이언트 실행 검증 상태
  if (verificationStatus === "verified" || verified) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
        <ShieldCheck className="w-3 h-3" />
        검증됨
      </span>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
        <Loader2 className="w-3 h-3 animate-spin" />
        검증 중
      </span>
    );
  }

  if (verificationStatus === "mismatch") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
        <ShieldAlert className="w-3 h-3" />
        확정 보류
      </span>
    );
  }

  // 기본: 클라이언트 실행, 미검증
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
      title="브라우저에서 실행된 결과입니다"
    >
      <Shield className="w-3 h-3" />
      로컬 실행
    </span>
  );
}

// Success Result Content Component with missed bugs details
function SuccessResultContent({
  submission,
  killRatio,
  survivedCount,
  missedBugs,
  type,
  onTabChange,
}: {
  submission: Submission;
  killRatio: number;
  survivedCount: number;
  missedBugs: Array<{ id: number; description: string; testOutput?: string }>;
  type: "excellent" | "good" | "moderate" | "needs_improvement";
  onTabChange?: (tab: TabId) => void;
}) {
  const [expandedBugId, setExpandedBugId] = useState<number | null>(null);

  const toggleBugExpand = (bugId: number) => {
    setExpandedBugId(expandedBugId === bugId ? null : bugId);
  };

  // Summary message based on type
  const getSummaryMessage = () => {
    if (type === "excellent") return "거의 모든 버그를 탐지했습니다!";
    if (type === "good") return `${survivedCount}개의 버그가 테스트를 통과했습니다.`;
    if (type === "moderate") return `절반 정도의 버그만 탐지했습니다.`;
    return `대부분의 버그가 살아남았습니다.`;
  };

  // Recommendations based on type
  const getRecommendations = (): string[] => {
    if (type === "excellent") {
      return ["완벽에 가까운 테스트입니다. 유지보수 시 테스트도 함께 업데이트하세요."];
    }
    if (type === "good") {
      return [
        "경계값 테스트 추가 (0, 빈 값, 최대값)",
        "예외 상황 테스트 강화",
      ];
    }
    if (type === "moderate") {
      return [
        "다양한 입력값 테스트 추가",
        "경계값/예외 케이스 보강",
        "엣지 케이스 (빈 배열, None 등) 확인",
      ];
    }
    return [
      "기본적인 입력값 테스트부터 추가",
      "경계값 테스트 (0, 1, 최대값)",
      "예외 상황 테스트 (빈 입력, 잘못된 타입)",
    ];
  };

  const recommendations = getRecommendations();

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Beta Label */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
          학습용 지표 (베타)
        </span>
      </div>

      {/* Summary Row */}
      <div className="flex items-center gap-4">
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
              <span className="text-sm text-gray-600 dark:text-gray-400" title="테스트가 버그를 발견한 비율">
                버그 탐지율
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
              {submission.killed_mutants}/{submission.total_mutants}개 버그 발견
            </p>
          </div>
        )}

        {/* Verification badge + Success badge */}
        <div className="flex items-center gap-2">
          <VerificationBadge submission={submission} />
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">완료</span>
          </div>
        </div>
      </div>

      {/* Missed Bugs Section */}
      {missedBugs.length > 0 ? (
        <div className="rounded-lg border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20">
          {/* Header */}
          <div className="px-3 py-2 border-b border-orange-200 dark:border-orange-800/50">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <Search className="w-4 h-4" />
              <span className="font-medium text-sm">놓친 버그 ({missedBugs.length}개)</span>
            </div>
          </div>

          {/* Bug List */}
          <div className="divide-y divide-orange-200 dark:divide-orange-800/50">
            {missedBugs.map((bug) => (
              <div key={bug.id} className="px-3 py-2">
                <button
                  onClick={() => toggleBugExpand(bug.id)}
                  className="w-full flex items-start gap-2 text-left hover:bg-orange-100 dark:hover:bg-orange-900/30 -mx-1 px-1 py-0.5 rounded transition-colors"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5 transition-transform ${
                      expandedBugId === bug.id ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <span className="text-sm text-orange-800 dark:text-orange-200 flex-1">
                    {bug.description}
                  </span>
                </button>

                {/* Expanded content */}
                {expandedBugId === bug.id && bug.testOutput && (
                  <div className="mt-2 ml-6 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{bug.testOutput}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : type === "excellent" ? (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{getSummaryMessage()}</p>
          </div>
        </div>
      ) : (
        <div className={`p-3 rounded-lg text-sm ${
          type === "good" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" :
          type === "moderate" ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" :
          "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
        }`}>
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{getSummaryMessage()}</p>
          </div>
        </div>
      )}

      {/* Hints/Recommendations Section */}
      {recommendations.length > 0 && type !== "excellent" && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-sm">개선 힌트</span>
              <ul className="mt-1 space-y-1 text-sm">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-blue-400">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      {type !== "excellent" && (
        <ResultCTAButtons
          submission={submission}
          missedBugs={missedBugs}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
}

// CTA Buttons for Result Tab
function ResultCTAButtons({
  submission,
  missedBugs,
  onTabChange,
}: {
  submission?: Submission;
  missedBugs?: Array<{ id: number; description: string }>;
  onTabChange?: (tab: TabId) => void;
}) {
  const { openAIChatWithPrefill } = useLayoutStore();

  const handleAskAI = () => {
    if (!submission) {
      openAIChatWithPrefill("채점 결과에 대해 분석해주세요.");
      return;
    }

    // Build context for AI prompt
    const killRatio = submission.total_mutants && submission.total_mutants > 0
      ? Math.round((submission.killed_mutants || 0) / submission.total_mutants * 100)
      : 0;

    const missedBugsText = missedBugs && missedBugs.length > 0
      ? missedBugs.map(b => `- ${b.description}`).join("\n")
      : "없음";

    const prompt = applyTemplate("gradingResultAnalysis", {
      score: submission.score.toString(),
      killRatio: killRatio.toString(),
      missedBugs: missedBugsText,
    });

    openAIChatWithPrefill(prompt);
  };

  const handleViewLogs = () => {
    onTabChange?.("logs");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleViewLogs}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                   bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                   hover:bg-gray-200 dark:hover:bg-gray-700
                   rounded-lg transition-colors"
      >
        <Terminal className="w-4 h-4" />
        실행 로그 보기
      </button>
      <button
        onClick={handleAskAI}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                   bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300
                   hover:bg-purple-200 dark:hover:bg-purple-900/50
                   rounded-lg transition-colors"
      >
        <Bot className="w-4 h-4" />
        AI 도우미에게 물어보기
      </button>
      <Link
        href="/problems"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                   bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                   hover:bg-gray-200 dark:hover:bg-gray-700
                   rounded-lg transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        다른 문제 풀기
      </Link>
    </div>
  );
}

// Logs Tab Content Component
function LogsTabContent({
  localTestResult,
  localTestError,
  submission,
  submissionError,
}: {
  localTestResult?: PytestResult | null;
  localTestError?: string | null;
  submission?: Submission | null;
  submissionError?: string | null;
}) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isTestOutputOpen, setIsTestOutputOpen] = useState(true);
  const [isRawLogOpen, setIsRawLogOpen] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [testOutputCopied, setTestOutputCopied] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);

  // Determine log source and type
  const isLocalTest = !!(localTestResult || localTestError);
  const isSubmission = !!(submission || submissionError);

  // Get pytest output
  const pytestOutput = localTestResult?.output || "";

  // Get raw JSON data
  const getRawJson = (): string => {
    if (submissionError) return submissionError;
    if (submission?.execution_log) {
      return JSON.stringify(submission.execution_log, null, 2);
    }
    if (localTestError) return localTestError;
    if (localTestResult) {
      return JSON.stringify(localTestResult, null, 2);
    }
    return "";
  };

  const rawJson = getRawJson();
  const hasContent = pytestOutput || rawJson;

  // Generate summary text
  const getSummaryText = (): string => {
    const lines: string[] = [];

    if (isLocalTest && localTestResult) {
      lines.push(`실행 모드: 로컬 테스트`);
      lines.push(`실행 시간: ${localTestResult.executionTime.toFixed(0)}ms`);
      lines.push(`테스트 결과: ${localTestResult.passed}개 통과, ${localTestResult.failed}개 실패, ${localTestResult.errors}개 에러`);
      if (localTestResult.failed > 0 || localTestResult.errors > 0) {
        lines.push(`상태: 테스트 실패`);
      } else {
        lines.push(`상태: 테스트 통과`);
      }
    } else if (isSubmission && submission) {
      lines.push(`실행 모드: 채점`);
      lines.push(`상태: ${submission.status}`);
      if (submission.killed_mutants !== undefined && submission.total_mutants !== undefined) {
        lines.push(`버그 탐지: ${submission.killed_mutants}/${submission.total_mutants}개`);
      }
      lines.push(`점수: ${submission.score}점`);
    } else if (submissionError) {
      lines.push(`실행 모드: 채점`);
      lines.push(`상태: 에러`);
      lines.push(`에러: ${submissionError}`);
    } else if (localTestError) {
      lines.push(`실행 모드: 로컬 테스트`);
      lines.push(`상태: 에러`);
      lines.push(`에러: ${localTestError}`);
    }

    return lines.join("\n");
  };

  const summaryText = getSummaryText();

  // Copy handlers
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy summary:", err);
    }
  };

  const handleCopyTestOutput = async () => {
    try {
      await navigator.clipboard.writeText(pytestOutput);
      setTestOutputCopied(true);
      setTimeout(() => setTestOutputCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy test output:", err);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setRawCopied(true);
      setTimeout(() => setRawCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy raw:", err);
    }
  };

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">로그 없음</p>
          <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
            테스트 실행 또는 채점 후 상세 로그가 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {/* Summary Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          onKeyDown={(e) => e.key === "Enter" && setIsSummaryOpen(!isSummaryOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-4 h-4 transition-transform ${isSummaryOpen ? "rotate-90" : ""}`} />
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">요약</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleCopySummary(); }}
            className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded transition-colors"
            title="요약 복사"
          >
            {summaryCopied ? (
              <><Check className="w-3 h-3 text-green-500" /> 복사됨</>
            ) : (
              <><Copy className="w-3 h-3" /> 요약 복사</>
            )}
          </button>
        </div>
        {isSummaryOpen && (
          <div className="p-3 bg-white dark:bg-gray-900 text-sm">
            <div className="space-y-1">
              {summaryText.split("\n").map((line, idx) => {
                const [label, value] = line.split(": ");
                return (
                  <div key={idx} className="flex">
                    <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}:</span>
                    <span className="text-gray-900 dark:text-gray-100">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Test Output Section (pytest stdout) */}
      {pytestOutput && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsTestOutputOpen(!isTestOutputOpen)}
            onKeyDown={(e) => e.key === "Enter" && setIsTestOutputOpen(!isTestOutputOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className={`w-4 h-4 transition-transform ${isTestOutputOpen ? "rotate-90" : ""}`} />
              <Terminal className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">테스트 출력</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopyTestOutput(); }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded transition-colors"
              title="테스트 출력 복사"
            >
              {testOutputCopied ? (
                <><Check className="w-3 h-3 text-green-500" /> 복사됨</>
              ) : (
                <><Copy className="w-3 h-3" /> 출력 복사</>
              )}
            </button>
          </div>
          {isTestOutputOpen && (
            <pre className="p-3 bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">
              {pytestOutput}
            </pre>
          )}
        </div>
      )}

      {/* Raw Data Section (JSON) */}
      {rawJson && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsRawLogOpen(!isRawLogOpen)}
            onKeyDown={(e) => e.key === "Enter" && setIsRawLogOpen(!isRawLogOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ChevronRight className={`w-4 h-4 transition-transform ${isRawLogOpen ? "rotate-90" : ""}`} />
              <Code className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">원시 데이터 (JSON)</span>
              {!isRawLogOpen && (
                <span className="text-xs text-gray-400 dark:text-gray-500">클릭하여 펼치기</span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopyRaw(); }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded transition-colors"
              title="원시 데이터 복사"
            >
              {rawCopied ? (
                <><Check className="w-3 h-3 text-green-500" /> 복사됨</>
              ) : (
                <><Copy className="w-3 h-3" /> JSON 복사</>
              )}
            </button>
          </div>
          {isRawLogOpen && (
            <pre className="p-3 bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">
              {rawJson}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// History Tab Content Component
function HistoryTabContent({
  problemId,
  sessionHistory,
  onLoadSubmission,
  onTabChange,
}: {
  problemId?: number;
  sessionHistory?: Submission[];
  onLoadSubmission?: (submission: Submission) => void;
  onTabChange?: (tab: TabId) => void;
}) {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch submissions from API (for authenticated users)
  const fetchSubmissions = useCallback(async () => {
    if (!problemId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all submissions and filter by problem_id
      const response = await getMySubmissions(1, 50);
      const filtered = response.submissions.filter(
        (s) => s.problem_id === problemId
      );
      setSubmissions(filtered);
    } catch (err) {
      // User might not be authenticated - that's OK, use session history
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Convert session history to display format
  const sessionItems: SubmissionListItem[] = (sessionHistory || [])
    .filter((s) => s.problem_id === problemId)
    .map((s) => ({
      id: s.id,
      problem_id: s.problem_id,
      problem_title: "",
      problem_difficulty: "Easy" as const,
      status: s.status,
      score: s.score,
      killed_mutants: s.killed_mutants,
      total_mutants: s.total_mutants,
      has_feedback: !!s.feedback_json,
      created_at: s.created_at,
    }));

  // Merge API submissions with session history, avoiding duplicates
  const allSubmissions = [...submissions];
  sessionItems.forEach((item) => {
    if (!allSubmissions.some((s) => s.id === item.id)) {
      allSubmissions.push(item);
    }
  });

  // Sort by created_at descending (newest first)
  allSubmissions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Handle click on history item
  const handleItemClick = async (item: SubmissionListItem) => {
    if (!onLoadSubmission) return;

    // Check if it's in session history (full Submission object available)
    const sessionSubmission = sessionHistory?.find((s) => s.id === item.id);
    if (sessionSubmission) {
      onLoadSubmission(sessionSubmission);
      onTabChange?.("result");
      return;
    }

    // Otherwise, we need to fetch the full submission
    // For now, create a partial submission object from the list item
    const partialSubmission: Submission = {
      id: item.id,
      user_id: null,
      anonymous_id: null,
      problem_id: item.problem_id,
      code: "",
      status: item.status,
      score: item.score,
      killed_mutants: item.killed_mutants,
      total_mutants: item.total_mutants,
      created_at: item.created_at,
    };
    onLoadSubmission(partialSubmission);
    onTabChange?.("result");
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
            <CheckCircle className="w-3 h-3" />
            성공
          </span>
        );
      case "FAILURE":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
            <XCircle className="w-3 h-3" />
            실패
          </span>
        );
      case "ERROR":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
            <AlertTriangle className="w-3 h-3" />
            에러
          </span>
        );
      case "PENDING":
      case "RUNNING":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            <Loader2 className="w-3 h-3 animate-spin" />
            진행중
          </span>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px] p-4">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Empty state
  if (allSubmissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px] p-4 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">제출 히스토리 없음</p>
          <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">
            채점 후 제출 기록이 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  // History list
  return (
    <div className="p-3 space-y-2">
      {allSubmissions.map((item) => {
        const killRatio =
          item.killed_mutants !== undefined &&
          item.total_mutants !== undefined &&
          item.total_mutants > 0
            ? Math.round((item.killed_mutants / item.total_mutants) * 100)
            : null;

        return (
          <div
            key={item.id}
            data-testid={`history-item-${item.id}`}
            role="button"
            tabIndex={0}
            onClick={() => handleItemClick(item)}
            onKeyDown={(e) => e.key === "Enter" && handleItemClick(item)}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            {/* Top row: time and status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeTime(item.created_at)}
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Bottom row: score and kill ratio */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Trophy className={`w-4 h-4 ${
                  item.score >= 90 ? "text-green-500" :
                  item.score >= 70 ? "text-blue-500" :
                  item.score >= 50 ? "text-yellow-500" : "text-red-500"
                }`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.score}점
                </span>
              </div>

              {killRatio !== null && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Target className="w-4 h-4" />
                  <span>
                    {item.killed_mutants}/{item.total_mutants} ({killRatio}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
