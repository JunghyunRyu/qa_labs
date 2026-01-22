'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'AI Verifier Track',
    description: 'AI가 만든 코드의 버그를 찾아보세요!\n코딩 없이 논리적 사고만으로 도전할 수 있어요.',
    icon: '🎯',
  },
  {
    id: 'chat',
    title: 'AI와 대화하기',
    description: 'AI에게 코드를 요청하면 버그가 숨어있는 코드를 생성합니다.\nApply 버튼으로 에디터에 적용하세요.',
    icon: '💬',
    highlight: 'chat-panel',
  },
  {
    id: 'editor',
    title: '코드 확인하기',
    description: '에디터에서 AI가 만든 코드를 확인하세요.\n어떤 입력에서 문제가 생길지 생각해보세요.',
    icon: '📝',
    highlight: 'code-editor',
  },
  {
    id: 'test',
    title: '버그 찾기',
    description: '테스트 케이스를 입력해서 버그를 찾아보세요!\n버그를 찾으면 포인트를 획득합니다.',
    icon: '🔍',
    highlight: 'test-input',
  },
  {
    id: 'complete',
    title: '준비 완료!',
    description: '이제 AI Verifier Track을 시작할 준비가 됐어요.\n다양한 문제에 도전해보세요!',
    icon: '🚀',
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-700"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            {step.icon}
          </motion.div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>

          {/* Description */}
          <p className="text-gray-300 whitespace-pre-line leading-relaxed">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 my-6">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep
                    ? 'bg-green-500'
                    : i < currentStep
                    ? 'bg-green-500/50'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {currentStep < ONBOARDING_STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="flex-1 py-3 text-gray-400 hover:text-white transition"
              >
                건너뛰기
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition"
            >
              {currentStep < ONBOARDING_STEPS.length - 1 ? '다음' : '시작하기'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
