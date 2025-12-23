/** Problem detail page - Resizable Split Layout */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { ChevronLeft } from "lucide-react";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import ScoringMethodDrawer from "@/components/ScoringMethodDrawer";
import { generateTestTemplate, generateFallbackTemplate } from "@/lib/templateGenerator";
import ResizableSplitPanel from "@/components/layout/ResizableSplitPanel";
import ProblemPanel from "@/components/layout/ProblemPanel";
import CodeEditorPanel from "@/components/layout/CodeEditorPanel";
import MobileTabLayout from "@/components/layout/MobileTabLayout";
import ProblemPeekOverlay from "@/components/layout/ProblemPeekOverlay";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import AICoachPanel from "@/components/AICoachPanel";
import type { SavedFeedback } from "@/components/ai/SavedFeedbackDisplay";
import Link from "next/link";

export default function ProblemDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionIdFromUrl = searchParams.get("submission");
  // Support both numeric ID and slug
  const problemIdOrSlug = params.id as string;
  const { isDesktop } = useMediaQuery();
  const {
    toggleProblemPanel,
    toggleAIChat,
    setIsAIChatOpen,
    isFocusMode,
    toggleFocusMode,
    isProblemPeekOpen,
    toggleProblemPeek,
    setIsProblemPeekOpen,
  } = useLayoutStore();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isScoringDrawerOpen, setIsScoringDrawerOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AIChatMode>("OFF");

  // Saved feedback from URL submission parameter
  const [savedFeedback, setSavedFeedback] = useState<SavedFeedback | null>(null);
  const [savedFeedbackScore, setSavedFeedbackScore] = useState<number | undefined>(undefined);

  // Local test state (Pyodide)
  const [localTestResult, setLocalTestResult] = useState<PytestResult | null>(null);
  const [localTestError, setLocalTestError] = useState<string | null>(null);

  // Session history (for non-authenticated users)
  const [sessionHistory, setSessionHistory] = useState<Submission[]>([]);

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

  // Initialize code: either from saved submission or template
  // This single effect handles all code initialization to avoid race conditions
  useEffect(() => {
    const initializeCode = async () => {
      // Wait for problem to load first
      if (!problem) return;

      // Clear previous saved feedback state
      setSavedFeedback(null);
      setSavedFeedbackScore(undefined);

      if (submissionIdFromUrl) {
        // Load saved submission
        try {
          const submissionData = await getSubmission(submissionIdFromUrl);

          // Check if this submission belongs to this problem
          if (submissionData.problem_id !== problem.id) {
            console.warn("Submission does not belong to this problem");
            setCode(getInitialTemplate(problem));
            return;
          }

          // 1. Load the submitted code into editor
          if (submissionData.code) {
            setCode(submissionData.code);
          } else {
            setCode(getInitialTemplate(problem));
          }

          // 2. Set the submission result (score, mutants, status)
          setSubmission(submissionData);

          // 3. Extract and show AI feedback if exists
          if (submissionData.feedback_json) {
            const feedback = submissionData.feedback_json as unknown as SavedFeedback;
            setSavedFeedback(feedback);
            setSavedFeedbackScore(submissionData.score);
            // Auto-open AI chat panel to show feedback
            setIsAIChatOpen(true);
            setAiMode("COACH");
          }
        } catch (err) {
          console.error("Failed to load saved submission:", err);
          // Fallback to template on error
          setCode(getInitialTemplate(problem));
        }
      } else {
        // No submission param - set template
        setCode(getInitialTemplate(problem));
      }
    };

    initializeCode();
  }, [submissionIdFromUrl, problem, setIsAIChatOpen]);

  // Clear saved feedback handler
  const handleClearSavedFeedback = useCallback(() => {
    setSavedFeedback(null);
    setSavedFeedbackScore(undefined);
    // Remove submission param from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete("submission");
    window.history.replaceState({}, "", url.toString());
  }, []);

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

  // Load submission from history
  const handleLoadSubmission = useCallback((loadedSubmission: Submission) => {
    setSubmission(loadedSubmission);
    // If the submission has code, optionally load it (but keep current code by default)
    // Users can choose to view the result without changing their current code
  }, []);

  // 로컬 테스트 진행률 (실행 중일 때만)
  const currentLocalTestProgress = isLocalTesting ? pyodideProgress?.message : undefined;

  // Keyboard shortcuts
  useProblemSolverShortcuts({
    toggleProblemPanel,
    toggleAIChat,
    closeAIChat: () => setIsAIChatOpen(false),
    toggleFocusMode,
    toggleProblemPeek,
    closeProblemPeek: () => setIsProblemPeekOpen(false),
  });

  // Generate initial test template using the template generator
  const getInitialTemplate = (problem: Problem): string => {
    try {
      return generateTestTemplate(problem);
    } catch (err) {
      console.warn("Failed to generate template, using fallback:", err);
      return generateFallbackTemplate(problem.function_signature);
    }
  };

  // Fetch problem data (code initialization is handled by initializeCode effect)
  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemIdOrSlug) {
        setError("잘못된 문제 ID입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getProblem(problemIdOrSlug);
        setProblem(result);
        // Note: Code initialization is handled by the initializeCode effect
        // which depends on `problem` state and `submissionIdFromUrl`
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
  }, [problemIdOrSlug]);

  // Polling for submission result with exponential backoff
  // Also poll for AI feedback if member submitted successfully but feedback not yet generated
  useEffect(() => {
    const needsPolling = submission && (
      submission.status === "PENDING" ||
      submission.status === "RUNNING" ||
      // 회원이고 SUCCESS인데 feedback_json이 아직 없으면 AI 피드백 대기 중
      (submission.status === "SUCCESS" && submission.user_id && !submission.feedback_json)
    );

    if (!needsPolling) {
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

          // 폴링 계속 조건: 채점 진행 중 또는 AI 피드백 대기 중
          const shouldContinuePolling =
            updatedSubmission.status === "PENDING" ||
            updatedSubmission.status === "RUNNING" ||
            (updatedSubmission.status === "SUCCESS" && updatedSubmission.user_id && !updatedSubmission.feedback_json);

          if (shouldContinuePolling) {
            scheduleNextPoll(BASE_POLL_INTERVAL);
          } else {
            // Add to session history when submission completes
            setSessionHistory((prev) => {
              // Avoid duplicates
              if (prev.some((s) => s.id === updatedSubmission.id)) {
                return prev;
              }
              return [updatedSubmission, ...prev];
            });
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
    // Focus mode uses smaller header (h-8 = 2rem vs h-14 = 3.5rem)
    const headerHeight = isFocusMode ? "2rem" : "3.5rem";

    return (
      <div className="flex flex-col" style={{ height: `calc(100vh - ${headerHeight})` }}>
        {/* Main content - Split panel (Breadcrumb integrated into ProblemPanel) */}
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
                problemId={problem?.id ?? 0}
                onLoadSubmission={handleLoadSubmission}
                sessionHistory={sessionHistory}
              />
            }
          />
        </div>

        {/* Floating AI Chat */}
        <FloatingAIChat
          problemId={problem?.id ?? 0}
          codeContext={code}
          mode={aiMode}
          onModeChange={handleAIModeChange}
          savedFeedback={savedFeedback}
          savedFeedbackScore={savedFeedbackScore}
          onClearSavedFeedback={handleClearSavedFeedback}
        />

        {/* Problem Peek Overlay (Alt+P) */}
        <ProblemPeekOverlay
          problem={problem}
          isOpen={isProblemPeekOpen}
          onClose={() => setIsProblemPeekOpen(false)}
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
      {/* Compact Mobile Header */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Link
            href="/problems"
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">목록</span>
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">
            {problem.title || `문제 #${problem.id}`}
          </h1>
        </div>
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
              problemId={problem?.id ?? 0}
              onLoadSubmission={handleLoadSubmission}
              sessionHistory={sessionHistory}
            />
          }
          aiPanel={
            <div className="h-full">
              <AICoachPanel
                problemId={problem?.id ?? 0}
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
