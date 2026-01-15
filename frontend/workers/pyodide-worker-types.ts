/**
 * Pyodide Web Worker 메시지 타입 정의
 */

// Worker로 보내는 메시지 타입
export type WorkerRequestType =
  | 'init'
  | 'runPython'
  | 'runPytest'
  | 'runMutationTest'
  | 'cleanup';

// Worker에서 받는 응답 타입
export type WorkerResponseType =
  | 'ready'
  | 'initialized'
  | 'result'
  | 'error'
  | 'progress';

// 진행률 단계
export type ProgressStage =
  | 'loading'
  | 'installing'
  | 'executing'
  | 'testing';

// 진행률 정보
export interface ProgressInfo {
  stage: ProgressStage;
  message: string;
  current?: number;
  total?: number;
  percent?: number;
}

// Worker 초기화 요청
export interface InitRequest {
  type: 'init';
  id: string;
}

// Python 코드 실행 요청
export interface RunPythonRequest {
  type: 'runPython';
  id: string;
  payload: {
    code: string;
  };
}

// pytest 실행 요청
export interface RunPytestRequest {
  type: 'runPytest';
  id: string;
  payload: {
    testCode: string;
    targetCode: string;
  };
}

// Mutation Testing 실행 요청
export interface RunMutationTestRequest {
  type: 'runMutationTest';
  id: string;
  payload: {
    testCode: string;
    goldenCode: string;
    buggyImplementations: Array<{
      id: string;
      code: string;
    }>;
  };
}

// 정리 요청
export interface CleanupRequest {
  type: 'cleanup';
  id: string;
}

// Worker 요청 유니온 타입
export type WorkerRequest =
  | InitRequest
  | RunPythonRequest
  | RunPytestRequest
  | RunMutationTestRequest
  | CleanupRequest;

// 초기화 완료 응답
export interface InitializedResponse {
  type: 'initialized';
  id: string;
  payload: {
    version: string;
    loadTime: number;
  };
}

// 준비 완료 응답
export interface ReadyResponse {
  type: 'ready';
}

// 결과 응답
export interface ResultResponse {
  type: 'result';
  id: string;
  payload: {
    success: boolean;
    data: unknown;
    executionTime: number;
  };
}

// 에러 응답
export interface ErrorResponse {
  type: 'error';
  id?: string;
  payload: {
    message: string;
    stack?: string;
  };
}

// 진행률 응답
export interface ProgressResponse {
  type: 'progress';
  id?: string;
  payload: ProgressInfo;
}

// Worker 응답 유니온 타입
export type WorkerResponse =
  | ReadyResponse
  | InitializedResponse
  | ResultResponse
  | ErrorResponse
  | ProgressResponse;

// 코드 실행 결과
export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

// pytest 실행 결과
export interface PytestResult {
  passed: number;
  failed: number;
  errors: number;
  total: number;
  output: string;
  executionTime: number;
  testDetails: Array<{
    name: string;
    status: 'passed' | 'failed' | 'error' | 'skipped';
    duration?: number;
    message?: string;
  }>;
}

// Mutation Testing 결과
export interface MutationTestResult {
  goldenCodePassed: boolean;
  mutantsKilled: number;
  totalMutants: number;
  score: number;
  details: Array<{
    mutantId: string;
    killed: boolean;
    testOutput: string;
    executionTime: number;
  }>;
  totalExecutionTime: number;
  /** Golden 테스트 출력 (실패 시 에러 포함) - M6-2 */
  goldenTestOutput?: string;
}
