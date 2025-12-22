"use client";

/**
 * Quality Gauge Component.
 *
 * Phase 4-2: 테스트 품질 점수를 원형 게이지로 표시.
 */

import { Trophy, Award, Star, Zap } from "lucide-react";
import {
  QualityGrade,
  GRADE_LABELS,
  getGradeFromScore,
  getGradeColor,
  getGradeBgColor,
} from "@/types/test-quality";

interface QualityGaugeProps {
  score: number;
  grade?: QualityGrade;
  testCount?: number;
  effectiveTestCount?: number;
  confidence?: number;
  showDetails?: boolean;
}

export default function QualityGauge({
  score,
  grade,
  testCount,
  effectiveTestCount,
  confidence,
  showDetails = true,
}: QualityGaugeProps) {
  const displayGrade = grade || getGradeFromScore(score);
  const gradeColor = getGradeColor(displayGrade);
  const gradeBgColor = getGradeBgColor(displayGrade);

  // SVG 원형 진행률
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGradientId = (grade: QualityGrade) => {
    const colors: Record<QualityGrade, { start: string; end: string }> = {
      A: { start: "#22c55e", end: "#16a34a" },
      B: { start: "#3b82f6", end: "#2563eb" },
      C: { start: "#eab308", end: "#ca8a04" },
      D: { start: "#f97316", end: "#ea580c" },
      F: { start: "#ef4444", end: "#dc2626" },
    };
    return colors[grade];
  };

  const gradient = getGradientId(displayGrade);

  return (
    <div className={`rounded-xl border-2 p-6 ${gradeBgColor}`}>
      <div className="flex items-center gap-6">
        {/* 원형 게이지 */}
        <div className="relative flex-shrink-0">
          <svg width="150" height="150" className="-rotate-90">
            <defs>
              <linearGradient
                id={`gauge-gradient-${displayGrade}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={gradient.start} />
                <stop offset="100%" stopColor={gradient.end} />
              </linearGradient>
            </defs>
            {/* 배경 원 */}
            <circle
              cx="75"
              cy="75"
              r={radius}
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="10"
              fill="none"
            />
            {/* 진행률 원 */}
            <circle
              cx="75"
              cy="75"
              r={radius}
              stroke={`url(#gauge-gradient-${displayGrade})`}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* 중앙 점수 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${gradeColor}`}>{score}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">점</span>
          </div>
        </div>

        {/* 정보 영역 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className={`w-8 h-8 ${gradeColor}`} />
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                테스트 품질 등급
              </div>
              <div className={`text-3xl font-bold ${gradeColor}`}>
                {displayGrade} ({GRADE_LABELS[displayGrade]})
              </div>
            </div>
          </div>

          {showDetails && (
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              {testCount !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    테스트 함수:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {testCount}개
                    </span>
                  </span>
                </div>
              )}
              {effectiveTestCount !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    유효 케이스:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {effectiveTestCount}개
                    </span>
                    {effectiveTestCount > (testCount || 0) && (
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        (parametrize 확장)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {confidence !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    분석 신뢰도:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(confidence * 100).toFixed(0)}%
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
