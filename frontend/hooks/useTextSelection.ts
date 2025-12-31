/**
 * useTextSelection - 텍스트 선택 감지 훅 (M5-4)
 *
 * 컨테이너 내 텍스트 드래그 선택을 감지하고
 * 선택 영역 정보를 반환합니다.
 */

import { useState, useEffect, RefObject, useCallback } from "react";

export interface TextSelection {
  text: string;
  rect: DOMRect | null;
  isValid: boolean;
}

const MIN_SELECTION_LENGTH = 5; // 최소 5자 이상 선택

export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean = true
): TextSelection {
  const [selection, setSelection] = useState<TextSelection>({
    text: "",
    rect: null,
    isValid: false,
  });

  const clearSelection = useCallback(() => {
    setSelection({ text: "", rect: null, isValid: false });
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearSelection();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();

      // 선택이 없거나 collapsed 상태
      if (!sel || sel.isCollapsed) {
        clearSelection();
        return;
      }

      // 선택 범위 가져오기
      const range = sel.getRangeAt(0);

      // 선택이 컨테이너 내부인지 확인
      if (!container.contains(range.commonAncestorContainer)) {
        clearSelection();
        return;
      }

      const text = sel.toString().trim();

      // 최소 길이 확인
      if (text.length < MIN_SELECTION_LENGTH) {
        clearSelection();
        return;
      }

      // 선택 영역의 위치 정보
      const rect = range.getBoundingClientRect();

      setSelection({
        text,
        rect,
        isValid: true,
      });
    };

    // 디바운싱으로 선택 완료 후 처리
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, 200);
    };

    // mouseup 이벤트로 선택 완료 감지 (더 정확함)
    const handleMouseUp = () => {
      // 약간의 딜레이 후 선택 확인
      setTimeout(handleSelectionChange, 50);
    };

    // 스크롤 시 메뉴 숨김
    const handleScroll = () => {
      clearSelection();
    };

    document.addEventListener("selectionchange", debouncedHandler);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("selectionchange", debouncedHandler);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("scroll", handleScroll, true);
      clearTimeout(timeoutId);
    };
  }, [containerRef, enabled, clearSelection]);

  return selection;
}

/**
 * 현재 선택 해제
 */
export function clearWindowSelection(): void {
  window.getSelection()?.removeAllRanges();
}
