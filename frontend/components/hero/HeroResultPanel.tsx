"use client";

/**
 * HeroResultPanel Component
 *
 * Hero 섹션에 표시되는 채점 결과 미리보기 패널.
 * 탐지율 + 품질 등급 + AI 요약을 한눈에 보여줌.
 */

import { Target, Award, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

// ============================================================
// Sub-Components
// ============================================================

/** 버그 탐지 카드 */
function DetectionRateCard({
  killed,
  total,
}: {
  killed: number;
  total: number;
}) {
  // SVG 원형 게이지
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (killed / total) * circumference;

  return (
    <div className="flex flex-col items-center p-4 bg-white/[0.08] backdrop-blur border border-white/15 rounded-xl hover:bg-white/[0.12] hover:border-white/25 transition-colors">
      {/* 라벨 */}
      <div className="flex items-center gap-1.5 mb-3">
        <Target className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-white/60">잡은 버그</span>
      </div>

      {/* 원형 게이지 */}
      <div className="relative">
        <svg width="90" height="90" className="-rotate-90">
          <defs>
            <linearGradient
              id="hero-gauge-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* 배경 원 */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke="currentColor"
            className="text-white/20"
            strokeWidth="6"
            fill="none"
          />
          {/* 진행률 원 */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            stroke="url(#hero-gauge-gradient)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* 중앙 분수 표기 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{killed}/{total}</span>
        </div>
      </div>

      {/* 하단 라벨 */}
      <div className="mt-2 text-sm text-white/75">
        숨은 버그{" "}
        <span className="font-semibold text-emerald-400">
          {total}개 중 {killed}개
        </span>{" "}
        발견
      </div>
    </div>
  );
}

/** 테스트 품질 등급 카드 */
function QualityGradeCard({
  grade,
  chips,
}: {
  grade: string;
  chips: string[];
}) {
  return (
    <div className="flex flex-col items-center p-4 bg-white/[0.08] backdrop-blur border border-white/15 rounded-xl hover:bg-white/[0.12] hover:border-white/25 transition-colors">
      {/* 라벨 */}
      <div className="flex items-center gap-1.5 mb-3">
        <Award className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-white/60">테스트 품질</span>
      </div>

      {/* 등급 뱃지 */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400/40">
        <span className="text-3xl font-bold text-blue-400">{grade}</span>
      </div>

      {/* 커버리지 칩 */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
        {chips.map((chip) => (
          <span
            key={chip}
            className="px-2 py-0.5 text-xs font-medium bg-white/10 text-white/80 border border-white/20 rounded-full"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

/** AI 요약 카드 */
function AISummaryCard({
  summary,
  suggestions,
}: {
  summary: string;
  suggestions: string[];
}) {
  return (
    <div className="flex flex-col p-4 bg-white/[0.08] backdrop-blur border border-white/15 rounded-xl hover:bg-white/[0.12] hover:border-white/25 transition-colors">
      {/* 라벨 */}
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-medium text-white/60">AI 요약</span>
      </div>

      {/* 요약 */}
      <p className="text-sm font-medium text-white/90 mb-3 whitespace-nowrap">{summary}</p>

      {/* 개선 제안 */}
      <div className="space-y-1.5">
        {suggestions.map((suggestion, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            {idx === 0 ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-white/75">{suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

interface HeroResultPanelProps {
  /** 버그 탐지율 데이터 */
  killRatio?: { killed: number; total: number };
  /** 품질 등급 */
  grade?: string;
  /** 커버리지 칩 */
  chips?: string[];
  /** AI 요약 */
  aiSummary?: {
    summary: string;
    suggestions: string[];
  };
}

const defaultProps: Required<HeroResultPanelProps> = {
  killRatio: { killed: 3, total: 4 },
  grade: "B+",
  chips: ["경계값", "예외처리", "다중케이스"],
  aiSummary: {
    summary: "케이스 누락: 음수·빈 리스트",
    suggestions: [
      "빈 리스트 테스트 추가",
      "음수 값 테스트 추가",
    ],
  },
};

export default function HeroResultPanel({
  killRatio = defaultProps.killRatio,
  grade = defaultProps.grade,
  chips = defaultProps.chips,
  aiSummary = defaultProps.aiSummary,
}: HeroResultPanelProps) {
  return (
    <div className="w-full max-w-xl lg:max-w-2xl">
      {/* 상단 라벨 */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs text-white/50 whitespace-nowrap">
          실제 채점 결과 예시
        </span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      {/* 3컬럼 그리드 (모바일: 세로 스택) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DetectionRateCard
          killed={killRatio.killed}
          total={killRatio.total}
        />
        <QualityGradeCard grade={grade} chips={chips} />
        <AISummaryCard
          summary={aiSummary.summary}
          suggestions={aiSummary.suggestions}
        />
      </div>
    </div>
  );
}
