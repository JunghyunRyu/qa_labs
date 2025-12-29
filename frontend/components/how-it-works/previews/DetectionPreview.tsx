"use client";

/**
 * Step 4: 탐지율 측정 프리뷰
 * 뮤턴트별 탐지 결과 테이블 + 탐지율 게이지
 */

import { motion } from "framer-motion";
import { Target, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

export default function DetectionPreview() {
  const results = [
    { id: 1, type: "조건 반전", detected: true, failedTest: "test_edge_cases" },
    { id: 2, type: "경계값 변경", detected: true, failedTest: "test_large_numbers" },
    { id: 3, type: "연산자 변경", detected: false, failedTest: null },
    { id: 4, type: "반환값 변경", detected: true, failedTest: "test_prime_numbers" },
  ];

  const killed = results.filter((r) => r.detected).length;
  const total = results.length;
  const percentage = Math.round((killed / total) * 100);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Target className="w-5 h-5" />
          <span className="font-semibold">버그 탐지율 측정</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-600 dark:text-green-400 font-medium">
            {percentage}%
          </span>
        </div>
      </div>

      {/* 결과 테이블 */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                Mutant
              </th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">
                상태
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                탐지 테스트
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((r, idx) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white dark:bg-gray-900"
              >
                <td className="px-3 py-2">
                  <div className="text-gray-700 dark:text-gray-300">
                    #{r.id} {r.type}
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {r.detected ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">KILLED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">SURVIVED</span>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  {r.failedTest || "—"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 탐지율 요약 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4"
      >
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mutation Score
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {killed}개 탐지 / {total}개 중
          </div>
        </div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {percentage}%
        </div>
      </motion.div>
    </div>
  );
}
