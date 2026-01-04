"use client";

/**
 * ScenarioShowcase Component
 *
 * 실제 시나리오 미리보기 섹션.
 * 도메인별 필터 칩으로 문제를 분류하여 표시합니다.
 */

import { useState } from "react";
import Link from "next/link";

// ============================================================
// Types
// ============================================================

interface Domain {
  key: string;
  label: string;
}

interface ShowcaseProblem {
  domain: string;
  emoji: string;
  title: string;
  scenario: string;
  difficulty: "Easy" | "Medium" | "Hard";
  mutants: number;
  badges: string[];
  href: string;
}

interface ScenarioShowcaseProps {
  domains: Domain[];
  problems: ShowcaseProblem[];
}

// ============================================================
// Sub-Components
// ============================================================

function DomainFilterChip({
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
      className={`px-4 py-2 text-sm font-medium rounded-full border transition-all
        ${
          isSelected
            ? "bg-blue-500/30 border-blue-400/50 text-white"
            : "text-slate-300 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 hover:text-white"
        }`}
    >
      {domain.label}
    </button>
  );
}

function ProblemCard({ problem }: { problem: ShowcaseProblem }) {
  const difficultyLabel =
    problem.difficulty === "Easy"
      ? "초급"
      : problem.difficulty === "Medium"
      ? "중급"
      : "고급";

  const difficultyClass =
    problem.difficulty === "Easy"
      ? "bg-green-500/20 text-green-400"
      : problem.difficulty === "Medium"
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-red-500/20 text-red-400";

  return (
    <Link
      href={problem.href}
      className="card-dark group flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{problem.emoji}</span>
          <span className="rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 capitalize">
            {problem.domain}
          </span>
        </div>
        <div className="text-right text-xs">
          <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${difficultyClass}`}>
            {difficultyLabel}
          </span>
          <div className="mt-1.5 text-slate-400">🐞 숨은 버그: {problem.mutants}개</div>
        </div>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-slate-100">
        {problem.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{problem.scenario}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {problem.badges.map((b) => (
          <span
            key={b}
            className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
          >
            {b}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-6 text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors inline-flex items-center gap-1">
        도전하기
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ScenarioShowcase({ domains, problems }: ScenarioShowcaseProps) {
  const [selectedDomain, setSelectedDomain] = useState("common");

  const filteredProblems = problems
    .filter((p) => p.domain === selectedDomain)
    .slice(0, 3);

  return (
    <section
      id="scenario-showcase"
      className="section-base bg-slate-900 dark:bg-slate-950 relative overflow-hidden scroll-mt-24"
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />
      <div className="section-container relative z-10">
        <div className="section-header">
          <h2 className="section-title !text-white">
            운영에서 터지는 실제 시나리오
          </h2>
          <p className="section-subtitle !text-slate-300">
            평범한 테스트는 통과합니다. 하지만 운영에서는 사고가 납니다.
            <br className="hidden sm:block" />
            실제 현업에서 자주 발생하는 시나리오를 미리 확인해보세요.
          </p>
        </div>

        {/* Domain Filter Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {domains.map((d) => (
            <DomainFilterChip
              key={d.key}
              domain={d}
              isSelected={d.key === selectedDomain}
              onClick={() => setSelectedDomain(d.key)}
            />
          ))}
        </div>

        {/* Problem Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProblems.map((p) => (
            <ProblemCard key={p.href} problem={p} />
          ))}
        </div>

        {/* CTA 버튼 */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/problems"
            className="inline-flex items-center justify-center rounded-full border border-blue-400/50 bg-blue-500/20 px-6 py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/30 hover:border-blue-400 transition-colors"
          >
            전체 문제 보기
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
