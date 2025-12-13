"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import AICoachPanel from "./AICoachPanel";
import type { AIChatMode } from "@/types/ai";

interface AICoachMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
  codeContext?: string;
  mode: AIChatMode;
  onModeChange: (mode: AIChatMode) => void;
}

export default function AICoachMobileDrawer({
  isOpen,
  onClose,
  problemId,
  codeContext,
  mode,
  onModeChange,
}: AICoachMobileDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden animate-slide-up"
        style={{ height: "85vh" }}
      >
        <div className="h-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl flex flex-col">
          {/* Handle bar for drag gesture hint */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* AI Coach Panel */}
          <div className="flex-1 overflow-hidden">
            <AICoachPanel
              problemId={problemId}
              codeContext={codeContext}
              mode={mode}
              onModeChange={onModeChange}
              className="h-full border-0 rounded-none"
            />
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
