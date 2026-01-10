/**
 * mockFeedback.ts
 * AI 피드백 티저용 하드코딩 예시 데이터
 *
 * 실제 피드백을 블러 처리하여 호기심을 유발합니다.
 */

export interface MockFeedbackItem {
  type: "warning" | "success" | "info";
  icon: string;
  content: string;
  blurredPart: string;
}

// 점수별 블러 피드백 카드 예시
export const MOCK_FEEDBACK_ITEMS: MockFeedbackItem[] = [
  {
    type: "warning",
    icon: "⚠️",
    content: "라인 42: ",
    blurredPart: "Memory Leak 가능성 감지",
  },
  {
    type: "success",
    icon: "✅",
    content: "시간 복잡도: O(n) / ",
    blurredPart: "공간 최적화 가능",
  },
  {
    type: "info",
    icon: "💡",
    content: "엣지 케이스: ",
    blurredPart: "빈 배열 입력 시 처리 필요",
  },
];

// 점수별 등급 & 메시지
export interface ScoreTier {
  min: number;
  max: number;
  tier: string;
  tierLabel: string;
  message: string;
  subMessage: string;
}

export const SCORE_TIERS: ScoreTier[] = [
  {
    min: 100,
    max: 100,
    tier: "master",
    tierLabel: "Master",
    message: "완벽한 버그 사냥꾼!",
    subMessage: "AI가 코드 품질 개선 팁을 준비했어요",
  },
  {
    min: 75,
    max: 99,
    tier: "practitioner",
    tierLabel: "Practitioner",
    message: "거의 다 왔어요!",
    subMessage: "AI가 놓친 엣지 케이스를 찾았어요",
  },
  {
    min: 50,
    max: 74,
    tier: "apprentice",
    tierLabel: "Apprentice",
    message: "좋은 시작이에요!",
    subMessage: "AI가 개선 방향을 제안해요",
  },
  {
    min: 0,
    max: 49,
    tier: "novice",
    tierLabel: "Novice",
    message: "문제 파악 중...",
    subMessage: "AI가 단계별로 안내해드려요",
  },
];

/**
 * 점수에 따른 등급 정보 반환
 */
export function getScoreTier(score: number): ScoreTier {
  const tier = SCORE_TIERS.find((t) => score >= t.min && score <= t.max);
  return tier || SCORE_TIERS[SCORE_TIERS.length - 1];
}

/**
 * 점수별 표시할 피드백 아이템 개수
 */
export function getFeedbackItemCount(score: number): number {
  if (score >= 100) return 2;
  if (score >= 75) return 3;
  if (score >= 50) return 3;
  return 3;
}
