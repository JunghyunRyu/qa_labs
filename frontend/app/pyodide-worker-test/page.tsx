'use client';

/**
 * Pyodide Web Worker 통합 테스트 페이지
 *
 * useCodeRunner Hook을 사용하여 Web Worker 기반 Python 실행을 테스트합니다.
 */

import { useState } from 'react';
import { useCodeRunner } from '@/hooks/useCodeRunner';
import { ALL_TEST_PROBLEMS, type TestProblem } from '@/lib/pyodide/test-problems';
import type { ProgressInfo } from '@/workers/pyodide-worker-types';

export default function PyodideWorkerTestPage() {
  const [selectedProblem, setSelectedProblem] = useState<TestProblem>(ALL_TEST_PROBLEMS[0]);
  const [testResults, setTestResults] = useState<
    Array<{
      problemId: string;
      title: string;
      score: number;
      mutantsKilled: number;
      totalMutants: number;
      executionTime: number;
      error?: string;
    }>
  >([]);
  const [progressLog, setProgressLog] = useState<string[]>([]);

  // useCodeRunner Hook 사용
  const {
    isInitializing,
    isReady,
    isRunning,
    error,
    pyodideVersion,
    progress,
    lastResult,
    runMutationTest,
    initialize,
    restart,
  } = useCodeRunner({
    autoInit: false,
    onProgress: (info: ProgressInfo) => {
      const logMessage = `[${info.stage}] ${info.message}${
        info.percent !== undefined ? ` (${info.percent}%)` : ''
      }`;
      setProgressLog((prev) => [...prev, logMessage]);
    },
    onComplete: (result) => {
      setProgressLog((prev) => [
        ...prev,
        `[완료] 점수: ${result.score}%, 죽인 mutants: ${result.mutantsKilled}/${result.totalMutants}`,
      ]);
    },
    onError: (errorMsg) => {
      setProgressLog((prev) => [...prev, `[에러] ${errorMsg}`]);
    },
  });

  // Pyodide 초기화
  const handleInit = async () => {
    setProgressLog(['Pyodide 초기화 시작...']);
    try {
      await initialize();
      setProgressLog((prev) => [...prev, 'Pyodide 초기화 완료!']);
    } catch (err) {
      setProgressLog((prev) => [
        ...prev,
        `초기화 실패: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    }
  };

  // 단일 문제 테스트
  const handleRunTest = async () => {
    setProgressLog((prev) => [...prev, `\n--- ${selectedProblem.title} 테스트 시작 ---`]);

    const result = await runMutationTest(
      selectedProblem.testCode,
      selectedProblem.goldenCode,
      selectedProblem.buggyImplementations
    );

    setTestResults((prev) => [
      ...prev,
      {
        problemId: selectedProblem.id,
        title: selectedProblem.title,
        score: result.score,
        mutantsKilled: result.mutantsKilled,
        totalMutants: result.totalMutants,
        executionTime: result.executionTime,
        error: result.error,
      },
    ]);
  };

  // 전체 문제 테스트
  const handleRunAllTests = async () => {
    setTestResults([]);
    setProgressLog(['=== 전체 문제 테스트 시작 ===\n']);

    for (const problem of ALL_TEST_PROBLEMS) {
      setProgressLog((prev) => [...prev, `\n--- ${problem.title} ---`]);

      const result = await runMutationTest(
        problem.testCode,
        problem.goldenCode,
        problem.buggyImplementations
      );

      setTestResults((prev) => [
        ...prev,
        {
          problemId: problem.id,
          title: problem.title,
          score: result.score,
          mutantsKilled: result.mutantsKilled,
          totalMutants: result.totalMutants,
          executionTime: result.executionTime,
          error: result.error,
        },
      ]);
    }

    setProgressLog((prev) => [...prev, '\n=== 전체 테스트 완료 ===']);
  };

  // 결과 초기화
  const handleClear = () => {
    setTestResults([]);
    setProgressLog([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Pyodide Web Worker 통합 테스트</h1>

      {/* 상태 패널 */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Worker 상태</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-600 dark:text-gray-400">상태:</span>
            <span
              className={`ml-2 font-medium ${
                isReady
                  ? 'text-green-600'
                  : isInitializing
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}
            >
              {isInitializing ? '초기화 중...' : isReady ? '준비됨' : '대기'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">버전:</span>
            <span className="ml-2">{pyodideVersion || '-'}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">실행 중:</span>
            <span className={`ml-2 ${isRunning ? 'text-blue-600' : ''}`}>
              {isRunning ? '예' : '아니오'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">에러:</span>
            <span className={`ml-2 ${error ? 'text-red-600' : ''}`}>{error || '없음'}</span>
          </div>
        </div>

        {/* 진행률 바 */}
        {progress && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{progress.message}</span>
              {progress.percent !== undefined && <span>{progress.percent}%</span>}
            </div>
            {progress.percent !== undefined && (
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 컨트롤 패널 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleInit}
          disabled={isInitializing || isReady}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInitializing ? '초기화 중...' : isReady ? '초기화됨' : 'Pyodide 초기화'}
        </button>

        <select
          value={selectedProblem.id}
          onChange={(e) => {
            const problem = ALL_TEST_PROBLEMS.find((p) => p.id === e.target.value);
            if (problem) setSelectedProblem(problem);
          }}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          {ALL_TEST_PROBLEMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.difficulty})
            </option>
          ))}
        </select>

        <button
          onClick={handleRunTest}
          disabled={!isReady || isRunning}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? '실행 중...' : '선택 문제 테스트'}
        </button>

        <button
          onClick={handleRunAllTests}
          disabled={!isReady || isRunning}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          전체 문제 테스트
        </button>

        <button
          onClick={restart}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Worker 재시작
        </button>

        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          결과 초기화
        </button>
      </div>

      {/* 결과 테이블 */}
      {testResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">테스트 결과</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                    문제
                  </th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                    점수
                  </th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                    Mutants Killed
                  </th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                    실행 시간
                  </th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {result.title}
                    </td>
                    <td
                      className={`border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold ${
                        result.score === 100
                          ? 'text-green-600'
                          : result.score > 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {result.score}%
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                      {result.mutantsKilled}/{result.totalMutants}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                      {result.executionTime.toFixed(0)}ms
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                      {result.error ? (
                        <span className="text-red-600" title={result.error}>
                          에러
                        </span>
                      ) : result.score === 100 ? (
                        <span className="text-green-600">통과</span>
                      ) : (
                        <span className="text-yellow-600">부분 통과</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 요약 */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p>
              <strong>전체 테스트:</strong> {testResults.length}개
            </p>
            <p>
              <strong>평균 점수:</strong>{' '}
              {(testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length).toFixed(1)}%
            </p>
            <p>
              <strong>평균 실행 시간:</strong>{' '}
              {(
                testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length
              ).toFixed(0)}
              ms
            </p>
          </div>
        </div>
      )}

      {/* 진행 로그 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">진행 로그</h2>
        <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto">
          {progressLog.length === 0 ? (
            <p className="text-gray-500">로그가 없습니다. Pyodide를 초기화하세요.</p>
          ) : (
            progressLog.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 마지막 결과 상세 */}
      {lastResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">마지막 실행 상세</h2>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p>
              <strong>Golden Code 테스트:</strong>{' '}
              {lastResult.goldenCodePassed ? (
                <span className="text-green-600">통과</span>
              ) : (
                <span className="text-red-600">실패</span>
              )}
            </p>
            <p>
              <strong>점수:</strong> {lastResult.score}%
            </p>
            <p>
              <strong>Mutants:</strong> {lastResult.mutantsKilled}/{lastResult.totalMutants} killed
            </p>
            <p>
              <strong>실행 시간:</strong> {lastResult.executionTime.toFixed(0)}ms
            </p>

            {lastResult.details.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Mutant 상세:</h3>
                <ul className="list-disc list-inside">
                  {lastResult.details.map((detail, index) => (
                    <li key={index}>
                      <span className="font-mono">{detail.mutantId}</span>:{' '}
                      {detail.killed ? (
                        <span className="text-green-600">killed</span>
                      ) : (
                        <span className="text-red-600">survived</span>
                      )}{' '}
                      ({detail.executionTime.toFixed(0)}ms)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
