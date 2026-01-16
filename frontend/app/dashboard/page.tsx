"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  History,
  Filter,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUserRank } from "@/lib/rank";
import RankBadge from "@/components/RankBadge";
import { getProgressSummary, getProgressTimeline } from "@/lib/api/progress";
import { getMySubmissions } from "@/lib/api/users";
import type {
  ProgressSummary,
  ProgressTimeline,
  TimeRange,
} from "@/types/progress";
import type {
  UserSubmissionsResponse,
  SubmissionFilters as FiltersType,
} from "@/types/submission";
import { isProgressEmpty } from "@/types/progress";
import SubmissionFilters from "@/components/SubmissionFilters";
import SubmissionHistoryTable from "@/components/SubmissionHistoryTable";

// Dynamic imports for chart components to avoid SSR issues with recharts
const ProgressTimelineChart = dynamic(
  () => import("@/components/dashboard/ProgressTimelineChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const SkillRadarChart = dynamic(
  () => import("@/components/dashboard/SkillRadarChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PAGE_SIZE = 10;

function ChartSkeleton() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-[250px] bg-slate-800 rounded"></div>
      </div>
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <div className="animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  valueColor?: string;
}

function KPICard({ title, value, subtitle, icon, iconBgColor = "bg-slate-800", valueColor = "text-slate-100" }: KPICardProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${valueColor} truncate`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${iconBgColor} p-2 rounded-lg flex-shrink-0 ml-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
        <BarChart3 className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-100 mb-2">
        아직 제출 기록이 없습니다
      </h2>
      <p className="text-slate-400 mb-6">
        첫 문제를 풀어보세요! 여러분의 성장 과정을 기록해 드립니다.
      </p>
      <a
        href="/problems"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
      >
        문제 풀러 가기
      </a>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Progress data states
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeline, setTimeline] = useState<ProgressTimeline | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  // Submission states (Zone C)
  const [submissions, setSubmissions] = useState<UserSubmissionsResponse | null>(null);
  const [filters, setFilters] = useState<FiltersType>({});
  const [submissionPage, setSubmissionPage] = useState(1);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

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

  // Fetch submissions (Zone C)
  const fetchSubmissions = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingSubmissions(true);
    try {
      const data = await getMySubmissions(
        submissionPage,
        PAGE_SIZE,
        filters.result,
        filters.days
      );
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [isAuthenticated, submissionPage, filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Handle filter change
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setSubmissionPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setSubmissionPage(newPage);
  };

  // Calculate derived values
  const successRate = summary
    ? summary.total_submissions > 0
      ? (summary.success_submissions / summary.total_submissions) * 100
      : 0
    : 0;

  // Use SDET Career Path rank system
  const solvedCount = user?.solved_count || 0;
  const rankResult = getUserRank(solvedCount, successRate);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {user?.username || "사용자"}님의 미션 리포트
          </h1>
          <p className="mt-2 text-slate-400">
            지난 {timeRange === "7d" ? "7일" : timeRange === "30d" ? "30일" : timeRange === "90d" ? "90일" : "전체"} 간의 성장 기록입니다.
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-rose-900/20 border border-rose-800 rounded-lg text-rose-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingSummary && isEmpty && <EmptyState />}

        {/* Dashboard Content */}
        {!isEmpty && (
          <>
            {/* Zone A: KPI Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {isLoadingSummary ? (
                <>
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                </>
              ) : summary ? (
                <>
                  <KPICard
                    title="총 미션 수행"
                    value={summary.total_submissions}
                    subtitle={`성공 ${summary.success_submissions}회`}
                    icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
                    iconBgColor="bg-blue-500/10"
                  />
                  <KPICard
                    title="성공률"
                    value={`${successRate.toFixed(1)}%`}
                    subtitle={`최근 10회 평균 ${summary.recent_avg_score.toFixed(0)}점`}
                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                    iconBgColor="bg-emerald-500/10"
                    valueColor="text-emerald-400"
                  />
                  <KPICard
                    title="Bug Kill Ratio"
                    value={summary.avg_kill_ratio.toFixed(2)}
                    subtitle="평균 버그 탐지율"
                    icon={<Target className="w-5 h-5 text-rose-400" />}
                    iconBgColor="bg-rose-500/10"
                    valueColor="text-rose-400"
                  />
                  <KPICard
                    title="현재 랭크"
                    value={`${rankResult.current.icon} ${rankResult.current.name}`}
                    subtitle={
                      rankResult.isMaxRank
                        ? "🎉 최고 랭크 달성!"
                        : `다음 랭크까지 ${rankResult.solvedToNext}문제`
                    }
                    icon={<Trophy className="w-5 h-5 text-amber-400" />}
                    iconBgColor="bg-amber-500/10"
                    valueColor={rankResult.current.color}
                  />
                </>
              ) : null}
            </section>

            {/* Zone B: Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Timeline Chart - 2 columns */}
              <div className="lg:col-span-2">
                <ProgressTimelineChart
                  data={timeline?.entries || []}
                  range={timeRange}
                  onRangeChange={setTimeRange}
                  isLoading={isLoadingTimeline}
                />
              </div>

              {/* Skill Radar Chart - 1 column */}
              <div className="lg:col-span-1">
                <SkillRadarChart
                  data={summary?.skill_stats || []}
                  isLoading={isLoadingSummary}
                />
              </div>
            </section>

            {/* Zone C: Submission History */}
            <section className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              {/* Section Header with Filters */}
              <div className="p-4 sm:p-6 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-100">
                      제출 기록
                    </h2>
                    {submissions && (
                      <span className="text-sm text-slate-500">
                        ({submissions.total}건)
                      </span>
                    )}
                  </div>
                  <SubmissionFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </div>

              {/* Submission Table */}
              <div className="p-4 sm:p-6 pt-0 sm:pt-0">
                {isLoadingSubmissions ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : submissions ? (
                  <SubmissionHistoryTable
                    submissions={submissions.submissions}
                    page={submissions.page}
                    totalPages={submissions.total_pages}
                    total={submissions.total}
                    onPageChange={handlePageChange}
                  />
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
