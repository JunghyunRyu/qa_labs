"use client";

/**
 * Breakdown Chart Component.
 *
 * Phase 4-2: 테스트 품질 점수 세부 내역을 차트로 표시.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { CheckCircle, XCircle, AlertCircle, BarChart2 } from "lucide-react";
import {
  ScoringBreakdown,
  VALUE_TYPE_LABELS,
  INPUT_DIVERSITY_LABELS,
  TEST_PURPOSE_LABELS,
  TOTAL_VALUE_TYPES,
  TOTAL_INPUT_DIVERSITIES,
  TOTAL_TEST_PURPOSES,
  calculateCoverage,
} from "@/types/test-quality";

interface BreakdownChartProps {
  breakdown?: ScoringBreakdown;
  valueTypes: string[];
  inputDiversities: string[];
  testPurposes: string[];
  showScoreBreakdown?: boolean;
}

// 차트 색상
const CHART_COLORS = {
  valueType: "#22c55e",
  inputDiversity: "#3b82f6",
  testPurpose: "#a855f7",
  penalty: "#ef4444",
};

export default function BreakdownChart({
  breakdown,
  valueTypes,
  inputDiversities,
  testPurposes,
  showScoreBreakdown = true,
}: BreakdownChartProps) {
  // 점수 세부 데이터
  const scoreData = breakdown
    ? [
        {
          name: "값 유형",
          score: breakdown.value_type_score,
          max: 35,
          color: CHART_COLORS.valueType,
        },
        {
          name: "입력 다양성",
          score: breakdown.input_diversity_score,
          max: 30,
          color: CHART_COLORS.inputDiversity,
        },
        {
          name: "테스트 목적",
          score: breakdown.test_purpose_score,
          max: 35,
          color: CHART_COLORS.testPurpose,
        },
      ]
    : [];

  // 커버리지 계산
  const valueCoverage = calculateCoverage(valueTypes, TOTAL_VALUE_TYPES);
  const diversityCoverage = calculateCoverage(
    inputDiversities,
    TOTAL_INPUT_DIVERSITIES
  );
  const purposeCoverage = calculateCoverage(testPurposes, TOTAL_TEST_PURPOSES);

  // 커버리지 데이터
  const coverageData = [
    {
      name: "값 유형",
      covered: valueCoverage.count,
      total: TOTAL_VALUE_TYPES,
      percentage: valueCoverage.percentage,
      color: CHART_COLORS.valueType,
    },
    {
      name: "입력 다양성",
      covered: diversityCoverage.count,
      total: TOTAL_INPUT_DIVERSITIES,
      percentage: diversityCoverage.percentage,
      color: CHART_COLORS.inputDiversity,
    },
    {
      name: "테스트 목적",
      covered: purposeCoverage.count,
      total: TOTAL_TEST_PURPOSES,
      percentage: purposeCoverage.percentage,
      color: CHART_COLORS.testPurpose,
    },
  ];

  // 파이 차트 데이터
  const pieData = coverageData.map((d) => ({
    name: d.name,
    value: d.covered,
    remaining: d.total - d.covered,
    fill: d.color,
  }));

  const getCoverageIcon = (percentage: number) => {
    if (percentage >= 80)
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (percentage >= 50)
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* 점수 세부 내역 (막대 차트) */}
      {showScoreBreakdown && breakdown && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              점수 세부 내역
            </h4>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  type="number"
                  domain={[0, 35]}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value, _name, props) => {
                    const v = typeof value === "number" ? value : 0;
                    const payload = props as { payload?: { max?: number } };
                    return [`${v.toFixed(1)} / ${payload.payload?.max || 0}`, "점수"];
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 안티패턴 감점 */}
          {breakdown.antipattern_penalty < 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  안티패턴 감점
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {breakdown.antipattern_penalty}점
                </span>
              </div>
            </div>
          )}

          {/* 최종 점수 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                최종 점수
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {breakdown.final_score.toFixed(1)}점
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 커버리지 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          카테고리 커버리지
        </h4>

        <div className="space-y-4">
          {coverageData.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCoverageIcon(category.percentage)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${getCoverageColor(
                    category.percentage
                  )}`}
                >
                  {category.covered}/{category.total} (
                  {category.percentage.toFixed(0)}%)
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 커버된 항목 상세 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CategoryList
          title="값 유형"
          items={valueTypes}
          labelMap={VALUE_TYPE_LABELS}
          color={CHART_COLORS.valueType}
        />
        <CategoryList
          title="입력 다양성"
          items={inputDiversities}
          labelMap={INPUT_DIVERSITY_LABELS}
          color={CHART_COLORS.inputDiversity}
        />
        <CategoryList
          title="테스트 목적"
          items={testPurposes}
          labelMap={TEST_PURPOSE_LABELS}
          color={CHART_COLORS.testPurpose}
        />
      </div>
    </div>
  );
}

// 카테고리 목록 컴포넌트
interface CategoryListProps {
  title: string;
  items: string[];
  labelMap: Record<string, string>;
  color: string;
}

function CategoryList({ title, items, labelMap, color }: CategoryListProps) {
  const uniqueItems = [
    ...new Set(items.filter((i) => i.toLowerCase() !== "unknown")),
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <h5
        className="text-sm font-medium mb-2"
        style={{ color }}
      >
        {title}
      </h5>
      {uniqueItems.length > 0 ? (
        <ul className="space-y-1">
          {uniqueItems.map((item) => (
            <li
              key={item}
              className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {labelMap[item.toLowerCase()] || item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          해당 없음
        </p>
      )}
    </div>
  );
}
