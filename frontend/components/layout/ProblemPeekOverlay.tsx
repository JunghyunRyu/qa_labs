"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { X, FileText, Code2, Sparkles, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Problem } from "@/types/problem";
import CopyButton from "@/components/CopyButton";
import TagChips from "@/components/TagChips";
import ProblemDescription from "@/components/ProblemDescription";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface ProblemPeekOverlayProps {
  problem: Problem;
  isOpen: boolean;
  onClose: () => void;
}

// Difficulty color mapping
const difficultyColors: Record<string, string> = {
  "Very Easy": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Easy": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "Hard": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function ProblemPeekOverlay({
  problem,
  isOpen,
  onClose,
}: ProblemPeekOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSignatureCollapsed, setIsSignatureCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);

  // Close on ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      // Add ESC listener with capture to handle before Monaco
      document.addEventListener("keydown", handleKeyDown, true);
      document.addEventListener("mousedown", handleClickOutside);

      // Focus trap - prevent background scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen) return null;

  // Use problem.summary if available, fallback to extract from description
  const getSummary = (): string => {
    if (problem.summary) {
      return problem.summary;
    }
    // Fallback: extract first 3 meaningful lines
    const lines = problem.description_md
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .slice(0, 3);
    return lines.join("\n");
  };

  const summary = getSummary();

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4
                 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="peek-title"
    >
      <div
        ref={contentRef}
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900
                   rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
                   flex flex-col overflow-hidden
                   animate-in slide-in-from-top-4 duration-200"
      >
        {/* Header - Always visible */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700
                        bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title and difficulty */}
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-sky-500 flex-shrink-0" />
                <h2
                  id="peek-title"
                  className="text-lg font-bold text-gray-900 dark:text-white truncate"
                >
                  {problem.title}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    difficultyColors[problem.difficulty] || difficultyColors["Medium"]
                  }`}
                >
                  {problem.difficulty}
                </span>
              </div>

              {/* Skills tags */}
              {problem.skills && problem.skills.length > 0 && (
                <div className="ml-8">
                  <TagChips tags={problem.skills} maxVisible={4} size="sm" />
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                         text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
              aria-label="닫기 (ESC)"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Function Signature - Collapsible */}
        <div className="flex-shrink-0 px-5 py-3 bg-purple-50 dark:bg-purple-900/20
                        border-b border-purple-100 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSignatureCollapsed(!isSignatureCollapsed)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                함수 시그니처
              </span>
              {isSignatureCollapsed ? (
                <ChevronDown className="w-4 h-4 text-purple-500" />
              ) : (
                <ChevronUp className="w-4 h-4 text-purple-500" />
              )}
            </button>
            <CopyButton text={problem.function_signature} variant="light" />
          </div>
          {!isSignatureCollapsed && (
            <pre className="mt-1.5 text-sm text-purple-900 dark:text-purple-100 font-mono
                            bg-white dark:bg-gray-900 p-2.5 rounded-lg
                            border border-purple-200 dark:border-purple-700
                            max-h-[120px] overflow-auto">
              {problem.function_signature}
            </pre>
          )}
        </div>

        {/* Summary - Key test points - Collapsible */}
        <div className="flex-shrink-0 px-5 py-3 bg-sky-50 dark:bg-sky-900/20
                        border-b border-sky-100 dark:border-sky-800/30">
          <button
            onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                핵심 테스트 포인트
              </span>
            </div>
            {isSummaryCollapsed ? (
              <ChevronDown className="w-4 h-4 text-sky-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-sky-500" />
            )}
          </button>
          {!isSummaryCollapsed && (
            summary ? (
              <div className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none max-h-[150px] overflow-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {summary}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 italic">
                문제 설명을 확인하세요.
              </p>
            )
          )}
        </div>

        {/* Full Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <ProblemDescription description_md={problem.description_md} />
        </div>

        {/* Footer hint */}
        <div className="flex-shrink-0 px-5 py-2 bg-gray-50 dark:bg-gray-800
                        border-t border-gray-200 dark:border-gray-700
                        text-xs text-gray-500 dark:text-gray-400 text-center">
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">
            ESC
          </kbd>
          {" 또는 바깥 클릭으로 닫기 • "}
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">
            Alt+P
          </kbd>
          {" 토글"}
        </div>
      </div>
    </div>
  );
}
