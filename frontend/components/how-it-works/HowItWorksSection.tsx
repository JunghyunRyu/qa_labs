"use client";

/**
 * HowItWorksSection Component (Dark Theme Version)
 *
 * 3단계 진행 방식을 시각적으로 보여주는 섹션.
 * - 좌측: 스텝 네비게이션 (클릭 가능)
 * - 우측: Mac 스타일 미리보기 창
 * - 5초마다 자동 전환 또는 사용자 클릭으로 전환
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// Step Data
// ============================================================
const steps = [
  {
    id: 1,
    number: "01",
    title: "테스트 작성",
    desc: "주어진 명세(Spec)를 분석하고, pytest 기반의 테스트 코드를 작성합니다.",
  },
  {
    id: 2,
    number: "02",
    title: "버그 방어 (Mutation)",
    desc: "당신의 테스트가 '숨겨진 버그 코드(Mutants)'를 얼마나 잘 잡아내는지 검증합니다.",
  },
  {
    id: 3,
    number: "03",
    title: "AI Copilot 피드백",
    desc: "놓친 케이스와 개선점을 AI가 분석하여 즉시 리포트로 제공합니다.",
  },
];

// ============================================================
// Main Component
// ============================================================
export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 사용자 클릭 핸들러
  const handleStepClick = useCallback((index: number) => {
    setUserInteracted(true);
    setActiveStep(index);
  }, []);

  // 자동 슬라이드 (5초마다, 사용자가 클릭하면 중단)
  useEffect(() => {
    if (userInteracted) return;

    timerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userInteracted]);

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      {/* 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* Left: Steps Navigation */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={`group text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                activeStep === index
                  ? "bg-slate-800 border-blue-500/50 shadow-lg shadow-blue-900/20"
                  : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
              }`}
            >
              {/* Active Indicator Bar */}
              {activeStep === index && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
              )}

              <div className="flex items-start gap-4">
                <span
                  className={`text-sm font-mono font-bold mt-1 ${
                    activeStep === index
                      ? "text-blue-400"
                      : "text-slate-600 group-hover:text-slate-500"
                  }`}
                >
                  {step.number}
                </span>
                <div>
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      activeStep === index
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      activeStep === index ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Visual Preview (Mac-style Window) */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden min-h-[400px] flex flex-col">

            {/* Mac-style Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
              <div className="ml-4 px-3 py-1 rounded-md bg-slate-800 text-[10px] text-slate-500 font-mono">
                qa-arena-runner
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col justify-center">

              {/* Step 1: Code Editor View */}
              {activeStep === 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="font-mono text-sm space-y-1">
                    <div className="text-pink-400">
                      import <span className="text-white">pytest</span>
                    </div>
                    <div className="text-slate-500 mb-2"># TODO: Implement test cases</div>
                    <div className="text-blue-400">
                      def <span className="text-yellow-300">test_calculate_total</span>():
                    </div>
                    <div className="pl-4 text-slate-400"># 엣지 케이스 검증</div>
                    <div className="pl-4 text-white">
                      assert calculate([]) == <span className="text-emerald-400">0</span>
                    </div>
                    <div className="pl-4 text-white mt-2">
                      items = [{`{`}&quot;price&quot;: <span className="text-emerald-400">100</span>{`}`}]
                    </div>
                    <div className="pl-4 text-white">
                      assert calculate(items) == <span className="text-emerald-400">100</span>
                    </div>
                  </div>
                  {/* Cursor Animation */}
                  <div className="mt-2 w-2 h-4 bg-blue-500 animate-pulse" />
                </div>
              )}

              {/* Step 2: Mutation Testing View */}
              {activeStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span>Mutation Progress</span>
                    <span className="text-white font-mono">3/4 Killed</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-gradient-to-r from-blue-500 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>

                  {/* Logs */}
                  <div className="space-y-2 mt-4 font-mono text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>✓</span>
                      <span>
                        Mutant #1 (Off-by-one) →{" "}
                        <span className="bg-emerald-500/10 px-1 rounded">KILLED</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>✓</span>
                      <span>
                        Mutant #2 (Null Return) →{" "}
                        <span className="bg-emerald-500/10 px-1 rounded">KILLED</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>✓</span>
                      <span>
                        Mutant #3 (Zero Division) →{" "}
                        <span className="bg-emerald-500/10 px-1 rounded">KILLED</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/5 p-2 rounded border border-red-500/20">
                      <span>✗</span>
                      <span>
                        Mutant #4 (Negative Value) →{" "}
                        <span className="font-bold">SURVIVED</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: AI Feedback View */}
              {activeStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🤖</span>
                      <span className="text-sm font-bold text-violet-400">AI Analysis Report</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      &quot;대부분의 로직은 훌륭하지만,{" "}
                      <span className="text-red-300 font-bold">음수 입력값</span>에 대한 방어
                      로직이 누락되었습니다.&quot;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-emerald-400 mb-1">STRENGTHS</div>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li>• 경계값 테스트 우수</li>
                        <li>• Parametrize 활용</li>
                      </ul>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-red-400 mb-1">WEAKNESSES</div>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li>• 예외 처리 미흡</li>
                        <li>• 음수 케이스 누락</li>
                      </ul>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="flex justify-end mt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] text-slate-400">테스트 품질</span>
                      <span className="text-lg font-bold text-blue-400">B+</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Step Indicator */}
            <div className="flex justify-center gap-1 pb-4">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleStepClick(i)}
                  className="p-2 -m-1"
                  aria-label={`Step ${i + 1}로 이동`}
                >
                  <span className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === activeStep
                      ? "bg-blue-500 w-8"
                      : "bg-slate-700 hover:bg-slate-600 w-1.5"
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
