/** Sample Problems Banner - Mission Control 온보딩 섹션 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Rocket, X } from "lucide-react";

// 샘플 문제 ID (하드코딩)
const SAMPLE_SUCCESS_ID = 63; // 100점 정답 예시
const SAMPLE_FAILURE_ID = 64; // 실패 케이스 예시

const STORAGE_KEY = "hide_tutorial_banner";

interface SampleProblemsBannerProps {
  /** 외부에서 강제로 숨김 처리 (예: solved_count > 0) */
  forceHide?: boolean;
}

export default function SampleProblemsBanner({ forceHide = false }: SampleProblemsBannerProps) {
  const [isHidden, setIsHidden] = useState(true); // SSR 안전을 위해 초기값 true

  useEffect(() => {
    // 클라이언트에서만 localStorage 확인
    const hidden = localStorage.getItem(STORAGE_KEY) === "true";
    setIsHidden(hidden);
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsHidden(true);
  };

  // 숨김 조건: forceHide이거나 사용자가 닫은 경우
  if (forceHide || isHidden) {
    return null;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-5 sm:p-6 mb-6">
      {/* 배경 글로우 효과 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
        aria-label="튜토리얼 배너 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 헤더 */}
      <div className="relative flex items-center gap-3 mb-5 pr-8">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Rocket className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            처음이신가요? 튜토리얼 미션을 시작하세요!
          </h2>
          <p className="text-sm text-slate-400">
            채점 시스템이 어떻게 작동하는지 직접 체험해보세요
          </p>
        </div>
      </div>

      {/* 샘플 문제 카드 */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 성공 예시 카드 */}
        <Link
          href={`/problems/${SAMPLE_SUCCESS_ID}`}
          className="group bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">
                  100점 정답
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 mb-1 group-hover:text-emerald-400 transition-colors">
                성공 케이스 체험하기
              </h3>
              <p className="text-sm text-slate-500">
                정답 코드가 미리 입력되어 있어요. 채점 버튼만 눌러보세요!
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
          </div>
        </Link>

        {/* 실패 예시 카드 */}
        <Link
          href={`/problems/${SAMPLE_FAILURE_ID}`}
          className="group bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 border border-amber-500/20 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
              <XCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded border border-amber-500/20">
                  실패 예시
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 mb-1 group-hover:text-amber-400 transition-colors">
                실패 케이스 확인하기
              </h3>
              <p className="text-sm text-slate-500">
                버그를 놓치는 테스트 코드 예시. 어떤 점이 부족한지 확인해보세요.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
          </div>
        </Link>
      </div>
    </div>
  );
}
