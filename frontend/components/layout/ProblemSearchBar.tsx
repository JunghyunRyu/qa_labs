"use client";

import { useEffect, useRef, KeyboardEvent } from "react";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
} from "lucide-react";

export interface ProblemSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  currentIndex: number;
  totalCount: number;
  caseSensitive: boolean;
  onToggleCaseSensitive: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export default function ProblemSearchBar({
  query,
  onQueryChange,
  currentIndex,
  totalCount,
  caseSensitive,
  onToggleCaseSensitive,
  onNext,
  onPrev,
  onClose,
}: ProblemSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 마운트 시 자동 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (e.shiftKey) {
          onPrev();
        } else {
          onNext();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "f":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // 검색창 내에서 Ctrl+F는 다음 매치로 이동
          onNext();
        }
        break;
    }
  };

  const hasMatches = totalCount > 0;
  const showNoResults = query.trim() && !hasMatches;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* 검색 아이콘 */}
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

      {/* 검색 입력창 */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="검색어 입력..."
        className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 dark:text-gray-100
                   placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none"
        aria-label="문제 내 검색"
      />

      {/* 매치 카운터 */}
      {query.trim() && (
        <span
          data-testid="match-counter"
          className={`text-xs whitespace-nowrap ${
            showNoResults
              ? "text-red-500 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {showNoResults
            ? "0개 결과"
            : `${currentIndex + 1}/${totalCount}`}
        </span>
      )}

      {/* 대소문자 구분 토글 */}
      <button
        type="button"
        onClick={onToggleCaseSensitive}
        title="대소문자 구분 (Aa)"
        aria-pressed={caseSensitive}
        data-testid="case-sensitive-toggle"
        className={`p-1 rounded transition-colors ${
          caseSensitive
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        }`}
      >
        <CaseSensitive className="w-4 h-4" />
      </button>

      {/* 이전 매치 */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasMatches}
        aria-label="이전 매치"
        title="이전 (Shift+Enter)"
        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* 다음 매치 */}
      <button
        type="button"
        onClick={onNext}
        disabled={!hasMatches}
        aria-label="다음 매치"
        title="다음 (Enter)"
        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* 닫기 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="검색 닫기"
        title="닫기 (Escape)"
        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
