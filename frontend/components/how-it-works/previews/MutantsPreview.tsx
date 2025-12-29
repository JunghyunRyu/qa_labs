"use client";

/**
 * Step 3: 뮤턴트 생성 프리뷰
 * 코드 변형 시각화
 */

import { motion } from "framer-motion";
import { Bug, ArrowRight, Code2 } from "lucide-react";

export default function MutantsPreview() {
  const mutations = [
    {
      id: 1,
      type: "조건 반전",
      original: "n < 2",
      mutated: "n > 2",
      color: "text-red-400",
    },
    {
      id: 2,
      type: "경계값 변경",
      original: "i * i <= n",
      mutated: "i * i < n",
      color: "text-orange-400",
    },
    {
      id: 3,
      type: "연산자 변경",
      original: "n % i == 0",
      mutated: "n % i != 0",
      color: "text-yellow-400",
    },
    {
      id: 4,
      type: "반환값 변경",
      original: "return True",
      mutated: "return False",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Bug className="w-5 h-5" />
          <span className="font-semibold">버그 코드(Mutant) 생성</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          4개 생성됨
        </div>
      </div>

      {/* 원본 코드 참조 */}
      <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-xs">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
          <Code2 className="w-3.5 h-3.5" />
          <span>원본 코드 (is_prime)</span>
        </div>
        <code className="text-gray-700 dark:text-gray-300 font-mono">
          정상 작동하는 소수 판별 함수
        </code>
      </div>

      {/* 뮤턴트 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        {mutations.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-lg border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                Mutant #{m.id}
              </span>
              <Bug className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {m.type}
            </div>
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-gray-500 line-through">{m.original}</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className={m.color}>{m.mutated}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 설명 */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        정상 코드에 의도적인 버그를 심어 테스트의 버그 탐지 능력을 평가합니다.
      </p>
    </div>
  );
}
