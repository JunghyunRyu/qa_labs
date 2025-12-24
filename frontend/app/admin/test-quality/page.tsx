"use client";

/**
 * Admin - Test Quality Dashboard Page.
 *
 * Phase 4-3: 테스트 품질 통계 및 분석 대시보드.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  PieChart,
  TrendingUp,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getQualityStatistics } from "@/lib/api/test-quality";
import { ApiError } from "@/lib/api";
import {
  QualityStatisticsResponse,
  QualityGrade,
  GRADE_LABELS,
  GRADE_COLORS,
} from "@/types/test-quality";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

// 등급 색상 (차트용)
const CHART_GRADE_COLORS: Record<QualityGrade, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

export default function AdminTestQualityPage() {
  const [stats, setStats] = useState<QualityStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const result = await getQualityStatistics();
      setStats(result);
    } catch (err: unknown) {
      let errorMessage = "통계를 불러오는데 실패했습니다.";
      if (err instanceof ApiError) {
        const errorData = err.data as { detail?: string } | undefined;
        errorMessage = errorData?.detail || err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
        <Error message={error} onRetry={() => fetchStats()} />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // 파이 차트 데이터
  const pieData = Object.entries(stats.grade_distribution)
    .filter(([_, value]) => value > 0)
    .map(([grade, value]) => ({
      name: `${grade} (${GRADE_LABELS[grade as QualityGrade]})`,
      value,
      color: CHART_GRADE_COLORS[grade as QualityGrade],
    }));

  // 막대 차트 데이터
  const barData = (["A", "B", "C", "D", "F"] as QualityGrade[]).map((grade) => ({
    grade,
    label: GRADE_LABELS[grade],
    count: stats.grade_distribution[grade] || 0,
    fill: CHART_GRADE_COLORS[grade],
  }));

  const totalSubmissions = Object.values(stats.grade_distribution).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            테스트 품질 대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            제출된 테스트 코드의 품질 통계를 확인합니다.
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="분석된 제출"
          value={stats.analyzed_submissions}
          subValue={`전체 ${totalSubmissions}개`}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="평균 점수"
          value={stats.average_score.toFixed(1)}
          subValue="/ 100점"
          colorClass="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={<BarChart2 className="w-6 h-6" />}
          label="최다 등급"
          value={getMostCommonGrade(stats.grade_distribution)}
          subValue={GRADE_LABELS[getMostCommonGrade(stats.grade_distribution)]}
          colorClass="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 파이 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              등급 분포
            </h3>
          </div>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 막대 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              등급별 제출 수
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="grade"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => {
                    const v = typeof value === "number" ? value : 0;
                    return [`${v}개`, "제출 수"];
                  }}
                  labelFormatter={(label) =>
                    `${label}등급 (${GRADE_LABELS[label as QualityGrade]})`
                  }
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 등급 상세 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
          등급별 상세
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  등급
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  설명
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  점수 범위
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  제출 수
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  비율
                </th>
              </tr>
            </thead>
            <tbody>
              {(["A", "B", "C", "D", "F"] as QualityGrade[]).map((grade) => {
                const count = stats.grade_distribution[grade] || 0;
                const percentage =
                  totalSubmissions > 0
                    ? ((count / totalSubmissions) * 100).toFixed(1)
                    : "0.0";

                return (
                  <tr
                    key={grade}
                    className="border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white"
                        style={{
                          backgroundColor: CHART_GRADE_COLORS[grade],
                        }}
                      >
                        {grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {GRADE_LABELS[grade]}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {getScoreRange(grade)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {count}개
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-500 dark:text-gray-400">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/admin/problems"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← 문제 관리
        </Link>
        <Link
          href="/"
          className="text-gray-600 dark:text-gray-400 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
}

function StatCard({ icon, label, value, subValue, colorClass }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={colorClass}>{icon}</div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
        {subValue && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

// 최다 등급 찾기
function getMostCommonGrade(
  distribution: Record<string, number>
): QualityGrade {
  const grades: QualityGrade[] = ["A", "B", "C", "D", "F"];
  let maxGrade: QualityGrade = "C";
  let maxCount = 0;

  for (const grade of grades) {
    const count = distribution[grade] || 0;
    if (count > maxCount) {
      maxCount = count;
      maxGrade = grade;
    }
  }

  return maxGrade;
}

// 점수 범위 텍스트
function getScoreRange(grade: QualityGrade): string {
  const ranges: Record<QualityGrade, string> = {
    A: "90 ~ 100",
    B: "75 ~ 89",
    C: "60 ~ 74",
    D: "40 ~ 59",
    F: "0 ~ 39",
  };
  return ranges[grade];
}
