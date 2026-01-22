'use client';

/**
 * JudgeResultDisplay Component
 *
 * 검증 결과를 표시하는 컴포넌트입니다.
 * - 버그 발견 시 폭죽 효과
 * - 실패 시 흔들림 효과
 * - 상세 결과 표시
 */

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { JudgeResult } from '@/workers/pyodide-worker-types';

interface JudgeResultDisplayProps {
  result: JudgeResult | null;
  onPointsEarned?: (points: number) => void;
}

export default function JudgeResultDisplay({
  result,
  onPointsEarned,
}: JudgeResultDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredEffect = useRef(false);

  useEffect(() => {
    if (!result || hasTriggeredEffect.current) return;

    if (result.bugFound) {
      // 버그 발견 시 폭죽 효과
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'],
      });
      onPointsEarned?.(100);
      hasTriggeredEffect.current = true;
    } else if (result.success && !result.bugFound) {
      // 실패 시 흔들림 효과
      containerRef.current?.classList.add('animate-shake');
      setTimeout(() => {
        containerRef.current?.classList.remove('animate-shake');
      }, 500);
      hasTriggeredEffect.current = true;
    }
  }, [result, onPointsEarned]);

  // result가 바뀌면 효과 리셋
  useEffect(() => {
    hasTriggeredEffect.current = false;
  }, [result?.userInput]);

  if (!result) return null;

  return (
    <div
      ref={containerRef}
      className="p-4 border-t border-gray-700 bg-gray-800/50"
    >
      {/* 에러 발생 */}
      {result.errorType && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400 text-xl">❌</span>
            <p className="text-red-400 font-bold">에러 발생</p>
            <span className="text-xs bg-red-800 text-red-200 px-2 py-0.5 rounded">
              {result.errorType}
            </span>
          </div>
          <p className="text-red-300 text-sm">
            {result.userFriendlyMessage || result.errorMessage}
          </p>
        </div>
      )}

      {/* 버그 발견 (성공) */}
      {result.success && result.bugFound && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🎉</span>
            <p className="text-green-400 text-2xl font-bold">버그 발견! 승리!</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-16 shrink-0">입력값:</span>
              <code className="bg-gray-800 text-white px-2 py-1 rounded break-all">
                {result.userInput}
              </code>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-16 shrink-0">AI 결과:</span>
              <code className="bg-red-900/50 text-red-300 px-2 py-1 rounded break-all">
                {String(result.actualResult)}
              </code>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-16 shrink-0">정답:</span>
              <code className="bg-green-900/50 text-green-300 px-2 py-1 rounded break-all">
                {String(result.expectedResult)}
              </code>
            </div>
          </div>
          <p className="text-green-400 text-sm mt-3">
            +100 포인트 획득! 🏆
          </p>
        </div>
      )}

      {/* 버그 미발견 (실패) */}
      {result.success && !result.bugFound && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🤔</span>
            <p className="text-yellow-400 font-bold">아쉽습니다!</p>
          </div>
          <p className="text-yellow-300 text-sm mb-3">
            이 입력으로는 버그를 찾지 못했습니다. 다른 값을 시도해보세요.
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-start gap-2">
              <span className="w-16 shrink-0">입력값:</span>
              <code className="bg-gray-800 text-white px-2 py-1 rounded break-all">
                {result.userInput}
              </code>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-16 shrink-0">결과:</span>
              <code className="bg-gray-700 text-gray-300 px-2 py-1 rounded break-all">
                {String(result.actualResult)}
              </code>
              <span className="text-gray-500">(정답과 동일)</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">
            힌트: 경계값(0, -1, 빈 배열 등)이나 특수한 케이스를 시도해보세요.
          </p>
        </div>
      )}

      {/* 실행 시간 */}
      <p className="text-gray-500 text-xs mt-2 text-right">
        실행 시간: {result.executionTimeMs}ms
      </p>
    </div>
  );
}
