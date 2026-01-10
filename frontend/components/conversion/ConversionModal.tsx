/**
 * ConversionModal component
 * 비회원 → 회원 전환 유도 공통 모달
 *
 * 특징:
 * - 컨텍스트 유지 (페이지 이동 없음)
 * - 개발자 언어 마이크로카피
 * - OAuth 로그인 통합
 */

"use client";

import { X, Github, Sparkles, History, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useGuestConversion } from "./useGuestConversion";

export type ConversionFeature = "ai_coach" | "hint" | "feedback" | "history";

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: ConversionFeature;
  /** 커스텀 혜택 목록 (기본값 사용 시 생략) */
  benefits?: string[];
}

// 기능별 설정
const FEATURE_CONFIG: Record<
  ConversionFeature,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    defaultBenefits: string[];
  }
> = {
  ai_coach: {
    title: "AI 코치로 더 빠르게 성장하세요",
    description: "AI가 코드를 분석하고 개선 방향을 제안합니다",
    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    defaultBenefits: [
      "실시간 코드 리뷰",
      "맞춤형 학습 조언",
      "버그 패턴 분석",
    ],
  },
  hint: {
    title: "힌트로 막힌 부분을 해결하세요",
    description: "단계별 힌트로 문제 해결의 실마리를 찾아보세요",
    icon: <Sparkles className="w-6 h-6 text-amber-500" />,
    defaultBenefits: [
      "단계별 힌트 제공",
      "핵심 개념 설명",
      "접근 방법 안내",
    ],
  },
  feedback: {
    title: "AI 피드백으로 코드를 개선하세요",
    description: "AI가 놓친 케이스와 개선점을 분석했습니다",
    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    defaultBenefits: [
      "상세 코드 분석",
      "놓친 엣지 케이스",
      "최적화 제안",
    ],
  },
  history: {
    title: "제출 이력을 저장하세요",
    description: "풀이 기록을 영구 보존하고 성장을 추적하세요",
    icon: <History className="w-6 h-6 text-blue-500" />,
    defaultBenefits: [
      "제출 이력 관리",
      "성장 그래프",
      "포트폴리오 생성",
    ],
  },
};

export default function ConversionModal({
  isOpen,
  onClose,
  feature,
  benefits,
}: ConversionModalProps) {
  const { login } = useAuth();
  const { setPendingMerge } = useGuestConversion();

  if (!isOpen) return null;

  const config = FEATURE_CONFIG[feature];
  const displayBenefits = benefits || config.defaultBenefits;

  const handleLogin = (provider: "github" | "google") => {
    // OAuth 리다이렉트 전에 pending_merge 플래그 설정
    setPendingMerge(true);
    login(provider);
  };

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
        className="relative bg-[var(--background)] border border-[var(--card-border)] rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversion-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--card-background)] transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-[var(--muted)]" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            {config.icon}
          </div>
        </div>

        {/* Title */}
        <h2
          id="conversion-modal-title"
          className="text-xl font-bold text-center mb-2"
        >
          {config.title}
        </h2>

        {/* Description */}
        <p className="text-[var(--muted)] text-center mb-6">
          {config.description}
        </p>

        {/* Benefits */}
        <div className="bg-[var(--card-background)] rounded-lg p-4 mb-6">
          <div className="space-y-3">
            {displayBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleLogin("github")}
            className="w-full flex items-center justify-center gap-2 py-3 px-4
                       bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                       rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Github className="w-5 h-5" />
            GitHub으로 코드 동기화
          </button>

          <button
            onClick={() => handleLogin("google")}
            className="w-full flex items-center justify-center gap-2 py-3 px-4
                       border border-[var(--card-border)] rounded-lg font-medium
                       hover:bg-[var(--card-background)] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-[var(--muted)] text-center mt-4">
          3초 만에 연결, 작성한 코드가 자동 저장됩니다
        </p>

        {/* Later button */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
}
