"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DifficultyStats } from "@/types/progress";

interface SolvedProblemsDonutProps {
  data: DifficultyStats[];
  isLoading?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  "Very Easy": "#22c55e", // green-500
  Easy: "#84cc16", // lime-500
  Medium: "#f59e0b", // amber-500
  Hard: "#ef4444", // red-500
};

const DIFFICULTY_LABELS: Record<string, string> = {
  "Very Easy": "입문",
  Easy: "초급",
  Medium: "중급",
  Hard: "고급",
};

const DIFFICULTY_ORDER = ["Very Easy", "Easy", "Medium", "Hard"];

export default function SolvedProblemsDonut({
  data,
  isLoading,
}: SolvedProblemsDonutProps) {
  // Sort by difficulty order
  const sortedData = [...data].sort(
    (a, b) =>
      DIFFICULTY_ORDER.indexOf(a.difficulty) -
      DIFFICULTY_ORDER.indexOf(b.difficulty)
  );

  // Calculate totals
  const totalSolved = sortedData.reduce((sum, d) => sum + d.submission_count, 0);

  // Transform data for pie chart
  const chartData = sortedData.map((item) => ({
    name: item.difficulty,
    value: item.submission_count,
    label: DIFFICULTY_LABELS[item.difficulty] || item.difficulty,
    avgScore: item.avg_score,
    successRate: item.success_rate,
  }));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          문제 풀이 현황
        </h3>
        <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        문제 풀이 현황
      </h3>

      <div className="h-[200px] sm:h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DIFFICULTY_COLORS[entry.name] || "#6b7280"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #fff)",
                border: "1px solid var(--tooltip-border, #e5e7eb)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name, props) => {
                const item = props.payload;
                return [
                  <div key="tooltip" className="text-sm">
                    <div className="font-medium">{item.label}: {value}회</div>
                    <div className="text-gray-500 text-xs">평균 {item.avgScore.toFixed(1)}점</div>
                  </div>,
                  "",
                ];
              }}
              labelFormatter={() => ""}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {totalSolved}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              총 제출
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: DIFFICULTY_COLORS[item.name] }}
            />
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 block truncate">
                {item.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.value}회
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
