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

// ============================================
// Landing Page CTA 트래킹 이벤트
// ============================================

/**
 * 랜딩 페이지 CTA 클릭 이벤트
 */
export const trackLandingCTAClick = (params: {
  location: "hero" | "footer" | "showcase" | "header";
  ctaType: "start_challenge" | "ai_copilot" | "signup" | "browse" | "problem_card";
  destination?: string;
}) => {
  sendGAEvent("landing_cta_click", {
    location: params.location,
    cta_type: params.ctaType,
    destination: params.destination || "",
  });
};

/**
 * 시나리오 카드 클릭 이벤트
 */
export const trackScenarioCardClick = (params: {
  problemSlug: string;
  domain: string;
  difficulty: string;
}) => {
  sendGAEvent("scenario_card_click", {
    problem_slug: params.problemSlug,
    domain: params.domain,
    difficulty: params.difficulty,
  });
};

/**
 * 랜딩 페이지 섹션 노출 이벤트 (스크롤 추적용)
 */
export const trackLandingSectionView = (params: {
  section: "hero" | "ai_teaser" | "proof_points" | "how_it_works" | "showcase" | "target_audience" | "footer_cta";
}) => {
  sendGAEvent("landing_section_view", {
    section: params.section,
  });
};

// ============================================
// Guest AI Conversion 퍼널 트래킹 이벤트
// ============================================

/**
 * 게스트 AI 채팅 시작 이벤트
 */
export const trackGuestAIChatStart = (params: {
  problemId: string;
  usageCount: number;
}) => {
  sendGAEvent("guest_ai_chat_start", {
    problem_id: params.problemId,
    usage_count: params.usageCount,
  });
};

/**
 * 게스트 AI 사용 제한 도달 이벤트
 */
export const trackGuestAILimitReached = (params: {
  problemId: string;
}) => {
  sendGAEvent("guest_ai_limit_reached", {
    problem_id: params.problemId,
    limit: 3,
  });
};

/**
 * 게스트 AI 전환 버튼 클릭 이벤트
 */
export const trackGuestAIConversionClick = (params: {
  problemId: string;
  trigger: "blur_answer" | "limit_modal";
}) => {
  sendGAEvent("guest_ai_conversion_click", {
    problem_id: params.problemId,
    trigger: params.trigger,
  });
};

/**
 * AI 넛지 토스트 노출 이벤트
 */
export const trackAINudgeImpression = (params: {
  problemId: string;
  trigger: "wrong_answer" | "inactivity";
}) => {
  sendGAEvent("ai_nudge_impression", {
    problem_id: params.problemId,
    trigger: params.trigger,
  });
};

/**
 * AI 넛지 토스트 클릭 이벤트
 */
export const trackAINudgeClick = (params: {
  problemId: string;
  trigger: "wrong_answer" | "inactivity";
}) => {
  sendGAEvent("ai_nudge_click", {
    problem_id: params.problemId,
    trigger: params.trigger,
  });
};
