"use client";

/**
 * Step 2: 기본 검증 프리뷰
 * 테스트 실행 결과 - 성공/실패 스타일
 */

import { motion } from "framer-motion";
import { CheckCircle2, Play, Clock } from "lucide-react";

export default function ValidatePreview() {
  const testResults = [
    { name: "test_is_prime_with_prime_numbers", status: "pass", time: "0.02s" },
    { name: "test_is_prime_with_non_primes", status: "pass", time: "0.01s" },
    { name: "test_is_prime_edge_cases", status: "pass", time: "0.01s" },
    { name: "test_is_prime_large_numbers", status: "pass", time: "0.03s" },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">정상 코드 검증</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>0.07s</span>
        </div>
      </div>

      {/* 테스트 결과 리스트 */}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* 터미널 스타일 헤더 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Play className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            pytest test_is_prime.py
          </span>
        </div>

        {/* 결과 영역 */}
        <div className="bg-gray-900 p-3 font-mono text-xs space-y-1">
          {testResults.map((test, idx) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300 truncate max-w-[180px] sm:max-w-none">
                  {test.name}
                </span>
              </div>
              <span className="text-gray-500">{test.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 요약 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3 rounded-xl border-2 border-green-500/30 bg-green-50 dark:bg-green-950/30 p-4"
      >
        <CheckCircle2 className="w-8 h-8 text-green-500" />
        <div>
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            모든 테스트 통과
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            4/4 테스트 성공 · Golden Code 검증 완료
          </div>
        </div>
      </motion.div>
    </div>
  );
}
