"use client";

import { useEffect, useState } from "react";
import { getProblemsStats } from "@/lib/api/problems";
import type { ProblemStatsResponse } from "@/types/problem";

// 난이도 색상 (ProblemCard와 일치)
const DIFFICULTY_COLORS: Record<string, string> = {
  "Very Easy": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Easy": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Hard": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  "Very Easy": "아주쉬움",
  "Easy": "쉬움",
  "Medium": "보통",
  "Hard": "어려움",
};

const DOMAIN_CONFIG: Record<string, { icon: string; label: string }> = {
  common: { icon: "📚", label: "공통" },
  fintech: { icon: "💳", label: "핀테크" },
  commerce: { icon: "🛒", label: "커머스" },
  saas: { icon: "☁️", label: "SaaS" },
  platform: { icon: "🔗", label: "플랫폼" },
  content: { icon: "📝", label: "컨텐츠" },
};

export default function ProblemStatsRow() {
  const [stats, setStats] = useState<ProblemStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProblemsStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  // 도메인 정렬 (개수 많은 순)
  const sortedDomains = Object.entries(stats.by_domain)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {/* 총 개수 */}
      <span
        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium"
        aria-label={`총 ${stats.total}개 문제`}
      >
        총 {stats.total}개
      </span>

      {/* 구분선 */}
      <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">|</span>

      {/* 난이도별 */}
      {["Very Easy", "Easy", "Medium", "Hard"].map((diff) => {
        const count = stats.by_difficulty[diff] || 0;
        if (count === 0) return null;
        return (
          <span
            key={diff}
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[diff]}`}
            aria-label={`${DIFFICULTY_LABELS[diff]} ${count}개`}
          >
            {DIFFICULTY_LABELS[diff]} {count}
          </span>
        );
      })}

      {/* 도메인 전체 표시 */}
      {sortedDomains.length > 0 && (
        <>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">|</span>
          {sortedDomains.map(([domain, count]) => {
            const config = DOMAIN_CONFIG[domain] || { icon: "📁", label: domain };
            return (
              <span
                key={domain}
                className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs"
                aria-label={`${config.label} ${count}개`}
              >
                {config.icon} {config.label} {count}
              </span>
            );
          })}
        </>
      )}
    </div>
  );
}
