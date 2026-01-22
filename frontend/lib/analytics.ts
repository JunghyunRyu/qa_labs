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
 * M6-1: 회원 전환 모달 트리거 이벤트
 * 비회원이 2회 이상 제출 시 모달 표시할 때 호출
 */
export const trackConversionModalTrigger = (params: {
  trigger: "submission_count" | "deep_feedback";
  problemId: string;
  submissionCount: number;
}) => {
  sendGAEvent("conversion_modal_trigger", {
    trigger: params.trigger,
    problem_id: params.problemId,
    submission_count: params.submissionCount,
  });
};

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
  trigger: "wrong_answer" | "inactivity" | "auto_failure";
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
  trigger: "wrong_answer" | "inactivity" | "auto_failure";
}) => {
  sendGAEvent("ai_nudge_click", {
    problem_id: params.problemId,
    trigger: params.trigger,
  });
};

/**
 * M6-3: 에러 화면에서 AI 질문 버튼 클릭 이벤트
 */
export const trackAIAskFromError = (params: {
  problemId: string;
  errorType: string;
  submissionStatus: "FAILURE" | "ERROR";
}) => {
  sendGAEvent("ai_ask_from_error", {
    problem_id: params.problemId,
    error_type: params.errorType,
    submission_status: params.submissionStatus,
  });
};

// ============================================
// M7 AI 강제 경험 트래킹 이벤트
// ============================================

/**
 * M7: VE01 첫 성공 모달 오픈 이벤트
 */
export const trackFirstSuccessModalOpen = (params: {
  problemSlug: string;
}) => {
  sendGAEvent("first_success_modal_open", {
    problem_slug: params.problemSlug,
  });
};

/**
 * M7: VE01 첫 성공 모달에서 AI 클릭 이벤트
 */
export const trackFirstSuccessAIClick = (params: {
  problemSlug: string;
}) => {
  sendGAEvent("first_success_ai_click", {
    problem_slug: params.problemSlug,
  });
};

// ============================================
// AI Verifier Track 트래킹 이벤트
// ============================================

/**
 * AI Verifier 트랙 진입 이벤트
 */
export const trackAIVerifierStart = () => {
  sendGAEvent("ai_verifier_start", {
    referrer: typeof document !== "undefined" ? document.referrer : "",
  });
};

/**
 * AI Verifier 챌린지 조회 이벤트
 */
export const trackAIVerifierChallengeView = (params: {
  challengeId: string;
  level: number;
  category: string;
}) => {
  sendGAEvent("ai_verifier_challenge_view", {
    challenge_id: params.challengeId,
    level: params.level,
    category: params.category,
  });
};

/**
 * AI Verifier 채팅 메시지 전송 이벤트
 */
export const trackAIVerifierChatMessage = (params: {
  challengeId: string;
  messageType: "user" | "assistant";
}) => {
  sendGAEvent("ai_verifier_chat_message", {
    challenge_id: params.challengeId,
    message_type: params.messageType,
  });
};

/**
 * AI Verifier 코드 적용 이벤트
 */
export const trackAIVerifierCodeApplied = (params: {
  challengeId: string;
  isPrescripted: boolean;
}) => {
  sendGAEvent("ai_verifier_code_applied", {
    challenge_id: params.challengeId,
    is_prescripted: params.isPrescripted,
  });
};

/**
 * AI Verifier 테스트 제출 이벤트
 */
export const trackAIVerifierTestSubmitted = (params: {
  challengeId: string;
  inputType: string;
}) => {
  sendGAEvent("ai_verifier_test_submitted", {
    challenge_id: params.challengeId,
    input_type: params.inputType,
  });
};

/**
 * AI Verifier 버그 발견 이벤트
 */
export const trackAIVerifierBugFound = (params: {
  challengeId: string;
  level: number;
  attempts: number;
  timeSpentSec: number;
}) => {
  sendGAEvent("ai_verifier_bug_found", {
    challenge_id: params.challengeId,
    level: params.level,
    attempts: params.attempts,
    time_spent_sec: params.timeSpentSec,
  });
};

/**
 * AI Verifier 버그 미발견 이벤트
 */
export const trackAIVerifierBugNotFound = (params: {
  challengeId: string;
  attempts: number;
}) => {
  sendGAEvent("ai_verifier_bug_not_found", {
    challenge_id: params.challengeId,
    attempts: params.attempts,
  });
};

/**
 * AI Verifier 힌트 사용 이벤트
 */
export const trackAIVerifierHintUsed = (params: {
  challengeId: string;
  hintLevel: number;
}) => {
  sendGAEvent("ai_verifier_hint_used", {
    challenge_id: params.challengeId,
    hint_level: params.hintLevel,
  });
};

/**
 * AI Verifier 배지 획득 이벤트
 */
export const trackAIVerifierBadgeEarned = (params: {
  badgeId: string;
  badgeName: string;
}) => {
  sendGAEvent("ai_verifier_badge_earned", {
    badge_id: params.badgeId,
    badge_name: params.badgeName,
  });
};

/**
 * AI Verifier 랭크 업 이벤트
 */
export const trackAIVerifierRankUp = (params: {
  oldRank: string;
  newRank: string;
  totalScore: number;
}) => {
  sendGAEvent("ai_verifier_rank_up", {
    old_rank: params.oldRank,
    new_rank: params.newRank,
    total_score: params.totalScore,
  });
};

/**
 * AI Verifier 온보딩 단계 이벤트
 */
export const trackAIVerifierOnboardingStep = (params: {
  stepNumber: number;
  stepName: string;
}) => {
  sendGAEvent("ai_verifier_onboarding_step", {
    step_number: params.stepNumber,
    step_name: params.stepName,
  });
};

/**
 * AI Verifier 온보딩 스킵 이벤트
 */
export const trackAIVerifierOnboardingSkip = (params: {
  skippedAtStep: number;
}) => {
  sendGAEvent("ai_verifier_onboarding_skip", {
    skipped_at_step: params.skippedAtStep,
  });
};
