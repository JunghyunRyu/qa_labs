"use client";

/**
 * Hero Section CTA Buttons with GA4 Event Tracking
 */

import Link from "next/link";
import { trackLandingCTAClick } from "@/lib/analytics";

export default function HeroCTA() {
  const handleStartChallenge = () => {
    trackLandingCTAClick({
      location: "hero",
      ctaType: "start_challenge",
      destination: "/problems",
    });
  };

  const handleAICopilot = () => {
    trackLandingCTAClick({
      location: "hero",
      ctaType: "ai_copilot",
      destination: "/ai",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
      <Link
        href="/problems"
        onClick={handleStartChallenge}
        className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-slate-900 min-h-[48px]"
      >
        <span>챌린지 시작하기</span>
        <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
      <Link
        href="/ai"
        onClick={handleAICopilot}
        className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-slate-300 transition-all duration-200 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 hover:text-white min-h-[48px]"
      >
        <span>AI Copilot 알아보기</span>
        <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full">BETA</span>
      </Link>
    </div>
  );
}
