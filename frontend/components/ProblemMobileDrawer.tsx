"use client";

import { useEffect, useCallback } from "react";
import { X, Info } from "lucide-react";
import ProblemSummaryContent from "@/components/ProblemSummaryContent";
import type { Problem, Submission } from "@/types/problem";

interface ProblemMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem;
  latestSubmission?: Submission | null;
  // AI 모드 토글 (M4 placeholder)
  aiModeEnabled?: boolean;
  onAiModeToggle?: (enabled: boolean) => void;
}

export default function ProblemMobileDrawer({
  isOpen,
  onClose,
  problem,
  latestSubmission,
  aiModeEnabled,
  onAiModeToggle,
}: ProblemMobileDrawerProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 하단 슬라이드 업 패널 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-out max-h-[70vh] overflow-hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-drawer-title"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="problem-drawer-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"
          >
            <Info className="w-5 h-5 text-sky-500" />
            문제 정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-5 overflow-y-auto max-h-[calc(70vh-100px)]">
          <ProblemSummaryContent
            problem={problem}
            latestSubmission={latestSubmission}
            aiModeEnabled={aiModeEnabled}
            onAiModeToggle={onAiModeToggle}
          />
        </div>
      </div>
    </div>
  );
}
