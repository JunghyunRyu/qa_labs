import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LayoutState {
  // Panel state
  panelWidth: number; // Left panel width percentage (20-55)
  isProblemCollapsed: boolean;
  isAIChatOpen: boolean;

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
  resetLayout: () => void;
}

const DEFAULT_STATE = {
  panelWidth: 35, // 35% problem / 65% code
  isProblemCollapsed: false,
  isAIChatOpen: false,
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
        // Don't persist isAIChatOpen or activeTab
      }),
    }
  )
);
