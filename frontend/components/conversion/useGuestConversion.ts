/**
 * useGuestConversion hook
 * 게스트 상태 관리 + OAuth 리다이렉트 방어
 *
 * 기능:
 * 1. localStorage 미러링 (코드, 점수)
 * 2. OAuth 리다이렉트 방어 (pending_merge 플래그)
 * 3. SSR Hydration 방어
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// localStorage 키
const STORAGE_KEYS = {
  GUEST_CODE: "qa_guest_code",
  GUEST_SCORE: "qa_guest_score",
  GUEST_PROBLEM_ID: "qa_guest_problem_id",
  PENDING_MERGE: "qa_pending_merge",
} as const;

interface GuestData {
  code: string;
  score: number | null;
  problemId: string;
  timestamp: number;
}

interface UseGuestConversionReturn {
  /** 저장된 게스트 코드 */
  guestCode: string | null;
  /** 저장된 게스트 점수 */
  guestScore: number | null;
  /** 저장된 문제 ID */
  guestProblemId: string | null;
  /** 게스트 데이터 저장 */
  saveGuestData: (code: string, problemId: string, score?: number | null) => void;
  /** 게스트 데이터 삭제 */
  clearGuestData: () => void;
  /** 병합 대기 상태 설정 */
  setPendingMerge: (pending: boolean) => void;
  /** 병합 대기 상태 확인 */
  hasPendingMerge: boolean;
  /** 하이드레이션 완료 여부 */
  isHydrated: boolean;
}

export function useGuestConversion(): UseGuestConversionReturn {
  const [guestCode, setGuestCode] = useState<string | null>(null);
  const [guestScore, setGuestScore] = useState<number | null>(null);
  const [guestProblemId, setGuestProblemId] = useState<string | null>(null);
  const [hasPendingMerge, setHasPendingMerge] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // SSR 방어: 클라이언트에서만 localStorage 접근
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const code = localStorage.getItem(STORAGE_KEYS.GUEST_CODE);
      const score = localStorage.getItem(STORAGE_KEYS.GUEST_SCORE);
      const problemId = localStorage.getItem(STORAGE_KEYS.GUEST_PROBLEM_ID);
      const pending = localStorage.getItem(STORAGE_KEYS.PENDING_MERGE);

      setGuestCode(code);
      setGuestScore(score ? parseInt(score, 10) : null);
      setGuestProblemId(problemId);
      setHasPendingMerge(pending === "true");
    } catch (error) {
      console.warn("[useGuestConversion] Failed to read localStorage:", error);
    }

    setIsHydrated(true);
  }, []);

  // 게스트 데이터 저장
  const saveGuestData = useCallback(
    (code: string, problemId: string, score?: number | null) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(STORAGE_KEYS.GUEST_CODE, code);
        localStorage.setItem(STORAGE_KEYS.GUEST_PROBLEM_ID, problemId);
        setGuestCode(code);
        setGuestProblemId(problemId);

        if (score !== undefined && score !== null) {
          localStorage.setItem(STORAGE_KEYS.GUEST_SCORE, score.toString());
          setGuestScore(score);
        }
      } catch (error) {
        console.warn("[useGuestConversion] Failed to save to localStorage:", error);
      }
    },
    []
  );

  // 게스트 데이터 삭제
  const clearGuestData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEYS.GUEST_CODE);
      localStorage.removeItem(STORAGE_KEYS.GUEST_SCORE);
      localStorage.removeItem(STORAGE_KEYS.GUEST_PROBLEM_ID);
      localStorage.removeItem(STORAGE_KEYS.PENDING_MERGE);

      setGuestCode(null);
      setGuestScore(null);
      setGuestProblemId(null);
      setHasPendingMerge(false);
    } catch (error) {
      console.warn("[useGuestConversion] Failed to clear localStorage:", error);
    }
  }, []);

  // 병합 대기 상태 설정
  const setPendingMerge = useCallback((pending: boolean) => {
    if (typeof window === "undefined") return;

    try {
      if (pending) {
        localStorage.setItem(STORAGE_KEYS.PENDING_MERGE, "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.PENDING_MERGE);
      }
      setHasPendingMerge(pending);
    } catch (error) {
      console.warn("[useGuestConversion] Failed to set pending merge:", error);
    }
  }, []);

  return {
    guestCode,
    guestScore,
    guestProblemId,
    saveGuestData,
    clearGuestData,
    setPendingMerge,
    hasPendingMerge,
    isHydrated,
  };
}

export default useGuestConversion;
