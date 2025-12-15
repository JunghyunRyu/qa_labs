"use client";

import { useState, useRef, useEffect } from "react";
import { Code2, Play, Keyboard, Loader2 } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import SubmissionResultPanel from "@/components/SubmissionResultPanel";
import type { Submission } from "@/types/problem";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submission: Submission | null;
  submissionError: string | null;
}

export default function CodeEditorPanel({
  code,
  onCodeChange,
  onSubmit,
  isSubmitting,
  submission,
  submissionError,
}: CodeEditorPanelProps) {
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [editorHeight, setEditorHeight] = useState(400);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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

  // Handle Ctrl+Enter for submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isSubmitting && code.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
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

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !code.trim()}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     font-medium flex items-center gap-2 text-sm"
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

      {/* Editor Area */}
      <div
        ref={editorContainerRef}
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
          <div className="flex items-center gap-1">
            <Keyboard className="w-3 h-3" />
            <span>
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                Ctrl
              </kbd>
              {" + "}
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                Enter
              </kbd>
              {" 로 채점"}
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
              {" AI 코치"}
            </span>
          </div>
        </div>
      </div>

      {/* Submission Result */}
      {(submission || submissionError) && (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 max-h-[40%] overflow-y-auto">
          <SubmissionResultPanel
            submission={submission}
            isSubmitting={isSubmitting}
            submissionError={submissionError}
            onRetry={onSubmit}
          />
        </div>
      )}
    </div>
  );
}
