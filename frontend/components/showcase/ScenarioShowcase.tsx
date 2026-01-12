"use client";

/**
 * ScenarioShowcase Component (Dark Theme Version)
 *
 * 실제 시나리오 미리보기 - 필터 버튼과 카드 그리드만 렌더링.
 * 제목/설명은 부모(page.tsx)에서 제공하므로 여기서는 생략.
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
// Main Component
// ============================================================
export default function ScenarioShowcase({ domains, problems }: ScenarioShowcaseProps) {
  const [activeDomain, setActiveDomain] = useState("common");

  // 필터링 로직 (선택된 도메인의 문제만, 최대 3개)
  const filteredProblems = problems
    .filter((p) => p.domain === activeDomain)
    .slice(0, 3);

  return (
    <div className="w-full">

      {/* 1. 도메인 필터 (Pill Shape Tabs) */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {domains.map((domain) => (
          <button
            key={domain.key}
            onClick={() => setActiveDomain(domain.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
              activeDomain === domain.key
                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {domain.label}
          </button>
        ))}
      </div>

      {/* 2. 문제 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblems.map((problem) => (
          <Link
            key={problem.href}
            href={problem.href}
            className="group relative block"
          >
            {/* Hover Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-30 transition duration-500 blur"></div>

            <div className="relative h-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:bg-slate-900 transition-all flex flex-col backdrop-blur-sm">

              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl filter drop-shadow-md">{problem.emoji}</span>
                <div className="flex gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                      problem.difficulty === "Easy"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : problem.difficulty === "Medium"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-red-500/20 text-red-300 border-red-500/40"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    🦠 {problem.mutants}
                  </span>
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {problem.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow">
                {problem.scenario}
              </p>

              {/* Footer Badges */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {problem.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* CTA Arrow */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                  도전하기
                </span>
                <svg
                  className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 3. '전체 문제 보기' 링크 */}
      <div className="mt-12 text-center">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
        >
          전체 문제 라이브러리 탐색하기
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
