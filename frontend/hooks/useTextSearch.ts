"use client";

import { useState, useCallback, useEffect, useRef, RefObject } from "react";
import {
  highlightTextWithSections,
  clearHighlights,
  setCurrentHighlight,
  getSectionsWithMatches,
  MatchInfo,
} from "@/utils/textHighlight";

export interface UseTextSearchOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  debounceMs?: number;
  onSectionsToOpen?: (sectionIds: Set<string>) => void;
}

export interface UseTextSearchResult {
  isOpen: boolean;
  query: string;
  matches: MatchInfo[];
  currentIndex: number;
  totalCount: number;
  caseSensitive: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  toggleCaseSensitive: () => void;
  goNext: () => void;
  goPrev: () => void;
}

export function useTextSearch(
  options: UseTextSearchOptions
): UseTextSearchResult {
  const { containerRef, debounceMs = 150, onSectionsToOpen } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryState] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 이전 포커스 저장 (검색창 닫을 때 복원용)
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Debounced 검색 실행
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (containerRef.current && query.trim()) {
        const result = highlightTextWithSections(
          containerRef.current,
          query,
          caseSensitive
        );
        setMatches(result.matches);
        setCurrentIndex(0);

        // 매치된 섹션들 자동 펼침
        if (onSectionsToOpen && result.matches.length > 0) {
          const sections = getSectionsWithMatches(result.matches);
          if (sections.size > 0) {
            onSectionsToOpen(sections);
          }
        }

        // 첫 번째 매치로 스크롤
        if (result.matches.length > 0) {
          setCurrentHighlight(
            result.matches.map((m) => m.mark),
            0
          );
        }
      } else if (containerRef.current) {
        clearHighlights(containerRef.current);
        setMatches([]);
        setCurrentIndex(0);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, caseSensitive, containerRef, debounceMs, isOpen, onSectionsToOpen]);

  // 검색창 닫을 때 하이라이트 제거
  useEffect(() => {
    if (!isOpen && containerRef.current) {
      clearHighlights(containerRef.current);
      setMatches([]);
      setQueryState("");
      setCurrentIndex(0);

      // 이전 포커스 복원
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen, containerRef]);

  const open = useCallback(() => {
    // 현재 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const toggleCaseSensitive = useCallback(() => {
    setCaseSensitive((c) => !c);
  }, []);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIndex);
    setCurrentHighlight(
      matches.map((m) => m.mark),
      nextIndex
    );
  }, [matches, currentIndex]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prevIndex = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIndex);
    setCurrentHighlight(
      matches.map((m) => m.mark),
      prevIndex
    );
  }, [matches, currentIndex]);

  return {
    isOpen,
    query,
    matches,
    currentIndex,
    totalCount: matches.length,
    caseSensitive,
    open,
    close,
    toggle,
    setQuery,
    toggleCaseSensitive,
    goNext,
    goPrev,
  };
}
