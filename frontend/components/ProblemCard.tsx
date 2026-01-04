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

// GitHub Dark 스타일: Primer 색상 팔레트
const difficultyConfig = {
  "Very Easy": {
    colors: "bg-[#ddf4ff] text-[#0969da] border-[#b6e3ff] dark:bg-[#388bfd26] dark:text-[#58a6ff] dark:border-[#388bfd40]",
    icon: <TrendingDown className="w-3 h-3" />,
    label: "아주쉬움",
    gradient: "from-white to-[#ddf4ff]/50 dark:from-[#161b22] dark:to-[#388bfd15]",
    borderClass: "border-[#d0d7de] dark:border-[#30363d]",
  },
  Easy: {
    colors: "bg-[#dafbe1] text-[#1a7f37] border-[#aceebb] dark:bg-[#238636]/20 dark:text-[#3fb950] dark:border-[#238636]/40",
    icon: <TrendingDown className="w-3 h-3" />,
    label: "쉬움",
    gradient: "from-white to-[#dafbe1]/50 dark:from-[#161b22] dark:to-[#238636]/10",
    borderClass: "border-[#d0d7de] dark:border-[#30363d]",
  },
  Medium: {
    colors: "bg-[#fff8c5] text-[#9a6700] border-[#fae17d] dark:bg-[#9e6a03]/20 dark:text-[#d29922] dark:border-[#9e6a03]/40",
    icon: <Minus className="w-3 h-3" />,
    label: "보통",
    gradient: "from-white to-[#fff8c5]/50 dark:from-[#161b22] dark:to-[#9e6a03]/10",
    borderClass: "border-[#d0d7de] dark:border-[#30363d]",
  },
  Hard: {
    colors: "bg-[#ffebe9] text-[#cf222e] border-[#ffc1ba] dark:bg-[#f85149]/20 dark:text-[#f85149] dark:border-[#f85149]/40",
    icon: <TrendingUp className="w-3 h-3" />,
    label: "어려움",
    gradient: "from-white to-[#ffebe9]/50 dark:from-[#161b22] dark:to-[#f85149]/10",
    borderClass: "border-[#d0d7de] dark:border-[#30363d]",
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

// 도메인 아이콘 및 레이블 - GitHub Dark 스타일
const DOMAIN_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  common: { icon: "📚", label: "공통", color: "text-[#57606a] dark:text-[#8b949e]" },
  fintech: { icon: "💳", label: "핀테크", color: "text-[#1a7f37] dark:text-[#3fb950]" },
  commerce: { icon: "🛒", label: "커머스", color: "text-[#9a6700] dark:text-[#d29922]" },
  saas: { icon: "☁️", label: "SaaS", color: "text-[#0969da] dark:text-[#58a6ff]" },
  platform: { icon: "🔗", label: "플랫폼", color: "text-[#8250df] dark:text-[#a371f7]" },
  content: { icon: "📝", label: "컨텐츠", color: "text-[#cf222e] dark:text-[#f85149]" },
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
      className="block h-full focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:ring-offset-2 rounded-lg"
      aria-label={`${displayTitle} 문제 보기`}
      tabIndex={0}
    >
      <div className={`bg-gradient-to-br ${difficulty.gradient} rounded-lg shadow-md p-4 sm:p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col border-2 ${difficulty.borderClass} min-h-[180px] sm:min-h-[200px] relative`}>
        {/* NEW 배지 - GitHub Dark 스타일: 하늘색 */}
        {isNew && (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#58a6ff] text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
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
        <h3 className="text-sm sm:text-base font-bold text-[#24292f] dark:text-[#c9d1d9] line-clamp-2 leading-snug mb-2">
          {displayTitle}
        </h3>

        {/* 문제 설명 미리보기 (1줄로 축소) */}
        {preview && (
          <p className="text-xs text-[#57606a] dark:text-[#8b949e] line-clamp-1 mb-3 flex-1">
            {preview}
          </p>
        )}

        {/* 태그 + 버그 수 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
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
                      className="px-1.5 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] rounded text-xs border border-[#d0d7de] dark:border-[#30363d] whitespace-nowrap"
                      role="listitem"
                    >
                      {tag.labelKo}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="px-1 py-0.5 text-[#6e7781] dark:text-[#8b949e] text-xs">
                      +{hiddenCount}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* 숨은 버그 수 */}
          {bugsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-[#cf222e] dark:text-[#f85149] shrink-0" title={`숨은 버그 ${bugsCount}개`}>
              <Bug className="w-3.5 h-3.5" />
              <span>{bugsCount}개</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

