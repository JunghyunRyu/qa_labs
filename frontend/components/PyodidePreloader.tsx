/**
 * PyodidePreloader
 *
 * 문제 목록 페이지에서 Pyodide를 사전 로딩합니다.
 * 사용자가 문제 상세 페이지로 이동하기 전에 로딩을 시작하여
 * 초기 로딩 시간을 줄입니다.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePyodideStore } from "@/stores/pyodideStore";

interface PyodidePreloaderProps {
  /** 즉시 초기화 시작 여부 (기본값: false - preload만) */
  initializeImmediately?: boolean;
  /** 지연 시간 (ms, 기본값: 1000) - 페이지 로드 후 지연 */
  delay?: number;
}

export default function PyodidePreloader({
  initializeImmediately = false,
  delay = 1000,
}: PyodidePreloaderProps) {
  const { status, preload, initialize } = usePyodideStore();
  const hasStarted = useRef(false);

  useEffect(() => {
    // 이미 시작했거나 로딩/준비 상태면 스킵
    if (hasStarted.current || status !== "idle") {
      return;
    }

    hasStarted.current = true;

    const timer = setTimeout(() => {
      if (initializeImmediately) {
        // 전체 초기화 (Worker 생성 + Pyodide 로드 + pytest 설치)
        initialize().catch((err) => {
          console.warn("Pyodide preload initialization failed:", err);
        });
      } else {
        // Worker만 생성 (가벼운 preload)
        preload();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [status, preload, initialize, initializeImmediately, delay]);

  // 렌더링 없음 - 백그라운드 작업만 수행
  return null;
}
