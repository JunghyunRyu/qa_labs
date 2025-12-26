"use client";

import { useEffect, useCallback } from "react";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  preventDefault?: boolean;
  /** Allow this shortcut to work even in input fields */
  allowInInput?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if typing in input/textarea
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const ctrlOrMeta = event.ctrlKey || event.metaKey;

        const matchesKey =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? ctrlOrMeta : !ctrlOrMeta;
        const matchesShift = shortcut.shiftKey
          ? event.shiftKey
          : !event.shiftKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          // Check if shortcut should be blocked in input fields
          if (isInInput && !shortcut.allowInInput && event.key !== "Escape") {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Preset shortcuts for problem solver page
export function useProblemSolverShortcuts(handlers: {
  toggleProblemPanel: () => void;
  toggleAIChat: () => void;
  closeAIChat: () => void;
  toggleFocusMode?: () => void;
  toggleProblemPeek?: () => void;
  closeProblemPeek?: () => void;
  openProblemSearch?: () => void;
}) {
  useKeyboardShortcuts([
    {
      key: "b",
      ctrlKey: true,
      action: handlers.toggleProblemPanel,
    },
    {
      key: "/",
      ctrlKey: true,
      action: handlers.toggleAIChat,
    },
    {
      key: "Escape",
      action: () => {
        // ESC closes peek first, then AI chat
        if (handlers.closeProblemPeek) {
          handlers.closeProblemPeek();
        }
        handlers.closeAIChat();
      },
      preventDefault: false,
    },
    // Alt+P: Toggle problem peek overlay
    ...(handlers.toggleProblemPeek
      ? [
          {
            key: "p",
            altKey: true,
            action: handlers.toggleProblemPeek,
          },
        ]
      : []),
    // Alt+F: Toggle focus mode
    ...(handlers.toggleFocusMode
      ? [
          {
            key: "f",
            altKey: true,
            action: handlers.toggleFocusMode,
          },
        ]
      : []),
    // Ctrl+F: Open problem search
    ...(handlers.openProblemSearch
      ? [
          {
            key: "f",
            ctrlKey: true,
            action: handlers.openProblemSearch,
            allowInInput: true, // Allow Ctrl+F even in search input (goes to next match)
          },
        ]
      : []),
  ]);
}
