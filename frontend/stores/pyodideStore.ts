/**
 * Pyodide Store
 *
 * Pyodide Worker를 앱 전역에서 싱글톤으로 관리하여
 * 페이지 이동 시에도 초기화 상태를 유지합니다.
 */

import { create } from "zustand";
import type {
  WorkerRequest,
  WorkerResponse,
  ProgressInfo,
  MutationTestResult,
  PytestResult,
} from "../workers/pyodide-worker-types";

type PyodideStatus = "idle" | "loading" | "ready" | "executing" | "error";

interface PyodideState {
  // State
  status: PyodideStatus;
  error: string | null;
  version: string | null;
  loadTime: number | null;
  progress: ProgressInfo | null;

  // Internal refs (not reactive)
  _worker: Worker | null;
  _pendingRequests: Map<
    string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >;
  _isInitialized: boolean;
  _isInitializing: boolean;

  // Actions
  initialize: () => Promise<void>;
  runMutationTest: (
    testCode: string,
    goldenCode: string,
    buggyImplementations: Array<{ id: string; code: string }>
  ) => Promise<MutationTestResult>;
  runTests: (testCode: string, targetCode: string) => Promise<PytestResult>;
  cleanup: () => Promise<void>;
  restart: () => void;
  preload: () => void;
}

// 실행 타임아웃 (6초 - Worker 내부 타임아웃보다 1초 여유)
const EXECUTION_TIMEOUT_MS = 6000;

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const usePyodideStore = create<PyodideState>()((set, get) => {
  // Worker 생성 함수
  const createWorker = (): Worker | null => {
    if (typeof window === "undefined") return null;

    try {
      // M6-2: Using v2 worker file to bypass cache
      const worker = new Worker("/workers/pyodide.worker.v2.js");

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        const state = get();

        switch (response.type) {
          case "ready":
            // Worker 준비 완료
            break;

          case "initialized":
            set({
              status: "ready",
              version: response.payload.version,
              loadTime: response.payload.loadTime,
              _isInitialized: true,
              _isInitializing: false,
            });
            if (response.id) {
              const request = state._pendingRequests.get(response.id);
              if (request) {
                request.resolve(response.payload);
                state._pendingRequests.delete(response.id);
              }
            }
            break;

          case "result":
            if (response.id) {
              const request = state._pendingRequests.get(response.id);
              if (request) {
                request.resolve(response.payload.data);
                state._pendingRequests.delete(response.id);
              }
            }
            set({ status: state._isInitialized ? "ready" : "idle" });
            break;

          case "error":
            const errorMessage = response.payload.message;
            set({
              error: errorMessage,
              status: "error",
              _isInitializing: false,
            });
            if (response.id) {
              const request = state._pendingRequests.get(response.id);
              if (request) {
                request.reject(new Error(errorMessage));
                state._pendingRequests.delete(response.id);
              }
            }
            break;

          case "progress":
            set({ progress: response.payload });
            break;
        }
      };

      worker.onerror = (event) => {
        const errorMessage = event.message || "Worker error occurred";
        set({
          error: errorMessage,
          status: "error",
          _isInitializing: false,
        });
      };

      return worker;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create worker";
      set({ error: errorMessage, status: "error" });
      return null;
    }
  };

  // 메시지 전송 헬퍼 (타임아웃 포함)
  const sendMessage = <T>(
    request: WorkerRequest,
    timeoutMs?: number
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const state = get();
      if (!state._worker) {
        reject(new Error("Worker not available"));
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      // 타임아웃 설정 (실행 요청인 경우에만)
      if (
        timeoutMs &&
        (request.type === "runMutationTest" || request.type === "runPytest")
      ) {
        timeoutId = setTimeout(() => {
          // pending request 제거
          state._pendingRequests.delete(request.id);
          // Worker 강제 종료 및 재생성
          get().restart();
          reject(
            new Error(
              `실행 시간 초과 (${timeoutMs / 1000}초). 무한 루프나 과도한 연산이 있는지 확인해주세요.`
            )
          );
        }, timeoutMs);
      }

      // 원래의 resolve/reject를 감싸서 타임아웃을 클리어
      const wrappedResolve = (value: unknown) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(value as T);
      };

      const wrappedReject = (error: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      };

      state._pendingRequests.set(request.id, {
        resolve: wrappedResolve,
        reject: wrappedReject,
      });

      state._worker.postMessage(request);
    });
  };

  return {
    // Initial state
    status: "idle",
    error: null,
    version: null,
    loadTime: null,
    progress: null,
    _worker: null,
    _pendingRequests: new Map(),
    _isInitialized: false,
    _isInitializing: false,

    // Preload - Worker만 생성 (초기화는 나중에)
    preload: () => {
      const state = get();
      if (!state._worker && typeof window !== "undefined") {
        const worker = createWorker();
        set({ _worker: worker });
      }
    },

    // Initialize Pyodide
    initialize: async () => {
      const state = get();

      // 이미 초기화되었거나 진행 중이면 스킵
      if (state._isInitialized || state._isInitializing) {
        return;
      }

      // Worker가 없으면 생성
      if (!state._worker) {
        const worker = createWorker();
        set({ _worker: worker });
      }

      set({ _isInitializing: true, status: "loading", error: null });

      try {
        const request: WorkerRequest = {
          type: "init",
          id: generateRequestId(),
        };

        await sendMessage(request);
      } catch (err) {
        set({ _isInitializing: false });
        throw err;
      }
    },

    // Run Mutation Test (타임아웃 적용)
    runMutationTest: async (testCode, goldenCode, buggyImplementations) => {
      const state = get();

      if (!state._isInitialized) {
        throw new Error("Pyodide is not initialized");
      }

      set({ status: "executing", progress: null });

      const request: WorkerRequest = {
        type: "runMutationTest",
        id: generateRequestId(),
        payload: { testCode, goldenCode, buggyImplementations },
      };

      return await sendMessage<MutationTestResult>(request, EXECUTION_TIMEOUT_MS);
    },

    // Run pytest (타임아웃 적용)
    runTests: async (testCode, targetCode) => {
      const state = get();

      if (!state._isInitialized) {
        throw new Error("Pyodide is not initialized");
      }

      set({ status: "executing", progress: null });

      const request: WorkerRequest = {
        type: "runPytest",
        id: generateRequestId(),
        payload: { testCode, targetCode },
      };

      return await sendMessage<PytestResult>(request, EXECUTION_TIMEOUT_MS);
    },

    // Cleanup
    cleanup: async () => {
      const request: WorkerRequest = {
        type: "cleanup",
        id: generateRequestId(),
      };

      await sendMessage(request);
    },

    // Restart Worker
    restart: () => {
      const state = get();

      state._worker?.terminate();
      state._pendingRequests.clear();

      const worker = createWorker();

      set({
        _worker: worker,
        _isInitialized: false,
        _isInitializing: false,
        status: "idle",
        error: null,
        version: null,
        loadTime: null,
        progress: null,
      });
    },
  };
});

// Derived selectors
export const selectPyodideIsReady = (state: PyodideState) =>
  state.status === "ready";
export const selectPyodideIsExecuting = (state: PyodideState) =>
  state.status === "executing";
export const selectPyodideIsLoading = (state: PyodideState) =>
  state.status === "loading";
