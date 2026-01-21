"use client";

/**
 * OnboardingModal - 로그인 직후 온보딩 안내 모달
 *
 * 신규/기존 사용자에게 첫 번째 미션을 안내합니다.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Sparkles, ChevronRight, X } from "lucide-react";

type OnboardingType = "new" | "returning";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: OnboardingType;
  problemTitle?: string;
}

const MESSAGES = {
  new: {
    badge: "첫 번째 미션",
    title: "30초 만에 첫 버그를 잡아보세요!",
    description: "간단한 함수지만 숨겨진 함정이 있어요. pytest로 버그를 찾아보세요.",
    cta: "시작하기",
  },
  returning: {
    badge: "다시 오셨네요!",
    title: "오늘의 미션부터 시작해볼까요?",
    description: "워밍업으로 딱 좋은 문제예요. 바로 도전해보세요!",
    cta: "도전하기",
  },
};

export default function OnboardingModal({
  isOpen,
  onClose,
  type,
  problemTitle = "양수 판별 함수 테스트",
}: OnboardingModalProps) {
  const router = useRouter();
  const messages = MESSAGES[type];

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSkip = () => {
    onClose();
    router.push("/problems");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-6 sm:p-8 text-center">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-blue-400" />
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">
                    {messages.badge}
                  </span>
                </div>

                {/* Problem Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {problemTitle}
                </h2>

                {/* Message */}
                <p className="text-lg text-slate-300 mb-2">{messages.title}</p>
                <p className="text-sm text-slate-500 mb-8">{messages.description}</p>

                {/* CTA Button */}
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors min-h-[52px]"
                >
                  <span>{messages.cta}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Skip Link */}
                <button
                  onClick={handleSkip}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  나중에 할게요 →
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
