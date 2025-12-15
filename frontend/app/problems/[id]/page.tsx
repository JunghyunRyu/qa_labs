/** Problem detail page - Resizable Split Layout */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getProblem } from "@/lib/api/problems";
import { createSubmission, getSubmission } from "@/lib/api/submissions";
import { ApiError } from "@/lib/api";
import { useSubmit } from "@/hooks/useSubmit";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProblemSolverShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCodeRunner } from "@/hooks/useCodeRunner";
import { useLayoutStore } from "@/stores/layoutStore";
import type { Problem, Submission, ClientExecutionResult } from "@/types/problem";
import type { AIChatMode } from "@/types/ai";
import type { PytestResult } from "@/workers/pyodide-worker-types";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import Breadcrumb from "@/components/Breadcrumb";
import ScoringMethodDrawer from "@/components/ScoringMethodDrawer";
import ResizableSplitPanel from "@/components/layout/ResizableSplitPanel";
import ProblemPanel from "@/components/layout/ProblemPanel";
import CodeEditorPanel from "@/components/layout/CodeEditorPanel";
import MobileTabLayout from "@/components/layout/MobileTabLayout";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import AICoachPanel from "@/components/AICoachPanel";
import Link from "next/link";

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = parseInt(params.id as string);
  const { isDesktop } = useMediaQuery();
  const { toggleProblemPanel, toggleAIChat, setIsAIChatOpen } = useLayoutStore();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isScoringDrawerOpen, setIsScoringDrawerOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AIChatMode>("OFF");

  // Local test state (Pyodide)
  const [localTestResult, setLocalTestResult] = useState<PytestResult | null>(null);
  const [localTestError, setLocalTestError] = useState<string | null>(null);

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingMaxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const pollingErrorCountRef = useRef<number>(0);

  // Polling constants
  const BASE_POLL_INTERVAL = 2000;
  const MAX_POLL_INTERVAL = 32000;

  // Pyodide for local testing and client-side mutation testing
  const {
    isReady: isPyodideReady,
    isRunning: isLocalTesting,
    progress: pyodideProgress,
    initialize: initializePyodide,
    runTests,
    runMutationTest,
  } = useCodeRunner({
    autoInit: false,
  });

  // Initialize Pyodide when problem loads
  useEffect(() => {
    if (problem && !isPyodideReady) {
      initializePyodide();
    }
  }, [problem, isPyodideReady, initializePyodide]);

  // Local test handler (quick test against golden code only)
  const handleLocalTest = useCallback(async () => {
    if (!problem || !code.trim() || !isPyodideReady) return;

    setLocalTestResult(null);
    setLocalTestError(null);

    try {
      const result = await runTests(code.trim(), problem.golden_code);
      setLocalTestResult(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof globalThis.Error ? err.message : "테스트 실행 실패";
      setLocalTestError(errorMessage);
    }
  }, [problem, code, isPyodideReady, runTests]);

  // 로컬 테스트 진행률 (실행 중일 때만)
  const currentLocalTestProgress = isLocalTesting ? pyodideProgress?.message : undefined;

  // Keyboard shortcuts
  useProblemSolverShortcuts({
    toggleProblemPanel,
    toggleAIChat,
    closeAIChat: () => setIsAIChatOpen(false),
  });

  // Generate initial test template
  const getInitialTemplate = (problem: Problem): string => {
    const functionNameMatch = problem.function_signature.match(/def\s+(\w+)/);
    const functionName = functionNameMatch ? functionNameMatch[1] : "function";

    return `import pytest
from target import ${functionName}


def test_basic():
    """기본 테스트 케이스"""
    # 정상 입력에 대한 테스트
    # result = ${functionName}(...)  # TODO: 인자 입력
    # assert result == ...  # TODO: 예상 결과
    pass


def test_edge_case():
    """경계값/예외 테스트"""
    # 경계값 테스트 예시
    # assert ${functionName}([]) == 0

    # 예외 테스트 예시
    # with pytest.raises(ValueError):
    #     ${functionName}(invalid_input)
    pass
`;
  };

  // Fetch problem data
  useEffect(() => {
    const fetchProblem = async () => {
      if (isNaN(problemId)) {
        setError("잘못된 문제 ID입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getProblem(problemId);
        setProblem(result);
        setCode(getInitialTemplate(result));
      } catch (err: unknown) {
        let errorMessage = "문제를 불러오는데 실패했습니다.";
        if (err instanceof ApiError) {
          const errorData = err.data as { detail?: string } | undefined;
          errorMessage = errorData?.detail || err.message;
        } else if (err && typeof err === "object" && "message" in err) {
          errorMessage = String(err.message);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Polling for submission result with exponential backoff
  useEffect(() => {
    if (!submission || (submission.status !== "PENDING" && submission.status !== "RUNNING")) {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      if (pollingMaxTimeoutRef.current) {
        clearTimeout(pollingMaxTimeoutRef.current);
        pollingMaxTimeoutRef.current = null;
      }
      pollingStartTimeRef.current = null;
      pollingErrorCountRef.current = 0;
      return;
    }

    if (!pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
      pollingErrorCountRef.current = 0;
    }

    const POLLING_MAX_TIMEOUT = 5 * 60 * 1000;
    pollingMaxTimeoutRef.current = setTimeout(() => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      setSubmissionError(
        "채점이 5분 이상 지연되고 있습니다. 서버에 문제가 있을 수 있습니다. 잠시 후 다시 시도해주세요."
      );
      pollingStartTimeRef.current = null;
    }, POLLING_MAX_TIMEOUT);

    const getBackoffInterval = (errorCount: number) => {
      return Math.min(BASE_POLL_INTERVAL * Math.pow(2, errorCount), MAX_POLL_INTERVAL);
    };

    const scheduleNextPoll = (currentInterval: number) => {
      pollingTimeoutRef.current = setTimeout(async () => {
        try {
          const updatedSubmission = await getSubmission(submission.id);
          setSubmission(updatedSubmission);
          pollingErrorCountRef.current = 0;

          if (updatedSubmission.status === "PENDING" || updatedSubmission.status === "RUNNING") {
            scheduleNextPoll(BASE_POLL_INTERVAL);
          }
        } catch (err) {
          pollingErrorCountRef.current += 1;
          console.error("Failed to fetch submission:", err);

          if (pollingErrorCountRef.current >= 5) {
            setSubmissionError("연결 문제가 발생했습니다. 새로고침해 주세요.");
            if (pollingTimeoutRef.current) {
              clearTimeout(pollingTimeoutRef.current);
              pollingTimeoutRef.current = null;
            }
            if (pollingMaxTimeoutRef.current) {
              clearTimeout(pollingMaxTimeoutRef.current);
              pollingMaxTimeoutRef.current = null;
            }
            return;
          }

          const nextInterval = getBackoffInterval(pollingErrorCountRef.current);
          scheduleNextPoll(nextInterval);
        }
      }, currentInterval);
    };

    scheduleNextPoll(BASE_POLL_INTERVAL);

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      if (pollingMaxTimeoutRef.current) {
        clearTimeout(pollingMaxTimeoutRef.current);
        pollingMaxTimeoutRef.current = null;
      }
    };
  }, [submission]);

  // Submission function - runs mutation test locally, then saves results to server
  const doSubmit = useCallback(async (): Promise<Submission> => {
    if (!problem) {
      throw new globalThis.Error("문제 정보가 없습니다.");
    }

    if (!code.trim()) {
      throw new globalThis.Error("코드를 입력해주세요.");
    }

    pollingStartTimeRef.current = null;
    pollingErrorCountRef.current = 0;
    setSubmissionError(null);

    // If Pyodide is ready and we have buggy implementations, run client-side mutation test
    if (isPyodideReady && problem.buggy_implementations && problem.buggy_implementations.length > 0) {
      // Prepare buggy implementations for Pyodide
      const buggyImpls = problem.buggy_implementations.map((bi) => ({
        id: String(bi.id),
        code: bi.buggy_code,
      }));

      // Run mutation test locally
      const testResult = await runMutationTest(code.trim(), problem.golden_code, buggyImpls);

      // Convert to ClientExecutionResult format
      const clientResult: ClientExecutionResult = {
        golden_code_passed: testResult.goldenCodePassed,
        mutants_killed: testResult.mutantsKilled,
        total_mutants: testResult.totalMutants,
        score: testResult.score,
        details: testResult.details.map((d) => ({
          mutant_id: d.mutantId,
          killed: d.killed,
          test_output: d.testOutput,
          execution_time: d.executionTime,
        })),
        total_execution_time: testResult.executionTime,
      };

      // Submit with client results (server skips Celery)
      const newSubmission = await createSubmission({
        problem_id: problem.id,
        code: code.trim(),
        client_result: clientResult,
      });

      setSubmission(newSubmission);
      return newSubmission;
    }

    // Fallback to server-side execution (no buggy implementations or Pyodide not ready)
    const newSubmission = await createSubmission({
      problem_id: problem.id,
      code: code.trim(),
    });

    setSubmission(newSubmission);
    return newSubmission;
  }, [problem, code, isPyodideReady, runMutationTest]);

  // useSubmit hook with debounce
  const { submit: handleSubmit, isSubmitting: submitting } = useSubmit(doSubmit, {
    debounceMs: 2000,
    onError: (err: unknown) => {
      let errorMessage = "제출에 실패했습니다.";
      if (err instanceof ApiError) {
        if (err.status === 429) {
          errorMessage = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        } else {
          const errorData = err.data as { detail?: string } | undefined;
          errorMessage = errorData?.detail || err.message;
        }
      } else if (err instanceof globalThis.Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String((err as { message: unknown }).message);
      }
      setSubmissionError(errorMessage);
    },
  });

  // AI mode change handler
  const handleAIModeChange = useCallback((mode: AIChatMode) => {
    setAiMode(mode);
    if (mode === "OFF") {
      setIsAIChatOpen(false);
    }
  }, [setIsAIChatOpen]);

  // Loading state
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message={error} />
        <div className="mt-4">
          <Link
            href="/problems"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            ← 문제 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!problem) {
    return null;
  }

  // Desktop layout - Resizable split panel
  if (isDesktop) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Breadcrumb
            items={[
              { label: "문제 목록", href: "/problems" },
              { label: problem.title || `문제 #${problem.id}` },
            ]}
          />
        </div>

        {/* Main content - Split panel */}
        <div className="flex-1 min-h-0">
          <ResizableSplitPanel
            leftPanel={<ProblemPanel problem={problem} />}
            rightPanel={
              <CodeEditorPanel
                code={code}
                onCodeChange={setCode}
                onSubmit={handleSubmit}
                isSubmitting={submitting}
                submission={submission}
                submissionError={submissionError}
                goldenCode={problem.golden_code}
                onLocalTest={isPyodideReady ? handleLocalTest : undefined}
                isLocalTesting={isLocalTesting}
                localTestResult={localTestResult}
                localTestError={localTestError}
                localTestProgress={currentLocalTestProgress}
              />
            }
          />
        </div>

        {/* Floating AI Chat */}
        <FloatingAIChat
          problemId={problemId}
          codeContext={code}
          mode={aiMode}
          onModeChange={handleAIModeChange}
        />

        {/* Scoring Method Drawer */}
        <ScoringMethodDrawer
          isOpen={isScoringDrawerOpen}
          onClose={() => setIsScoringDrawerOpen(false)}
        />
      </div>
    );
  }

  // Mobile/Tablet layout - Tab-based
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Breadcrumb
          items={[
            { label: "문제 목록", href: "/problems" },
            { label: problem.title || `문제 #${problem.id}` },
          ]}
        />
      </div>

      {/* Tab Layout */}
      <div className="flex-1 min-h-0">
        <MobileTabLayout
          problemPanel={
            <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
              <ProblemPanel problem={problem} />
            </div>
          }
          codePanel={
            <CodeEditorPanel
              code={code}
              onCodeChange={setCode}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              submission={submission}
              submissionError={submissionError}
              goldenCode={problem.golden_code}
              onLocalTest={isPyodideReady ? handleLocalTest : undefined}
              isLocalTesting={isLocalTesting}
              localTestResult={localTestResult}
              localTestError={localTestError}
              localTestProgress={currentLocalTestProgress}
            />
          }
          aiPanel={
            <div className="h-full">
              <AICoachPanel
                problemId={problemId}
                codeContext={code}
                mode={aiMode}
                onModeChange={handleAIModeChange}
                className="h-full"
              />
            </div>
          }
        />
      </div>

      {/* Scoring Method Drawer */}
      <ScoringMethodDrawer
        isOpen={isScoringDrawerOpen}
        onClose={() => setIsScoringDrawerOpen(false)}
      />
    </div>
  );
}
