"use client";

import { useEffect, useCallback } from "react";
import { X, Target, Bug, CheckCircle, Info } from "lucide-react";

interface ScoringMethodDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoringMethodDrawer({
  isOpen,
  onClose,
}: ScoringMethodDrawerProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 패널 */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoring-drawer-title"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="scoring-drawer-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"
          >
            <Target className="w-5 h-5 text-sky-500" />
            채점 방식
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto h-[calc(100%-65px)]">
          {/* 점수 구성 */}
          <div className="space-y-6">
            {/* 총점 안내 */}
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-sky-800 dark:text-sky-300">
                  총점: 100점
                </span>
              </div>
              <p className="text-sm text-sky-700 dark:text-sky-400">
                테스트 코드의 품질을 두 가지 기준으로 평가합니다.
              </p>
            </div>

            {/* 기본 점수 */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-800 dark:text-green-300">
                  기본 점수: 30점
                </span>
              </div>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                <p className="font-medium">Golden 테스트 통과</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>정답 코드(Golden Code)에 대해 테스트 실행</li>
                  <li>모든 테스트가 통과하면 30점 획득</li>
                  <li>하나라도 실패하면 0점</li>
                </ul>
              </div>
            </div>

            {/* 결함 검출 점수 */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-800 dark:text-red-300">
                  결함 검출 점수: 70점
                </span>
              </div>
              <div className="space-y-2 text-sm text-red-700 dark:text-red-400">
                <p className="font-medium">Mutant Kill Ratio</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>버그가 심어진 코드(Mutant)들에 대해 테스트 실행</li>
                  <li>테스트가 실패해야 버그를 &quot;검출&quot;한 것</li>
                  <li>검출한 Mutant 수 / 전체 Mutant 수 × 70점</li>
                </ul>
              </div>
            </div>

            {/* 점수 계산 예시 */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                점수 계산 예시
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">
                    Golden 테스트 통과
                  </span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    30점
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">
                    Mutant 5개 중 4개 검출
                  </span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    4/5 × 70 = 56점
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 font-semibold">
                  <span className="text-gray-800 dark:text-gray-200">총점</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400">
                    86점
                  </span>
                </div>
              </div>
            </div>

            {/* 팁 */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium text-gray-800 dark:text-gray-200">
                높은 점수를 받으려면?
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>정상 동작을 검증하는 테스트 작성 (Golden 통과)</li>
                <li>경계값, 예외 상황을 철저히 테스트</li>
                <li>버그를 놓치지 않도록 다양한 케이스 커버</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
