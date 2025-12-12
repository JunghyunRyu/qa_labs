/**
 * Submission history and statistics page.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMySubmissions, getMyStatistics } from "@/lib/api/users";
import { ApiError } from "@/lib/api";
import type {
  UserSubmissionsResponse,
  UserStatisticsResponse,
  SubmissionFilters as FiltersType,
} from "@/types/submission";
import { useAuth } from "@/lib/auth/AuthContext";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import SubmissionStatistics from "@/components/SubmissionStatistics";
import SubmissionHistoryTable from "@/components/SubmissionHistoryTable";
import SubmissionFilters from "@/components/SubmissionFilters";
import { ArrowLeft, History, BarChart3 } from "lucide-react";

const PAGE_SIZE = 10;

export default function SubmissionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [statistics, setStatistics] = useState<UserStatisticsResponse | null>(null);
  const [submissions, setSubmissions] = useState<UserSubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({});

  // Fetch statistics (once)
  const fetchStatistics = useCallback(async () => {
    try {
      const data = await getMyStatistics();
      setStatistics(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/problems");
        return;
      }
      throw err;
    }
  }, [router]);

  // Fetch submissions (with filters and pagination)
  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await getMySubmissions(
        page,
        PAGE_SIZE,
        filters.status,
        filters.days
      );
      setSubmissions(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/problems");
        return;
      }
      throw err;
    }
  }, [page, filters, router]);

  // Initial load
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStatistics(), fetchSubmissions()]);
    } catch (err: unknown) {
      let errorMessage = "데이터를 불러오는데 실패했습니다.";
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
  }, [fetchStatistics, fetchSubmissions]);

  // Load data on auth change
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/problems");
      return;
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, router, loadData]);

  // Refetch submissions when filters or page changes
  useEffect(() => {
    if (isAuthenticated && !loading) {
      fetchSubmissions().catch((err) => {
        let errorMessage = "제출 목록을 불러오는데 실패했습니다.";
        if (err instanceof ApiError) {
          const errorData = err.data as { detail?: string } | undefined;
          errorMessage = errorData?.detail || err.message;
        }
        setError(errorMessage);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  // Handle filter change
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 when filters change
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Loading states
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
        <Error message={error} onRetry={loadData} />
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
          <History className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              내 제출 기록
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              제출 이력과 통계를 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics section */}
      {statistics && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              통계
            </h2>
          </div>
          <SubmissionStatistics statistics={statistics} />
        </section>
      )}

      {/* Submissions section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            제출 기록
          </h2>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <SubmissionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Table */}
        {submissions && (
          <SubmissionHistoryTable
            submissions={submissions.submissions}
            page={submissions.page}
            totalPages={submissions.total_pages}
            total={submissions.total}
            onPageChange={handlePageChange}
          />
        )}
      </section>
    </div>
  );
}
