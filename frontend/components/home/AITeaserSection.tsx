"use client";

/**
 * AITeaserSection Component (Hybrid View)
 *
 * 메인 페이지의 AI Copilot 소개 섹션.
 * Chat 모드와 Report 모드가 번갈아 표시되어 AI의 다양한 기능을 보여줌:
 * - Chat Mode: 실시간 대화형 디버깅
 * - Report Mode: 구조화된 심층 분석 리포트
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ============================================================
// Type Definitions
// ============================================================
interface ChatScenario {
  id: number;
  displayMode: "chat";
  type: string;
  emoji: string;
  user: string;
  ai: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

interface ReportScenario {
  id: number;
  displayMode: "report";
  type: string;
  emoji: string;
  reportData: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    score: string;
  };
  color: string;
  borderColor: string;
  bgColor: string;
}

type Scenario = ChatScenario | ReportScenario;

// ============================================================
// Scenario Data (Chat + Report 하이브리드)
// ============================================================
const scenarios: Scenario[] = [
  {
    id: 1,
    displayMode: "chat",
    type: "Debugging",
    emoji: "🐞",
    user: "이 테스트가 왜 실패했는지 모르겠어. 엣지 케이스가 뭐지?",
    ai: "입력값이 Empty List 일 때 처리가 누락되었습니다.\nassert calculate([]) == 0 을 추가해보세요.",
    color: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
  },
  {
    id: 2,
    displayMode: "report",
    type: "AI Feedback",
    emoji: "📝",
    reportData: {
      summary: "정상 덧셈의 주요 동등분할은 잘 커버했으나, '정수 외 입력 방어' 테스트가 빠져 있습니다.",
      strengths: ["동등분할(양수/음수) 구성 우수", "Parametrize 활용"],
      weaknesses: ["TypeError 예외 처리 미검증", "float/str 입력 방어 로직 부재"],
      score: "B+",
    },
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: 3,
    displayMode: "chat",
    type: "Security QA",
    emoji: "🛡️",
    user: "로그인 폼 테스트 시 보안 항목은 뭐가 있어?",
    ai: "기능 테스트 외에 다음 취약점을 점검하세요:\n1. SQL Injection 공격 시도\n2. XSS 스크립트 삽입 시도",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
  },
];

// ============================================================
// Animation Constants
// ============================================================
const ANIMATION_DELAYS = {
  SCENARIO_INTERVAL: 6000,
  FADE_DURATION: 500,
  TYPE_SPEED: 30,
};

// ============================================================
// Main Component
// ============================================================
export default function AITeaserSection() {
  const [index, setIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [displayedAiText, setDisplayedAiText] = useState("");

  const animationRef = useRef<NodeJS.Timeout[]>([]);
  const currentScenario = scenarios[index];

  const clearAllTimers = () => {
    animationRef.current.forEach(clearTimeout);
    animationRef.current = [];
  };

  // 시나리오 전환 (6초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("out");

      const fadeTimer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % scenarios.length);
        setDisplayedAiText("");
        setFadeState("in");
      }, ANIMATION_DELAYS.FADE_DURATION);

      animationRef.current.push(fadeTimer);
    }, ANIMATION_DELAYS.SCENARIO_INTERVAL);

    return () => {
      clearInterval(interval);
      clearAllTimers();
    };
  }, []);

  // 타이핑 효과 (Chat 모드일 때만)
  useEffect(() => {
    if (fadeState !== "in") return;
    if (currentScenario.displayMode !== "chat") return;

    let charIndex = 0;
    const text = (currentScenario as ChatScenario).ai;

    const typeInterval = setInterval(() => {
      setDisplayedAiText(text.slice(0, charIndex + 1));
      charIndex++;
      if (charIndex >= text.length) clearInterval(typeInterval);
    }, ANIMATION_DELAYS.TYPE_SPEED);

    return () => clearInterval(typeInterval);
  }, [fadeState, index, currentScenario]);

  return (
    <section className="relative py-24 bg-slate-900 border-y border-slate-800 overflow-hidden">
      {/* 배경 데코레이션 */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Dynamic Visual Container */}
          <div className="relative group order-2 lg:order-1 h-[340px] flex items-center">
            {/* 배경 Glow */}
            <div
              className={`absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-xl transition duration-1000 ${
                fadeState === "in" ? "opacity-15" : "opacity-0"
              }`}
            ></div>

            <div className="relative w-full h-full rounded-xl bg-slate-950 border border-slate-800 p-6 shadow-2xl flex flex-col">
              {/* 상단 뱃지 */}
              <div
                className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded border transition-all duration-500 ${
                  currentScenario.color
                } ${currentScenario.bgColor} ${currentScenario.borderColor} ${
                  fadeState === "in" ? "opacity-100" : "opacity-0"
                }`}
              >
                {currentScenario.emoji} {currentScenario.type}
              </div>

              {/* === CONTENT SWITCHER === */}
              <div
                className={`flex-1 transition-all duration-500 ease-in-out ${
                  fadeState === "in"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                {/* MODE A: CHAT UI */}
                {currentScenario.displayMode === "chat" && (
                  <div className="space-y-6 mt-8">
                    {/* User Bubble */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-sm">
                        👤
                      </div>
                      <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200 border border-slate-700 shadow-sm max-w-[90%]">
                        {(currentScenario as ChatScenario).user}
                      </div>
                    </div>
                    {/* AI Bubble */}
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 text-sm shadow-lg shadow-violet-500/30">
                        🤖
                      </div>
                      <div className="bg-slate-900/80 border border-violet-500/30 rounded-2xl rounded-tr-none p-3 text-sm text-violet-100 shadow-md max-w-[90%] min-h-[60px]">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {displayedAiText}
                          {displayedAiText.length < (currentScenario as ChatScenario).ai.length && (
                            <span className="animate-pulse inline-block w-1.5 h-3 bg-violet-400 ml-1 align-middle"></span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE B: REPORT UI */}
                {currentScenario.displayMode === "report" && (
                  <div className="mt-6 h-full flex flex-col justify-center">
                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-4">
                      {/* Summary Section */}
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                          <span>📋</span> 요약
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {(currentScenario as ReportScenario).reportData.summary}
                        </p>
                      </div>

                      {/* Strengths & Weaknesses Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <div className="text-[10px] font-bold text-emerald-400 mb-2 flex items-center gap-1">
                            <span>✓</span> 잘한 점
                          </div>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {(currentScenario as ReportScenario).reportData.strengths.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                          <div className="text-[10px] font-bold text-red-400 mb-2 flex items-center gap-1">
                            <span>!</span> 개선할 점
                          </div>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {(currentScenario as ReportScenario).reportData.weaknesses.map((w, i) => (
                              <li key={i}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex justify-end">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                          <span className="text-[10px] text-slate-400">테스트 품질</span>
                          <span className="text-lg font-bold text-blue-400">
                            {(currentScenario as ReportScenario).reportData.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단: 시나리오 인디케이터 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {scenarios.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFadeState("out");
                      setTimeout(() => {
                        setIndex(i);
                        setDisplayedAiText("");
                        setFadeState("in");
                      }, 300);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === index
                        ? "bg-violet-500 w-6"
                        : "bg-slate-700 hover:bg-slate-600 w-2"
                    }`}
                    aria-label={`시나리오 ${i + 1}로 이동`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Copy & CTA */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-violet-900/30 border border-violet-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-violet-400 text-xs font-bold">New Feature</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight break-keep">
              혼자 고민하지 마세요.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                AI Copilot
              </span>
              이 함께 디버깅합니다.
            </h2>

            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              실시간 질의응답은 기본.
              <br />
              제출 직후 생성되는{" "}
              <strong className="text-emerald-400">심층 분석 리포트</strong>로
              놓친 엣지 케이스와 코드의 허점을 한눈에 파악하세요.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/ai"
                className="inline-flex items-center px-6 py-3 text-white bg-violet-600 hover:bg-violet-700 rounded-xl font-bold transition-all shadow-lg shadow-violet-600/20 hover:scale-105"
              >
                AI 기능 자세히 보기
              </Link>
              <Link
                href="/problems"
                className="inline-flex items-center px-6 py-3 text-slate-300 border border-slate-700 hover:bg-slate-800 rounded-xl font-medium transition-all"
              >
                무료로 체험하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
