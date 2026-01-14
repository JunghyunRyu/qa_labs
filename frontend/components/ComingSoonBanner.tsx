/** Coming Soon banner component - Mission Control Dark Theme */

"use client";

import { Clock, Calendar, ChevronRight, Rocket } from "lucide-react";

interface NextProblem {
  title: string;
  difficulty: string;
  domain: string;
  published_at: string;
}

interface ComingSoonBannerProps {
  nextProblem: NextProblem;
}

// 도메인 아이콘
const DOMAIN_ICONS: Record<string, string> = {
  common: "📚",
  fintech: "💳",
  commerce: "🛒",
  saas: "☁️",
  platform: "🔗",
  content: "📝",
};

// Mission Control 스타일 난이도 설정
const DIFFICULTY_CONFIG: Record<string, { color: string; label: string }> = {
  "Very Easy": { color: "bg-sky-500/10 text-sky-400 border-sky-500/20", label: "입문" },
  Easy: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "쉬움" },
  Medium: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "보통" },
  Hard: { color: "bg-rose-500/10 text-rose-400 border-rose-500/20", label: "어려움" },
};

// 날짜 포맷팅 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

// D-Day 계산 함수
function getDaysUntil(dateString: string): number {
  const now = new Date();
  const target = new Date(dateString);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function ComingSoonBanner({ nextProblem }: ComingSoonBannerProps) {
  const domainIcon = DOMAIN_ICONS[nextProblem.domain] || "📚";
  const difficultyConfig = DIFFICULTY_CONFIG[nextProblem.difficulty] || {
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    label: nextProblem.difficulty,
  };
  const daysUntil = getDaysUntil(nextProblem.published_at);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-cyan-900/20 to-indigo-900/20 border border-cyan-500/20 rounded-xl px-5 py-4 mb-6">
      {/* 배경 글로우 효과 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Coming Soon badge + Title */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* 아이콘 */}
          <div className="p-2 bg-cyan-500/20 rounded-lg flex-shrink-0">
            <Rocket className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Coming Soon 배지 */}
          <span className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg shadow-cyan-500/20">
            <Clock className="w-3.5 h-3.5" />
            COMING SOON
          </span>

          {/* 문제 제목 */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">{domainIcon}</span>
            <span className="text-sm font-semibold text-slate-100 truncate">
              {nextProblem.title}
            </span>
          </div>
        </div>

        {/* Right: Difficulty + Date + D-Day */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 난이도 */}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${difficultyConfig.color}`}>
            {difficultyConfig.label}
          </span>

          {/* 공개일 */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatDate(nextProblem.published_at)}
            </span>
          </div>

          {/* D-Day 배지 */}
          {daysUntil > 0 && (
            <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/30">
              D-{daysUntil}
            </span>
          )}

          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
}
