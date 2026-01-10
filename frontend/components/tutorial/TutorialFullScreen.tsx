"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Play,
  Send,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

import { useTutorialStore, getCurrentStepInfo } from "@/stores/tutorialStore";
import {
  TUTORIAL_PROBLEM,
  TUTORIAL_STEPS,
  TUTORIAL_COMPLETION,
  STEP_SUCCESS_MESSAGES,
} from "@/lib/tutorialData";
import { useCodeRunner } from "@/hooks/useCodeRunner";

// Components
import GuideBubble from "./GuideBubble";
import StepIndicator from "./StepIndicator";
import ConfettiEffect from "./ConfettiEffect";

// Monaco Editor - dynamic import to avoid SSR issues
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-[#0d1117] rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  ),
});

interface TutorialFullScreenProps {
  onClose: () => void;
  onComplete: () => void;
}

/**
 * TutorialFullScreen - 전체 화면 튜토리얼 오버레이
 *
 * 문제 목록 페이지 위에 오버레이로 표시되며,
 * 4단계 인터랙티브 튜토리얼을 진행합니다.
 */
export default function TutorialFullScreen({
  onClose,
  onComplete,
}: TutorialFullScreenProps) {
  // Tutorial store
  const {
    currentStep,
    stepCompleted,
    useGoldenCode,
    lastTestPassed,
    nextStep,
    prevStep,
    completeStep,
    setLastTestPassed,
  } = useTutorialStore();

  // Code state
  const [code, setCode] = useState(TUTORIAL_PROBLEM.initialTestCode);
  const [testOutput, setTestOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isTestOutputExpanded, setIsTestOutputExpanded] = useState(false);

  // Pyodide
  const {
    isReady: isPyodideReady,
    isRunning,
    runTests,
  } = useCodeRunner({ autoInit: true });

  // Current step info
  const currentStepInfo = getCurrentStepInfo(currentStep);

  // Detect code change for Step 2
  useEffect(() => {
    if (currentStep === 2 && currentStepInfo?.expectedCode) {
      const hasExpectedCode = code.includes(currentStepInfo.expectedCode);
      if (hasExpectedCode && !stepCompleted.step2) {
        completeStep(2);
      }
    }
  }, [code, currentStep, currentStepInfo, stepCompleted.step2, completeStep]);

  // Get target code based on current step
  const getTargetCode = useCallback(() => {
    return useGoldenCode
      ? TUTORIAL_PROBLEM.goldenCode
      : TUTORIAL_PROBLEM.buggyCode;
  }, [useGoldenCode]);

  // Run test
  const handleRunTest = useCallback(async () => {
    if (!isPyodideReady || isRunning) return;

    setTestOutput("테스트 실행 중...");

    try {
      const result = await runTests(code, getTargetCode());

      const passed = result.failed === 0 && result.errors === 0;
      setLastTestPassed(passed);
      setTestOutput(result.output || "테스트 완료");

      // Step 1: 정상 코드 테스트 통과
      if (currentStep === 1 && passed) {
        completeStep(1);
      }

      // Step 3: 버그 코드 테스트 실패 (버그 탐지 성공!)
      if (currentStep === 3 && !passed) {
        completeStep(3);
      }
    } catch (error) {
      setTestOutput(`오류 발생: ${error}`);
      setLastTestPassed(false);
    }
  }, [
    isPyodideReady,
    isRunning,
    code,
    getTargetCode,
    runTests,
    currentStep,
    completeStep,
    setLastTestPassed,
  ]);

  // Handle submit (Step 4)
  const handleSubmit = useCallback(() => {
    completeStep(4);
    setShowCompletion(true);
  }, [completeStep]);

  // Handle completion
  const handleCompletionClose = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Copy ghost code
  const handleCopyGhostCode = useCallback(() => {
    if (currentStepInfo?.ghostCode) {
      navigator.clipboard.writeText(currentStepInfo.ghostCode.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentStepInfo]);

  // Check if can proceed to next step
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return stepCompleted.step1;
      case 2:
        return stepCompleted.step2;
      case 3:
        return stepCompleted.step3;
      case 4:
        return stepCompleted.step4;
      default:
        return false;
    }
  }, [currentStep, stepCompleted]);

  // Handle close with confirmation
  const handleClose = useCallback(() => {
    if (
      window.confirm(
        "튜토리얼을 나가시겠습니까?\n진행 상황은 저장되지 않습니다."
      )
    ) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] text-gray-100 overflow-auto">
      {/* Confetti */}
      <ConfettiEffect trigger={showCompletion} />

      {/* Completion Modal */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-lg w-full p-6 animate-in fade-in zoom-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {TUTORIAL_COMPLETION.title}
              </h2>
            </div>
            <div className="text-gray-300 whitespace-pre-line mb-6">
              {TUTORIAL_COMPLETION.message}
            </div>
            <button
              onClick={handleCompletionClose}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
            >
              {TUTORIAL_COMPLETION.ctaLabel}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur border-b border-[#30363d]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              버그 사냥꾼의 첫 걸음
            </h1>
            <StepIndicator
              currentStep={currentStep}
              totalSteps={TUTORIAL_STEPS.length}
            />
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            나가기
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Problem Description */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            {/* Step Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                Step {currentStep} / {TUTORIAL_STEPS.length}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {currentStepInfo?.title}
              </h2>
              <p className="text-gray-400">{currentStepInfo?.description}</p>
            </div>

            {/* Guide */}
            <GuideBubble
              title={`Step ${currentStep}`}
              content={currentStepInfo?.guide || ""}
              position="bottom"
              targetRect={null}
            />

            {/* Ghost Code (Step 2) */}
            {currentStep === 2 && currentStepInfo?.ghostCode && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    추가할 테스트 코드:
                  </span>
                  <button
                    onClick={handleCopyGhostCode}
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        복사하기
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                  <code>{currentStepInfo.ghostCode.trim()}</code>
                </pre>
              </div>
            )}

            {/* Problem Info */}
            <div className="mt-6 pt-6 border-t border-[#30363d]">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                문제 정보
              </h3>
              <div className="tutorial-markdown text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h4 className="text-white font-semibold mt-5 mb-2 text-base">{children}</h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-300 my-2">{children}</p>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes("language-");
                      if (isBlock) {
                        return (
                          <pre className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 my-3 overflow-x-auto">
                            <code className="text-gray-300 text-xs">{children}</code>
                          </pre>
                        );
                      }
                      return (
                        <code className="text-blue-300 bg-[#21262d] px-1.5 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    table: ({ children }) => (
                      <table className="w-full border-collapse my-3 text-xs">{children}</table>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-[#21262d]">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="border border-[#30363d] px-3 py-2 text-left text-gray-200 font-medium">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-[#30363d] px-3 py-2 text-gray-300">{children}</td>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-yellow-300 font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {TUTORIAL_PROBLEM.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Right: Code Editor */}
          <div className="flex flex-col gap-4">
            {/* Editor */}
            <div
              className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden"
              data-tutorial="editor"
            >
              <div className="px-4 py-2 border-b border-[#30363d] flex items-center justify-between">
                <span className="text-sm text-gray-400">test_submission.py</span>
                {!isPyodideReady && (
                  <span className="text-xs text-yellow-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Pyodide 로딩 중...
                  </span>
                )}
              </div>
              <CodeEditor
                value={code}
                onChange={(val) => setCode(val || "")}
                height="350px"
                language="python"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRunTest}
                disabled={!isPyodideReady || isRunning}
                data-tutorial="run-test"
                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  currentStep === 1 || currentStep === 3
                    ? "bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0d1117]"
                    : "bg-[#21262d] hover:bg-[#30363d] text-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRunning ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                테스트 실행
              </button>

              <button
                onClick={handleSubmit}
                disabled={currentStep !== 4 || !stepCompleted.step3}
                data-tutorial="submit"
                className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  currentStep === 4
                    ? "bg-green-600 hover:bg-green-500 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-[#0d1117]"
                    : "bg-[#21262d] text-gray-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-5 h-5" />
                채점하기
              </button>
            </div>

            {/* Step Completion Message - 먼저 표시 */}
            {stepCompleted[`step${currentStep}` as keyof typeof stepCompleted] &&
              STEP_SUCCESS_MESSAGES[`step${currentStep}`] && (
                <div
                  className={`p-4 rounded-lg border ${
                    currentStep === 3
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-green-500/10 border-green-500/30"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 font-semibold mb-2 ${
                      currentStep === 3 ? "text-yellow-400" : "text-green-400"
                    }`}
                  >
                    {currentStep === 3 ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {STEP_SUCCESS_MESSAGES[`step${currentStep}`].title}
                  </div>
                  <p className="text-gray-300 text-sm mb-2">
                    {STEP_SUCCESS_MESSAGES[`step${currentStep}`].message}
                  </p>
                  {STEP_SUCCESS_MESSAGES[`step${currentStep}`].explanation && (
                    <pre className="text-xs text-gray-400 bg-[#0d1117] p-3 rounded mt-2 overflow-x-auto whitespace-pre-wrap">
                      {STEP_SUCCESS_MESSAGES[`step${currentStep}`].explanation}
                    </pre>
                  )}
                </div>
              )}

            {/* Test Output - 접을 수 있는 섹션 */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <button
                onClick={() => setIsTestOutputExpanded(!isTestOutputExpanded)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-[#21262d] transition-colors"
              >
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isTestOutputExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  테스트 결과 (pytest 실행 결과)
                </span>
                {lastTestPassed !== null && (
                  <span
                    className={`text-sm flex items-center gap-1 ${
                      lastTestPassed ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {lastTestPassed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        PASSED
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        FAILED
                      </>
                    )}
                  </span>
                )}
              </button>
              {isTestOutputExpanded && (
                <pre className="p-4 text-sm text-gray-300 max-h-[200px] overflow-auto font-mono border-t border-[#30363d]">
                  {testOutput || "테스트 실행 버튼을 클릭하세요"}
                </pre>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>

              {currentStep < TUTORIAL_STEPS.length && canProceed() && (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all ring-2 ring-green-400 ring-offset-2 ring-offset-[#0d1117] animate-pulse"
                >
                  다음 단계로
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              {currentStep < TUTORIAL_STEPS.length && !canProceed() && (
                <button
                  disabled
                  className="flex items-center gap-1 text-gray-500 cursor-not-allowed"
                >
                  다음
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
