/** Problem card component - Mission Control Style */

"use client";

import Link from "next/link";
import type { ProblemListItem } from "@/types/problem";
import { Bug, Sparkles, CheckCircle2, XCircle, Clock, ThumbsUp, Flame } from "lucide-react";
import BookmarkButton from "./BookmarkButton";
import { toTagViewModels, sliceTags } from "@/lib/tagDefinitions";

interface ProblemCardProps {
  problem: ProblemListItem;
}

// Mission Control 스타일 난이도 설정
const difficultyConfig = {
  "Very Easy": {
    dotColor: "bg-sky-400",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    label: "입문",
  },
  Easy: {
    dotColor: "bg-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "쉬움",
  },
  Medium: {
    dotColor: "bg-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    label: "보통",
  },
  Hard: {
    dotColor: "bg-rose-400",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    label: "어려움",
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

// 추천 배지 타입 결정 (Easy/Medium 문제에 표시)
type RecommendBadgeType = "hot" | "recommend" | null;
function getRecommendBadge(difficulty: string, successRate?: number | null): RecommendBadgeType {
  // Medium이면서 정답률이 높으면 Hot
  if (difficulty === "Medium" && successRate && successRate >= 50) {
    return "hot";
  }
  // Easy는 추천
  if (difficulty === "Easy") {
    return "recommend";
  }
  // Medium은 기본적으로 추천
  if (difficulty === "Medium") {
    return "recommend";
  }
  return null;
}

// 도메인 아이콘 및 레이블
const DOMAIN_CONFIG: Record<string, { icon: string; label: string }> = {
  common: { icon: "📚", label: "공통" },
  fintech: { icon: "💳", label: "핀테크" },
  commerce: { icon: "🛒", label: "커머스" },
  saas: { icon: "☁️", label: "SaaS" },
  platform: { icon: "🔗", label: "플랫폼" },
  content: { icon: "📝", label: "컨텐츠" },
};

// 상태 아이콘 컴포넌트
function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case "solved":
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" title="해결됨" />;
    case "attempted":
      return <Clock className="w-4 h-4 text-amber-400" title="시도 중" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-rose-400" title="실패" />;
    default:
      return null;
  }
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  // 제목이 없을 때 fallback 처리
  const displayTitle = problem.title || `문제 #${problem.id}`;

  // short_description 사용 (카드용 짧은 설명)
  const preview = problem.short_description || "";

  const difficulty = difficultyConfig[problem.difficulty];
  const domain = DOMAIN_CONFIG[problem.domain || "common"] || DOMAIN_CONFIG.common;
  const bugsCount = problem.bugs_count ?? 0;
  const isNew = isNewProblem(problem.published_at);

  // 정답률 계산 (임시 - 실제 데이터가 있으면 사용)
  const successRate = problem.success_rate ?? null;

  // 추천 배지 결정 (Easy/Medium 문제에 표시)
  const recommendBadge = getRecommendBadge(problem.difficulty, successRate);

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group block h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-xl"
      aria-label={`${displayTitle} 문제 보기`}
      tabIndex={0}
    >
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-5 h-full flex flex-col min-h-[200px] transition-all duration-200 hover:bg-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 cursor-pointer">

        {/* NEW 배지 - 우측 상단 */}
        {isNew && (
          <span className="absolute -top-2 -right-2 px-2.5 py-1 bg-sky-500 text-white text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1 z-10">
            <Sparkles className="w-3 h-3" />
            NEW
          </span>
        )}

        {/* Header: 난이도 + 추천 배지 (좌) + 상태 아이콘 (우) */}
        <div className="flex items-center justify-between mb-3">
          {/* 난이도 뱃지 + 추천 배지 */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${difficulty.badgeColor}`}>
              <span className={`w-2 h-2 rounded-full ${difficulty.dotColor}`} />
              {difficulty.label}
            </span>
            {/* 추천 배지 (Easy/Medium) */}
            {recommendBadge === "hot" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[10px] font-bold border border-orange-500/30">
                <Flame className="w-3 h-3" />
                HOT
              </span>
            )}
            {recommendBadge === "recommend" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-500/30">
                <ThumbsUp className="w-3 h-3" />
                추천
              </span>
            )}
          </div>

          {/* 상태 아이콘 + 북마크 */}
          <div className="flex items-center gap-2">
            <StatusIcon status={problem.user_status} />
            <BookmarkButton problemId={problem.id} size="sm" />
          </div>
        </div>

        {/* Title (2줄 말줄임) */}
        <h3 className="text-base font-bold text-slate-100 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-400 transition-colors">
          {displayTitle}
        </h3>

        {/* Description (2줄 말줄임) */}
        {preview && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {preview}
          </p>
        )}

        {/* Footer: 도메인 + 태그 + 메타 정보 */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
          {/* 도메인 + 태그 */}
          <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="문제 태그">
            {/* 도메인 표시 */}
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mr-0.5">
              <span>{domain.icon}</span>
              <span>{domain.label}</span>
            </span>
            {/* 구분선 */}
            {problem.skills && problem.skills.length > 0 && (
              <span className="w-px h-3 bg-slate-700" />
            )}
            {/* 태그 (border-only 스타일) */}
            {problem.skills && problem.skills.length > 0 && (() => {
              const tagModels = toTagViewModels(problem.skills);
              const { visible, hiddenCount } = sliceTags(tagModels, 2);
              return (
                <>
                  {visible.map((tag) => (
                    <span
                      key={tag.slug}
                      className="px-2 py-0.5 text-[11px] text-slate-500 border border-slate-700 rounded"
                      role="listitem"
                    >
                      {tag.labelKo}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] text-slate-600">
                      +{hiddenCount}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* 메타 정보: 버그 수 또는 정답률 */}
          <div className="flex items-center gap-3 shrink-0">
            {successRate !== null && (
              <span className="text-[11px] text-slate-500" title="정답률">
                {successRate}%
              </span>
            )}
            {bugsCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-rose-400" title={`숨은 버그 ${bugsCount}개`}>
                <Bug className="w-3.5 h-3.5" />
                <span>{bugsCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
