"use client";

/**
 * HeroStarter Component
 *
 * Hero 하단의 통합 시작 모듈.
 * 도메인 선택 칩 + 추천 문제 카드를 단일 박스로 제공.
 * 도메인 선택 시 추천 문제가 동적으로 변경됨.
 * localStorage에 선택 도메인 저장 (재방문 시 유지)
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = "qa-arena-selected-domain";
const FALLBACK_DOMAIN = "common";

// ============================================================
// Types
// ============================================================

interface Domain {
  key: string;
  label: string;
  title: string;
  hint: string;
}

interface RecommendedProblem {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  mutants: number;
  href: string;
}

interface HeroStarterProps {
  /** 도메인 목록 */
  domains: Domain[];
  /** 도메인별 추천 문제 매핑 */
  recommendedProblems: Record<string, RecommendedProblem>;
  /** 초기 선택 도메인 (localStorage가 없을 때 사용) */
  initialDomain?: string;
}

// ============================================================
// Sub-Components
// ============================================================

/** 도메인 선택 칩 */
function DomainChip({
  domain,
  isSelected,
  onClick,
}: {
  domain: Domain;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={domain.hint}
      data-testid={`domain-chip-${domain.key}`}
      className={`px-3 py-1.5 text-sm rounded-full border transition-all
        ${
          isSelected
            ? "bg-blue-500/30 border-blue-400/50 text-white"
            : "text-white/90 bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40 hover:text-white"
        }`}
    >
      {domain.label}
    </button>
  );
}

/** 추천 문제 카드 */
function RecommendedProblemCard({
  problem,
  isAnimating,
}: {
  problem: RecommendedProblem;
  isAnimating: boolean;
}) {
  const difficultyLabel =
    problem.difficulty === "Easy"
      ? "초급"
      : problem.difficulty === "Medium"
      ? "중급"
      : "고급";

  const difficultyColor =
    problem.difficulty === "Easy"
      ? "text-emerald-400"
      : problem.difficulty === "Medium"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <Link
      href={problem.href}
      data-testid="starter-card"
      className={`group flex items-center justify-between gap-4 p-4 rounded-xl
                 bg-white/[0.06] border border-white/10
                 hover:bg-white/[0.1] hover:border-white/20 transition-all
                 motion-safe:transition-[opacity,transform] motion-safe:duration-150
                 ${isAnimating ? "opacity-0 translate-y-0.5" : "opacity-100 translate-y-0"}`}
    >
      <div className="min-w-0 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-white/50">추천 시작 문제</span>
        </div>
        <span
          data-testid="starter-card-title"
          className="block text-base font-semibold text-white truncate
                     group-hover:text-blue-200 transition-colors"
        >
          {problem.title}
        </span>
        <span className="block mt-1 text-sm text-white/70">
          <span className={difficultyColor}>{difficultyLabel}</span>
          <span className="mx-1.5 text-white/30">·</span>
          숨은 버그 {problem.mutants}개
        </span>
      </div>
      <span
        data-testid="starter-card-cta"
        className="shrink-0 flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-semibold
                   bg-blue-600 text-white transition-all
                   group-hover:bg-blue-500 group-hover:scale-105"
      >
        도전하기
        <ChevronRight className="w-4 h-4 transition-transform
                                 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Fallback 메시지 (추천 문제가 없을 때) */
function FallbackMessage({
  onFallback,
  isAnimating,
}: {
  onFallback: () => void;
  isAnimating: boolean;
}) {
  return (
    <div
      data-testid="starter-fallback"
      className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20
                  motion-safe:transition-[opacity,transform] motion-safe:duration-150
                  ${isAnimating ? "opacity-0 translate-y-0.5" : "opacity-100 translate-y-0"}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white/80">
            해당 도메인의 추천 문제가 준비 중입니다.
          </p>
          <button
            onClick={onFallback}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            공통 문제로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function HeroStarter({
  domains,
  recommendedProblems,
  initialDomain = FALLBACK_DOMAIN,
}: HeroStarterProps) {
  // localStorage에서 저장된 도메인 읽기 (SSR 대응)
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [isHydrated, setIsHydrated] = useState(false);
  // 카드 전환 애니메이션 상태
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 클라이언트에서 localStorage 읽기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && domains.some((d) => d.key === saved)) {
      setSelectedDomain(saved);
    }
    setIsHydrated(true);
  }, [domains]);

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // 도메인 변경 시 localStorage에 저장 + 애니메이션
  const handleDomainSelect = (domainKey: string) => {
    if (domainKey === selectedDomain) return;

    // 애니메이션 시작 (fade out)
    setIsAnimating(true);

    // 150ms 후 도메인 변경 + fade in
    animationTimeoutRef.current = setTimeout(() => {
      setSelectedDomain(domainKey);
      localStorage.setItem(STORAGE_KEY, domainKey);

      // 다음 프레임에서 애니메이션 종료
      requestAnimationFrame(() => {
        setIsAnimating(false);
      });
    }, 150);
  };

  // 현재 선택된 도메인 정보
  const currentDomain = domains.find((d) => d.key === selectedDomain);
  const currentProblem = recommendedProblems[selectedDomain];

  // Fallback 처리
  const handleFallback = () => {
    handleDomainSelect(FALLBACK_DOMAIN);
  };

  return (
    <div
      data-testid="hero-starter"
      className="rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur p-6"
    >
      {/* 상단: 도메인 선택 헤더 */}
      <div className="mb-4">
        <p className="text-sm font-medium text-white/80">
          도메인 선택
        </p>
        <p className="text-xs text-white/50 mt-1">
          선택하면 추천 문제가 바뀝니다
        </p>
      </div>

      {/* 중단: 도메인 칩 */}
      <div
        data-testid="domain-chips"
        className="flex flex-wrap gap-2 mb-3"
      >
        {domains.map((d) => (
          <DomainChip
            key={d.key}
            domain={d}
            isSelected={d.key === selectedDomain}
            onClick={() => handleDomainSelect(d.key)}
          />
        ))}
      </div>

      {/* 선택된 도메인 설명 */}
      {currentDomain && (
        <div
          data-testid="domain-description"
          className={`mb-5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10
                      motion-safe:transition-opacity motion-safe:duration-150
                      ${isAnimating ? "opacity-50" : "opacity-100"}`}
        >
          <p className="text-xs text-white/70">
            <span className="font-medium text-white/90">{currentDomain.title}</span>
            <span className="mx-2 text-white/30">|</span>
            {currentDomain.hint}
          </p>
        </div>
      )}

      {/* 하단: 추천 문제 카드 또는 Fallback */}
      {currentProblem ? (
        <RecommendedProblemCard problem={currentProblem} isAnimating={isAnimating} />
      ) : (
        <FallbackMessage onFallback={handleFallback} isAnimating={isAnimating} />
      )}
    </div>
  );
}
