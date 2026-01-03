/** Coming Soon card component */

"use client";

import { Clock, Calendar } from "lucide-react";

interface NextProblem {
  title: string;
  difficulty: string;
  domain: string;
  published_at: string;
}

interface ComingSoonCardProps {
  nextProblem: NextProblem;
}

// 난이도별 색상 설정
const difficultyConfig: Record<string, { gradient: string; borderClass: string; label: string }> = {
  "Very Easy": {
    gradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
    borderClass: "border-blue-200 dark:border-blue-800",
    label: "아주쉬움",
  },
  Easy: {
    gradient: "from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50",
    borderClass: "border-green-200 dark:border-green-800",
    label: "쉬움",
  },
  Medium: {
    gradient: "from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50",
    borderClass: "border-yellow-200 dark:border-yellow-800",
    label: "보통",
  },
  Hard: {
    gradient: "from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50",
    borderClass: "border-red-200 dark:border-red-800",
    label: "어려움",
  },
};

// 도메인 아이콘 및 레이블
const DOMAIN_CONFIG: Record<string, { icon: string; label: string }> = {
  common: { icon: "📚", label: "공통" },
  fintech: { icon: "💳", label: "핀테크" },
  commerce: { icon: "🛒", label: "커머스" },
  saas: { icon: "☁️", label: "SaaS" },
  platform: { icon: "🔗", label: "플랫폼" },
  content: { icon: "📝", label: "컨텐츠" },
};

// 날짜 포맷팅 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

// D-Day 계산 함수
function getDaysUntil(dateString: string): number {
  const now = new Date();
  const target = new Date(dateString);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function ComingSoonCard({ nextProblem }: ComingSoonCardProps) {
  const difficulty = difficultyConfig[nextProblem.difficulty] || difficultyConfig.Easy;
  const domain = DOMAIN_CONFIG[nextProblem.domain] || DOMAIN_CONFIG.common;
  const daysUntil = getDaysUntil(nextProblem.published_at);

  return (
    <div
      className={`bg-gradient-to-br ${difficulty.gradient} rounded-lg shadow-md p-4 sm:p-5 h-full flex flex-col border-2 border-dashed ${difficulty.borderClass} min-h-[180px] sm:min-h-[200px] relative opacity-75`}
      aria-label="곧 공개될 문제"
    >
      {/* Coming Soon 배지 */}
      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
        <Clock className="w-3 h-3" />
        COMING SOON
      </span>

      {/* 도메인 + 난이도 */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span>{domain.icon}</span>
          <span>{domain.label}</span>
        </span>
        <span className="px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600">
          {difficulty.label}
        </span>
      </div>

      {/* 제목 (흐리게) */}
      <h3 className="text-sm sm:text-base font-bold text-gray-400 dark:text-gray-500 line-clamp-2 leading-snug mb-2">
        {nextProblem.title}
      </h3>

      {/* 공개 예정일 */}
      <div className="flex-1 flex items-end">
        <div className="w-full pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatDate(nextProblem.published_at)} 공개
              </span>
            </div>
            {daysUntil > 0 && (
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                D-{daysUntil}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
