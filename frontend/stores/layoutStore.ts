import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutState {
  // Panel state
  panelWidth: number; // Left panel width percentage (22-55)
  isProblemCollapsed: boolean;
  isAIChatOpen: boolean;

  // Focus mode (minimizes header, collapses problem panel)
  isFocusMode: boolean;
  isProblemPeekOpen: boolean;

  // Editor settings
  editorFontSize: number;

  // Mobile tab
  activeTab: "problem" | "code" | "ai";

  // Actions
  setPanelWidth: (width: number) => void;
  toggleProblemPanel: () => void;
  setIsProblemCollapsed: (collapsed: boolean) => void;
  toggleAIChat: () => void;
  setIsAIChatOpen: (open: boolean) => void;
  setEditorFontSize: (size: number) => void;
  setActiveTab: (tab: "problem" | "code" | "ai") => void;
  toggleFocusMode: () => void;
  setIsFocusMode: (focus: boolean) => void;
  toggleProblemPeek: () => void;
  setIsProblemPeekOpen: (open: boolean) => void;
  resetLayout: () => void;
}

const DEFAULT_STATE = {
  panelWidth: 35, // 35% problem / 65% code
  isProblemCollapsed: false,
  isAIChatOpen: false,
  isFocusMode: false,
  isProblemPeekOpen: false,
  editorFontSize: 14,
  activeTab: "code" as const,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setPanelWidth: (width: number) => {
        // Clamp between 22-55% (problem panel takes 22-55%, code takes 45-78%)
        const clampedWidth = Math.min(55, Math.max(22, width));
        set({ panelWidth: clampedWidth });
      },

      toggleProblemPanel: () => {
        set((state) => ({ isProblemCollapsed: !state.isProblemCollapsed }));
      },

      setIsProblemCollapsed: (collapsed: boolean) => {
        set({ isProblemCollapsed: collapsed });
      },

      toggleAIChat: () => {
        set((state) => ({ isAIChatOpen: !state.isAIChatOpen }));
      },

      setIsAIChatOpen: (open: boolean) => {
        set({ isAIChatOpen: open });
      },

      setEditorFontSize: (size: number) => {
        // Clamp between 10-24px
        const clampedSize = Math.min(24, Math.max(10, size));
        set({ editorFontSize: clampedSize });
      },

      setActiveTab: (tab: "problem" | "code" | "ai") => {
        set({ activeTab: tab });
      },

      toggleFocusMode: () => {
        set((state) => {
          const newFocusMode = !state.isFocusMode;
          return {
            isFocusMode: newFocusMode,
            // Auto-collapse problem panel when entering focus mode
            isProblemCollapsed: newFocusMode ? true : state.isProblemCollapsed,
            // Close peek when exiting focus mode
            isProblemPeekOpen: newFocusMode ? state.isProblemPeekOpen : false,
          };
        });
      },

      setIsFocusMode: (focus: boolean) => {
        set((state) => ({
          isFocusMode: focus,
          isProblemCollapsed: focus ? true : state.isProblemCollapsed,
          isProblemPeekOpen: focus ? state.isProblemPeekOpen : false,
        }));
      },

      toggleProblemPeek: () => {
        set((state) => ({ isProblemPeekOpen: !state.isProblemPeekOpen }));
      },

      setIsProblemPeekOpen: (open: boolean) => {
        set({ isProblemPeekOpen: open });
      },

      resetLayout: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: "qa-arena-layout",
      partialize: (state) => ({
        panelWidth: state.panelWidth,
        isProblemCollapsed: state.isProblemCollapsed,
        editorFontSize: state.editorFontSize,
        isFocusMode: state.isFocusMode,
        // Don't persist isAIChatOpen, isProblemPeekOpen, or activeTab
      }),
    }
  )
);
