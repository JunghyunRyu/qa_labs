/**
 * Google Analytics 이벤트 유틸리티
 *
 * 사용법:
 * import { sendGAEvent } from "@/lib/analytics";
 * sendGAEvent("submit_code", { problem_id: "123", result: "pass" });
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * GA 이벤트 전송 함수
 * @param action 이벤트 이름 (예: "submit_code", "click_problem")
 * @param params 이벤트 파라미터
 */
export const sendGAEvent = (
  action: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== "undefined" && window.gtag && GA_ID) {
    window.gtag("event", action, params);
  }
};

/**
 * 코드 제출 이벤트
 */
export const trackCodeSubmit = (params: {
  problemId: number | string;
  problemSlug?: string;
  difficulty?: string;
  score?: number;
  mutantsKilled?: number;
  totalMutants?: number;
  isClientSide?: boolean;
}) => {
  sendGAEvent("submit_code", {
    problem_id: String(params.problemId),
    problem_slug: params.problemSlug || "",
    difficulty: params.difficulty || "",
    score: params.score ?? 0,
    mutants_killed: params.mutantsKilled ?? 0,
    total_mutants: params.totalMutants ?? 0,
    execution_mode: params.isClientSide ? "client" : "server",
  });
};

/**
 * 문제 조회 이벤트
 */
export const trackProblemView = (params: {
  problemId: number | string;
  problemSlug?: string;
  difficulty?: string;
  domain?: string;
}) => {
  sendGAEvent("view_problem", {
    problem_id: String(params.problemId),
    problem_slug: params.problemSlug || "",
    difficulty: params.difficulty || "",
    domain: params.domain || "",
  });
};

/**
 * 로컬 테스트 실행 이벤트
 */
export const trackLocalTest = (params: {
  problemId: number | string;
  passed: number;
  failed: number;
}) => {
  sendGAEvent("local_test", {
    problem_id: String(params.problemId),
    tests_passed: params.passed,
    tests_failed: params.failed,
    all_passed: params.failed === 0 && params.passed > 0,
  });
};

// ============================================
// Guest Conversion 트래킹 이벤트 (M5)
// ============================================

/**
 * 게스트 배너 노출 이벤트
 */
export const trackGuestBannerImpression = (params: {
  problemId?: string;
  location?: string;
}) => {
  sendGAEvent("guest_banner_impression", {
    problem_id: params.problemId || "",
    location: params.location || "problem_page",
  });
};

/**
 * 게스트 배너 CTA 클릭 이벤트
 */
export const trackGuestBannerClick = (params: {
  problemId?: string;
  location?: string;
}) => {
  sendGAEvent("guest_banner_click", {
    problem_id: params.problemId || "",
    location: params.location || "problem_page",
  });
};

/**
 * 게스트 피드백 티저 노출 이벤트
 */
export const trackGuestTeaserImpression = (params: {
  problemId?: string;
  score?: number;
  tier?: string;
}) => {
  sendGAEvent("guest_teaser_impression", {
    problem_id: params.problemId || "",
    score: params.score ?? 0,
    tier: params.tier || "",
  });
};

/**
 * Conversion 모달 오픈 이벤트
 */
export const trackGuestModalOpen = (params: {
  feature: string; // 'ai_coach' | 'hint' | 'feedback' | 'history'
  problemId?: string;
}) => {
  sendGAEvent("guest_modal_open", {
    feature: params.feature,
    problem_id: params.problemId || "",
  });
};

/**
 * OAuth 플로우 시작 이벤트
 */
export const trackGuestConversionStart = (params: {
  provider: string; // 'github' | 'google'
  feature: string;
  problemId?: string;
}) => {
  sendGAEvent("guest_conversion_start", {
    provider: params.provider,
    feature: params.feature,
    problem_id: params.problemId || "",
  });
};
