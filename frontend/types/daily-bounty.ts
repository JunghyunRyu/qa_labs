/**
 * Daily Bounty (일일 현상금) Types
 */

export interface DailyBountyProblem {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  domain: string;
  short_description?: string;
}

export interface DailyBountyRewards {
  base_reward: number;      // 기본 보상 (5)
  streak_bonus: number;     // 스트릭 보너스 (50)
  streak_threshold: number; // 보너스 조건 (3일)
}

export interface DailyBountyCompletion {
  base_reward_granted: boolean;
  streak_bonus_granted: boolean;
}

export interface DailyBountyStatus {
  date: string;                          // YYYY-MM-DD
  problem: DailyBountyProblem | null;
  is_completed: boolean;
  user_streak: number;                   // 현재 연속 일수
  streak_progress: number;               // 3일까지 남은 일수 (0-2)
  time_remaining_seconds: number;        // 자정까지 남은 시간
  rewards: DailyBountyRewards;
  completion?: DailyBountyCompletion;
  error?: string;
}

export interface DailyBountyHistoryItem {
  date: string;
  problem_id: number | null;
  streak_count: number;
  base_reward_granted: boolean;
  streak_bonus_granted: boolean;
}

export interface DailyBountyHistory {
  completions: DailyBountyHistoryItem[];
  current_streak: number;
  total_completions: number;
}
