/**
 * SyntaxHintCard - 문법 오류 힌트 카드 컴포넌트
 * M6-2: Very Easy 실패율 감소를 위한 한글 가이드 시스템
 */

"use client";

import { Lightbulb, ChevronDown } from "lucide-react";
import type { SanitizedError } from "@/lib/errorSanitizer";

interface SyntaxHintCardProps {
  error: SanitizedError;
  originalStderr?: string;
}

export function SyntaxHintCard({ error, originalStderr }: SyntaxHintCardProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {/* 에러 타입 */}
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            {error.type}
          </p>

          {/* 힌트 메시지 */}
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {error.hint}
          </p>

          {/* 제안 (있는 경우) */}
          {error.suggestion && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Tip: {error.suggestion}
            </p>
          )}

          {/* 원본 에러 메시지 (간략) */}
          {error.originalMessage && (
            <p className="text-xs text-blue-500 dark:text-blue-500 mt-2 font-mono truncate">
              {error.originalMessage}
            </p>
          )}
        </div>
      </div>

      {/* 원본 stderr 토글 */}
      {originalStderr && (
        <details className="mt-3">
          <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            원본 에러 메시지 보기
          </summary>
          <pre className="mt-2 text-xs bg-white dark:bg-neutral-900 p-3 rounded border border-blue-200/50 dark:border-blue-800/50 overflow-x-auto font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
            {originalStderr}
          </pre>
        </details>
      )}
    </div>
  );
}

export default SyntaxHintCard;
