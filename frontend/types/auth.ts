export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  github_username: string | null;
  terms_accepted_at: string | null;
  tutorial_completed_at: string | null;
  solved_count?: number;  // 해결한 문제 수
  token_balance?: number;  // 토큰 잔액
}

export interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}

export interface TokenStatus {
  token_balance: number;
  token_used: number;
  tokens_remaining: number;
  daily_bonus_remaining: number;
  daily_bonus_limit: number;
  next_reset: string | null;
  tier: string;
}
