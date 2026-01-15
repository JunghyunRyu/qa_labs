/**
 * useCodeRunner Hook
 *
 * QA Arena 문제 풀이를 위한 고수준 코드 실행 Hook입니다.
 * 전역 PyodideStore를 기반으로 Mutation Testing에 특화된 API를 제공합니다.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePyodideStore } from '../stores/pyodideStore';
import type { ProgressInfo, MutationTestResult, PytestResult } from '../workers/pyodide-worker-types';

// 실행 결과 타입
interface TestRunResult {
  /** 테스트 성공 여부 */
  success: boolean;
  /** 점수 (0-100) */
  score: number;
  /** 죽인 mutant 수 */
  mutantsKilled: number;
  /** 전체 mutant 수 */
  totalMutants: number;
  /** Golden Code 테스트 통과 여부 */
  goldenCodePassed: boolean;
  /** 상세 결과 */
  details: MutationTestResult['details'];
  /** 총 실행 시간 (ms) */
  executionTime: number;
  /** 에러 메시지 (실패 시) */
  error?: string;
  /** M6-2: Golden 테스트 출력 (실패 시 에러 포함) */
  goldenTestOutput?: string;
}

// Hook 옵션
interface UseCodeRunnerOptions {
  /** 자동 초기화 여부 (기본값: true) */
  autoInit?: boolean;
  /** 진행률 콜백 */
  onProgress?: (info: ProgressInfo) => void;
  /** 실행 시작 콜백 */
  onStart?: () => void;
  /** 실행 완료 콜백 */
  onComplete?: (result: TestRunResult) => void;
  /** 에러 콜백 */
  onError?: (error: string) => void;
}

// Hook 반환 타입
interface UseCodeRunnerReturn {
  /** Pyodide 초기화 중 여부 */
  isInitializing: boolean;
  /** Pyodide 준비 완료 여부 */
  isReady: boolean;
  /** 테스트 실행 중 여부 */
  isRunning: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** Pyodide 버전 */
  pyodideVersion: string | null;
  /** 현재 진행률 정보 */
  progress: ProgressInfo | null;
  /** 마지막 실행 결과 */
  lastResult: TestRunResult | null;
  /** Mutation Testing 실행 */
  runMutationTest: (
    testCode: string,
    goldenCode: string,
    buggyImplementations: Array<{ id: string; code: string }>
  ) => Promise<TestRunResult>;
  /** pytest 실행 (단순 테스트용) */
  runTests: (testCode: string, targetCode: string) => Promise<PytestResult>;
  /** 수동 초기화 */
  initialize: () => Promise<void>;
  /** 재시작 */
  restart: () => void;
  /** 결과 초기화 */
  clearResult: () => void;
}

/**
 * QA Arena 문제 풀이용 코드 실행 Hook
 *
 * @example
 * ```tsx
 * const { isReady, isRunning, progress, lastResult, runMutationTest } = useCodeRunner({
 *   onComplete: (result) => {
 *     console.log(`테스트 완료: ${result.score}점`);
 *   },
 * });
 *
 * const handleSubmit = async () => {
 *   const result = await runMutationTest(testCode, goldenCode, buggyImpls);
 *   // 결과 처리...
 * };
 * ```
 */
export function useCodeRunner(options: UseCodeRunnerOptions = {}): UseCodeRunnerReturn {
  const {
    autoInit = true,
    onProgress,
    onStart,
    onComplete,
    onError,
  } = options;

  // 상태
  const [lastResult, setLastResult] = useState<TestRunResult | null>(null);

  // 콜백 refs
  const onProgressRef = useRef(onProgress);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onErrorRef.current = onError;
  }, [onProgress, onError]);

  // 전역 Pyodide store 사용
  const {
    status,
    error,
    version,
    progress,
    initialize: pyodideInit,
    runTests: pyodideRunTests,
    runMutationTest: pyodideRunMutationTest,
    restart: pyodideRestart,
  } = usePyodideStore();

  // 파생 상태
  const isReady = status === 'ready';
  const isInitializing = status === 'loading';
  const isRunning = status === 'executing';

  // 자동 초기화
  useEffect(() => {
    if (autoInit && status === 'idle') {
      pyodideInit().catch((err) => {
        onErrorRef.current?.(err instanceof Error ? err.message : 'Initialization failed');
      });
    }
  }, [autoInit, status, pyodideInit]);

  // 진행률 콜백 처리
  useEffect(() => {
    if (progress) {
      onProgressRef.current?.(progress);
    }
  }, [progress]);

  // 에러 콜백 처리
  useEffect(() => {
    if (error) {
      onErrorRef.current?.(error);
    }
  }, [error]);

  // Mutation Testing 실행
  const runMutationTest = useCallback(
    async (
      testCode: string,
      goldenCode: string,
      buggyImplementations: Array<{ id: string; code: string }>
    ): Promise<TestRunResult> => {
      onStart?.();

      try {
        const result = await pyodideRunMutationTest(
          testCode,
          goldenCode,
          buggyImplementations
        );

        // M6-2 Debug: Log result from pyodide
        console.log('[M6-2 DEBUG] pyodide result:', result);
        console.log('[M6-2 DEBUG] pyodide goldenTestOutput:', result.goldenTestOutput);

        const testRunResult: TestRunResult = {
          success: result.goldenCodePassed,
          score: result.score,
          mutantsKilled: result.mutantsKilled,
          totalMutants: result.totalMutants,
          goldenCodePassed: result.goldenCodePassed,
          details: result.details,
          executionTime: result.totalExecutionTime,
          // M6-2: Golden 테스트 출력 (에러 힌트용)
          goldenTestOutput: result.goldenTestOutput,
        };

        setLastResult(testRunResult);
        onComplete?.(testRunResult);

        return testRunResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorResult: TestRunResult = {
          success: false,
          score: 0,
          mutantsKilled: 0,
          totalMutants: buggyImplementations.length,
          goldenCodePassed: false,
          details: [],
          executionTime: 0,
          error: errorMessage,
        };

        setLastResult(errorResult);
        onErrorRef.current?.(errorMessage);

        return errorResult;
      }
    },
    [pyodideRunMutationTest, onStart, onComplete]
  );

  // pytest 실행 (단순 테스트)
  const runTests = useCallback(
    async (testCode: string, targetCode: string): Promise<PytestResult> => {
      onStart?.();

      try {
        const result = await pyodideRunTests(testCode, targetCode);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        onErrorRef.current?.(errorMessage);
        throw err;
      }
    },
    [pyodideRunTests, onStart]
  );

  // 결과 초기화
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  // 재시작
  const restart = useCallback(() => {
    setLastResult(null);
    pyodideRestart();
  }, [pyodideRestart]);

  return {
    isInitializing,
    isReady,
    isRunning,
    error,
    pyodideVersion: version,
    progress,
    lastResult,
    runMutationTest,
    runTests,
    initialize: pyodideInit,
    restart,
    clearResult,
  };
}

export type { TestRunResult, UseCodeRunnerOptions, UseCodeRunnerReturn };
