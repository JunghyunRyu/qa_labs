"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle, Bug, MessageSquare } from "lucide-react";
import { getMySubmissions } from "@/lib/api/users";
import type { SubmissionListItem, SubmissionStatus, Difficulty } from "@/types/submission";

interface RecentSubmissionsProps {
  limit?: number;
}

// 난이도 색상 및 라벨
const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  "Very Easy": {
    label: "입문",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  "Easy": {
    label: "초급",
    className: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  },
  "Medium": {
    label: "중급",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  "Hard": {
    label: "고급",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

// 상대 시간 포맷 (예: "2시간 전", "3일 전")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else {
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }
}

// 점수에 따른 색상 클래스
function getScoreColorClass(score: number): string {
  if (score >= 80) {
    return "text-green-600 dark:text-green-400";
  } else if (score >= 50) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  return "text-red-600 dark:text-red-400";
}

// 상태에 따른 아이콘
function StatusIcon({ status }: { status: SubmissionStatus }) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "FAILURE":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "PENDING":
    case "RUNNING":
      return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    case "ERROR":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
}

// 스켈레톤 로딩 UI
function SubmissionSkeleton() {
  return (
    <div className="py-3 animate-pulse">
      {/* Row 1 */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-48" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-10" />
      </div>
      {/* Row 2 */}
      <div className="flex items-center gap-3 pl-6">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        <div className="flex-1" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14" />
      </div>
    </div>
  );
}

export default function RecentSubmissions({ limit = 5 }: RecentSubmissionsProps) {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentSubmissions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMySubmissions(1, limit);
        setSubmissions(data.submissions);
      } catch (err) {
        console.error("Failed to fetch recent submissions:", err);
        setError("제출 기록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentSubmissions();
  }, [limit]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            최근 제출 기록
          </h3>
        </div>
        <Link
          href="/submissions"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          전체 보기
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Array.from({ length: limit }).map((_, i) => (
            <SubmissionSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            아직 제출 기록이 없습니다.
          </p>
          <Link
            href="/problems"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            첫 문제 풀러 가기
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {submissions.map((submission) => {
            const difficultyConfig = DIFFICULTY_CONFIG[submission.problem_difficulty];
            const hasKillRatio = submission.killed_mutants !== undefined && submission.total_mutants !== undefined;

            return (
              <Link
                key={submission.id}
                href={`/problems/${submission.problem_id}`}
                className="block py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-lg transition-colors group"
              >
                {/* Row 1: Status + Problem Title + Difficulty Badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusIcon status={submission.status} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">
                    {submission.problem_title}
                  </span>
                  {difficultyConfig && (
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${difficultyConfig.className}`}>
                      {difficultyConfig.label}
                    </span>
                  )}
                </div>

                {/* Row 2: Score + Kill Ratio + Feedback + Time */}
                <div className="flex items-center gap-3 pl-6 text-xs">
                  {/* Score */}
                  <span className={`font-semibold ${getScoreColorClass(submission.score)}`}>
                    {submission.score}점
                  </span>

                  {/* Kill Ratio */}
                  {hasKillRatio && (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Bug className="w-3 h-3" />
                      <span>{submission.killed_mutants}/{submission.total_mutants}</span>
                    </span>
                  )}

                  {/* AI Feedback */}
                  {submission.has_feedback && (
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400" title="AI 피드백 있음">
                      <MessageSquare className="w-3 h-3" />
                      <span>피드백</span>
                    </span>
                  )}

                  {/* Spacer */}
                  <span className="flex-1" />

                  {/* Time */}
                  <span className="text-gray-400 dark:text-gray-500">
                    {formatRelativeTime(submission.created_at)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
