/**
 * Submission history table component.
 */

"use client";

import Link from "next/link";
import type { SubmissionListItem, Difficulty, SubmissionStatus } from "@/types/submission";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface SubmissionHistoryTableProps {
  submissions: SubmissionListItem[];
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const statusConfig: Record<
  SubmissionStatus,
  { icon: React.ReactNode; label: string; colorClass: string }
> = {
  SUCCESS: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: "성공",
    colorClass: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40",
  },
  FAILURE: {
    icon: <XCircle className="w-4 h-4" />,
    label: "실패",
    colorClass: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40",
  },
  ERROR: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: "에러",
    colorClass: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/40",
  },
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    label: "대기중",
    colorClass: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700",
  },
  RUNNING: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    label: "실행중",
    colorClass: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40",
  },
};

const difficultyConfig: Record<
  Difficulty,
  { label: string; colorClass: string }
> = {
  "Very Easy": {
    label: "아주쉬움",
    colorClass: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40",
  },
  Easy: {
    label: "쉬움",
    colorClass: "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40",
  },
  Medium: {
    label: "보통",
    colorClass: "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/40",
  },
  Hard: {
    label: "어려움",
    colorClass: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40",
  },
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.colorClass}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = difficultyConfig[difficulty];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.colorClass}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubmissionHistoryTable({
  submissions,
  page,
  totalPages,
  total,
  onPageChange,
}: SubmissionHistoryTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          아직 제출 기록이 없습니다.
        </p>
        <Link
          href="/problems"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          문제 풀러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                문제
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                난이도
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                점수
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                뮤턴트
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                제출일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/problems/${submission.problem_id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                  >
                    {submission.problem_title}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <DifficultyBadge difficulty={submission.problem_difficulty} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {submission.score}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {submission.killed_mutants !== null &&
                  submission.total_mutants !== null
                    ? `${submission.killed_mutants}/${submission.total_mutants}`
                    : "-"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(submission.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {submissions.map((submission) => (
          <div key={submission.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/problems/${submission.problem_id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
              >
                {submission.problem_title}
                <ExternalLink className="w-3 h-3" />
              </Link>
              <StatusBadge status={submission.status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DifficultyBadge difficulty={submission.problem_difficulty} />
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {submission.score}점
              </span>
              {submission.killed_mutants !== null &&
                submission.total_mutants !== null && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">|</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {submission.killed_mutants}/{submission.total_mutants}
                    </span>
                  </>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(submission.created_at)}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            총 {total}건 중 {(page - 1) * 10 + 1}-{Math.min(page * 10, total)}
          </p>
          <nav
            aria-label="페이지 네비게이션"
            className="flex items-center gap-2"
          >
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            <span className="px-2 text-sm text-gray-700 dark:text-gray-300">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
