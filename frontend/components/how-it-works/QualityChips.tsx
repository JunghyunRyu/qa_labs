"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

type QualityChip = {
  id: string;
  label: string;
  tooltip: string;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
};

// 품질 지표 (긍정적 요소)
const qualityChips: QualityChip[] = [
  {
    id: "normal",
    label: "일반값",
    tooltip: "일반 입력값에 대한 기본 동작을 검증합니다",
    color: "blue",
  },
  {
    id: "boundary",
    label: "경계값",
    tooltip: "경계값은 실무 버그가 가장 자주 발생하는 구간입니다",
    color: "green",
  },
  {
    id: "edge",
    label: "극단값",
    tooltip: "빈 값/None 등 극단 입력에서 안정성을 확인합니다",
    color: "yellow",
  },
  {
    id: "happy_path",
    label: "정상흐름",
    tooltip: "정상 흐름이 스펙대로 동작하는지 검증합니다",
    color: "blue",
  },
  {
    id: "error_handling",
    label: "예외처리",
    tooltip: "예외/에러가 의도대로 처리되는지 확인합니다",
    color: "purple",
  },
  {
    id: "empty",
    label: "빈값",
    tooltip: "빈 입력 처리가 누락되면 품질 문제가 커집니다",
    color: "orange",
  },
  {
    id: "multiple",
    label: "다중케이스",
    tooltip: "여러 케이스를 분리해 테스트하면 회귀 탐지가 쉬워집니다",
    color: "purple",
  },
];

// 감점 요소 (안티패턴)
const penaltyChips: QualityChip[] = [
  {
    id: "flaky",
    label: "불안정",
    tooltip: "비결정적(랜덤/시간 의존) 테스트는 감점 요인입니다",
    color: "red",
  },
  {
    id: "no_assertion",
    label: "검증누락",
    tooltip: "assert 없이 실행만 하는 테스트는 버그를 잡지 못합니다",
    color: "red",
  },
  {
    id: "hardcoded",
    label: "하드코딩",
    tooltip: "특정 값에만 의존하면 다른 입력에서 실패할 수 있습니다",
    color: "red",
  },
];

const colorClasses: Record<QualityChip["color"], string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  green:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
  yellow:
    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-700",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  purple:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  orange:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
};

function Chip({
  chip,
  isActive,
  isRelevant,
  onToggle,
}: {
  chip: QualityChip;
  isActive: boolean;
  isRelevant: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="group relative inline-block">
      <button
        type="button"
        onClick={onToggle}
        className={[
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
          "cursor-pointer transition-all duration-300",
          colorClasses[chip.color],
          isActive ? "ring-2 ring-offset-1 ring-blue-400" : "",
          // 관련 칩은 scale 및 shadow로 강조
          isRelevant
            ? "scale-105 shadow-md ring-1 ring-offset-1 ring-blue-300 dark:ring-blue-600"
            : "opacity-70 hover:opacity-100",
        ].join(" ")}
        aria-expanded={isActive}
        aria-describedby={`tooltip-${chip.id}`}
      >
        {chip.label}
        <Info className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Tooltip - hover on desktop, click on mobile */}
      <div
        id={`tooltip-${chip.id}`}
        className={[
          "absolute left-1/2 -translate-x-1/2 bottom-full mb-2",
          "w-48 px-3 py-2 rounded-lg",
          "bg-gray-900 text-white text-xs text-center",
          "transition-all duration-200 z-10",
          "dark:bg-gray-700",
          // Show on hover (desktop) or when active (mobile tap)
          isActive
            ? "opacity-100 visible"
            : "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
        ].join(" ")}
        role="tooltip"
      >
        {chip.tooltip}
        {/* Tooltip Arrow */}
        <div
          className={[
            "absolute left-1/2 -translate-x-1/2 top-full",
            "border-4 border-transparent border-t-gray-900",
            "dark:border-t-gray-700",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

// 각 Step에서 관련된 품질 칩 ID
const stepRelevantChips: Record<number, string[]> = {
  1: ["normal", "boundary", "edge", "error_handling"], // 테스트 작성 시 고려할 요소
  2: ["happy_path"], // Golden Code 검증
  3: [], // 뮤턴트 생성 - 품질 칩 무관
  4: ["boundary", "edge", "error_handling"], // 탐지에 기여한 요소
  5: ["boundary", "error_handling", "multiple"], // 최종 점수에 반영된 요소
};

interface QualityChipsProps {
  activeStepId?: number;
}

export default function QualityChips({ activeStepId }: QualityChipsProps) {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 Step에서 관련된 칩들
  const relevantChipIds = activeStepId ? stepRelevantChips[activeStepId] || [] : [];

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveChip(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (chipId: string) => {
    setActiveChip((prev) => (prev === chipId ? null : chipId));
  };

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            테스트 품질 기준
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            버그 탐지율 외에도 다양한 품질 지표를 분석합니다
          </p>
        </div>
        <a
          href="/about/quality"
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--accent)" }}
        >
          자세히 보기 &rarr;
        </a>
      </div>

      {/* 품질 지표 그룹 */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          품질 지표
        </div>
        <div className="flex flex-wrap gap-2">
          {qualityChips.map((chip) => (
            <Chip
              key={chip.id}
              chip={chip}
              isActive={activeChip === chip.id}
              isRelevant={relevantChipIds.includes(chip.id)}
              onToggle={() => handleToggle(chip.id)}
            />
          ))}
        </div>
      </div>

      {/* 감점 요소 그룹 */}
      <div>
        <div className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
          감점 요소
        </div>
        <div className="flex flex-wrap gap-2">
          {penaltyChips.map((chip) => (
            <Chip
              key={chip.id}
              chip={chip}
              isActive={activeChip === chip.id}
              isRelevant={false}
              onToggle={() => handleToggle(chip.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        칩을 클릭하거나 마우스를 올리면 설명을 볼 수 있습니다
      </p>
    </div>
  );
}
