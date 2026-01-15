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
  MessageSquare,
  Trophy,
  Target,
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
    colorClass: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
  },
  FAILURE: {
    icon: <XCircle className="w-4 h-4" />,
    label: "실패",
    colorClass: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
  },
  ERROR: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: "에러",
    colorClass: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
  },
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    label: "대기중",
    colorClass: "text-slate-400 bg-slate-500/10 border border-slate-500/20",
  },
  RUNNING: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    label: "실행중",
    colorClass: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
  },
};

const difficultyConfig: Record<
  Difficulty,
  { label: string; colorClass: string }
> = {
  "Very Easy": {
    label: "아주쉬움",
    colorClass: "text-sky-300 bg-sky-500/10 border border-sky-500/20",
  },
  Easy: {
    label: "쉬움",
    colorClass: "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20",
  },
  Medium: {
    label: "보통",
    colorClass: "text-amber-300 bg-amber-500/10 border border-amber-500/20",
  },
  Hard: {
    label: "어려움",
    colorClass: "text-rose-300 bg-rose-500/10 border border-rose-500/20",
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

/**
 * 결과 배지 - 점수 기반으로 통과/부분통과/미달 표시
 * status가 SUCCESS가 아닌 경우(PENDING, RUNNING, ERROR, FAILURE)는 상태 배지 표시
 */
function ResultBadge({ submission }: { submission: SubmissionListItem }) {
  const { status, score } = submission;

  // 진행 중이거나 에러인 경우 상태 배지 표시
  if (status === "PENDING" || status === "RUNNING" || status === "ERROR") {
    return <StatusBadge status={status} />;
  }

  // FAILURE (golden code 실패) - 테스트 실패
  if (status === "FAILURE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20">
        <XCircle className="w-4 h-4" />
        테스트 실패
      </span>
    );
  }

  // SUCCESS 상태에서 점수 기반으로 결과 표시
  if (score === 100) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
        <Trophy className="w-4 h-4" />
        통과
      </span>
    );
  } else if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20">
        <Target className="w-4 h-4" />
        부분통과
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-400 bg-slate-500/10 border border-slate-500/20">
        <XCircle className="w-4 h-4" />
        미달
      </span>
    );
  }
}

/**
 * AI 피드백 아이콘 - 피드백이 있으면 표시
 */
function FeedbackIcon({ hasFeedback, submissionId, problemId }: { hasFeedback: boolean; submissionId: string; problemId: number }) {
  if (!hasFeedback) {
    return <span className="text-slate-600">-</span>;
  }

  return (
    <Link
      href={`/problems/${problemId}?submission=${submissionId}`}
      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
      title="AI 피드백 보기"
    >
      <MessageSquare className="w-4 h-4" />
    </Link>
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
      <div className="py-12 text-center">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">
          아직 제출 기록이 없습니다.
        </p>
        <Link
          href="/problems"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          문제 풀러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                문제
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                난이도
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                결과
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                점수
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                뮤턴트
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                AI
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                제출일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/problems/${submission.problem_id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    {submission.problem_title}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <DifficultyBadge difficulty={submission.problem_difficulty} />
                </td>
                <td className="px-4 py-4">
                  <ResultBadge submission={submission} />
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-slate-100">
                    {submission.score}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-400">
                  {submission.killed_mutants !== null &&
                  submission.total_mutants !== null
                    ? `${submission.killed_mutants}/${submission.total_mutants}`
                    : "-"}
                </td>
                <td className="px-4 py-4 text-center">
                  <FeedbackIcon
                    hasFeedback={submission.has_feedback}
                    submissionId={submission.id}
                    problemId={submission.problem_id}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-slate-500">
                  {formatDate(submission.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-800">
        {submissions.map((submission) => (
          <div key={submission.id} className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/problems/${submission.problem_id}`}
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                {submission.problem_title}
                <ExternalLink className="w-3 h-3" />
              </Link>
              <div className="flex items-center gap-2">
                {submission.has_feedback && (
                  <FeedbackIcon
                    hasFeedback={submission.has_feedback}
                    submissionId={submission.id}
                    problemId={submission.problem_id}
                  />
                )}
                <ResultBadge submission={submission} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DifficultyBadge difficulty={submission.problem_difficulty} />
              <span className="text-slate-600">|</span>
              <span className="font-semibold text-slate-100">
                {submission.score}점
              </span>
              {submission.killed_mutants !== null &&
                submission.total_mutants !== null && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">
                      {submission.killed_mutants}/{submission.total_mutants}
                    </span>
                  </>
                )}
            </div>
            <p className="text-xs text-slate-500">
              {formatDate(submission.created_at)}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            총 {total}건 중 {(page - 1) * 10 + 1}-{Math.min(page * 10, total)}
          </p>
          <nav
            aria-label="페이지 네비게이션"
            className="flex items-center gap-2"
          >
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            <span className="px-2 text-sm text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
