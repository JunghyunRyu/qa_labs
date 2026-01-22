/**
 * useJudge Hook
 *
 * AI Verifier Track용 Judge Engine 훅입니다.
 * Pyodide Worker를 통해 코드 검증을 수행합니다.
 */

import { useCallback, useState } from 'react';
import { usePyodideStore } from '@/stores/pyodideStore';
import type { JudgeResult } from '@/workers/pyodide-worker-types';

interface UseJudgeOptions {
  functionName: string;
  expectedOutputType: string;
  comparisonConfig?: {
    float_epsilon?: number;
    list_order_matters?: boolean;
    case_sensitive?: boolean;
  };
}

export function useJudge(options: UseJudgeOptions) {
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isJudging, setIsJudging] = useState(false);

  const {
    runJudge: storeRunJudge,
    isInitialized,
    isInitializing,
    initialize,
    status,
  } = usePyodideStore();

  const judge = useCallback(async (
    userInput: string,
    buggyCode: string,
    correctCode: string
  ): Promise<JudgeResult> => {
    // Pyodide 초기화 확인
    if (!isInitialized && !isInitializing) {
      await initialize();
    }

    // 초기화 완료 대기
    while (!usePyodideStore.getState()._isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsJudging(true);
    setResult(null);

    try {
      const judgeResult = await storeRunJudge({
        userInput,
        buggyCode,
        correctCode,
        functionName: options.functionName,
        expectedOutputType: options.expectedOutputType,
        comparisonConfig: options.comparisonConfig || {},
      });

      setResult(judgeResult);
      return judgeResult;
    } catch (error) {
      const errorResult: JudgeResult = {
        success: false,
        bugFound: false,
        userInput,
        parsedInput: null,
        actualResult: null,
        expectedResult: null,
        errorType: 'E_RUNTIME',
        errorMessage: error instanceof Error ? error.message : String(error),
        userFriendlyMessage: '검증 중 오류가 발생했습니다.',
        executionTimeMs: 0,
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsJudging(false);
    }
  }, [isInitialized, isInitializing, initialize, storeRunJudge, options]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    judge,
    result,
    isJudging,
    reset,
    isPyodideReady: isInitialized,
    isPyodideLoading: isInitializing || status === 'loading',
  };
}

export default useJudge;
