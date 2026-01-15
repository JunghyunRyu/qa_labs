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
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
          <div className="h-[200px] sm:h-[300px] bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-slate-100">
          점수 추이
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showKillRatio}
              onChange={(e) => setShowKillRatio(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
            Kill Ratio 표시
          </label>
          <TimeRangeFilter value={range} onChange={onRangeChange} />
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-slate-500">
          선택한 기간에 데이터가 없습니다.
        </div>
      ) : (
        <div className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#475569" }}
                tickLine={{ stroke: "#475569" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={{ stroke: "#475569" }}
                tickLine={{ stroke: "#475569" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{ color: "#e2e8f0" }}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
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
                wrapperStyle={{ color: "#94a3b8" }}
                formatter={(value) => {
                  if (value === "avg_score") return <span className="text-slate-300">평균 점수</span>;
                  if (value === "kill_ratio_percent") return <span className="text-slate-300">Kill Ratio</span>;
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ fill: "#818cf8", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, fill: "#818cf8" }}
              />
              {showKillRatio && (
                <Line
                  type="monotone"
                  dataKey="kill_ratio_percent"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: "#34d399", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, fill: "#34d399" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 text-sm text-slate-500 text-center">
        총 {data.reduce((sum, d) => sum + d.submission_count, 0)}회 제출
      </div>
    </div>
  );
}
