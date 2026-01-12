"use client";

/**
 * HeroResultPanel Component (Animated + Toned Down Version)
 *
 * Hero 섹션에 표시되는 채점 결과 미리보기 패널.
 * 동적 애니메이션 + 은은한 Glow로 고급스러운 느낌 제공:
 * - 버그 카운팅: 0에서 숫자가 올라가며 게이지가 차오름
 * - 등급 스탬프: 쾅! 효과로 도장 찍힘
 * - AI 타이핑: 타자기 효과로 글자가 써짐
 */

import { useEffect, useState, useRef } from "react";

// ============================================================
// Animation Constants
// ============================================================
const ANIMATION_DELAYS = {
  START_COUNTING: 500,
  SHOW_GRADE: 1500,
  START_TYPING: 2200,
  COUNT_INTERVAL: 200,
  TYPE_INTERVAL: 40,
};

export default function HeroResultPanel() {
  // Animation states
  const [step, setStep] = useState(0); // 0: 대기, 1: 카운팅, 2: 등급, 3: 타이핑
  const [bugCount, setBugCount] = useState(0);
  const [aiText, setAiText] = useState("");

  const fullAiText = "케이스 누락 감지:\n① 빈 리스트([]) 입력 테스트 부재\n② 음수 값 예외 처리 필요";

  // Ref for cleanup
  const animationRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const cleanup = () => {
      animationRef.current.forEach(clearTimeout);
      animationRef.current = [];
    };

    // 1단계: 버그 카운팅 시작
    const timer1 = setTimeout(() => {
      setStep(1);
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        setBugCount(count);
        if (count >= 3) clearInterval(interval);
      }, ANIMATION_DELAYS.COUNT_INTERVAL);
      animationRef.current.push(interval as unknown as NodeJS.Timeout);
    }, ANIMATION_DELAYS.START_COUNTING);
    animationRef.current.push(timer1);

    // 2단계: 등급 스탬프 표시
    const timer2 = setTimeout(() => {
      setStep(2);
    }, ANIMATION_DELAYS.SHOW_GRADE);
    animationRef.current.push(timer2);

    // 3단계: AI 타이핑 시작
    const timer3 = setTimeout(() => {
      setStep(3);
      let i = 0;
      const typeInterval = setInterval(() => {
        setAiText(fullAiText.slice(0, i + 1));
        i++;
        if (i > fullAiText.length) clearInterval(typeInterval);
      }, ANIMATION_DELAYS.TYPE_INTERVAL);
      animationRef.current.push(typeInterval as unknown as NodeJS.Timeout);
    }, ANIMATION_DELAYS.START_TYPING);
    animationRef.current.push(timer3);

    return cleanup;
  }, []);

  return (
    <div className="relative group w-full max-w-xl lg:max-w-2xl">
      {/* 배경 Glow: 톤 다운 (opacity-10, blur-xl) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>

      {/* 메인 패널: Glassmorphism */}
      <div className="relative bg-slate-950/90 border border-slate-800/50 backdrop-blur-md rounded-2xl p-6 shadow-2xl">

        {/* 상단 상태 바 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-mono text-emerald-400 tracking-wider">LIVE ANALYSIS</span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono">ID: #TEST-8291</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* 1. 발견한 버그 (게이지 차오름) */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-wide">Detected Bugs</div>
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* 회색 배경 원 */}
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                {/* 초록색 진행 원 */}
                <circle
                  cx="40" cy="40" r="36"
                  stroke="#10b981" strokeWidth="6" fill="transparent"
                  strokeDasharray="226"
                  strokeDashoffset={step >= 1 ? 56 : 226}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-2xl font-bold text-white">
                {bugCount}<span className="text-sm text-slate-500 font-normal">/4</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              75% Killed
            </div>
          </div>

          {/* 2. 테스트 품질 (도장 효과) */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-wide">Quality Grade</div>
            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-2 border-blue-500/20 bg-blue-500/5 transition-all duration-500 ${step >= 2 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <span className="text-4xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                B+
              </span>
            </div>
            <div className="mt-2 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </div>
          </div>

          {/* 3. AI 요약 (타이핑 효과) */}
          <div className="md:col-span-1 bg-gradient-to-b from-violet-500/10 to-slate-900/50 rounded-xl p-4 border border-violet-500/20 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🤖</span>
              <span className="text-[11px] font-bold text-violet-300 uppercase">AI Insight</span>
            </div>
            <div className="h-20 overflow-hidden">
              <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                {aiText}
                {step === 3 && aiText.length < fullAiText.length && (
                  <span className="animate-pulse inline-block w-1.5 h-3 bg-violet-400 ml-0.5 align-middle"></span>
                )}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
