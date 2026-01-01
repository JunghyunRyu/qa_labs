/**
 * Hint Store (M5-5)
 *
 * 힌트 조회 상태 관리를 위한 Zustand store.
 * - 힌트 캐시 (API 호출 최소화)
 * - 조회한 힌트 레벨 추적
 * - 점수 패널티 계산
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface HintLevel {
  level: number;
  content: string;
  penalty: number;
}

export interface HintData {
  problemId: number;
  availableLevels: number[];
  viewedLevels: number[];
  hints: Record<number, HintLevel>;
}

interface HintState {
  // Cache: problemId -> HintData
  hintsCache: Record<number, HintData>;

  // Loading states
  loadingProblems: Set<number>;

  // Error states
  errorProblems: Record<number, string>;

  // Actions
  setHintData: (problemId: number, data: HintData) => void;
  addViewedHint: (problemId: number, level: number, hint: HintLevel) => void;
  setLoading: (problemId: number, loading: boolean) => void;
  setError: (problemId: number, error: string | null) => void;
  clearCache: (problemId?: number) => void;

  // Computed helpers
  getHintData: (problemId: number) => HintData | undefined;
  getViewedLevels: (problemId: number) => number[];
  getMaxPenalty: (problemId: number) => number;
  isLevelAvailable: (problemId: number, level: number) => boolean;
  isLevelViewed: (problemId: number, level: number) => boolean;
}

// Penalty values for each level
const HINT_PENALTIES: Record<number, number> = {
  1: 0,
  2: 10,
  3: 20,
};

export const useHintStore = create<HintState>()(
  persist(
    (set, get) => ({
      hintsCache: {},
      loadingProblems: new Set(),
      errorProblems: {},

      setHintData: (problemId: number, data: HintData) => {
        set((state) => ({
          hintsCache: {
            ...state.hintsCache,
            [problemId]: data,
          },
          errorProblems: {
            ...state.errorProblems,
            [problemId]: undefined as unknown as string,
          },
        }));
      },

      addViewedHint: (problemId: number, level: number, hint: HintLevel) => {
        set((state) => {
          const existing = state.hintsCache[problemId];
          if (!existing) return state;

          const newViewedLevels = existing.viewedLevels.includes(level)
            ? existing.viewedLevels
            : [...existing.viewedLevels, level].sort((a, b) => a - b);

          // Update available levels (unlock next level)
          const newAvailableLevels = [1];
          for (const lvl of [2, 3]) {
            if (newViewedLevels.includes(lvl - 1)) {
              newAvailableLevels.push(lvl);
            }
          }

          return {
            hintsCache: {
              ...state.hintsCache,
              [problemId]: {
                ...existing,
                viewedLevels: newViewedLevels,
                availableLevels: newAvailableLevels,
                hints: {
                  ...existing.hints,
                  [level]: hint,
                },
              },
            },
          };
        });
      },

      setLoading: (problemId: number, loading: boolean) => {
        set((state) => {
          const newSet = new Set(state.loadingProblems);
          if (loading) {
            newSet.add(problemId);
          } else {
            newSet.delete(problemId);
          }
          return { loadingProblems: newSet };
        });
      },

      setError: (problemId: number, error: string | null) => {
        set((state) => ({
          errorProblems: {
            ...state.errorProblems,
            [problemId]: error as string,
          },
        }));
      },

      clearCache: (problemId?: number) => {
        if (problemId !== undefined) {
          set((state) => {
            const newCache = { ...state.hintsCache };
            delete newCache[problemId];
            return { hintsCache: newCache };
          });
        } else {
          set({ hintsCache: {} });
        }
      },

      // Computed helpers
      getHintData: (problemId: number) => {
        return get().hintsCache[problemId];
      },

      getViewedLevels: (problemId: number) => {
        const data = get().hintsCache[problemId];
        return data?.viewedLevels || [];
      },

      getMaxPenalty: (problemId: number) => {
        const viewedLevels = get().getViewedLevels(problemId);
        if (viewedLevels.length === 0) return 0;
        const maxLevel = Math.max(...viewedLevels);
        return HINT_PENALTIES[maxLevel] || 0;
      },

      isLevelAvailable: (problemId: number, level: number) => {
        const data = get().hintsCache[problemId];
        return data?.availableLevels.includes(level) || level === 1;
      },

      isLevelViewed: (problemId: number, level: number) => {
        const data = get().hintsCache[problemId];
        return data?.viewedLevels.includes(level) || false;
      },
    }),
    {
      name: "qa-arena-hints",
      partialize: (state) => ({
        // Only persist the cache, not loading/error states
        hintsCache: state.hintsCache,
      }),
      // Convert Set to array for serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              loadingProblems: new Set(),
              errorProblems: {},
            },
          };
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
