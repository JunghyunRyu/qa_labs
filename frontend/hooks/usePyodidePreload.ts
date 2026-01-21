/**
 * usePyodidePreload Hook
 *
 * 문제 페이지 진입 시 백그라운드에서 Pyodide를 미리 초기화합니다.
 * 사용자가 "로컬 테스트" 버튼을 클릭할 때 즉시 실행할 수 있도록 준비합니다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WorkerResponse, ProgressInfo } from '../workers/pyodide-worker-types';

export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PyodidePreloadState {
  status: PreloadStatus;
  progress: number;        // 0-100
  progressMessage?: string;
  loadTime?: number;       // ms
  version?: string;
  error?: string;
}

export interface UsePyodidePreloadReturn extends PyodidePreloadState {
  worker: Worker | null;
  initialize: () => void;
  terminate: () => void;
}

/**
 * Pyodide를 백그라운드에서 미리 로드하는 Hook
 *
 * @example
 * \ */
export function usePyodidePreload(): UsePyodidePreloadReturn {
  const [state, setState] = useState<PyodidePreloadState>({
    status: 'idle',
    progress: 0,
  });

  const workerRef = useRef<Worker | null>(null);
  const initStartedRef = useRef(false);

  // Worker 메시지 핸들러
  const handleWorkerMessage = useCallback((event: MessageEvent<WorkerResponse>) => {
    const response = event.data;

    switch (response.type) {
      case 'progress':
        const info = response.payload as ProgressInfo;
        setState((prev) => ({
          ...prev,
          progress: info.percent || 0,
          progressMessage: info.message,
        }));
        break;

      case 'initialized':
        setState({
          status: 'ready',
          progress: 100,
          loadTime: response.payload.loadTime,
          version: response.payload.version,
        });
        break;

      case 'error':
        setState({
          status: 'error',
          progress: 0,
          error: response.payload.message,
        });
        break;

      case 'ready':
        // Worker 준비 완료 - 초기화 시작
        break;

      default:
        break;
    }
  }, []);

  // Worker 에러 핸들러
  const handleWorkerError = useCallback((event: ErrorEvent) => {
    const errorMessage = event.message || 'Worker 에러 발생';
    setState({
      status: 'error',
      progress: 0,
      error: errorMessage,
    });
  }, []);

  // 초기화 함수
  const initialize = useCallback(() => {
    if (initStartedRef.current || workerRef.current) return;

    try {
      setState((prev) => ({ ...prev, status: 'loading', progress: 0 }));

      // Worker 생성
      const worker = new Worker('/workers/pyodide.worker.js');
      worker.onmessage = handleWorkerMessage;
      worker.onerror = handleWorkerError;

      workerRef.current = worker;
      initStartedRef.current = true;

      // 초기화 메시지 전송
      worker.postMessage({
        type: 'init',
        id: \,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Worker 생성 실패';
      setState({
        status: 'error',
        progress: 0,
        error: errorMessage,
      });
    }
  }, [handleWorkerMessage, handleWorkerError]);

  // Worker 종료 함수
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      initStartedRef.current = false;
      setState({
        status: 'idle',
        progress: 0,
      });
    }
  }, []);

  // 컴포넌트 언마운트 시 Worker 정리
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    worker: workerRef.current,
    initialize,
    terminate,
  };
}
