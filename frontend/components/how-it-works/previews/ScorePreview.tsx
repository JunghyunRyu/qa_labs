"use client";

/**
 * Step 5: 점수 & 피드백 프리뷰
 * HeroResultPanel 축약 버전
 */

import { motion } from "framer-motion";
import { Sparkles, Target, Shield, Lightbulb } from "lucide-react";

export default function ScorePreview() {
  const qualityChips = [
    { label: "경계값", icon: Target, active: true },
    { label: "예외처리", icon: Shield, active: true },
    { label: "다중케이스", icon: Lightbulb, active: false },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI 회고</span>
        </div>
      </div>

      {/* 점수 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 탐지율 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-4"
        >
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            버그 탐지율
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            75%
          </div>
          <div className="text-xs text-gray-500 mt-1">3/4 Killed</div>
        </motion.div>

        {/* 품질 등급 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/30 p-4"
        >
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            테스트 품질
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            B+
          </div>
          <div className="flex gap-1 mt-1">
            {qualityChips.map((chip, idx) => (
              <span
                key={idx}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  chip.active
                    ? "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI 피드백 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/20 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            AI 개선 제안
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          연산자 변경 mutant를 놓쳤습니다.
        </p>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <span>n % i == 0 조건을 검증하는 테스트 추가</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <span>4, 6, 8 등 합성수 케이스 보강</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
