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
import type { SkillStats } from "@/types/progress";

interface SkillBreakdownChartProps {
  data: SkillStats[];
  isLoading?: boolean;
}

export default function SkillBreakdownChart({
  data,
  isLoading,
}: SkillBreakdownChartProps) {
  // Calculate average score across all skills
  const avgScore =
    data.length > 0
      ? data.reduce((sum, s) => sum + s.avg_score, 0) / data.length
      : 0;

  // Take top 10 skills
  const topSkills = data.slice(0, 10);

  // Determine color based on performance vs average
  const getBarColor = (score: number) => {
    if (score >= avgScore + 5) return "#22c55e"; // green - strength
    if (score <= avgScore - 5) return "#ef4444"; // red - weakness
    return "#3b82f6"; // blue - average
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          스킬별 성과
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          스킬별 성과
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">강점</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">평균</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">약점</span>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topSkills}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="skill"
              tick={{ fontSize: 12 }}
              width={75}
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
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="avg_score" radius={[0, 4, 4, 0]}>
              {topSkills.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.avg_score)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            전체 평균 점수
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {avgScore.toFixed(1)}점
          </span>
        </div>
      </div>
    </div>
  );
}
