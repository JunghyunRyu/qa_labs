/** Problem card component */

"use client";

import Link from "next/link";
import type { ProblemListItem } from "@/types/problem";
import { TrendingUp, TrendingDown, Minus, Bug, Sparkles } from "lucide-react";
import BookmarkButton from "./BookmarkButton";
import { toTagViewModels, sliceTags } from "@/lib/tagDefinitions";

interface ProblemCardProps {
  problem: ProblemListItem;
}

const difficultyConfig = {
  "Very Easy": {
    colors: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
    icon: <TrendingDown className="w-3 h-3" />,
    label: "아주쉬움",
    gradient: "from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950",
    borderClass: "border-blue-300 dark:border-blue-700",
  },
  Easy: {
    colors: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
    icon: <TrendingDown className="w-3 h-3" />,
    label: "쉬움",
    gradient: "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
    borderClass: "border-green-300 dark:border-green-700",
  },
  Medium: {
    colors: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700",
    icon: <Minus className="w-3 h-3" />,
    label: "보통",
    gradient: "from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950",
    borderClass: "border-yellow-300 dark:border-yellow-700",
  },
  Hard: {
    colors: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
    icon: <TrendingUp className="w-3 h-3" />,
    label: "어려움",
    gradient: "from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950",
    borderClass: "border-red-300 dark:border-red-700",
  },
};

// NEW 배지 표시 여부 (7일 이내 공개)
function isNewProblem(publishedAt?: string): boolean {
  if (!publishedAt) return false;
  const published = new Date(publishedAt);
  const now = new Date();
  const diffDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7 && diffDays >= 0;
}

// 도메인 아이콘 및 레이블
const DOMAIN_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  common: { icon: "📚", label: "공통", color: "text-gray-600 dark:text-gray-400" },
  fintech: { icon: "💳", label: "핀테크", color: "text-emerald-600 dark:text-emerald-400" },
  commerce: { icon: "🛒", label: "커머스", color: "text-orange-600 dark:text-orange-400" },
  saas: { icon: "☁️", label: "SaaS", color: "text-sky-600 dark:text-sky-400" },
  platform: { icon: "🔗", label: "플랫폼", color: "text-violet-600 dark:text-violet-400" },
  content: { icon: "📝", label: "컨텐츠", color: "text-pink-600 dark:text-pink-400" },
};

export default function ProblemCard({ problem }: ProblemCardProps) {
  // 제목이 없을 때 fallback 처리
  const displayTitle = problem.title || `문제 #${problem.id}`;

  // short_description 사용 (카드용 짧은 설명)
  const preview = problem.short_description || "";

  const difficulty = difficultyConfig[problem.difficulty];
  const domain = DOMAIN_CONFIG[problem.domain || "common"] || DOMAIN_CONFIG.common;
  const bugsCount = problem.bugs_count ?? 0;
  const isNew = isNewProblem(problem.published_at);

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      aria-label={`${displayTitle} 문제 보기`}
      tabIndex={0}
    >
      <div className={`bg-gradient-to-br ${difficulty.gradient} rounded-lg shadow-md p-4 sm:p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col border-2 ${difficulty.borderClass} min-h-[180px] sm:min-h-[200px] relative`}>
        {/* NEW 배지 */}
        {isNew && (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3" />
            NEW
          </span>
        )}

        {/* 도메인 + 난이도 + 북마크 */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className={`text-xs font-medium ${domain.color} flex items-center gap-1`}>
            <span>{domain.icon}</span>
            <span>{domain.label}</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <BookmarkButton problemId={problem.id} size="sm" />
            <span
              className={`px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap flex items-center gap-1 ${difficulty.colors} shadow-sm`}
              aria-label={`난이도: ${difficulty.label}`}
            >
              {difficulty.icon}
              <span>{difficulty.label}</span>
            </span>
          </div>
        </div>

        {/* 제목 (2줄) */}
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug mb-2">
          {displayTitle}
        </h3>

        {/* 문제 설명 미리보기 (1줄로 축소) */}
        {preview && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mb-3 flex-1">
            {preview}
          </p>
        )}

        {/* 태그 + 버그 수 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* 태그 */}
          <div className="flex flex-wrap gap-1" role="list" aria-label="문제 태그">
            {problem.skills && problem.skills.length > 0 && (() => {
              const tagModels = toTagViewModels(problem.skills);
              const { visible, hiddenCount } = sliceTags(tagModels, 3);
              return (
                <>
                  {visible.map((tag) => (
                    <span
                      key={tag.slug}
                      className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                      role="listitem"
                    >
                      {tag.labelKo}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="px-1 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                      +{hiddenCount}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* 숨은 버그 수 */}
          {bugsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 shrink-0" title={`숨은 버그 ${bugsCount}개`}>
              <Bug className="w-3.5 h-3.5" />
              <span>{bugsCount}개</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

