/** Admin - Problems List Page */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProblems } from "@/lib/api/problems";
import { ApiError } from "@/lib/api";
import type { ProblemListResponse } from "@/types/problem";
import ProblemCard from "@/components/ProblemCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

export default function AdminProblemsPage() {
  const [data, setData] = useState<ProblemListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProblems(page, pageSize);
      setData(result);
    } catch (err: unknown) {
      let errorMessage = "문제 목록을 불러오는데 실패했습니다.";
      if (err instanceof ApiError) {
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
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
        <Error message={error} onRetry={fetchProblems} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin - 문제 관리</h1>
          <p className="text-gray-600">
            총 {data.total}개의 문제가 있습니다.
          </p>
        </div>
        <Link
          href="/admin/problems/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + 새 문제 생성
        </Link>
      </div>

      {data.problems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">등록된 문제가 없습니다.</p>
          <Link
            href="/admin/problems/new"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            첫 문제를 생성해보세요 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="px-4 py-2 text-gray-700">
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

