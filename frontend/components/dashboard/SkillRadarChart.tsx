"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SkillStats } from "@/types/progress";

interface SkillRadarChartProps {
  data: SkillStats[];
  isLoading?: boolean;
}

export default function SkillRadarChart({
  data,
  isLoading,
}: SkillRadarChartProps) {
  // Take top 8 skills by submission count for radar readability
  const topSkills = [...data]
    .sort((a, b) => b.submission_count - a.submission_count)
    .slice(0, 8)
    .map((skill) => ({
      skill: skill.skill.length > 10 ? skill.skill.slice(0, 10) + "..." : skill.skill,
      fullName: skill.skill,
      score: skill.avg_score,
      count: skill.submission_count,
    }));

  // Calculate average score
  const avgScore =
    data.length > 0
      ? data.reduce((sum, s) => sum + s.avg_score, 0) / data.length
      : 0;

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
          <div className="h-[250px] bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          스킬 분석
        </h3>
        <div className="h-[250px] flex items-center justify-center text-slate-500">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">
          스킬 분석
        </h3>
        <span className="text-xs text-slate-500">
          상위 {topSkills.length}개 스킬
        </span>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={topSkills} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={{ stroke: "#475569" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickCount={5}
              axisLine={{ stroke: "#475569" }}
            />
            <Radar
              name="평균 점수"
              dataKey="score"
              stroke="#818cf8"
              fill="#818cf8"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#e2e8f0" }}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(1)}점`, "평균 점수"]}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload;
                return item?.fullName || "";
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">전체 평균 점수</span>
          <span className="font-medium text-slate-100">
            {avgScore.toFixed(1)}점
          </span>
        </div>
      </div>
    </div>
  );
}
