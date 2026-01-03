/** Coming Soon banner component - horizontal banner for problems list */

"use client";

import { Clock, Calendar, ChevronRight } from "lucide-react";

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

// 난이도 한글 레이블
const DIFFICULTY_LABELS: Record<string, string> = {
  "Very Easy": "아주쉬움",
  Easy: "쉬움",
  Medium: "보통",
  Hard: "어려움",
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
  const difficultyLabel = DIFFICULTY_LABELS[nextProblem.difficulty] || nextProblem.difficulty;
  const daysUntil = getDaysUntil(nextProblem.published_at);

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Coming Soon badge + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="flex-shrink-0 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            COMING SOON
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">{domainIcon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {nextProblem.title}
            </span>
          </div>
        </div>

        {/* Right: Difficulty + Date + D-Day */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
            {difficultyLabel}
          </span>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatDate(nextProblem.published_at)}
            </span>
          </div>
          {daysUntil > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
              D-{daysUntil}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
