import { create } from "zustand";
import { persist } from "zustand/middleware";

// Accordion section types for problem panel
export type AccordionSectionType = 'examples' | 'hints' | 'exceptions' | 'function' | 'strategy' | 'other';

// Panel sizing constants
export const BOTTOM_PANEL_MIN = 120;
export const BOTTOM_PANEL_MAX = 500;
export const BOTTOM_PANEL_DEFAULT = 250;
export const BOTTOM_PANEL_EXPANDED = 300; // Height when auto-expanding for results

// Problem panel width constants
export const PANEL_WIDTH_NORMAL = 35;    // 35% - 기본 사이드바 너비
export const PANEL_WIDTH_EXPANDED = 50;  // 50% - 확장 모드 사이드바 너비
export const PANEL_WIDTH_MIN = 22;
export const PANEL_WIDTH_MAX = 55;

// AI Drawer sizing constants
export const AI_DRAWER_MIN = 320;
export const AI_DRAWER_MAX = 800;
export const AI_DRAWER_DEFAULT = 384;

interface LayoutState {
  // Panel state
  panelWidth: number; // Left panel width percentage (22-55)
  isProblemCollapsed: boolean;
  isAIChatOpen: boolean;
  aiDrawerWidth: number; // AI drawer width in pixels (320-800)
  aiChatPrefillMessage: string | null; // M5-2: AI로 보내기 기능용
  aiChatContextReference: string | null; // 참조된 문맥 (인용 카드용)

  // Bottom panel state
  bottomPanelHeight: number; // Bottom panel height in pixels

  // Focus mode (minimizes header, collapses problem panel)
  isFocusMode: boolean;
  isProblemPeekOpen: boolean;  // 확장 모드 (사이드바 확장)
  panelWidthBeforeExpand: number;  // 확장 전 패널 너비 저장

  // Problem search state (session-only)
  isProblemSearchOpen: boolean;

  // Editor focus request (session-only)
  editorFocusRequested: boolean;

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
  setAIDrawerWidth: (width: number) => void;
  setAIChatPrefillMessage: (message: string | null) => void;
  setAIChatContextReference: (reference: string | null) => void;
  openAIChatWithPrefill: (message: string, contextReference?: string) => void; // M5-2: Open AI chat with prefilled message
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
  requestEditorFocus: () => void;
  clearEditorFocusRequest: () => void;
  resetLayout: () => void;
}

const DEFAULT_STATE = {
  panelWidth: PANEL_WIDTH_NORMAL, // 35% problem / 65% code
  isProblemCollapsed: false,
  isAIChatOpen: false,
  aiDrawerWidth: AI_DRAWER_DEFAULT,
  aiChatPrefillMessage: null as string | null,
  aiChatContextReference: null as string | null,
  bottomPanelHeight: BOTTOM_PANEL_DEFAULT,
  isFocusMode: false,
  isProblemPeekOpen: false,  // 확장 모드
  panelWidthBeforeExpand: PANEL_WIDTH_NORMAL,
  isProblemSearchOpen: false,
  editorFocusRequested: false,
  editorFontSize: 14,
  activeTab: "code" as const,
  accordionDefaults: {
    examples: true,      // 예시: 기본 열림
    hints: false,        // 힌트: 기본 닫힘 (스포일러 방지)
    exceptions: true,    // 예외: 기본 열림
    function: true,      // 함수: 기본 열림
    strategy: true,      // 테스트 전략: 기본 열림
    other: true,         // 기타: 기본 열림
  } as Record<AccordionSectionType, boolean>,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setPanelWidth: (width: number) => {
        // Clamp between 22-55% (problem panel takes 22-55%, code takes 45-78%)
        const clampedWidth = Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, width));
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

      setAIDrawerWidth: (width: number) => {
        const clampedWidth = Math.min(AI_DRAWER_MAX, Math.max(AI_DRAWER_MIN, width));
        set({ aiDrawerWidth: clampedWidth });
      },

      setAIChatPrefillMessage: (message: string | null) => {
        set({ aiChatPrefillMessage: message });
      },

      setAIChatContextReference: (reference: string | null) => {
        set({ aiChatContextReference: reference });
      },

      openAIChatWithPrefill: (message: string, contextReference?: string) => {
        set({
          aiChatPrefillMessage: message,
          aiChatContextReference: contextReference || null,
          isAIChatOpen: true,
        });
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
        set((state) => {
          const newExpanded = !state.isProblemPeekOpen;
          if (newExpanded) {
            // 확장 모드로 진입: 현재 너비 저장하고 확장
            return {
              isProblemPeekOpen: true,
              panelWidthBeforeExpand: state.panelWidth,
              panelWidth: PANEL_WIDTH_EXPANDED,
              // 확장 시 문제 패널이 접혀있으면 펼치기
              isProblemCollapsed: false,
            };
          } else {
            // 확장 모드 종료: 이전 너비로 복원
            return {
              isProblemPeekOpen: false,
              panelWidth: state.panelWidthBeforeExpand,
            };
          }
        });
      },

      setIsProblemPeekOpen: (open: boolean) => {
        set((state) => {
          if (open) {
            return {
              isProblemPeekOpen: true,
              panelWidthBeforeExpand: state.panelWidth,
              panelWidth: PANEL_WIDTH_EXPANDED,
              isProblemCollapsed: false,
            };
          } else {
            return {
              isProblemPeekOpen: false,
              panelWidth: state.panelWidthBeforeExpand,
            };
          }
        });
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

      requestEditorFocus: () => {
        set({ editorFocusRequested: true });
      },

      clearEditorFocusRequest: () => {
        set({ editorFocusRequested: false });
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
        aiDrawerWidth: state.aiDrawerWidth,
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
