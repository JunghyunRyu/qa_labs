/** Bookmarked problems list page */

"use client";

import { useEffect, useState } from "react";
import { getBookmarkedProblems } from "@/lib/api/problems";
import { ApiError } from "@/lib/api";
import type { BookmarkedProblemListResponse, BookmarkedProblemItem } from "@/types/problem";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import Link from "next/link";
import { Bookmark, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

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

function BookmarkedProblemCard({ problem }: { problem: BookmarkedProblemItem }) {
  const difficulty = difficultyConfig[problem.difficulty];
  const displayTitle = problem.title || `문제 #${problem.id}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      aria-label={`${displayTitle} 문제 보기`}
    >
      <div
        className={`bg-gradient-to-br ${difficulty.gradient} rounded-lg shadow-md p-4 sm:p-5 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer h-full flex flex-col border-2 ${difficulty.borderClass}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 flex-1 pr-2 line-clamp-2 leading-snug">
            {displayTitle}
          </h3>
          <span
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 shrink-0 whitespace-nowrap flex items-center gap-1.5 ${difficulty.colors} shadow-sm`}
          >
            {difficulty.icon}
            <span>{difficulty.label}</span>
          </span>
        </div>

        {/* Tags */}
        {problem.skills && problem.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
            {problem.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-1.5 sm:px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-xs border border-gray-200 dark:border-gray-600"
              >
                {skill}
              </span>
            ))}
            {problem.skills.length > 3 && (
              <span className="px-1.5 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                +{problem.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bookmarked date */}
        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Bookmark className="w-3 h-3" />
            {formatDate(problem.bookmarked_at)}에 북마크됨
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function BookmarkedProblemsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<BookmarkedProblemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchBookmarkedProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBookmarkedProblems(page, pageSize);
      setData(result);
    } catch (err: unknown) {
      let errorMessage = "북마크된 문제 목록을 불러오는데 실패했습니다.";
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/problems");
          return;
        }
        const errorData = err.data as { detail?: string } | undefined;
        errorMessage = errorData?.detail || err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/problems");
      return;
    }

    if (isAuthenticated) {
      fetchBookmarkedProblems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAuthenticated, authLoading]);

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message={error} onRetry={fetchBookmarkedProblems} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/problems"
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          문제 목록으로
        </Link>
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              북마크한 문제
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              총 {data?.total || 0}개의 문제를 북마크했습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Problem list */}
      {!data || data.problems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center transition-colors">
          <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            아직 북마크한 문제가 없습니다.
          </p>
          <Link
            href="/problems"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            문제 둘러보기
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-8">
            {data.problems.map((problem) => (
              <BookmarkedProblemCard key={problem.id} problem={problem} />
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <nav
              aria-label="페이지 네비게이션"
              className="flex items-center justify-center gap-2"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
