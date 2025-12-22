"use client";

/**
 * Test Quality Panel Component.
 *
 * Phase 4-2: 테스트 품질 분석 결과를 통합 표시하는 패널.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Loader2 } from "lucide-react";
import QualityGauge from "./QualityGauge";
import BreakdownChart from "./BreakdownChart";
import AntiPatternList from "./AntiPatternList";
import HintDisplay from "./HintDisplay";
import {
  QualityGrade,
  TestQualityAnalysis,
  HintGenerationResult,
} from "@/types/test-quality";
import { getTestHints } from "@/lib/api/test-quality";
import { ApiError } from "@/lib/api";

interface TestQualityPanelProps {
  submissionId: string;
  score?: number;
  grade?: QualityGrade;
  analysis?: TestQualityAnalysis;
  showHints?: boolean;
  defaultExpanded?: boolean;
}

export default function TestQualityPanel({
  submissionId,
  score,
  grade,
  analysis,
  showHints = true,
  defaultExpanded = false,
}: TestQualityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hints, setHints] = useState<HintGenerationResult | null>(null);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsError, setHintsError] = useState<string | null>(null);

  // 분석 결과가 없으면 표시하지 않음
  if (!analysis && score === undefined) {
    return null;
  }

  const displayScore = score ?? analysis?.scoring_breakdown?.final_score ?? 0;
  const displayGrade = grade;

  const handleLoadHints = async () => {
    if (hints) return; // 이미 로드됨

    setHintsLoading(true);
    setHintsError(null);

    try {
      const result = await getTestHints(submissionId);
      setHints(result);
    } catch (error) {
      if (error instanceof ApiError) {
        setHintsError(error.message);
      } else {
        setHintsError("힌트를 불러오는데 실패했습니다.");
      }
    } finally {
      setHintsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            테스트 품질 분석
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isExpanded ? "접기" : "펼치기"}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 게이지 (항상 표시) */}
      <div className="p-4">
        <QualityGauge
          score={displayScore}
          grade={displayGrade}
          testCount={analysis?.test_count}
          effectiveTestCount={analysis?.effective_test_count}
          confidence={analysis?.overall_confidence}
          showDetails={isExpanded}
        />
      </div>

      {/* 확장 내용 */}
      {isExpanded && analysis && (
        <div className="px-4 pb-4 space-y-4">
          {/* 점수 세부 및 커버리지 */}
          <BreakdownChart
            breakdown={analysis.scoring_breakdown}
            valueTypes={analysis.value_types}
            inputDiversities={analysis.input_diversities}
            testPurposes={analysis.test_purposes}
          />

          {/* 안티패턴 목록 */}
          <AntiPatternList antipatterns={analysis.antipatterns} />

          {/* 힌트 섹션 */}
          {showHints && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    개선 힌트
                  </h4>
                </div>
                {!hints && !hintsLoading && (
                  <button
                    onClick={handleLoadHints}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    힌트 보기
                  </button>
                )}
              </div>

              {hintsLoading && (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  힌트를 생성하는 중...
                </div>
              )}

              {hintsError && (
                <div className="text-sm text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  {hintsError}
                </div>
              )}

              {hints && <HintDisplay hints={hints} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
