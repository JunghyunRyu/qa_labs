"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Bot, X, History, GripVertical } from "lucide-react";
import { useLayoutStore } from "@/stores/layoutStore";
import AICoachPanel from "@/components/AICoachPanel";
import SavedFeedbackDisplay, { type SavedFeedback } from "@/components/ai/SavedFeedbackDisplay";
import type { AIChatMode } from "@/types/ai";
import type { PromptContext } from "@/lib/quickPrompts";

// localStorage에 저장할 키
const POSITION_STORAGE_KEY = "qa_arena_ai_button_position";
const WIDTH_STORAGE_KEY = "qa_arena_ai_panel_width";

// 패널 너비 제한
const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 384; // w-96

interface FloatingAIChatProps {
  problemId: number;
  codeContext?: string;
  mode: AIChatMode;
  onModeChange: (mode: AIChatMode) => void;
  savedFeedback?: SavedFeedback | null;
  savedFeedbackScore?: number;
  onClearSavedFeedback?: () => void;
  promptContext?: PromptContext; // M5-3: 빠른 질문용 컨텍스트
}

// 기본 위치 (우하단)
const DEFAULT_POSITION = { x: 0, y: 0 };

export default function FloatingAIChat({
  problemId,
  codeContext,
  mode,
  onModeChange,
  savedFeedback,
  savedFeedbackScore,
  onClearSavedFeedback,
  promptContext,
}: FloatingAIChatProps) {
  const { isAIChatOpen, toggleAIChat, setIsAIChatOpen } = useLayoutStore();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // 드래그 위치 상태 (localStorage에서 복원)
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);

  // 패널 너비 상태
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // 컴포넌트 마운트 시 저장된 위치 및 너비 복원
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem(POSITION_STORAGE_KEY);
      if (savedPosition) {
        const parsed = JSON.parse(savedPosition);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(parsed);
        }
      }

      const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY);
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= MIN_PANEL_WIDTH && width <= MAX_PANEL_WIDTH) {
          setPanelWidth(width);
        }
      }
    } catch {
      // localStorage 접근 실패 시 기본값 사용
    }
  }, []);

  // 위치 변경 시 localStorage에 저장
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    const newPosition = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    };
    setPosition(newPosition);
    setIsDragging(false);

    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(newPosition));
    } catch {
      // localStorage 저장 실패 무시
    }
  };

  // 리사이즈 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = panelWidth;
  }, [panelWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const delta = resizeStartX.current - e.clientX;
    const newWidth = Math.min(
      MAX_PANEL_WIDTH,
      Math.max(MIN_PANEL_WIDTH, resizeStartWidth.current + delta)
    );
    setPanelWidth(newWidth);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;

    setIsResizing(false);
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(panelWidth));
    } catch {
      // localStorage 저장 실패 무시
    }
  }, [isResizing, panelWidth]);

  // 리사이즈 이벤트 리스너
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAIChatOpen) {
        setIsAIChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAIChatOpen, setIsAIChatOpen]);

  // Close drawer and turn off AI mode
  const handleClose = () => {
    setIsAIChatOpen(false);
    onModeChange("OFF");
  };

  // Open drawer and turn on AI mode
  const handleOpen = () => {
    setIsAIChatOpen(true);
    if (mode === "OFF") {
      onModeChange("COACH");
    }
  };

  return (
    <>
      {/* Drag constraints (화면 전체) */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      {/* Floating Action Button - 드래그 가능 */}
      <AnimatePresence>
        {!isAIChatOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: position.x, y: position.y }}
            animate={{ scale: 1, opacity: 1, x: position.x, y: position.y }}
            exit={{ scale: 0, opacity: 0 }}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            className="fixed bottom-6 right-6 z-50"
            style={{ touchAction: "none" }}
          >
            <motion.button
              whileHover={{ scale: isDragging ? 1 : 1.05 }}
              whileTap={{ scale: isDragging ? 1 : 0.95 }}
              onClick={() => !isDragging && handleOpen()}
              className={`w-14 h-14 rounded-full
                         bg-purple-600 dark:bg-purple-700
                         hover:bg-purple-700 dark:hover:bg-purple-800
                         text-white shadow-lg flex items-center justify-center
                         transition-colors cursor-grab active:cursor-grabbing
                         ${isDragging ? "ring-2 ring-purple-400 ring-offset-2" : ""}`}
              aria-label="AI 도우미 열기 (Ctrl+/) - 드래그하여 위치 이동"
              title="AI 도우미 열기 (Ctrl+/) - 드래그하여 위치 이동"
            >
              <Bot className="w-6 h-6" />
            </motion.button>
            {/* 드래그 힌트 */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-400 dark:bg-purple-500 flex items-center justify-center opacity-60">
              <GripVertical className="w-2.5 h-2.5 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isAIChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAIChatOpen(false)}
            className="fixed inset-0 bg-black/30 z-40"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isAIChatOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            style={{ width: panelWidth }}
            className="fixed top-0 right-0 h-full max-w-[90vw] z-50
                       bg-white dark:bg-neutral-900 shadow-2xl flex flex-col"
          >
            {/* 리사이즈 핸들 */}
            <div
              onMouseDown={handleResizeStart}
              className={`absolute -left-1 top-0 w-3 h-full cursor-ew-resize
                         group transition-colors z-10
                         ${isResizing ? "bg-purple-500/20" : ""}`}
              title="드래그하여 너비 조절"
            >
              {/* 리사이즈 바 (시각적 표시) */}
              <div className={`absolute left-1 top-0 w-1 h-full transition-colors
                              ${isResizing
                                ? "bg-purple-500"
                                : "bg-neutral-300 dark:bg-neutral-600 group-hover:bg-purple-400 dark:group-hover:bg-purple-500"}`} />
              {/* 가운데 그립 아이콘 */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-12
                              flex items-center justify-center rounded
                              transition-opacity
                              ${isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <div className="flex flex-col gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                </div>
              </div>
            </div>
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-purple-600 dark:bg-purple-700">
              <div className="flex items-center gap-2 text-white">
                {savedFeedback ? (
                  <>
                    <History className="w-5 h-5" />
                    <span className="font-semibold">저장된 AI 피드백</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    <span className="font-semibold">AI 도우미</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {savedFeedback && onClearSavedFeedback && (
                  <button
                    onClick={onClearSavedFeedback}
                    className="px-2 py-1 text-xs rounded-lg hover:bg-white/20 transition-colors text-white"
                    title="새 대화 시작"
                  >
                    새 대화
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                  aria-label="닫기 (Escape)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content: Saved Feedback or AI Coach Panel */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {savedFeedback ? (
                <div className="p-4">
                  <SavedFeedbackDisplay
                    feedback={savedFeedback}
                    submissionScore={savedFeedbackScore}
                  />
                </div>
              ) : (
                <AICoachPanel
                  problemId={problemId}
                  codeContext={codeContext}
                  mode={mode}
                  onModeChange={onModeChange}
                  className="h-full border-0 rounded-none"
                  promptContext={promptContext}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
