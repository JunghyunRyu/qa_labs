/**
 * SelectionActionMenu - 텍스트 선택 시 표시되는 플로팅 메뉴 (M5-4)
 *
 * 선택된 텍스트를 AI에게 질문하는 액션 버튼을 제공합니다.
 */

"use client";

import { useRef, useEffect, useMemo } from "react";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TextSelection } from "@/hooks/useTextSelection";
import {
  SELECTION_ACTIONS,
  type SelectionActionType,
} from "@/lib/selectionPrompts";

interface SelectionActionMenuProps {
  selection: TextSelection;
  onAction: (actionType: SelectionActionType, selectedText: string) => void;
  onDismiss: () => void;
}

export default function SelectionActionMenu({
  selection,
  onAction,
  onDismiss,
}: SelectionActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 위치 계산
  const menuStyle = useMemo(() => {
    if (!selection.rect) return {};

    // 화면 경계 고려
    const menuWidth = 160;
    const menuHeight = 150;
    const padding = 8;

    let top = selection.rect.bottom + padding;
    let left = selection.rect.left;

    // 오른쪽 경계 체크
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    // 왼쪽 경계 체크
    if (left < padding) {
      left = padding;
    }

    // 아래쪽 경계 체크 - 위로 표시
    if (top + menuHeight > window.innerHeight - padding) {
      top = selection.rect.top - menuHeight - padding;
    }

    return {
      position: "fixed" as const,
      top,
      left,
      zIndex: 100,
    };
  }, [selection.rect]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!selection.isValid) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };

    // 약간의 딜레이 후 이벤트 리스너 추가 (선택 직후 클릭 방지)
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selection.isValid, onDismiss]);

  // ESC 키 감지
  useEffect(() => {
    if (!selection.isValid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selection.isValid, onDismiss]);

  const handleAction = (actionType: SelectionActionType) => {
    onAction(actionType, selection.text);
  };

  return (
    <AnimatePresence>
      {selection.isValid && selection.rect && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15 }}
          style={menuStyle}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]"
        >
          {/* 헤더 */}
          <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-500" />
            <span>AI에게 질문</span>
          </div>

          {/* 액션 버튼들 */}
          {SELECTION_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30
                         flex items-center gap-2 text-gray-700 dark:text-gray-300
                         transition-colors"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
