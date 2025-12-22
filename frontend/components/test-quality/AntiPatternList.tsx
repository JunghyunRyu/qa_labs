"use client";

/**
 * AntiPattern List Component.
 *
 * Phase 4-2: 감지된 안티패턴 목록을 표시.
 */

import { AlertTriangle, XOctagon, FileCode, Info } from "lucide-react";
import { AntiPatternDetail, ANTIPATTERN_LABELS } from "@/types/test-quality";

interface AntiPatternListProps {
  antipatterns: AntiPatternDetail[];
  showEmpty?: boolean;
}

// 안티패턴 설명
const ANTIPATTERN_DESCRIPTIONS: Record<string, string> = {
  NO_ASSERTION:
    "테스트에 assertion이 없습니다. 테스트는 기대 결과를 검증해야 합니다.",
  EXCEPTION_SWALLOWED:
    "예외가 발생할 것으로 예상되지만 예외를 검증하지 않습니다.",
  MAGIC_NUMBER: "매직 넘버가 사용되었습니다. 상수나 변수로 대체하세요.",
  DUPLICATE_TEST: "중복된 테스트 케이스가 있습니다.",
  EMPTY_TEST: "테스트 본문이 비어있습니다.",
  ASSERTION_ROULETTE:
    "여러 assertion이 설명 없이 나열되어 있습니다.",
  CONDITIONAL_TEST:
    "테스트 내에 조건문이 있어 일부 경로가 테스트되지 않을 수 있습니다.",
};

// 안티패턴 심각도
const ANTIPATTERN_SEVERITY: Record<
  string,
  "critical" | "warning" | "info"
> = {
  NO_ASSERTION: "critical",
  EXCEPTION_SWALLOWED: "warning",
  MAGIC_NUMBER: "info",
  DUPLICATE_TEST: "warning",
  EMPTY_TEST: "critical",
  ASSERTION_ROULETTE: "info",
  CONDITIONAL_TEST: "info",
};

export default function AntiPatternList({
  antipatterns,
  showEmpty = true,
}: AntiPatternListProps) {
  if (antipatterns.length === 0) {
    if (!showEmpty) return null;

    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <Info className="w-5 h-5" />
          <span className="font-medium">안티패턴이 감지되지 않았습니다</span>
        </div>
        <p className="mt-2 text-sm text-green-600 dark:text-green-500">
          테스트 코드가 좋은 품질을 유지하고 있습니다.
        </p>
      </div>
    );
  }

  // 심각도별 그룹화
  const criticalPatterns = antipatterns.filter(
    (ap) => ANTIPATTERN_SEVERITY[ap.type] === "critical"
  );
  const warningPatterns = antipatterns.filter(
    (ap) => ANTIPATTERN_SEVERITY[ap.type] === "warning"
  );
  const infoPatterns = antipatterns.filter(
    (ap) =>
      ANTIPATTERN_SEVERITY[ap.type] === "info" ||
      !ANTIPATTERN_SEVERITY[ap.type]
  );

  const totalPenalty = antipatterns.reduce((sum, ap) => sum + ap.penalty, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            감지된 안티패턴 ({antipatterns.length}개)
          </h4>
        </div>
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          총 {totalPenalty}점 감점
        </span>
      </div>

      <div className="space-y-3">
        {/* Critical */}
        {criticalPatterns.length > 0 && (
          <AntiPatternGroup
            severity="critical"
            patterns={criticalPatterns}
          />
        )}

        {/* Warning */}
        {warningPatterns.length > 0 && (
          <AntiPatternGroup
            severity="warning"
            patterns={warningPatterns}
          />
        )}

        {/* Info */}
        {infoPatterns.length > 0 && (
          <AntiPatternGroup
            severity="info"
            patterns={infoPatterns}
          />
        )}
      </div>
    </div>
  );
}

interface AntiPatternGroupProps {
  severity: "critical" | "warning" | "info";
  patterns: AntiPatternDetail[];
}

function AntiPatternGroup({ severity, patterns }: AntiPatternGroupProps) {
  const severityStyles = {
    critical: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      icon: <XOctagon className="w-4 h-4 text-red-500" />,
      text: "text-red-700 dark:text-red-400",
      label: "심각",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      text: "text-yellow-700 dark:text-yellow-400",
      label: "주의",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      icon: <Info className="w-4 h-4 text-blue-500" />,
      text: "text-blue-700 dark:text-blue-400",
      label: "정보",
    },
  };

  const style = severityStyles[severity];

  return (
    <div
      className={`rounded-lg border ${style.bg} ${style.border} overflow-hidden`}
    >
      {patterns.map((pattern, index) => (
        <div
          key={`${pattern.type}-${pattern.location}-${index}`}
          className={`p-3 ${
            index < patterns.length - 1
              ? `border-b ${style.border}`
              : ""
          }`}
        >
          <div className="flex items-start gap-3">
            {style.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-medium text-sm ${style.text}`}>
                  {ANTIPATTERN_LABELS[pattern.type] || pattern.type}
                </span>
                <span className="text-xs font-semibold text-red-500 flex-shrink-0">
                  {pattern.penalty}점
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FileCode className="w-3 h-3" />
                <span className="truncate">{pattern.location}</span>
                {pattern.line && (
                  <span className="text-gray-400 dark:text-gray-500">
                    (line {pattern.line})
                  </span>
                )}
              </div>

              {ANTIPATTERN_DESCRIPTIONS[pattern.type] && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {ANTIPATTERN_DESCRIPTIONS[pattern.type]}
                </p>
              )}

              {pattern.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 italic">
                  {pattern.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
