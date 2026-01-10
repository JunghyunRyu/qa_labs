/**
 * Conversion components
 * 비회원 → 회원 전환율 향상을 위한 컴포넌트 모음
 */

// 컴포넌트
export { default as ConversionModal } from "./ConversionModal";
export type { ConversionFeature } from "./ConversionModal";
export { default as GuestConversionBanner } from "./GuestConversionBanner";
export { default as AIFeedbackTeaser } from "./AIFeedbackTeaser";

// 데이터
export { MOCK_FEEDBACK_ITEMS, SCORE_TIERS, getScoreTier, getFeedbackItemCount } from "./mockFeedback";
export type { MockFeedbackItem, ScoreTier } from "./mockFeedback";

// 훅
export { useGuestConversion } from "./useGuestConversion";
export { default as useGuestConversionDefault } from "./useGuestConversion";
