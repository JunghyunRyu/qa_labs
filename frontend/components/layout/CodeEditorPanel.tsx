"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Code2,
  Play,
  Keyboard,
  Loader2,
  FlaskConical,
} from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import BottomTabs, { type TabId } from "@/components/layout/BottomTabs";
import {
  useLayoutStore,
  BOTTOM_PANEL_MIN,
  BOTTOM_PANEL_MAX,
  BOTTOM_PANEL_DEFAULT,
  BOTTOM_PANEL_EXPANDED,
} from "@/stores/layoutStore";
import type { Submission } from "@/types/problem";
import type { PytestResult } from "@/workers/pyodide-worker-types";

// Height when collapsed (just tab bar)
const BOTTOM_PANEL_COLLAPSED = 36;

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
  // Get bottom panel height from global store (persisted)
  const { bottomPanelHeight, setBottomPanelHeight } = useLayoutStore();

  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const [activeTab, setActiveTab] = useState<TabId>("local");

  // Bottom panel state (session-only, not persisted)
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(true); // Start collapsed
  const [isDragging, setIsDragging] = useState(false);
  const [userHasManuallyCollapsed, setUserHasManuallyCollapsed] = useState(false);

  // Check if there's any result to show
  const hasAnyResult = !!(localTestResult || localTestError || submission || submissionError);
  const isRunning = isLocalTesting || isSubmitting;

  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

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

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (editorContainerRef.current) {
      resizeObserver.observe(editorContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = bottomPanelHeight;
  }, [bottomPanelHeight]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY;
      const newHeight = Math.max(
        BOTTOM_PANEL_MIN,
        Math.min(BOTTOM_PANEL_MAX, dragStartHeight.current + deltaY)
      );
      setBottomPanelHeight(newHeight);

      // If user drags to expand, un-collapse and reset manual collapse flag
      if (isBottomCollapsed && newHeight > BOTTOM_PANEL_MIN) {
        setIsBottomCollapsed(false);
        setUserHasManuallyCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isBottomCollapsed]);

  // Auto-expand when running starts (unless user manually collapsed)
  useEffect(() => {
    if (isRunning && !userHasManuallyCollapsed) {
      setIsBottomCollapsed(false);
    }
  }, [isRunning, userHasManuallyCollapsed]);

  // Auto-switch to appropriate tab when testing/submitting starts
  useEffect(() => {
    if (isLocalTesting) {
      setActiveTab("local");
    }
  }, [isLocalTesting]);

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

  // Auto-expand when results arrive (unless user manually collapsed)
  useEffect(() => {
    if (hasAnyResult && !userHasManuallyCollapsed) {
      setIsBottomCollapsed(false);
      // Also expand height if it's below the expanded threshold
      if (bottomPanelHeight < BOTTOM_PANEL_EXPANDED) {
        setBottomPanelHeight(BOTTOM_PANEL_EXPANDED);
      }
    }
  }, [hasAnyResult, userHasManuallyCollapsed, bottomPanelHeight, setBottomPanelHeight]);

  // Auto-collapse only when explicitly no results (e.g., new problem loaded)
  // This is tracked by problemId change, not by hasAnyResult becoming false
  useEffect(() => {
    // Reset state when problem changes
    setUserHasManuallyCollapsed(false);
    setIsBottomCollapsed(true);
  }, [problemId]);

  // Toggle collapse (manual action)
  const toggleCollapse = useCallback(() => {
    setIsBottomCollapsed((prev) => {
      const newCollapsed = !prev;
      // Track manual collapse to prevent auto-expand interference
      setUserHasManuallyCollapsed(newCollapsed);
      return newCollapsed;
    });
  }, []);

  // Double-click on drag handle: reset to default height
  const handleDoubleClick = useCallback(() => {
    setBottomPanelHeight(BOTTOM_PANEL_DEFAULT);
    setIsBottomCollapsed(false);
    setUserHasManuallyCollapsed(false);
  }, [setBottomPanelHeight]);

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

  // Current bottom panel height based on collapse state
  const currentBottomHeight = isBottomCollapsed ? BOTTOM_PANEL_COLLAPSED : bottomPanelHeight;

  return (
    <div
      ref={containerRef}
      data-testid="code-editor-panel"
      className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* ===== 상단 영역: 에디터 ===== */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          {/* Left: Title area - flexible, can shrink */}
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-500 shrink-0" />
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">
              테스트 코드 작성
            </h2>
            <span className="shrink-0 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
              Python
            </span>
          </div>

          {/* Right: Buttons - fixed, don't shrink */}
          <div className="shrink-0 flex items-center gap-2">
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
                  Alt+P
                </kbd>
                {" 문제 보기"}
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Alt+F
                </kbd>
                {" 집중 모드"}
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

      {/* ===== 드래그 핸들 ===== */}
      <div
        data-testid="drag-handle-bottom"
        className={`flex-shrink-0 h-2.5 flex items-center justify-center cursor-row-resize
                    border-t border-gray-200 dark:border-gray-700
                    bg-gray-100 dark:bg-gray-800
                    hover:bg-sky-100 dark:hover:bg-sky-900/30
                    active:bg-sky-200 dark:active:bg-sky-900/50
                    transition-colors group ${isDragging ? "bg-sky-200 dark:bg-sky-900/50" : ""}`}
        onMouseDown={handleDragStart}
        onDoubleClick={handleDoubleClick}
        title="드래그: 크기 조절 | 더블클릭: 기본값"
      >
        {/* Grip indicator - more visible */}
        <div className={`w-12 h-1 rounded-full transition-colors
                        bg-gray-300 dark:bg-gray-600
                        group-hover:bg-sky-400 dark:group-hover:bg-sky-500
                        ${isDragging ? "bg-sky-500 dark:bg-sky-400" : ""}`}
        />
      </div>

      {/* ===== 하단 영역: 결과 탭 ===== */}
      <div
        data-testid="bottom-panel"
        className={`flex-shrink-0 flex flex-col ${isDragging ? "" : "transition-all duration-150"}`}
        style={{
          height: currentBottomHeight,
          minHeight: BOTTOM_PANEL_COLLAPSED,
        }}
      >
        {/* Collapse toggle in tab bar is handled inside BottomTabs */}
        <BottomTabs
          className="h-full"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isExpanded={!isBottomCollapsed}
          onExpandToggle={() => toggleCollapse()}
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
          isCollapsed={isBottomCollapsed}
          onCollapseToggle={toggleCollapse}
        />
      </div>

      {/* Overlay during drag to prevent iframe/editor capturing mouse */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-row-resize" />
      )}
    </div>
  );
}
