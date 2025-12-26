import { create } from "zustand";
import { persist } from "zustand/middleware";

// Accordion section types for problem panel
export type AccordionSectionType = 'examples' | 'hints' | 'exceptions' | 'function' | 'other';

// Panel sizing constants
export const BOTTOM_PANEL_MIN = 120;
export const BOTTOM_PANEL_MAX = 500;
export const BOTTOM_PANEL_DEFAULT = 250;
export const BOTTOM_PANEL_EXPANDED = 300; // Height when auto-expanding for results

interface LayoutState {
  // Panel state
  panelWidth: number; // Left panel width percentage (22-55)
  isProblemCollapsed: boolean;
  isAIChatOpen: boolean;

  // Bottom panel state
  bottomPanelHeight: number; // Bottom panel height in pixels

  // Focus mode (minimizes header, collapses problem panel)
  isFocusMode: boolean;
  isProblemPeekOpen: boolean;

  // Problem search state (session-only)
  isProblemSearchOpen: boolean;

  // Editor settings
  editorFontSize: number;

  // Mobile tab
  activeTab: "problem" | "code" | "ai";

  // Accordion defaults (section type -> default open state)
  accordionDefaults: Record<AccordionSectionType, boolean>;

  // Actions
  setPanelWidth: (width: number) => void;
  toggleProblemPanel: () => void;
  setIsProblemCollapsed: (collapsed: boolean) => void;
  toggleAIChat: () => void;
  setIsAIChatOpen: (open: boolean) => void;
  setBottomPanelHeight: (height: number) => void;
  setEditorFontSize: (size: number) => void;
  setActiveTab: (tab: "problem" | "code" | "ai") => void;
  toggleFocusMode: () => void;
  setIsFocusMode: (focus: boolean) => void;
  toggleProblemPeek: () => void;
  setIsProblemPeekOpen: (open: boolean) => void;
  openProblemSearch: () => void;
  closeProblemSearch: () => void;
  toggleProblemSearch: () => void;
  setAccordionDefault: (sectionType: AccordionSectionType, isOpen: boolean) => void;
  resetLayout: () => void;
}

const DEFAULT_STATE = {
  panelWidth: 35, // 35% problem / 65% code
  isProblemCollapsed: false,
  isAIChatOpen: false,
  bottomPanelHeight: BOTTOM_PANEL_DEFAULT,
  isFocusMode: false,
  isProblemPeekOpen: false,
  isProblemSearchOpen: false,
  editorFontSize: 14,
  activeTab: "code" as const,
  accordionDefaults: {
    examples: true,      // 예시: 기본 열림
    hints: false,        // 힌트: 기본 닫힘 (스포일러 방지)
    exceptions: true,    // 예외: 기본 열림
    function: true,      // 함수: 기본 열림
    other: true,         // 기타: 기본 열림
  } as Record<AccordionSectionType, boolean>,
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

      setBottomPanelHeight: (height: number) => {
        const clampedHeight = Math.min(BOTTOM_PANEL_MAX, Math.max(BOTTOM_PANEL_MIN, height));
        set({ bottomPanelHeight: clampedHeight });
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

      openProblemSearch: () => {
        set({
          isProblemSearchOpen: true,
          // Also expand problem panel if collapsed
          isProblemCollapsed: false,
        });
      },

      closeProblemSearch: () => {
        set({ isProblemSearchOpen: false });
      },

      toggleProblemSearch: () => {
        set((state) => ({
          isProblemSearchOpen: !state.isProblemSearchOpen,
          // Expand problem panel when opening search
          isProblemCollapsed: state.isProblemSearchOpen ? state.isProblemCollapsed : false,
        }));
      },

      setAccordionDefault: (sectionType: AccordionSectionType, isOpen: boolean) => {
        set((state) => ({
          accordionDefaults: {
            ...state.accordionDefaults,
            [sectionType]: isOpen,
          },
        }));
      },

      resetLayout: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: "qa-arena-layout",
      partialize: (state) => ({
        // Persist panel sizes
        panelWidth: state.panelWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        // Persist UI state
        isProblemCollapsed: state.isProblemCollapsed,
        editorFontSize: state.editorFontSize,
        isFocusMode: state.isFocusMode,
        // Persist accordion defaults
        accordionDefaults: state.accordionDefaults,
        // Don't persist: isAIChatOpen, isProblemPeekOpen, activeTab (session-only)
      }),
    }
  )
);
