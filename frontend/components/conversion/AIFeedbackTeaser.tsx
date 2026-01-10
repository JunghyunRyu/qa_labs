/**
 * AIFeedbackTeaser component
 * 비회원용 AI 피드백 블러 프리뷰 (호기심 공백 활용)
 *
 * 특징:
 * - 글래스모피즘 UI (backdrop-blur-sm)
 * - 구조는 보여주고 내용만 블러
 * - 점수별 등급 메시지 (Master/Practitioner/Apprentice/Novice)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Lock, TrendingUp } from "lucide-react";
import ConversionModal from "./ConversionModal";
import {
  MOCK_FEEDBACK_ITEMS,
  getScoreTier,
  getFeedbackItemCount,
} from "./mockFeedback";
import { trackGuestTeaserImpression, trackGuestModalOpen } from "@/lib/analytics";
import type { MockFeedbackItem } from "./mockFeedback";

interface AIFeedbackTeaserProps {
  /** 제출 점수 */
  score: number;
  /** 문제 ID (slug) */
  problemId: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 블러 처리된 피드백 카드 아이템
 */
function BlurredFeedbackCard({ item }: { item: MockFeedbackItem }) {
  const bgColors = {
    warning: "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50",
    success: "bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50",
    info: "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50",
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColors[item.type]}`}
    >
      <span className="text-sm">{item.icon}</span>
      <span className="text-sm text-neutral-700 dark:text-neutral-300">
        {item.content}
      </span>
      <span
        className="text-sm text-neutral-500 dark:text-neutral-400 blur-[4px] select-none"
        aria-hidden="true"
      >
        {item.blurredPart}
      </span>
    </div>
  );
}

export default function AIFeedbackTeaser({
  score,
  problemId,
  className = "",
}: AIFeedbackTeaserProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tier = getScoreTier(score);
  const itemCount = getFeedbackItemCount(score);
  const feedbackItems = MOCK_FEEDBACK_ITEMS.slice(0, itemCount);

  // GA4 티저 노출 트래킹 (한 번만)
  const hasTrackedImpression = useRef(false);
  useEffect(() => {
    if (!hasTrackedImpression.current) {
      trackGuestTeaserImpression({
        problemId,
        score,
        tier: tier.tier,
      });
      hasTrackedImpression.current = true;
    }
  }, [problemId, score, tier.tier]);

  const handleOpenModal = () => {
    trackGuestModalOpen({ feature: "feedback", problemId });
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl ${className}`}
      >
        {/* 글래스모피즘 배경 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/80 via-white/80 to-blue-100/80 dark:from-purple-900/30 dark:via-neutral-900/80 dark:to-blue-900/30 backdrop-blur-sm" />

        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/40 dark:bg-purple-700/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200/40 dark:bg-blue-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* 컨텐츠 */}
        <div className="relative p-6">
          {/* 헤더: 점수 등급 + 메시지 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {tier.message}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                  {tier.tierLabel}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {tier.subMessage}
              </p>
            </div>
          </div>

          {/* 블러 처리된 피드백 미리보기 */}
          <div className="space-y-2 mb-6">
            {feedbackItems.map((item, index) => (
              <BlurredFeedbackCard key={index} item={item} />
            ))}

            {/* 더 많은 피드백 암시 */}
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
              <Lock className="w-4 h-4" />
              <span className="blur-[3px] select-none" aria-hidden="true">
                + {Math.floor(Math.random() * 3) + 2}개의 추가 분석 결과
              </span>
            </div>
          </div>

          {/* CTA 영역 */}
          <div className="text-center">
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium shadow-lg shadow-purple-500/25"
            >
              <Sparkles className="w-5 h-5" />
              AI 피드백 확인하기
            </button>

            {/* 혜택 미리보기 */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                맞춤형 개선 제안
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                놓친 엣지 케이스 분석
              </span>
            </div>

            <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
              GitHub 계정으로 3초 만에 연결
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Modal */}
      <ConversionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feature="feedback"
      />
    </>
  );
}
