"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DifficultyStats } from "@/types/progress";

interface DifficultyBreakdownChartProps {
  data: DifficultyStats[];
  isLoading?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  "Very Easy": "#22c55e", // green-500
  Easy: "#84cc16", // lime-500
  Medium: "#f59e0b", // amber-500
  Hard: "#ef4444", // red-500
};

const DIFFICULTY_ORDER = ["Very Easy", "Easy", "Medium", "Hard"];

export default function DifficultyBreakdownChart({
  data,
  isLoading,
}: DifficultyBreakdownChartProps) {
  // Sort by difficulty order
  const sortedData = [...data].sort(
    (a, b) =>
      DIFFICULTY_ORDER.indexOf(a.difficulty) -
      DIFFICULTY_ORDER.indexOf(b.difficulty)
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-[250px] bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          난이도별 성과
        </h3>
        <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        난이도별 성과
      </h3>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="difficulty"
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #fff)",
                border: "1px solid var(--tooltip-border, #e5e7eb)",
                borderRadius: "8px",
              }}
              formatter={(value, name) => {
                const v = typeof value === "number" ? value : 0;
                if (name === "avg_score") return [`${v.toFixed(1)}점`, "평균 점수"];
                return [v, name];
              }}
              labelFormatter={(label) => `${label} 난이도`}
            />
            <Bar dataKey="avg_score" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DIFFICULTY_COLORS[entry.difficulty] || "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with details */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {sortedData.map((stat) => (
          <div
            key={stat.difficulty}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: DIFFICULTY_COLORS[stat.difficulty] }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {stat.difficulty}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stat.submission_count}회
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                ({(stat.success_rate * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
