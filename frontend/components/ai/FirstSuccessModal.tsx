/**
 * FirstSuccessModal component
 * VE01 첫 문제 SUCCESS 후 축하 + AI 유도 모달
 *
 * M7 AI 강제 경험: 첫 성공 시 AI 코치 경험 유도
 */

"use client";

import { Trophy, Sparkles, X } from "lucide-react";

interface FirstSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAICoach: () => void;
  score: number;
}

export default function FirstSuccessModal({
  isOpen,
  onClose,
  onOpenAICoach,
  score,
}: FirstSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-success-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Trophy icon with score */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 rounded-full bg-amber-900/50 flex items-center justify-center mb-3">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-500">{score}점</div>
        </div>

        {/* Title */}
        <h2
          id="first-success-modal-title"
          className="text-xl font-bold text-center mb-2 text-slate-100"
        >
          축하합니다!
        </h2>

        {/* Description */}
        <p className="text-slate-300 text-center mb-6">
          첫 번째 문제를 성공적으로 해결했습니다.
          <br />
          <span className="text-purple-400 font-medium">
            AI 코치는 더 효율적인 코드를 알고 있습니다
          </span>
        </p>

        {/* Benefits hint */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <span>
              AI 코치가 코드 개선 방향과 더 나은 테스트 전략을 제안해 드립니다
            </span>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onOpenAICoach}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          AI 코치의 조언 보기 (무료)
        </button>

        {/* Secondary CTA */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
}
