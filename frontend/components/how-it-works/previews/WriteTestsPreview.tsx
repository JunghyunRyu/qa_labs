"use client";

/**
 * Step 1: 테스트 작성 프리뷰
 * 코드 에디터 스냅샷 스타일
 */

import { motion } from "framer-motion";
import { Code2, Play, CheckCircle } from "lucide-react";

export default function WriteTestsPreview() {
  const codeLines = [
    { num: 1, code: "import pytest", highlight: false },
    { num: 2, code: "", highlight: false },
    { num: 3, code: "def test_is_prime_with_prime_numbers():", highlight: true },
    { num: 4, code: '    """소수 판별 테스트"""', highlight: false },
    { num: 5, code: "    assert is_prime(2) == True", highlight: true },
    { num: 6, code: "    assert is_prime(7) == True", highlight: true },
    { num: 7, code: "    assert is_prime(13) == True", highlight: true },
    { num: 8, code: "", highlight: false },
    { num: 9, code: "def test_is_prime_with_non_primes():", highlight: true },
    { num: 10, code: "    assert is_prime(1) == False", highlight: true },
    { num: 11, code: "    assert is_prime(4) == False", highlight: true },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Code2 className="w-5 h-5" />
          <span className="font-semibold">테스트 코드 작성</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            test_is_prime.py
          </span>
        </div>
      </div>

      {/* 코드 에디터 스타일 */}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* 에디터 탭 바 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            pytest
          </span>
        </div>

        {/* 코드 영역 */}
        <div className="bg-gray-900 p-3 font-mono text-xs overflow-x-auto">
          {codeLines.map((line, idx) => (
            <motion.div
              key={line.num}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex ${
                line.highlight
                  ? "bg-blue-900/30 -mx-3 px-3"
                  : ""
              }`}
            >
              <span className="w-6 text-right text-gray-600 select-none mr-3">
                {line.num}
              </span>
              <span
                className={
                  line.code.startsWith("def ")
                    ? "text-yellow-300"
                    : line.code.includes("assert")
                    ? "text-green-300"
                    : line.code.startsWith("import")
                    ? "text-purple-300"
                    : line.code.startsWith("    #") || line.code.includes('"""')
                    ? "text-gray-500"
                    : "text-gray-300"
                }
              >
                {line.code || "\u00A0"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 실행 상태 */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Play className="w-4 h-4" />
          <span>테스트 실행 준비 완료</span>
        </div>
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span>문법 검증 통과</span>
        </div>
      </motion.div>
    </div>
  );
}
