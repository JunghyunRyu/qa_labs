/** Problem detail page - Resizable Split Layout */

"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getProblem } from "@/lib/api/problems";
import { createSubmission, getSubmission } from "@/lib/api/submissions";
import { ApiError } from "@/lib/api";
import { useSubmit } from "@/hooks/useSubmit";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProblemSolverShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCodeRunner } from "@/hooks/useCodeRunner";
import { useCodeDraft, loadDraft, clearDraft } from "@/hooks/useCodeDraft";
import { useLayoutStore } from "@/stores/layoutStore";
import type { Problem, Submission, ClientExecutionResult } from "@/types/problem";
import type { AIChatMode } from "@/types/ai";
import type { PytestResult } from "@/workers/pyodide-worker-types";
import type { PromptContext } from "@/lib/quickPrompts";
import { ChevronLeft, Sparkles } from "lucide-react";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import ScoringMethodDrawer from "@/components/ScoringMethodDrawer";
import { GuestConversionBanner, useGuestConversion } from "@/components/conversion";
import MobileNotice from "@/components/MobileNotice";
import { generateTestTemplate, generateFallbackTemplate } from "@/lib/templateGenerator";
import ResizableSplitPanel from "@/components/layout/ResizableSplitPanel";
import ProblemPanel from "@/components/layout/ProblemPanel";
import CodeEditorPanel from "@/components/layout/CodeEditorPanel";
import MobileTabLayout from "@/components/layout/MobileTabLayout";
// ProblemPeekOverlay 제거됨 - 사이드바 확장 모드로 대체
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import AICoachPanel from "@/components/AICoachPanel";
import type { SavedFeedback } from "@/components/ai/SavedFeedbackDisplay";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { trackCodeSubmit, trackProblemView, trackLocalTest, trackAINudgeImpression, trackAINudgeClick, trackConversionModalTrigger, trackFirstSuccessModalOpen, trackFirstSuccessAIClick } from "@/lib/analytics";
import { PyodideStatusIndicator } from "@/components/PyodideStatusIndicator";

// Dynamic imports for modals and heavy components (not needed on initial render)
const ConversionModal = dynamic(() => import("@/components/conversion/ConversionModal"), { ssr: false });
const FirstSuccessModal = dynamic(() => import("@/components/ai/FirstSuccessModal"), { ssr: false });
const OnboardingModal = dynamic(() => import("@/components/OnboardingModal"), { ssr: false });
const AIBugDiscoveryToast = dynamic(() => import("@/components/ai/AIBugDiscoveryToast"), { ssr: false });
const ConfettiEffect = dynamic(() => import("@/components/tutorial/ConfettiEffect"), { ssr: false });

export default function ProblemDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionIdFromUrl = searchParams.get("submission");
  // Support both numeric ID and slug
  const problemIdOrSlug = params.id as string;
  const { isDesktop } = useMediaQuery();
  const { isAuthenticated, user } = useAuth();
  const {
    toggleProblemPanel,
    toggleAIChat,
    setIsAIChatOpen,
    isAIChatOpen,
    aiDrawerWidth,
    isFocusMode,
    toggleFocusMode,
    isProblemPeekOpen,
    toggleProblemPeek,
    setIsProblemPeekOpen,
    openProblemSearch,
    openAIChatWithPrefill,
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

  // Honeypot for bot prevention (should always be empty)
  const [honeypot, setHoneypot] = useState("");

  // M6-1: 회원 전환 모달 상태
  const [showConversionModal, setShowConversionModal] = useState(false);
  const conversionModalTriggeredRef = useRef(false); // Strict Mode 이중 실행 방지
  const { incrementSubmissionCount } = useGuestConversion();

  // AI 넛지 상태
  const [showAINudge, setShowAINudge] = useState<{
    type: "wrong_answer" | "inactivity";
    message: string;
  } | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // M7 AI 강제 경험: VE01 첫 성공 모달
  const [showFirstSuccessModal, setShowFirstSuccessModal] = useState(false);
  const firstSuccessShownRef = useRef(false);

  // M7 AI 강제 경험: 자동 오답 토스트
  const [showBugDiscoveryToast, setShowBugDiscoveryToast] = useState(false);

  // 온보딩 모달 상태
  const onboardingType = searchParams.get("onboarding") as "new" | "returning" | null;
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

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
    isInitializing: isPyodideInitializing,
    progress: pyodideProgress,
    initialize: initializePyodide,
    runTests,
    runMutationTest,
  } = useCodeRunner({
    autoInit: false,
  });

  // M4: Pyodide 상태 (UI 인디케이터용)
  const pyodideStatus = isPyodideReady
    ? 'ready'
    : isPyodideInitializing
    ? 'loading'
    : 'idle';
  const pyodideProgressPercent = pyodideProgress?.percent || 0;
  const pyodideProgressMessage = pyodideProgress?.message;

  // Initialize Pyodide when problem loads
  useEffect(() => {
    if (problem && !isPyodideReady) {
      initializePyodide();
    }
  }, [problem, isPyodideReady, initializePyodide]);

  // 온보딩 모달 표시 (문제 로드 후)
  useEffect(() => {
    if (problem && onboardingType && (onboardingType === "new" || onboardingType === "returning")) {
      // 약간의 딜레이 후 모달 표시 (페이지 로딩 완료 느낌)
      const timer = setTimeout(() => {
        setShowOnboardingModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [problem, onboardingType]);

  // 온보딩 모달 닫기 핸들러 (URL에서 쿼리 파라미터 제거)
  const handleCloseOnboarding = useCallback(() => {
    setShowOnboardingModal(false);
    // URL에서 onboarding 파라미터 제거
    const url = new URL(window.location.href);
    url.searchParams.delete("onboarding");
    window.history.replaceState({}, "", url.toString());
  }, []);

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
        // No submission param - check for saved draft first
        const template = getInitialTemplate(problem);
        // sample_code가 있으면 sample_code 사용, 없으면 템플릿
        const defaultCode = problem.sample_code || template;
        const savedDraft = loadDraft(problem.slug);

        if (savedDraft && savedDraft.trim() !== defaultCode.trim()) {
          // Restore saved draft (draft가 sample_code/템플릿과 다를 때만)
          setCode(savedDraft);
        } else {
          // Use sample_code if exists, otherwise template
          setCode(defaultCode);
        }
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

      // GA 이벤트 트래킹 - 로컬 테스트
      trackLocalTest({
        problemId: problem.id,
        passed: result.passed,
        failed: result.failed,
      });
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
    openProblemSearch,
  });

  // AI 넛지: 오답 제출 시
  useEffect(() => {
    // submission이 있고, 점수가 100 미만이며, AI 채팅이 열려있지 않을 때
    if (submission && submission.score !== null && submission.score < 100 && !isAIChatOpen) {
      // 3초 후 넛지 표시 (즉시 표시하면 거슬릴 수 있음)
      const timer = setTimeout(() => {
        setShowAINudge({
          type: "wrong_answer",
          message: submission.score === 0
            ? "테스트가 통과하지 못했어요. AI 코치에게 도움을 받아볼까요?"
            : `${submission.score}점이에요! AI 코치가 놓친 부분을 알려드릴게요.`,
        });
        trackAINudgeImpression({ problemId: String(problem?.id), trigger: "wrong_answer" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submission, isAIChatOpen, problem?.id]);

  // AI 넛지: 3분 비활성 시
  useEffect(() => {
    // 이미 AI 채팅이 열려있으면 비활성 타이머 불필요
    if (isAIChatOpen) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // 3분(180초) 후 넛지 표시
      inactivityTimerRef.current = setTimeout(() => {
        if (!isAIChatOpen && problem) {
          setShowAINudge({
            type: "inactivity",
            message: "문제 풀이가 막히셨나요? AI 코치가 도움을 드릴 수 있어요.",
          });
          trackAINudgeImpression({ problemId: String(problem.id), trigger: "inactivity" });
        }
      }, 180000);
    };

    // 초기 타이머 설정
    resetInactivityTimer();

    // 활동 감지 이벤트
    const handleActivity = () => resetInactivityTimer();

    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [isAIChatOpen, problem]);

  // 넛지 클릭 핸들러
  const handleNudgeClick = useCallback(() => {
    if (showAINudge && problem) {
      trackAINudgeClick({ problemId: String(problem.id), trigger: showAINudge.type });
      setIsAIChatOpen(true);
      setAiMode("COACH");
      setShowAINudge(null);
    }
  }, [showAINudge, problem, setIsAIChatOpen]);

  // M7 AI 강제 경험: VE01 첫 성공 시 모달 표시
  useEffect(() => {
    const isVE01 = problem?.slug === "problem-ve01";

    if (
      submission?.status === "SUCCESS" &&
      isVE01 &&
      !firstSuccessShownRef.current &&
      !isAIChatOpen
    ) {
      firstSuccessShownRef.current = true;

      // 결과 확인 후 1초 뒤 모달 표시
      const timer = setTimeout(() => {
        setShowFirstSuccessModal(true);
        if (problem?.slug) {
          trackFirstSuccessModalOpen({ problemSlug: problem.slug });
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [submission?.status, problem?.slug, isAIChatOpen]);

  // M7 AI 강제 경험: FAILURE 시 자동 토스트
  useEffect(() => {
    if (submission?.status === "FAILURE" && !isAIChatOpen) {
      const timer = setTimeout(() => {
        setShowBugDiscoveryToast(true);
        if (problem?.id) {
          trackAINudgeImpression({
            problemId: String(problem.id),
            trigger: "auto_failure",
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }

    // AI 채팅 열리면 토스트 숨기기
    if (isAIChatOpen) {
      setShowBugDiscoveryToast(false);
    }
  }, [submission?.status, isAIChatOpen, problem?.id]);

  // M7: VE01 첫 성공 모달 → AI 클릭
  const handleFirstSuccessAIClick = useCallback(() => {
    if (problem) {
      trackFirstSuccessAIClick({ problemSlug: problem.slug });
      setShowFirstSuccessModal(false);
      setIsAIChatOpen(true);
      setAiMode("COACH");
      openAIChatWithPrefill(
        "방금 문제를 성공적으로 풀었습니다. 제 코드를 더 효율적으로 개선할 수 있는 방법이 있을까요?",
        "첫 문제 성공 후 코드 개선 요청"
      );
    }
  }, [problem, setIsAIChatOpen, openAIChatWithPrefill]);

  // M7: 자동 오답 토스트 → AI 클릭
  const handleBugDiscoveryClick = useCallback(() => {
    if (problem) {
      trackAINudgeClick({ problemId: String(problem.id), trigger: "auto_failure" });
      setShowBugDiscoveryToast(false);
      setIsAIChatOpen(true);
      setAiMode("COACH");
      openAIChatWithPrefill(
        "테스트가 실패했습니다. 코드의 어떤 부분에 버그가 있는지 분석해주세요.",
        "자동 오답 토스트 클릭"
      );
    }
  }, [problem, setIsAIChatOpen, openAIChatWithPrefill]);

  // Generate initial test template using the template generator
  const getInitialTemplate = (problem: Problem): string => {
    try {
      return generateTestTemplate(problem);
    } catch (err) {
      console.warn("Failed to generate template, using fallback:", err);
      return generateFallbackTemplate(problem.function_signature);
    }
  };

  // Get current template for auto-save comparison
  const currentTemplate = problem ? getInitialTemplate(problem) : "";

  // Detect if code has changed from initial state (for guest conversion banner)
  const hasCodeChanged = useMemo(() => {
    if (!problem || !code) return false;
    const initialCode = problem.sample_code || currentTemplate;
    return code.trim() !== initialCode.trim();
  }, [code, problem, currentTemplate]);

  // Auto-save code to localStorage (debounced)
  const {
    status: saveStatus,
    lastSavedAt,
    saveNow,
    wasRecovered,
    dismissRecovery,
  } = useCodeDraft(
    problem?.slug ?? null,
    code,
    currentTemplate,
    !loading && !!problem // Only save when problem is loaded
  );

  // Reset code to initial template
  const handleResetCode = useCallback(() => {
    if (!problem) return;
    const template = getInitialTemplate(problem);
    setCode(template);
    // Clear saved draft when resetting
    clearDraft(problem.slug);
  }, [problem]);

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

        // GA 이벤트 트래킹 - 문제 조회
        trackProblemView({
          problemId: result.id,
          problemSlug: result.slug,
          difficulty: result.difficulty,
          domain: result.domain,
        });

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

      // M6-2 Debug: Log goldenTestOutput
      console.log('[M6-2 DEBUG] testResult:', testResult);
      console.log('[M6-2 DEBUG] goldenTestOutput:', testResult.goldenTestOutput);

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
        // M6-2: Golden 테스트 출력 (에러 힌트용)
        golden_test_output: testResult.goldenTestOutput,
      };

      // M6-2 Debug: Log clientResult before sending to API
      console.log('[M6-2 DEBUG] clientResult to API:', JSON.stringify(clientResult, null, 2));

      // Submit with client results (server skips Celery)
      const newSubmission = await createSubmission({
        problem_id: problem.id,
        code: code.trim(),
        client_result: clientResult,
        website: honeypot || undefined,  // Honeypot - should be empty
      });

      setSubmission(newSubmission);

      // GA 이벤트 트래킹 (클라이언트 실행)
      trackCodeSubmit({
        problemId: problem.id,
        problemSlug: problem.slug,
        difficulty: problem.difficulty,
        score: clientResult.score,
        mutantsKilled: clientResult.mutants_killed,
        totalMutants: clientResult.total_mutants,
        isClientSide: true,
      });

      // M6-1: 비회원 제출 시 모달 트리거 (ref로 이중 실행 방지)
      if (!isAuthenticated && !conversionModalTriggeredRef.current) {
        const count = incrementSubmissionCount();
        if (count >= 2) {
          conversionModalTriggeredRef.current = true;
          trackConversionModalTrigger({
            trigger: "submission_count",
            problemId: problem.slug,
            submissionCount: count,
          });
          setShowConversionModal(true);
        }
      }

      return newSubmission;
    }

    // Fallback to server-side execution (no buggy implementations or Pyodide not ready)
    const newSubmission = await createSubmission({
      problem_id: problem.id,
      code: code.trim(),
      website: honeypot || undefined,  // Honeypot - should be empty
    });

    setSubmission(newSubmission);

    // GA 이벤트 트래킹 (서버 실행)
    trackCodeSubmit({
      problemId: problem.id,
      problemSlug: problem.slug,
      difficulty: problem.difficulty,
      isClientSide: false,
    });

    // M6-1: 비회원 제출 시 모달 트리거 (ref로 이중 실행 방지)
    if (!isAuthenticated && !conversionModalTriggeredRef.current) {
      const count = incrementSubmissionCount();
      if (count >= 2) {
        conversionModalTriggeredRef.current = true;
        trackConversionModalTrigger({
          trigger: "submission_count",
          problemId: problem.slug,
          submissionCount: count,
        });
        setShowConversionModal(true);
      }
    }

    return newSubmission;
  }, [problem, code, isPyodideReady, runMutationTest, honeypot, isAuthenticated, incrementSubmissionCount]);

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

  // P2: AI 코드를 에디터에 삽입하는 핸들러
  const handleInsertToEditor = useCallback((codeToInsert: string) => {
    // 현재 코드 끝에 새 코드 추가 (새 줄 구분)
    setCode((prevCode) => {
      const trimmedPrev = prevCode.trimEnd();
      const separator = trimmedPrev ? "\n\n" : "";
      return trimmedPrev + separator + codeToInsert;
    });
  }, []);

  // M5-3: AI 빠른 질문용 컨텍스트 생성
  const promptContext: PromptContext = useMemo(() => {
    if (!problem) return {};

    const ctx: PromptContext = {
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description_md,
        functionSignature: problem.function_signature,
        summary: problem.summary,
      },
    };

    // 제출 기록이 있는 경우
    if (submission && submission.status !== "PENDING" && submission.status !== "RUNNING") {
      ctx.submission = {
        code: code,
        score: submission.score ?? 0,
        status: submission.status,
      };
    }

    // AI 피드백이 있는 경우 - SavedFeedback의 필드들을 결합
    if (savedFeedback) {
      const feedbackParts: string[] = [];
      if (savedFeedback.summary) feedbackParts.push(`요약: ${savedFeedback.summary}`);
      if (savedFeedback.strengths?.length) feedbackParts.push(`강점: ${savedFeedback.strengths.join(', ')}`);
      if (savedFeedback.weaknesses?.length) feedbackParts.push(`약점: ${savedFeedback.weaknesses.join(', ')}`);
      if (savedFeedback.suggested_tests?.length) feedbackParts.push(`추천 테스트: ${savedFeedback.suggested_tests.join(', ')}`);

      if (feedbackParts.length > 0) {
        ctx.feedback = {
          content: feedbackParts.join('\n'),
        };
      }
    }

    // 로컬 테스트 로그 (Pyodide 실행 결과)
    const logParts: string[] = [];

    if (localTestResult?.output) {
      logParts.push(localTestResult.output);
    }

    if (localTestError) {
      logParts.push(`[Error] ${localTestError}`);
    }

    if (logParts.length > 0) {
      ctx.logs = logParts.join('\n\n');
    }

    // M3: 에러 로그 및 테스트 결과 추가
    if (localTestResult?.output && localTestResult.output.includes('FAILED')) {
      // pytest 출력에서 에러 부분만 추출 (최대 500자)
      ctx.errorLog = localTestResult.output.slice(0, 500);
    } else if (localTestError) {
      ctx.errorLog = localTestError.slice(0, 500);
    }

    // 테스트 결과 요약 (PytestResult에서 직접 가져옴)
    if (localTestResult) {
      ctx.testResult = {
        passed: localTestResult.passed,
        failed: localTestResult.failed,
        errors: localTestResult.errors,
      };
    }

    // Kill Ratio (제출 결과)
    if (submission && submission.status === 'SUCCESS') {
      const killRatio = submission.killed_mutants && submission.total_mutants
        ? Math.round((submission.killed_mutants / submission.total_mutants) * 100)
        : undefined;
      ctx.killRatio = killRatio;
    }

    // 마지막 액션
    if (localTestResult || localTestError) {
      ctx.lastAction = 'local_test';
    } else if (submission) {
      ctx.lastAction = 'submit';
    } else {
      ctx.lastAction = 'none';
    }

    return ctx;
  }, [problem, submission, code, savedFeedback, localTestResult, localTestError]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
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

  // Desktop layout - Resizable split panel (IDE 몰입 모드: 전체 화면)
  if (isDesktop) {
    return (
      <div className="flex flex-col h-screen">
        {/* Honeypot - hidden input for bot prevention */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute -left-[9999px] opacity-0 pointer-events-none"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Guest Conversion Banner - 비회원 코드 휘발성 경고 */}
        <GuestConversionBanner
          hasCodeChanged={hasCodeChanged}
          problemId={problem.slug}
          className="mx-4 mt-2"
        />

        {/* M4: Pyodide 초기화 상태 인디케이터 */}
        <PyodideStatusIndicator
          status={pyodideStatus as 'idle' | 'loading' | 'ready' | 'error'}
          progress={pyodideProgressPercent}
          message={pyodideProgressMessage}
          className="mx-4 mt-2"
        />

        {/* Main content - Split panel (Breadcrumb integrated into ProblemPanel) */}
        <div
          className="flex-1 min-h-0 transition-all duration-300 ease-out"
          style={{ marginRight: isAIChatOpen ? aiDrawerWidth : 0 }}
        >
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
                problem={problem}
                goldenCode={problem.golden_code}
                onLocalTest={isPyodideReady ? handleLocalTest : undefined}
                isLocalTesting={isLocalTesting}
                localTestResult={localTestResult}
                localTestError={localTestError}
                localTestProgress={currentLocalTestProgress}
                problemId={problem?.id ?? 0}
                onLoadSubmission={handleLoadSubmission}
                sessionHistory={sessionHistory}
                saveStatus={saveStatus}
                onSaveNow={saveNow}
                wasRecovered={wasRecovered}
                onDismissRecovery={dismissRecovery}
                onReset={handleResetCode}
                lastSavedAt={lastSavedAt}
              />
            }
          />
        </div>

        {/* AI 넛지 토스트 - 다크모드 */}
        {showAINudge && (
          <div className="fixed bottom-24 right-6 z-40 max-w-sm animate-in slide-in-from-right-5 fade-in duration-300">
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 mb-3">
                    {showAINudge.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNudgeClick}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      AI 코치 열기
                    </button>
                    <button
                      onClick={() => setShowAINudge(null)}
                      className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating AI Chat - Push Layout (에디터를 밀어냄) */}
        <FloatingAIChat
          problemId={problem?.id ?? 0}
          codeContext={code}
          mode={aiMode}
          onModeChange={handleAIModeChange}
          savedFeedback={savedFeedback}
          savedFeedbackScore={savedFeedbackScore}
          onClearSavedFeedback={handleClearSavedFeedback}
          promptContext={promptContext}
          layoutMode="push"
          onInsertCode={handleInsertToEditor}
        />

        {/* Problem Peek Overlay 제거됨 - 사이드바 확장 모드로 대체 (Alt+P) */}

        {/* Scoring Method Drawer */}
        <ScoringMethodDrawer
          isOpen={isScoringDrawerOpen}
          onClose={() => setIsScoringDrawerOpen(false)}
        />

        {/* M6-1: 회원 전환 모달 (Desktop) */}
        <ConversionModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          feature="history"
        />

        {/* M7 AI 강제 경험: VE01 첫 성공 모달 */}
        <FirstSuccessModal
          isOpen={showFirstSuccessModal}
          onClose={() => setShowFirstSuccessModal(false)}
          onOpenAICoach={handleFirstSuccessAIClick}
          score={submission?.score ?? 100}
        />

        {/* M7 AI 강제 경험: Confetti 효과 */}
        <ConfettiEffect trigger={showFirstSuccessModal} duration={3000} />

        {/* M7 AI 강제 경험: 자동 오답 토스트 */}
        <AIBugDiscoveryToast
          isVisible={showBugDiscoveryToast}
          onOpenAICoach={handleBugDiscoveryClick}
          onDismiss={() => setShowBugDiscoveryToast(false)}
          isGuest={!user}
        />

        {/* 온보딩 모달 (로그인 직후) */}
        {onboardingType && (
          <OnboardingModal
            isOpen={showOnboardingModal}
            onClose={handleCloseOnboarding}
            type={onboardingType}
            problemTitle={problem.title}
          />
        )}
      </div>
    );
  }

  // Mobile/Tablet layout - Tab-based (IDE 몰입 모드: 전체 화면)
  return (
    <div className="flex flex-col h-screen">
      {/* Honeypot - hidden input for bot prevention */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] opacity-0 pointer-events-none"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

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

      {/* Guest Conversion Banner - 비회원 코드 휘발성 경고 */}
      <GuestConversionBanner
        hasCodeChanged={hasCodeChanged}
        problemId={problem.slug}
        className="mx-3 mt-2"
      />

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
              problem={problem}
              goldenCode={problem.golden_code}
              onLocalTest={isPyodideReady ? handleLocalTest : undefined}
              isLocalTesting={isLocalTesting}
              localTestResult={localTestResult}
              localTestError={localTestError}
              localTestProgress={currentLocalTestProgress}
              problemId={problem?.id ?? 0}
              onLoadSubmission={handleLoadSubmission}
              sessionHistory={sessionHistory}
              saveStatus={saveStatus}
              onSaveNow={saveNow}
              wasRecovered={wasRecovered}
              onDismissRecovery={dismissRecovery}
              onReset={handleResetCode}
              lastSavedAt={lastSavedAt}
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
                promptContext={promptContext}
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

      {/* Mobile Notice - PC 권장 안내 */}
      <MobileNotice />

      {/* M6-1: 회원 전환 모달 */}
      <ConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        feature="history"
      />

      {/* M7 AI 강제 경험: VE01 첫 성공 모달 */}
      <FirstSuccessModal
        isOpen={showFirstSuccessModal}
        onClose={() => setShowFirstSuccessModal(false)}
        onOpenAICoach={handleFirstSuccessAIClick}
        score={submission?.score ?? 100}
      />

      {/* M7 AI 강제 경험: Confetti 효과 */}
      <ConfettiEffect trigger={showFirstSuccessModal} duration={3000} />

      {/* M7 AI 강제 경험: 자동 오답 토스트 */}
      <AIBugDiscoveryToast
        isVisible={showBugDiscoveryToast}
        onOpenAICoach={handleBugDiscoveryClick}
        onDismiss={() => setShowBugDiscoveryToast(false)}
        isGuest={!user}
      />

      {/* 온보딩 모달 (로그인 직후) */}
      {onboardingType && (
        <OnboardingModal
          isOpen={showOnboardingModal}
          onClose={handleCloseOnboarding}
          type={onboardingType}
          problemTitle={problem.title}
        />
      )}
    </div>
  );
}
