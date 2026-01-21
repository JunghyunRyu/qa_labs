"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Code2,
  Keyboard,
  Loader2,
  FlaskConical,
  Save,
  RotateCcw,
  X,
  Cloud,
  CloudOff,
  Bug,
  CheckCircle2,
  Check,
  Circle,
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
import type { Submission, Problem } from "@/types/problem";
import type { PytestResult } from "@/workers/pyodide-worker-types";
import type { SaveStatus } from "@/hooks/useCodeDraft";

// Height when collapsed (just tab bar)
const BOTTOM_PANEL_COLLAPSED = 36;

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submission: Submission | null;
  submissionError: string | null;
  /** Problem data for displaying missed bug details */
  problem?: Problem;
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
  /** Save status */
  saveStatus?: SaveStatus;
  /** Manual save function (Ctrl+S) */
  onSaveNow?: () => void;
  /** Whether draft was recovered */
  wasRecovered?: boolean;
  /** Dismiss recovery notification */
  onDismissRecovery?: () => void;
  /** Reset to template */
  onReset?: () => void;
  /** Last saved timestamp */
  lastSavedAt?: number | null;
}

/** Format time ago (e.g., "방금", "1분 전", etc.) */
function formatTimeAgo(timestamp: number | null | undefined): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 5000) return "방금";
  if (diff < 60000) return `${Math.floor(diff / 1000)}초 전`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  return `${Math.floor(diff / 3600000)}시간 전`;
}

export default function CodeEditorPanel({
  code,
  onCodeChange,
  onSubmit,
  isSubmitting,
  submission,
  submissionError,
  problem,
  goldenCode: _goldenCode, // Reserved for future use
  onLocalTest,
  isLocalTesting = false,
  localTestResult,
  localTestError,
  localTestProgress,
  problemId,
  onLoadSubmission,
  sessionHistory = [],
  saveStatus = "saved",
  onSaveNow,
  wasRecovered = false,
  onDismissRecovery,
  onReset,
  lastSavedAt,
}: CodeEditorPanelProps) {
  // Get bottom panel height and editor focus state from global store
  const { bottomPanelHeight, setBottomPanelHeight, editorFocusRequested, clearEditorFocusRequest } = useLayoutStore();

  // Monaco editor instance reference
  const monacoEditorRef = useRef<any>(null);

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
  // 🚨 DX 개선: 실행 버튼 클릭 시 결과 패널을 얼굴 앞에 들이밀기
  useEffect(() => {
    if (isRunning && !userHasManuallyCollapsed) {
      setIsBottomCollapsed(false);
      // 패널 높이도 확장 (결과를 바로 볼 수 있도록)
      if (bottomPanelHeight < BOTTOM_PANEL_EXPANDED) {
        setBottomPanelHeight(BOTTOM_PANEL_EXPANDED);
      }
    }
  }, [isRunning, userHasManuallyCollapsed, bottomPanelHeight, setBottomPanelHeight]);

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

  // Handle editor focus request from global store
  useEffect(() => {
    if (editorFocusRequested && monacoEditorRef.current) {
      monacoEditorRef.current.focus();
      clearEditorFocusRequest();
    }
  }, [editorFocusRequested, clearEditorFocusRequest]);

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
    // Ctrl+S for manual save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSaveNow?.();
    }
  };

  // Current bottom panel height based on collapse state
  const currentBottomHeight = isBottomCollapsed ? BOTTOM_PANEL_COLLAPSED : bottomPanelHeight;

  // Save status indicator render (with text - for other areas)
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden sm:inline">저장 중...</span>
          </span>
        );
      case "modified":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <CloudOff className="w-3 h-3" />
            <span className="hidden sm:inline">수정됨</span>
          </span>
        );
      case "saved":
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400" title={lastSavedAt ? `저장됨 ${formatTimeAgo(lastSavedAt)}` : "저장됨"}>
            <Cloud className="w-3 h-3" />
            <span className="hidden sm:inline">저장됨</span>
          </span>
        );
    }
  };

  // Save status icon only (for compact tab header)
  const renderSaveStatusIcon = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <span title="저장 중...">
            <Loader2 className="w-2.5 h-2.5 ml-1 text-amber-400 animate-spin" />
          </span>
        );
      case "modified":
        return (
          <span title="수정됨 (저장 필요)">
            <Circle className="w-2 h-2 ml-1 text-white fill-white" />
          </span>
        );
      case "saved":
      default:
        return (
          <span title={lastSavedAt ? `저장됨 ${formatTimeAgo(lastSavedAt)}` : "저장됨"}>
            <Check className="w-3 h-3 ml-1 text-slate-500" />
          </span>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="code-editor-panel"
      className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Recovery notification */}
      {wasRecovered && (
        <div className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <Save className="w-4 h-4 shrink-0" />
            <span>이전에 작성하던 코드가 복구되었습니다.</span>
          </div>
          <button
            onClick={onDismissRecovery}
            className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </button>
        </div>
      )}

      {/* ===== 상단 영역: 에디터 ===== */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Function Signature Header (Sticky) */}
        {problem?.function_signature && (
          <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700 bg-[#161b22] flex items-center justify-between">
            <code className="text-sm font-mono text-[#e6edf3]">
              {problem.function_signature}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(problem.function_signature || "");
              }}
              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              title="Copy signature"
            >
              Copy
            </button>
          </div>
        )}

        {/* Header - VS Code 스타일 슬림 헤더 (h-12 = 48px) */}
        <div className="flex-shrink-0 px-2 h-12 border-b border-slate-700 bg-slate-950 flex items-center gap-2">
          {/* Left: File tab style - 에디터와 연결된 탭 */}
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            {/* File tab - VS Code 스타일 (에디터 배경과 동일, 위로 연결) */}
            <div className="flex items-center gap-1.5 h-12 px-3 bg-slate-900 border-t border-x border-slate-700 rounded-t -mb-px text-sm">
              <Code2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span className="text-slate-200 font-medium">test_solution.py</span>
              {/* Save status - 아이콘만 (텍스트 제거) */}
              {renderSaveStatusIcon()}
            </div>
          </div>

          {/* Right: Buttons - compact VS Code 스타일 */}
          <div className="shrink-0 flex items-center gap-1">
            {/* Reset Button */}
            {onReset && (
              <button
                data-testid="btn-reset"
                onClick={onReset}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                title="새로 시작 (템플릿으로 초기화)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Local Test Button - compact */}
            {onLocalTest && (
              <div className="relative group/test">
                <button
                  data-testid="btn-local-test"
                  onClick={onLocalTest}
                  disabled={isLocalTesting || isSubmitting || !code.trim()}
                  className="h-7 px-2 xl:px-3 bg-emerald-600 text-white rounded hover:bg-emerald-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                             font-medium flex items-center gap-1 xl:gap-1.5 text-xs"
                  aria-describedby="local-test-tooltip"
                >
                  {isLocalTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="hidden xl:inline">검증 중</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">실행</span>
                    </>
                  )}
                </button>
                {/* Tooltip */}
                <div
                  id="local-test-tooltip"
                  role="tooltip"
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2
                             bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
                             opacity-0 invisible group-hover/test:opacity-100 group-hover/test:visible
                             transition-all duration-200 whitespace-nowrap z-50 pointer-events-none
                             shadow-lg"
                >
                  <div className="font-semibold mb-1">빠른 검증 (Shift+Enter)</div>
                  <div className="text-gray-300">문법 오류 확인 + 정답 코드 통과 테스트</div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700" />
                </div>
              </div>
            )}

            {/* Submit Button - compact */}
            <div className="relative group/submit">
              <button
                data-testid="btn-submit"
                onClick={onSubmit}
                disabled={isSubmitting || isLocalTesting || !code.trim()}
                className={`h-7 px-2 xl:px-3 bg-sky-600 text-white rounded hover:bg-sky-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                           font-medium flex items-center gap-1 xl:gap-1.5 text-xs
                           ${localTestResult && localTestResult.failed === 0 && localTestResult.errors === 0
                             ? "animate-pulse ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900"
                             : ""}`}
                aria-describedby="submit-tooltip"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden xl:inline">채점 중</span>
                  </>
                ) : (
                  <>
                    <Bug className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">채점</span>
                  </>
                )}
              </button>
              {/* Tooltip */}
              <div
                id="submit-tooltip"
                role="tooltip"
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2
                           bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg
                           opacity-0 invisible group-hover/submit:opacity-100 group-hover/submit:visible
                           transition-all duration-200 whitespace-nowrap z-50 pointer-events-none
                           shadow-lg"
              >
                <div className="font-semibold mb-1">채점 시작 (Ctrl+Enter)</div>
                <div className="text-gray-300">숨겨진 버그 코드들과 대결하여 탐지율 측정</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div
          ref={editorContainerRef}
          data-testid="code-editor-area"
          className="flex-1 min-h-0 overflow-hidden"
          onMouseDown={(e) => {
            // 스크롤바/미니맵 클릭은 무시 (Monaco 에디터 관련 요소 체크)
            const target = e.target as HTMLElement;
            const isScrollbarOrOverlay =
              target.closest('.scrollbar') ||
              target.closest('.slider') ||
              target.closest('.monaco-scrollable-element > .scrollbar') ||
              target.closest('.minimap') ||
              target.closest('.decorationsOverviewRuler') ||
              target.closest('.monaco-editor-overlaymessage') ||
              target.classList.contains('scrollbar') ||
              target.classList.contains('slider');

            // 클릭 위치가 오른쪽 가장자리 20px 이내면 스크롤바로 간주
            const rect = e.currentTarget.getBoundingClientRect();
            const isNearRightEdge = e.clientX > rect.right - 20;

            if (isScrollbarOrOverlay || isNearRightEdge) return;

            // 에디터 본문 클릭 시 패널 접기 (VS Code style)
            if (!isBottomCollapsed) {
              setIsBottomCollapsed(true);
              setUserHasManuallyCollapsed(true);
            }
          }}
        >
          <CodeEditor
            value={code}
            onChange={(value) => onCodeChange(value || "")}
            height={`${editorHeight}px`}
            language="python"
            onEditorReady={(editor) => { monacoEditorRef.current = editor; }}
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
                  {" 테스트 실행"}
                </span>
              )}
              <span>
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Ctrl+Enter
                </kbd>
                {" 채점하기"}
              </span>
              {onSaveNow && (
                <span>
                  <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                    Ctrl+S
                  </kbd>
                  {" 저장"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile save status */}
              <span className="sm:hidden">{renderSaveStatus()}</span>
              <span className="hidden sm:inline">
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Alt+P
                </kbd>
                {" 문제 보기"}
              </span>
              <span className="hidden sm:inline">
                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                  Alt+F
                </kbd>
                {" 집중 모드"}
              </span>
              <span className="hidden sm:inline">
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
                    transition-colors touch-none select-none group
                    ${isDragging ? "bg-sky-200 dark:bg-sky-900/50" : ""}`}
        onMouseDown={handleDragStart}
        onDoubleClick={handleDoubleClick}
        title="드래그: 크기 조절 | 더블클릭: 기본값"
      >
        {/* Grip indicator - always visible */}
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
          problem={problem}
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
