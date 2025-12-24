"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TimelineEntry, TimeRange } from "@/types/progress";
import TimeRangeFilter from "./TimeRangeFilter";

interface ProgressTimelineChartProps {
  data: TimelineEntry[];
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

export default function ProgressTimelineChart({
  data,
  range,
  onRangeChange,
  isLoading,
}: ProgressTimelineChartProps) {
  const [showKillRatio, setShowKillRatio] = useState(true);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Transform data for chart
  const chartData = data.map((entry) => ({
    ...entry,
    date: formatDate(entry.date),
    fullDate: entry.date,
    kill_ratio_percent: entry.avg_kill_ratio * 100,
  }));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          점수 추이
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showKillRatio}
              onChange={(e) => setShowKillRatio(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Kill Ratio 표시
          </label>
          <TimeRangeFilter value={range} onChange={onRangeChange} />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          선택한 기간에 데이터가 없습니다.
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, #fff)",
                  border: "1px solid var(--tooltip-border, #e5e7eb)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
                formatter={(value, name) => {
                  const v = typeof value === "number" ? value : 0;
                  if (name === "avg_score") return [`${v.toFixed(1)}점`, "평균 점수"];
                  if (name === "kill_ratio_percent") return [`${v.toFixed(1)}%`, "Kill Ratio"];
                  return [v, name];
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === "avg_score") return "평균 점수";
                  if (value === "kill_ratio_percent") return "Kill Ratio";
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              {showKillRatio && (
                <Line
                  type="monotone"
                  dataKey="kill_ratio_percent"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        총 {data.reduce((sum, d) => sum + d.submission_count, 0)}회 제출
      </div>
    </div>
  );
}
