/**
 * useHints - 힌트 API 연동 훅 (M5-5)
 *
 * 문제별 힌트 조회 및 레벨 보기 기능을 제공합니다.
 */

import { useCallback, useEffect, useState } from "react";
import { useHintStore, type HintData, type HintLevel } from "@/stores/hintStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const HINTS_ENDPOINT = "/v1/problems";

interface UseHintsOptions {
  /** 문제 ID */
  problemId: number;
  /** 자동으로 힌트 데이터 fetch */
  autoFetch?: boolean;
}

interface UseHintsResult {
  /** 힌트 데이터 */
  hintData: HintData | undefined;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 힌트를 사용할 수 있는지 (문제에 힌트가 있는지) */
  hintsAvailable: boolean;
  /** 특정 레벨 힌트 보기 */
  viewHint: (level: number) => Promise<HintLevel | null>;
  /** 힌트 데이터 새로고침 */
  refresh: () => Promise<void>;
  /** 현재 최대 패널티 */
  maxPenalty: number;
  /** 레벨이 잠겨있는지 확인 */
  isLevelLocked: (level: number) => boolean;
  /** 레벨을 이미 봤는지 확인 */
  isLevelViewed: (level: number) => boolean;
}

export function useHints({ problemId, autoFetch = true }: UseHintsOptions): UseHintsResult {
  const [localLoading, setLocalLoading] = useState(false);
  const [hintsAvailable, setHintsAvailable] = useState(true);

  const {
    hintsCache,
    setHintData,
    addViewedHint,
    setError,
    errorProblems,
    getHintData,
    getMaxPenalty,
    isLevelAvailable,
    isLevelViewed,
  } = useHintStore();

  const hintData = hintsCache[problemId];
  const error = errorProblems[problemId] || null;

  // Fetch hint data from API
  const fetchHints = useCallback(async () => {
    if (!problemId) return;

    setLocalLoading(true);
    setError(problemId, null);

    try {
      const response = await fetch(`${API_BASE}${HINTS_ENDPOINT}/${problemId}/hints`, {
        credentials: "include",
      });

      if (response.status === 404) {
        // 힌트가 없는 문제
        setHintsAvailable(false);
        setLocalLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch hints: ${response.status}`);
      }

      const data = await response.json();
      setHintData(problemId, {
        problemId: data.problem_id,
        availableLevels: data.available_levels,
        viewedLevels: data.viewed_levels,
        hints: Object.fromEntries(
          Object.entries(data.hints || {}).map(([key, value]) => [
            parseInt(key),
            value as HintLevel,
          ])
        ),
      });
      setHintsAvailable(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch hints";
      setError(problemId, message);
      console.error("Error fetching hints:", err);
    } finally {
      setLocalLoading(false);
    }
  }, [problemId, setHintData, setError]);

  // View a hint level
  const viewHint = useCallback(
    async (level: number): Promise<HintLevel | null> => {
      if (!problemId) return null;

      // Check if already viewed
      if (isLevelViewed(problemId, level)) {
        return hintData?.hints[level] || null;
      }

      // Check if level is available
      if (!isLevelAvailable(problemId, level)) {
        setError(problemId, `Level ${level - 1}을 먼저 확인해야 합니다`);
        return null;
      }

      setLocalLoading(true);
      setError(problemId, null);

      try {
        const response = await fetch(`${API_BASE}${HINTS_ENDPOINT}/${problemId}/hints/view`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ level }),
        });

        if (!response.ok) {
          // 401 인증 에러는 특별히 처리
          if (response.status === 401) {
            throw new Error("AUTH_REQUIRED");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to view hint: ${response.status}`);
        }

        const hint: HintLevel = await response.json();
        addViewedHint(problemId, level, hint);
        return hint;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to view hint";
        setError(problemId, message);
        console.error("Error viewing hint:", err);
        return null;
      } finally {
        setLocalLoading(false);
      }
    },
    [problemId, hintData, isLevelViewed, isLevelAvailable, addViewedHint, setError]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && problemId && !hintData) {
      fetchHints();
    }
  }, [autoFetch, problemId, hintData, fetchHints]);

  // Check if level is locked
  const isLevelLocked = useCallback(
    (level: number): boolean => {
      if (level === 1) return false;
      return !isLevelAvailable(problemId, level);
    },
    [problemId, isLevelAvailable]
  );

  // Check if level is viewed
  const isViewed = useCallback(
    (level: number): boolean => {
      return isLevelViewed(problemId, level);
    },
    [problemId, isLevelViewed]
  );

  return {
    hintData,
    isLoading: localLoading,
    error,
    hintsAvailable,
    viewHint,
    refresh: fetchHints,
    maxPenalty: getMaxPenalty(problemId),
    isLevelLocked,
    isLevelViewed: isViewed,
  };
}

/**
 * 힌트 레벨별 라벨과 아이콘
 */
export const HINT_LEVELS = [
  {
    level: 1,
    label: "기본 힌트",
    description: "테스트 방향성",
    icon: "💡",
    penalty: 0,
  },
  {
    level: 2,
    label: "중간 힌트",
    description: "구체적 접근법",
    icon: "📝",
    penalty: 10,
  },
  {
    level: 3,
    label: "강한 힌트",
    description: "코드 예시",
    icon: "🔍",
    penalty: 20,
  },
];
