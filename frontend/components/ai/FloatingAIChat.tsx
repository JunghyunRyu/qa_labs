"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, History } from "lucide-react";
import { useLayoutStore } from "@/stores/layoutStore";
import AICoachPanel from "@/components/AICoachPanel";
import SavedFeedbackDisplay, { type SavedFeedback } from "@/components/ai/SavedFeedbackDisplay";
import type { AIChatMode } from "@/types/ai";

interface FloatingAIChatProps {
  problemId: number;
  codeContext?: string;
  mode: AIChatMode;
  onModeChange: (mode: AIChatMode) => void;
  savedFeedback?: SavedFeedback | null;
  savedFeedbackScore?: number;
  onClearSavedFeedback?: () => void;
}

export default function FloatingAIChat({
  problemId,
  codeContext,
  mode,
  onModeChange,
  savedFeedback,
  savedFeedbackScore,
  onClearSavedFeedback,
}: FloatingAIChatProps) {
  const { isAIChatOpen, toggleAIChat, setIsAIChatOpen } = useLayoutStore();

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
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isAIChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                       bg-gradient-to-r from-purple-500 to-purple-600
                       hover:from-purple-600 hover:to-purple-700
                       text-white shadow-lg flex items-center justify-center
                       transition-colors"
            aria-label="AI 도우미 열기 (Ctrl+/)"
            title="AI 도우미 열기 (Ctrl+/)"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
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
            className="fixed top-0 right-0 h-full w-96 max-w-[90vw] z-50
                       bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-purple-600">
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
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
