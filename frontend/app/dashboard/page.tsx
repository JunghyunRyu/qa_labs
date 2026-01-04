"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Target,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getProgressSummary, getProgressTimeline } from "@/lib/api/progress";
import type {
  ProgressSummary,
  ProgressTimeline,
  TimeRange,
} from "@/types/progress";
import { isProgressEmpty } from "@/types/progress";
import { ProgressSummaryCard } from "@/components/dashboard";

// Dynamic imports for chart components to avoid SSR issues with recharts
const ProgressTimelineChart = dynamic(
  () => import("@/components/dashboard/ProgressTimelineChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DifficultyBreakdownChart = dynamic(
  () => import("@/components/dashboard/DifficultyBreakdownChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const SkillBreakdownChart = dynamic(
  () => import("@/components/dashboard/SkillBreakdownChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-[250px] bg-gray-100 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
        <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        아직 제출 기록이 없습니다
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        첫 문제를 풀어보세요! 여러분의 성장 과정을 기록해 드립니다.
      </p>
      <Link
        href="/problems"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        문제 풀러 가기
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeline, setTimeline] = useState<ProgressTimeline | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch summary data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSummary = async () => {
      setIsLoadingSummary(true);
      try {
        const data = await getProgressSummary();
        if (isProgressEmpty(data)) {
          setIsEmpty(true);
          setSummary(null);
        } else {
          setIsEmpty(false);
          setSummary(data);
        }
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        console.error("Failed to fetch summary:", err);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [isAuthenticated]);

  // Fetch timeline data
  useEffect(() => {
    if (!isAuthenticated || isEmpty) return;

    const fetchTimeline = async () => {
      setIsLoadingTimeline(true);
      try {
        const data = await getProgressTimeline(timeRange);
        setTimeline(data);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        setIsLoadingTimeline(false);
      }
    };

    fetchTimeline();
  }, [isAuthenticated, timeRange, isEmpty]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/problems"
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            문제 목록으로
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            성장 대시보드
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            여러분의 학습 진행 상황을 한눈에 확인하세요.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingSummary && isEmpty && <EmptyState />}

        {/* Dashboard Content */}
        {!isEmpty && (
          <>
            {/* 베타 안내 배너 */}
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    학습용 지표 (베타)
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    점수와 통계는 학습 목적으로 제공됩니다. 일부 클라이언트 실행 결과는 서버 검증을 거칩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {isLoadingSummary ? (
                <>
                  <SummaryCardSkeleton />
                  <SummaryCardSkeleton />
                  <SummaryCardSkeleton />
                  <SummaryCardSkeleton />
                </>
              ) : summary ? (
                <>
                  <ProgressSummaryCard
                    title="총 제출"
                    value={summary.total_submissions}
                    subtitle={`성공 ${summary.success_submissions}회`}
                    icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
                  />
                  <ProgressSummaryCard
                    title="평균 점수"
                    value={summary.avg_score}
                    subtitle={`최고 ${summary.best_score}점`}
                    icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                    format="number"
                  />
                  <ProgressSummaryCard
                    title="성공률"
                    value={
                      summary.total_submissions > 0
                        ? (summary.success_submissions / summary.total_submissions) * 100
                        : 0
                    }
                    subtitle={`최근 10회 평균 ${summary.recent_avg_score}점`}
                    icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                    format="percent"
                  />
                  <ProgressSummaryCard
                    title="평균 Kill Ratio"
                    value={summary.avg_kill_ratio}
                    subtitle="버그 탐지율"
                    icon={<Target className="w-6 h-6 text-purple-600" />}
                    format="ratio"
                  />
                </>
              ) : null}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ProgressTimelineChart
                data={timeline?.entries || []}
                range={timeRange}
                onRangeChange={setTimeRange}
                isLoading={isLoadingTimeline}
              />
              <DifficultyBreakdownChart
                data={summary?.difficulty_stats || []}
                isLoading={isLoadingSummary}
              />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1">
              <SkillBreakdownChart
                data={summary?.skill_stats || []}
                isLoading={isLoadingSummary}
              />
            </div>

          </>
        )}
      </div>
    </div>
  );
}
