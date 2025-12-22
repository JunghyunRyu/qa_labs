"use client";

import { useState, useRef, useEffect } from "react";
import { Code2, Play, Keyboard, Loader2, FlaskConical } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import BottomTabs, { type TabId } from "@/components/layout/BottomTabs";
import type { Submission } from "@/types/problem";
import type { PytestResult } from "@/workers/pyodide-worker-types";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submission: Submission | null;
  submissionError: string | null;
  /** Golden code for local testing */
  goldenCode?: string;
  /** Local test callback */
  onLocalTest?: () => void;
  /** Local test running state */
  isLocalTesting?: boolean;
  /** Local test result */
  localTestResult?: PytestResult | null;
  /** Local test error */
  localTestError?: string | null;
  /** Local test progress message */
  localTestProgress?: string;
  /** Problem ID for history */
  problemId?: number;
  /** Load submission from history */
  onLoadSubmission?: (submission: Submission) => void;
  /** Session-based history for non-authenticated users */
  sessionHistory?: Submission[];
}

export default function CodeEditorPanel({
  code,
  onCodeChange,
  onSubmit,
  isSubmitting,
  submission,
  submissionError,
  goldenCode,
  onLocalTest,
  isLocalTesting = false,
  localTestResult,
  localTestError,
  localTestProgress,
  problemId,
  onLoadSubmission,
  sessionHistory = [],
}: CodeEditorPanelProps) {
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [activeTab, setActiveTab] = useState<TabId>("local");
  const [isBottomExpanded, setIsBottomExpanded] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Panel heights
  const PANEL_HEIGHT_COLLAPSED = 220;
  const PANEL_HEIGHT_EXPANDED = 360;

  // Measure container height for Monaco
  useEffect(() => {
    const updateHeight = () => {
      if (editorContainerRef.current) {
        const height = editorContainerRef.current.clientHeight;
        if (height > 0) {
          setEditorHeight(height);
        }
      }
    };

    // Initial measurement
    updateHeight();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateHeight);
    if (editorContainerRef.current) {
      resizeObserver.observe(editorContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Auto-switch to local test tab when local test starts
  useEffect(() => {
    if (isLocalTesting) {
      setActiveTab("local");
    }
  }, [isLocalTesting]);

  // Auto-switch to result tab when submission starts
  useEffect(() => {
    if (isSubmitting) {
      setActiveTab("result");
    }
  }, [isSubmitting]);

  // Auto-switch to logs tab on submission error or failure
  useEffect(() => {
    if (submissionError) {
      setActiveTab("logs");
    } else if (submission?.status === "ERROR" || submission?.status === "FAILURE") {
      setActiveTab("logs");
    }
  }, [submissionError, submission?.status]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter for submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isSubmitting && code.trim()) {
        onSubmit();
      }
    }
    // Shift+Enter for local test
    if (e.shiftKey && e.key === "Enter" && onLocalTest) {
      e.preventDefault();
      if (!isLocalTesting && code.trim()) {
        onLocalTest();
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* ===== 상단 영역: 에디터 ===== */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              테스트 코드 작성
            </h2>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
              Python
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {/* Local Test Button */}
            {onLocalTest && (
              <button
                data-testid="btn-local-test"
                onClick={onLocalTest}
                disabled={isLocalTesting || isSubmitting || !code.trim()}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                           font-medium flex items-center gap-2 text-sm"
                title="로컬에서 테스트 실행 (Shift+Enter)"
              >
                {isLocalTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    테스트 중...
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4" />
                    로컬 테스트
                  </>
                )}
              </button>
            )}

            {/* Submit Button */}
            <button
              data-testid="btn-submit"
              onClick={onSubmit}
              disabled={isSubmitting || isLocalTesting || !code.trim()}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                         font-medium flex items-center gap-2 text-sm"
              title="서버에서 채점 (Ctrl+Enter)"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  채점하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div
          ref={editorContainerRef}
          data-testid="code-editor-area"
          className="flex-1 min-h-0 overflow-hidden"
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
        >
          <CodeEditor
            value={code}
            onChange={(value) => onCodeChange(value || "")}
            height={`${editorHeight}px`}
            language="python"
          />
        </div>

        {/* Footer with keyboard hint */}
        <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <Keyboard className="w-3 h-3" />
              {onLocalTest && (
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                    Shift+Enter
                  </kbd>
                  {" 로컬 테스트"}
                </span>
              )}
              <span>
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Ctrl+Enter
                </kbd>
                {" 채점"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Ctrl+B
                </kbd>
                {" 문제 패널"}
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Ctrl+/
                </kbd>
                {" AI 도우미"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 하단 영역: 결과 탭 ===== */}
      <div
        className="flex-shrink-0 flex flex-col transition-all duration-200"
        style={{
          height: isBottomExpanded ? PANEL_HEIGHT_EXPANDED : PANEL_HEIGHT_COLLAPSED,
          minHeight: isBottomExpanded ? PANEL_HEIGHT_EXPANDED : PANEL_HEIGHT_COLLAPSED,
        }}
      >
        <BottomTabs
          className="h-full"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isExpanded={isBottomExpanded}
          onExpandToggle={setIsBottomExpanded}
          localTestResult={localTestResult}
          localTestError={localTestError}
          isLocalTesting={isLocalTesting}
          localTestProgress={localTestProgress}
          onLocalTestRetry={onLocalTest}
          submission={submission}
          submissionError={submissionError}
          isSubmitting={isSubmitting}
          onSubmitRetry={onSubmit}
          problemId={problemId}
          onLoadSubmission={onLoadSubmission}
          sessionHistory={sessionHistory}
        />
      </div>
    </div>
  );
}
