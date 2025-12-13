/**
 * Submission statistics component with charts.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import type { UserStatisticsResponse, Difficulty } from "@/types/submission";
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  BarChart3,
  Activity,
} from "lucide-react";

interface SubmissionStatisticsProps {
  statistics: UserStatisticsResponse;
}

const difficultyOrder: Difficulty[] = ["Very Easy", "Easy", "Medium", "Hard"];
const difficultyLabels: Record<Difficulty, string> = {
  "Very Easy": "아주쉬움",
  Easy: "쉬움",
  Medium: "보통",
  Hard: "어려움",
};
const difficultyColors: Record<Difficulty, string> = {
  "Very Easy": "#3b82f6", // blue-500
  Easy: "#22c55e", // green-500
  Medium: "#eab308", // yellow-500
  Hard: "#ef4444", // red-500
};

function StatCard({
  icon,
  label,
  value,
  subValue,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      {subValue && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subValue}
        </p>
      )}
    </div>
  );
}

export default function SubmissionStatistics({
  statistics,
}: SubmissionStatisticsProps) {
  // Prepare difficulty chart data
  const difficultyData = difficultyOrder
    .filter((d) => statistics.by_difficulty[d])
    .map((difficulty) => ({
      name: difficultyLabels[difficulty],
      attempted: statistics.by_difficulty[difficulty]?.attempted || 0,
      solved: statistics.by_difficulty[difficulty]?.solved || 0,
      fill: difficultyColors[difficulty],
    }));

  // Prepare recent activity data (last 14 days for chart)
  const activityData = [...statistics.recent_activity]
    .slice(0, 14)
    .reverse()
    .map((item) => ({
      date: formatDateShort(item.date),
      submissions: item.submissions,
    }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          label="총 제출"
          value={statistics.total_submissions}
          colorClass="bg-blue-100 dark:bg-blue-900/40"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-purple-600" />}
          label="시도한 문제"
          value={statistics.total_problems_attempted}
          colorClass="bg-purple-100 dark:bg-purple-900/40"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          label="해결한 문제"
          value={statistics.total_problems_solved}
          colorClass="bg-green-100 dark:bg-green-900/40"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-cyan-600" />}
          label="성공률"
          value={`${statistics.success_rate}%`}
          colorClass="bg-cyan-100 dark:bg-cyan-900/40"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-orange-600" />}
          label="평균 점수"
          value={statistics.avg_score.toFixed(1)}
          colorClass="bg-orange-100 dark:bg-orange-900/40"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-yellow-600" />}
          label="최고 점수"
          value={statistics.best_score}
          colorClass="bg-yellow-100 dark:bg-yellow-900/40"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Difficulty breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            난이도별 현황
          </h3>
          {difficultyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis type="number" tick={{ fill: "#9ca3af" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={60}
                    tick={{ fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f3f4f6",
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "attempted" ? "시도" : "해결",
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ color: "#9ca3af" }}>
                        {value === "attempted" ? "시도" : "해결"}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: "10px" }}
                  />
                  <Bar
                    dataKey="attempted"
                    fill="#94a3b8"
                    name="attempted"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="solved"
                    fill="#10b981"
                    name="solved"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              아직 데이터가 없습니다
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            최근 활동
          </h3>
          {activityData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f3f4f6",
                    }}
                    formatter={(value: number) => [`${value}회`, "제출"]}
                  />
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorSubmissions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              최근 30일간 활동이 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
