/**
 * SDET Career Path - Unified Rank System
 *
 * 사용자의 성장 경로를 SDET 커리어 패스로 시각화합니다.
 * 모든 랭크 관련 로직은 이 파일에서 중앙 관리됩니다.
 */

export interface RankInfo {
  level: number;
  name: string;
  icon: string;
  color: string;        // Tailwind text color class
  bgColor: string;      // Tailwind background color class
  minSolved: number;
  minAccuracy?: number; // 정답률 조건 (0-100)
  description: string;
}

export interface UserRankResult {
  current: RankInfo;
  next: RankInfo | null;
  progress: number;           // 0-100 (현재 랭크 내 진행도)
  solvedToNext: number;       // 다음 랭크까지 필요한 문제 수
  isMaxRank: boolean;
}

// SDET Career Path 랭크 정의
export const RANKS: RankInfo[] = [
  {
    level: 1,
    name: "Rookie",
    icon: "🌱",
    color: "text-slate-400",
    bgColor: "bg-slate-400",
    minSolved: 0,
    description: "QA 여정의 시작! 첫 문제를 풀어보세요.",
  },
  {
    level: 2,
    name: "Junior SDET",
    icon: "🔍",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400",
    minSolved: 5,
    description: "테스트의 기초를 익히는 중입니다.",
  },
  {
    level: 3,
    name: "SDET",
    icon: "⚡",
    color: "text-blue-400",
    bgColor: "bg-blue-400",
    minSolved: 20,
    description: "자동화 테스트에 능숙해지고 있습니다.",
  },
  {
    level: 4,
    name: "Senior SDET",
    icon: "🛡️",
    color: "text-amber-400",
    bgColor: "bg-amber-400",
    minSolved: 50,
    minAccuracy: 80,
    description: "품질의 수호자로 성장했습니다.",
  },
  {
    level: 5,
    name: "QA Architect",
    icon: "👑",
    color: "text-purple-400",
    bgColor: "bg-purple-400",
    minSolved: 100,
    minAccuracy: 90,
    description: "QA 전략을 설계하는 아키텍트입니다.",
  },
];

/**
 * 사용자의 현재 랭크 정보를 계산합니다.
 *
 * @param solvedCount - 해결한 문제 수
 * @param accuracy - 정답률 (0-100), 선택적
 * @returns 현재 랭크, 다음 랭크, 진행도 정보
 */
export function getUserRank(
  solvedCount: number,
  accuracy: number = 0
): UserRankResult {
  // 역순으로 탐색하여 가장 높은 달성 랭크 찾기
  let currentRank = RANKS[0];

  for (let i = RANKS.length - 1; i >= 0; i--) {
    const rank = RANKS[i];
    const meetsSolved = solvedCount >= rank.minSolved;
    const meetsAccuracy = !rank.minAccuracy || accuracy >= rank.minAccuracy;

    if (meetsSolved && meetsAccuracy) {
      currentRank = rank;
      break;
    }
  }

  // 다음 랭크 찾기
  const currentIndex = RANKS.findIndex((r) => r.level === currentRank.level);
  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
  const isMaxRank = nextRank === null;

  // 진행도 계산
  let progress = 100;
  let solvedToNext = 0;

  if (nextRank) {
    const currentMin = currentRank.minSolved;
    const nextMin = nextRank.minSolved;
    const range = nextMin - currentMin;
    const progressInRange = solvedCount - currentMin;

    progress = Math.min(Math.round((progressInRange / range) * 100), 99);
    solvedToNext = nextMin - solvedCount;
  }

  return {
    current: currentRank,
    next: nextRank,
    progress,
    solvedToNext,
    isMaxRank,
  };
}

/**
 * 랭크 레벨로 랭크 정보를 가져옵니다.
 */
export function getRankByLevel(level: number): RankInfo | undefined {
  return RANKS.find((r) => r.level === level);
}

/**
 * 모든 랭크 목록을 반환합니다.
 */
export function getAllRanks(): RankInfo[] {
  return RANKS;
}
