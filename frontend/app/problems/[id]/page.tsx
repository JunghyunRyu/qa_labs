/** Problem detail page */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Code2, FileText, Info, Bot, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { getProblem } from "@/lib/api/problems";
import { createSubmission, getSubmission } from "@/lib/api/submissions";
import { ApiError } from "@/lib/api";
import { useSubmit } from "@/hooks/useSubmit";
import type { Problem, Submission } from "@/types/problem";
import type { AIChatMode } from "@/types/ai";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import CodeEditor from "@/components/CodeEditor";
import SubmissionResultPanel from "@/components/SubmissionResultPanel";
import ProblemDescription from "@/components/ProblemDescription";
import Breadcrumb from "@/components/Breadcrumb";
import ProblemCTA from "@/components/ProblemCTA";
import ScoringMethodDrawer from "@/components/ScoringMethodDrawer";
import BookmarkButton from "@/components/BookmarkButton";
import CopyButton from "@/components/CopyButton";
import ProblemStickyPanel from "@/components/ProblemStickyPanel";
import ProblemMobileDrawer from "@/components/ProblemMobileDrawer";
import AICoachModal from "@/components/AICoachModal";
import TagChips from "@/components/TagChips";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = parseInt(params.id as string);
  const { isAuthenticated, login } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isScoringDrawerOpen, setIsScoringDrawerOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AIChatMode>(() => {
    // Load from localStorage on initial render
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ai_coach_mode");
      if (saved === "COACH" || saved === "OFF") {
        return saved;
      }
    }
    return "OFF";
  });
  const editorSectionRef = useRef<HTMLDivElement | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingMaxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const pollingErrorCountRef = useRef<number>(0);

  // 폴링 지수 백오프 상수
  const BASE_POLL_INTERVAL = 2000;  // 2초
  const MAX_POLL_INTERVAL = 32000;  // 32초

  // Generate initial test template
  const getInitialTemplate = (problem: Problem): string => {
    // Extract function name from signature (e.g., "def sum_list(values: list[int]) -> int:" -> "sum_list")
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
        // Set initial template
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
    // 폴링이 필요 없는 상태면 정리
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

    // 폴링 시작 시간 기록
    if (!pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
      pollingErrorCountRef.current = 0;
    }

    // 최대 타임아웃 설정 (5분)
    const POLLING_MAX_TIMEOUT = 5 * 60 * 1000; // 5분
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

    // 지수 백오프 간격 계산: 2초 → 4초 → 8초 → 16초 → 32초
    const getBackoffInterval = (errorCount: number) => {
      return Math.min(BASE_POLL_INTERVAL * Math.pow(2, errorCount), MAX_POLL_INTERVAL);
    };

    // 재귀적 폴링 함수
    const scheduleNextPoll = (currentInterval: number) => {
      pollingTimeoutRef.current = setTimeout(async () => {
        try {
          const updatedSubmission = await getSubmission(submission.id);
          setSubmission(updatedSubmission);

          // 성공 시 에러 카운트 리셋 및 간격 초기화
          pollingErrorCountRef.current = 0;

          // 아직 폴링이 필요하면 다음 폴링 예약 (기본 간격으로)
          if (updatedSubmission.status === "PENDING" || updatedSubmission.status === "RUNNING") {
            scheduleNextPoll(BASE_POLL_INTERVAL);
          }
        } catch (err) {
          pollingErrorCountRef.current += 1;
          console.error("Failed to fetch submission:", err);

          // 연속 에러가 5회 이상이면 사용자에게 알림
          if (pollingErrorCountRef.current >= 5) {
            setSubmissionError("연결 문제가 발생했습니다. 새로고침해 주세요.");

            // 폴링 중지
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

          // 지수 백오프로 다음 폴링 예약
          const nextInterval = getBackoffInterval(pollingErrorCountRef.current);
          scheduleNextPoll(nextInterval);
        }
      }, currentInterval);
    };

    // 첫 폴링 시작 (기본 간격)
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

  // Submission function wrapped in useCallback for useSubmit
  const doSubmit = useCallback(async (): Promise<Submission> => {
    if (!problem) {
      const err = new globalThis.Error("문제 정보가 없습니다.");
      throw err;
    }

    if (!code.trim()) {
      const err = new globalThis.Error("코드를 입력해주세요.");
      throw err;
    }

    // 이전 폴링 상태 초기화
    pollingStartTimeRef.current = null;
    pollingErrorCountRef.current = 0;
    setSubmissionError(null);

    const newSubmission = await createSubmission({
      problem_id: problem.id,
      code: code.trim(),
    });

    setSubmission(newSubmission);
    return newSubmission;
  }, [problem, code]);

  // useSubmit hook with debounce and error handling
  const { submit: handleSubmit, isSubmitting: submitting } = useSubmit(
    doSubmit,
    {
      debounceMs: 2000, // 2초 디바운스
      onError: (err: unknown) => {
        let errorMessage = "제출에 실패했습니다.";
        if (err instanceof ApiError) {
          // 429 Rate Limit 에러 특별 처리
          if (err.status === 429) {
            errorMessage = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
          } else {
            const errorData = err.data as { detail?: string } | undefined;
            errorMessage = errorData?.detail || err.message;
          }
        } else if (err instanceof globalThis.Error) {
          errorMessage = (err as globalThis.Error).message;
        } else if (err && typeof err === "object" && "message" in err) {
          errorMessage = String((err as { message: unknown }).message);
        }
        setSubmissionError(errorMessage);
      },
    }
  );

  // IntersectionObserver로 에디터 영역 가시성 감지
  useEffect(() => {
    const editorSection = editorSectionRef.current;
    if (!editorSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsEditorVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1, // 10% 이상 보이면 visible
        rootMargin: "-100px 0px 0px 0px", // 헤더 높이 고려
      }
    );

    observer.observe(editorSection);

    return () => {
      observer.disconnect();
    };
  }, [problem]); // problem 로드 후 observer 설정

  const scrollToEditor = () => {
    const editorElement = editorSectionRef.current;
    if (editorElement) {
      editorElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Persist AI mode to localStorage and control modal
  const handleAIModeChange = useCallback((mode: AIChatMode) => {
    setAiMode(mode);
    localStorage.setItem("ai_coach_mode", mode);
    // Close modal when AI mode is turned off
    if (mode === "OFF") {
      setIsAIModalOpen(false);
    }
  }, []);

  // Handle sidebar toggle click - opens modal when enabled
  const handleAIToggle = useCallback((enabled: boolean) => {
    if (enabled) {
      // Turn on AI mode and open modal
      handleAIModeChange("COACH");
      setIsAIModalOpen(true);
    } else {
      // Turn off AI mode (modal will be closed via handleAIModeChange)
      handleAIModeChange("OFF");
    }
  }, [handleAIModeChange]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

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

  const difficultyConfig = {
    "Very Easy": {
      colors: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
      icon: <TrendingDown className="w-4 h-4" aria-hidden="true" />,
      label: "아주쉬움",
      gradient: "from-blue-50 to-cyan-50",
    },
    Easy: {
      colors: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      icon: <TrendingDown className="w-4 h-4" aria-hidden="true" />,
      label: "쉬움",
      gradient: "from-green-50 to-emerald-50",
    },
    Medium: {
      colors: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
      icon: <Minus className="w-4 h-4" aria-hidden="true" />,
      label: "보통",
      gradient: "from-yellow-50 to-amber-50",
    },
    Hard: {
      colors: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
      icon: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
      label: "어려움",
      gradient: "from-red-50 to-rose-50",
    },
  };

  const difficulty = difficultyConfig[problem.difficulty];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "문제 목록", href: "/problems" },
          { label: problem.title || `문제 #${problem.id}` },
        ]}
      />

      <div className="flex gap-8">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors">
        {/* Header with Title */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {problem.title || `문제 #${problem.id}`}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>ID: {problem.id}</span>
                {problem.slug && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="font-mono text-xs">{problem.slug}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <BookmarkButton problemId={problem.id} size="md" showLabel />
              <span
                className={`px-4 py-2 rounded-lg text-sm font-bold border-2 flex items-center gap-2 shadow-sm ${
                  difficulty.colors
                }`}
                aria-label={`난이도: ${difficulty.label}`}
              >
                {difficulty.icon}
                <span>{difficulty.label}</span>
              </span>
            </div>
          </div>
          
          {/* Tags */}
          <TagChips tags={problem.skills || []} maxVisible={6} size="md" />

          {/* CTA Buttons */}
          <ProblemCTA
            onScrollToEditor={scrollToEditor}
            onOpenScoring={() => setIsScoringDrawerOpen(true)}
            isEditorVisible={isEditorVisible}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            canSubmit={!!code.trim()}
          />
        </div>

        {/* Function Signature */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4" />
            함수 시그니처
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 group relative">
            <code className="text-gray-800 dark:text-gray-200 font-mono text-sm">
              {problem.function_signature}
            </code>
            <CopyButton
              text={problem.function_signature}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" />
            문제 설명
          </h2>
          <ProblemDescription description_md={problem.description_md} />
        </div>

        {/* Golden Code (for reference, hidden by default) */}
        <details className="mt-6 group/details">
          <summary
            className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            title="제출한 테스트는 기준 구현을 반드시 통과해야 합니다."
          >
            기준 구현 보기 (Reference)
          </summary>
          <div className="mt-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 relative group">
            <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono overflow-x-auto">
              <code>{problem.golden_code}</code>
            </pre>
            <CopyButton
              text={problem.golden_code}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </details>
      </div>

      {/* Code Editor and Submission */}
      <div
        ref={editorSectionRef}
        id="code-editor"
        className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          테스트 코드 작성
        </h2>

        <div className="mb-4">
          <CodeEditor
            value={code}
            onChange={(value) => setCode(value || "")}
            height="350px"
            minHeight={200}
            maxHeight={700}
            resizable
            language="python"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
          className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 select-none"
        >
          {submitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {submitting ? "제출 중..." : "채점하기"}
        </button>
      </div>

          {/* Submission Result - Always rendered in the same location */}
          <SubmissionResultPanel
            submission={submission}
            isSubmitting={submitting}
            submissionError={submissionError}
            onRetry={handleSubmit}
          />
        </main>

        {/* Right Sidebar - Desktop only */}
        <aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0">
          {/* Sticky Panel */}
          <ProblemStickyPanel
            problem={problem}
            latestSubmission={submission}
            onScrollToEditor={scrollToEditor}
            onOpenScoring={() => setIsScoringDrawerOpen(true)}
            isEditorVisible={isEditorVisible}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            canSubmit={!!code.trim()}
            aiModeEnabled={aiMode === "COACH"}
            onAiModeToggle={handleAIToggle}
          />
        </aside>
      </div>

      {/* Scoring Method Drawer */}
      <ScoringMethodDrawer
        isOpen={isScoringDrawerOpen}
        onClose={() => setIsScoringDrawerOpen(false)}
      />

      {/* Mobile Problem Info Drawer */}
      <ProblemMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        problem={problem}
        latestSubmission={submission}
      />

      {/* AI Coach Modal (both desktop and mobile) */}
      <AICoachModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        problemId={problemId}
        codeContext={code}
        mode={aiMode}
        onModeChange={handleAIModeChange}
      />

      {/* Mobile FAB buttons */}
      <div className="fixed bottom-4 right-4 lg:hidden z-40 flex flex-col gap-3">
        {/* AI Coach FAB */}
        <button
          onClick={() => {
            handleAIModeChange("COACH");
            setIsAIModalOpen(true);
          }}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white p-4 rounded-full shadow-lg transition-all"
          aria-label="AI 코치"
        >
          <Bot className="w-6 h-6" />
        </button>

        {/* Problem Info FAB */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="bg-gray-700 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-colors"
          aria-label="문제 정보 보기"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

