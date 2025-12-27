/**
 * 에디터 코드 자동 저장 훅
 *
 * 작성 중인 코드를 localStorage에 저장하여 페이지 새로고침 시 복원
 */

import { useEffect, useRef } from "react";

const STORAGE_PREFIX = "qa-arena:draft:";
const DEBOUNCE_DELAY = 1000; // 1초 디바운스

interface DraftData {
  code: string;
  savedAt: number;
}

/**
 * 코드를 localStorage에 저장
 */
function saveDraft(problemSlug: string, code: string): void {
  try {
    const data: DraftData = {
      code,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_PREFIX + problemSlug, JSON.stringify(data));
  } catch (error) {
    // localStorage 용량 초과 등의 에러 무시
    console.warn("Failed to save draft:", error);
  }
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
 */
export function useCodeDraft(
  problemSlug: string | null,
  code: string,
  template: string,
  enabled: boolean = true
): void {
  const lastSavedCodeRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || !problemSlug) return;

    // 코드가 변경되지 않았으면 무시
    if (code === lastSavedCodeRef.current) return;

    // 템플릿과 동일하면 draft 삭제 (저장 공간 절약)
    if (code.trim() === template.trim()) {
      clearDraft(problemSlug);
      lastSavedCodeRef.current = code;
      return;
    }

    // 디바운스 저장
    const timeoutId = setTimeout(() => {
      saveDraft(problemSlug, code);
      lastSavedCodeRef.current = code;
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [problemSlug, code, template, enabled]);
}
