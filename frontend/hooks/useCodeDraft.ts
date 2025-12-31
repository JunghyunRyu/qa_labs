/**
 * 에디터 코드 자동 저장 훅
 *
 * 작성 중인 코드를 localStorage에 저장하여 페이지 새로고침 시 복원
 */

import { useEffect, useRef, useState, useCallback } from "react";

const STORAGE_PREFIX = "qa-arena:draft:";
const DEBOUNCE_DELAY = 1000; // 1초 디바운스

/** 저장 상태 */
export type SaveStatus = "saved" | "saving" | "modified";

interface DraftData {
  code: string;
  savedAt: number;
}

interface UseCodeDraftResult {
  /** 현재 저장 상태 */
  status: SaveStatus;
  /** 마지막 저장 시간 (timestamp) */
  lastSavedAt: number | null;
  /** 수동 저장 (Ctrl+S) */
  saveNow: () => void;
  /** 복구된 draft가 있었는지 */
  wasRecovered: boolean;
  /** 복구 알림 확인 처리 */
  dismissRecovery: () => void;
}

/**
 * 코드를 localStorage에 저장
 */
function saveDraft(problemSlug: string, code: string): number {
  const savedAt = Date.now();
  try {
    const data: DraftData = {
      code,
      savedAt,
    };
    localStorage.setItem(STORAGE_PREFIX + problemSlug, JSON.stringify(data));
  } catch (error) {
    // localStorage 용량 초과 등의 에러 무시
    console.warn("Failed to save draft:", error);
  }
  return savedAt;
}

/**
 * localStorage에서 저장된 코드 로드
 */
export function loadDraft(problemSlug: string): string | null {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + problemSlug);
    if (!data) return null;

    const parsed = JSON.parse(data) as DraftData;
    return parsed.code;
  } catch (error) {
    console.warn("Failed to load draft:", error);
    return null;
  }
}

/**
 * localStorage에서 저장된 데이터 로드 (메타데이터 포함)
 */
export function loadDraftWithMeta(problemSlug: string): DraftData | null {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + problemSlug);
    if (!data) return null;

    return JSON.parse(data) as DraftData;
  } catch (error) {
    console.warn("Failed to load draft:", error);
    return null;
  }
}

/**
 * localStorage에서 저장된 코드 삭제
 */
export function clearDraft(problemSlug: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + problemSlug);
  } catch (error) {
    console.warn("Failed to clear draft:", error);
  }
}

/**
 * 저장된 draft가 있는지 확인
 */
export function hasDraft(problemSlug: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + problemSlug) !== null;
  } catch {
    return false;
  }
}

/**
 * 코드 자동 저장 훅
 *
 * @param problemSlug - 문제 slug (저장 키로 사용)
 * @param code - 현재 에디터의 코드
 * @param template - 기본 템플릿 (템플릿과 동일하면 저장하지 않음)
 * @param enabled - 자동 저장 활성화 여부
 * @returns 저장 상태 및 관련 함수들
 */
export function useCodeDraft(
  problemSlug: string | null,
  code: string,
  template: string,
  enabled: boolean = true
): UseCodeDraftResult {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [wasRecovered, setWasRecovered] = useState(false);

  const lastSavedCodeRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);

  // 초기 로드 시 복구 여부 확인
  useEffect(() => {
    if (!problemSlug || initialLoadDoneRef.current) return;

    const draftData = loadDraftWithMeta(problemSlug);
    if (draftData && draftData.code.trim() !== template.trim()) {
      setWasRecovered(true);
      setLastSavedAt(draftData.savedAt);
    }
    initialLoadDoneRef.current = true;
  }, [problemSlug, template]);

  // problemSlug 변경 시 초기화
  useEffect(() => {
    initialLoadDoneRef.current = false;
    setWasRecovered(false);
    setStatus("saved");
    lastSavedCodeRef.current = "";
  }, [problemSlug]);

  // 수동 저장 함수
  const saveNow = useCallback(() => {
    if (!problemSlug || !enabled) return;

    // 템플릿과 동일하면 draft 삭제
    if (code.trim() === template.trim()) {
      clearDraft(problemSlug);
      setStatus("saved");
      lastSavedCodeRef.current = code;
      return;
    }

    // 즉시 저장
    setStatus("saving");
    const savedAt = saveDraft(problemSlug, code);
    lastSavedCodeRef.current = code;
    setLastSavedAt(savedAt);

    // 짧은 딜레이 후 saved 상태로 변경 (사용자가 "저장 중..." 을 볼 수 있도록)
    setTimeout(() => {
      setStatus("saved");
    }, 200);
  }, [problemSlug, code, template, enabled]);

  // 복구 알림 dismiss
  const dismissRecovery = useCallback(() => {
    setWasRecovered(false);
  }, []);

  // 자동 저장 (디바운스)
  useEffect(() => {
    if (!enabled || !problemSlug) return;

    // 코드가 변경되지 않았으면 무시
    if (code === lastSavedCodeRef.current) return;

    // 변경됨 상태로 설정
    setStatus("modified");

    // 템플릿과 동일하면 draft 삭제 (저장 공간 절약)
    if (code.trim() === template.trim()) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearDraft(problemSlug);
      lastSavedCodeRef.current = code;
      setStatus("saved");
      return;
    }

    // 기존 타이머 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 디바운스 저장
    timeoutRef.current = setTimeout(() => {
      setStatus("saving");
      const savedAt = saveDraft(problemSlug, code);
      lastSavedCodeRef.current = code;
      setLastSavedAt(savedAt);

      // 짧은 딜레이 후 saved 상태로 변경
      setTimeout(() => {
        setStatus("saved");
      }, 200);
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [problemSlug, code, template, enabled]);

  return {
    status,
    lastSavedAt,
    saveNow,
    wasRecovered,
    dismissRecovery,
  };
}
