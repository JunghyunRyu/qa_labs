/**
 * usePyodide Hook
 *
 * Web Worker를 통해 Pyodide Python 런타임을 관리하는 React Hook입니다.
 * 메인 스레드 블로킹 없이 Python 코드를 실행할 수 있습니다.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  WorkerRequest,
  WorkerResponse,
  ProgressInfo,
  CodeExecutionResult,
  PytestResult,
  MutationTestResult,
} from '../workers/pyodide-worker-types';

// Worker 상태 타입
type PyodideStatus = 'idle' | 'loading' | 'ready' | 'executing' | 'error';

// Hook 옵션
interface UsePyodideOptions {
  /** Pyodide 자동 초기화 여부 (기본값: false) */
  autoInit?: boolean;
  /** 진행률 콜백 */
  onProgress?: (info: ProgressInfo) => void;
  /** 에러 콜백 */
  onError?: (error: string) => void;
}

// Hook 반환 타입
interface UsePyodideReturn {
  /** 현재 상태 */
  status: PyodideStatus;
  /** Pyodide 준비 완료 여부 */
  isReady: boolean;
  /** 실행 중 여부 */
  isExecuting: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** Pyodide 버전 */
  version: string | null;
  /** 로딩 시간 (ms) */
  loadTime: number | null;
  /** 현재 진행률 정보 */
  progress: ProgressInfo | null;
  /** Pyodide 초기화 */
  initialize: () => Promise<void>;
  /** Python 코드 실행 */
  runPython: (code: string) => Promise<CodeExecutionResult>;
  /** pytest 실행 */
  runPytest: (testCode: string, targetCode: string) => Promise<PytestResult>;
  /** Mutation Testing 실행 */
  runMutationTest: (
    testCode: string,
    goldenCode: string,
    buggyImplementations: Array<{ id: string; code: string }>
  ) => Promise<MutationTestResult>;
  /** 파일시스템 정리 */
  cleanup: () => Promise<void>;
  /** Worker 재시작 */
  restart: () => void;
}

// 요청 ID 생성
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Pyodide Web Worker를 관리하는 React Hook
 *
 * @example
 * ```tsx
 * const { status, isReady, initialize, runMutationTest } = usePyodide({
 *   onProgress: (info) => console.log(info.message),
 *   onError: (error) => console.error(error),
 * });
 *
 * useEffect(() => {
 *   initialize();
 * }, [initialize]);
 *
 * const handleTest = async () => {
 *   const result = await runMutationTest(testCode, goldenCode, buggyImpls);
 *   console.log(`Score: ${result.score}%`);
 * };
 * ```
 */
export function usePyodide(options: UsePyodideOptions = {}): UsePyodideReturn {
  const { autoInit = false, onProgress, onError } = options;

  // 상태
  const [status, setStatus] = useState<PyodideStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);

  // Refs
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<
    Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>
  >(new Map());
  const isInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);

  // 콜백 refs (Worker 재생성 방지)
  const onProgressRef = useRef(onProgress);
  const onErrorRef = useRef(onError);

  // 콜백 refs 업데이트
  useEffect(() => {
    onProgressRef.current = onProgress;
    onErrorRef.current = onError;
  }, [onProgress, onError]);

  // Worker 생성
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;

    try {
      // public 폴더의 정적 Worker 파일 사용 (Turbopack 번들링 우회)
      const worker = new Worker('/workers/pyodide.worker.js');

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;

        switch (response.type) {
          case 'ready':
            // Worker 준비 완료
            break;

          case 'initialized':
            setStatus('ready');
            setVersion(response.payload.version);
            setLoadTime(response.payload.loadTime);
            isInitializedRef.current = true;
            isInitializingRef.current = false;
            if (response.id) {
              const request = pendingRequestsRef.current.get(response.id);
              if (request) {
                request.resolve(response.payload);
                pendingRequestsRef.current.delete(response.id);
              }
            }
            break;

          case 'result':
            if (response.id) {
              const request = pendingRequestsRef.current.get(response.id);
              if (request) {
                request.resolve(response.payload.data);
                pendingRequestsRef.current.delete(response.id);
              }
            }
            setStatus(isInitializedRef.current ? 'ready' : 'idle');
            break;

          case 'error':
            const errorMessage = response.payload.message;
            setError(errorMessage);
            setStatus('error');
            isInitializingRef.current = false;
            onErrorRef.current?.(errorMessage);
            if (response.id) {
              const request = pendingRequestsRef.current.get(response.id);
              if (request) {
                request.reject(new Error(errorMessage));
                pendingRequestsRef.current.delete(response.id);
              }
            }
            break;

          case 'progress':
            setProgress(response.payload);
            onProgressRef.current?.(response.payload);
            break;
        }
      };

      worker.onerror = (event) => {
        const errorMessage = event.message || 'Worker error occurred';
        setError(errorMessage);
        setStatus('error');
        isInitializingRef.current = false;
        onErrorRef.current?.(errorMessage);
      };

      return worker;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create worker';
      setError(errorMessage);
      setStatus('error');
      onErrorRef.current?.(errorMessage);
      return null;
    }
  }, []); // 빈 의존성 배열 - Worker는 한 번만 생성

  // Worker 초기화
  useEffect(() => {
    workerRef.current = createWorker();

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRequestsRef.current.clear();
    };
  }, [createWorker]);

  // 자동 초기화
  useEffect(() => {
    if (autoInit && workerRef.current && status === 'idle') {
      initialize();
    }
  }, [autoInit, status]);

  // 메시지 전송 헬퍼
  const sendMessage = useCallback(
    <T>(request: WorkerRequest): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not available'));
          return;
        }

        pendingRequestsRef.current.set(request.id, {
          resolve: resolve as (value: unknown) => void,
          reject,
        });

        workerRef.current.postMessage(request);
      });
    },
    []
  );

  // Pyodide 초기화
  const initialize = useCallback(async (): Promise<void> => {
    // 이미 초기화되었거나 초기화 진행 중이면 스킵
    if (isInitializedRef.current || isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setStatus('loading');
    setError(null);

    try {
      const request: WorkerRequest = {
        type: 'init',
        id: generateRequestId(),
      };

      await sendMessage(request);
    } catch (err) {
      isInitializingRef.current = false;
      throw err;
    }
  }, [sendMessage]);

  // Python 코드 실행
  const runPython = useCallback(
    async (code: string): Promise<CodeExecutionResult> => {
      if (!isInitializedRef.current) {
        throw new Error('Pyodide is not initialized');
      }

      setStatus('executing');
      setProgress(null);

      const request: WorkerRequest = {
        type: 'runPython',
        id: generateRequestId(),
        payload: { code },
      };

      const result = await sendMessage<CodeExecutionResult>(request);
      return result;
    },
    [sendMessage]
  );

  // pytest 실행
  const runPytest = useCallback(
    async (testCode: string, targetCode: string): Promise<PytestResult> => {
      if (!isInitializedRef.current) {
        throw new Error('Pyodide is not initialized');
      }

      setStatus('executing');
      setProgress(null);

      const request: WorkerRequest = {
        type: 'runPytest',
        id: generateRequestId(),
        payload: { testCode, targetCode },
      };

      const result = await sendMessage<PytestResult>(request);
      return result;
    },
    [sendMessage]
  );

  // Mutation Testing 실행
  const runMutationTest = useCallback(
    async (
      testCode: string,
      goldenCode: string,
      buggyImplementations: Array<{ id: string; code: string }>
    ): Promise<MutationTestResult> => {
      if (!isInitializedRef.current) {
        throw new Error('Pyodide is not initialized');
      }

      setStatus('executing');
      setProgress(null);

      const request: WorkerRequest = {
        type: 'runMutationTest',
        id: generateRequestId(),
        payload: { testCode, goldenCode, buggyImplementations },
      };

      const result = await sendMessage<MutationTestResult>(request);
      return result;
    },
    [sendMessage]
  );

  // 파일시스템 정리
  const cleanup = useCallback(async (): Promise<void> => {
    const request: WorkerRequest = {
      type: 'cleanup',
      id: generateRequestId(),
    };

    await sendMessage(request);
  }, [sendMessage]);

  // Worker 재시작
  const restart = useCallback(() => {
    workerRef.current?.terminate();
    pendingRequestsRef.current.clear();
    isInitializedRef.current = false;
    isInitializingRef.current = false;

    setStatus('idle');
    setError(null);
    setVersion(null);
    setLoadTime(null);
    setProgress(null);

    workerRef.current = createWorker();
  }, [createWorker]);

  return {
    status,
    isReady: status === 'ready',
    isExecuting: status === 'executing',
    error,
    version,
    loadTime,
    progress,
    initialize,
    runPython,
    runPytest,
    runMutationTest,
    cleanup,
    restart,
  };
}

export type { PyodideStatus, UsePyodideOptions, UsePyodideReturn };
