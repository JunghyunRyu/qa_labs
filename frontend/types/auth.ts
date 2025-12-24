export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  github_username: string | null;
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
