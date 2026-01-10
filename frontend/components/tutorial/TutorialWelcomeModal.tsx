"use client";

import { X, Sparkles, Clock, ArrowRight } from "lucide-react";

interface TutorialWelcomeModalProps {
  onStart: () => void;
  onSkip: () => void;
}

/**
 * TutorialWelcomeModal - 튜토리얼 시작 환영 모달
 *
 * 문제 목록 페이지 진입 0.5초 후 표시되며,
 * 사용자가 튜토리얼을 시작하거나 건너뛸 수 있게 합니다.
 */
export default function TutorialWelcomeModal({
  onStart,
  onSkip,
}: TutorialWelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Modal */}
      <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl max-w-md w-full mx-4 p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-3">
          QA Arena에 오신 것을 환영합니다!
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-center mb-2">
          QA Arena는 방식이 조금 독특합니다.
        </p>
        <p className="text-gray-400 text-sm text-center mb-6">
          코드를 구현하는 대신, <span className="text-blue-400 font-medium">테스트 코드</span>를 작성하여
          버그를 찾아내는 플랫폼입니다.
        </p>

        {/* Time indicator */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
          <Clock className="w-4 h-4" />
          <span>약 3분 소요</span>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onStart}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            3분 튜토리얼 시작하기
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span className="text-blue-200 text-sm">(권장)</span>
          </button>

          <button
            onClick={onSkip}
            className="w-full py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            나중에 할게요
          </button>
        </div>

        {/* Footer note */}
        <p className="text-gray-500 text-xs text-center mt-4">
          설정에서 언제든 다시 시작할 수 있습니다
        </p>
      </div>
    </div>
  );
}
