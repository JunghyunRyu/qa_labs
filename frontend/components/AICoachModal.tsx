"use client";

import { useEffect } from "react";
import { X, Bot } from "lucide-react";
import AICoachPanel from "./AICoachPanel";
import type { AIChatMode } from "@/types/ai";

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
  codeContext?: string;
  mode: AIChatMode;
  onModeChange: (mode: AIChatMode) => void;
}

export default function AICoachModal({
  isOpen,
  onClose,
  problemId,
  codeContext,
  mode,
  onModeChange,
}: AICoachModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - 클릭하면 드로어 닫힘 */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-[400px] max-w-[90vw] animate-slide-in-right">
        <div className="h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  AI 코치
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  테스트 코드 작성을 도와드립니다
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* AI Coach Panel */}
          <div className="flex-1 overflow-hidden">
            <AICoachPanel
              problemId={problemId}
              codeContext={codeContext}
              mode={mode}
              onModeChange={onModeChange}
              onClose={onClose}
              className="h-full border-0 rounded-none"
            />
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
