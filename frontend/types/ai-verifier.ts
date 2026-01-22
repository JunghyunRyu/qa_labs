/**
 * AI Verifier Track TypeScript Types
 */

// ============================================================
// Input/Output Schema Types
// ============================================================

export interface InputArgSchema {
  name: string;
  type: 'int' | 'float' | 'str' | 'bool' | 'list' | 'dict' | 'none' | 'any';
  description?: string;
  example?: unknown;
}

export interface InputSchema {
  type: 'single' | 'multiple';
  args: InputArgSchema[];
}

export interface ComparisonConfig {
  float_epsilon?: number;
  list_order_matters?: boolean;
  case_sensitive?: boolean;
}

// ============================================================
// Challenge Types
// ============================================================

export type BugType = 'logic' | 'boundary' | 'type' | 'state' | 'security';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ErrorCode = 'E_SYNTAX' | 'E_RUNTIME' | 'E_TIMEOUT' | 'E_MEMORY' | 'E_FORBIDDEN' | 'E_INPUT';

export interface AIChallenge {
  id: string;
  title: string;
  description: string;
  level: number;
  category: string;
  function_name: string;
  bug_type: BugType;
  buggy_code_template: string;
  input_schema: InputSchema;
  expected_output_type: string;
  comparison_config?: ComparisonConfig;
  input_hint: string;
  hints: string[];
  bounty_points: number;
  difficulty: Difficulty;
}

export interface AIChallengeListItem {
  id: string;
  title: string;
  description: string;
  level: number;
  category: string;
  bug_type: BugType;
  input_hint: string;
  bounty_points: number;
  difficulty: Difficulty;
  is_completed: boolean;
}

export interface AIChallengeListResponse {
  challenges: AIChallengeListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================
// Attempt Types
// ============================================================

export interface AttemptCreate {
  user_input: string;
}

export interface NewBadge {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface NewRank {
  name: string;
  icon: string;
}

export interface AttemptResult {
  success: boolean;
  bug_found: boolean;
  user_input: string;
  parsed_input?: unknown;
  actual_output?: string;
  expected_output?: string;
  error_type?: ErrorCode;
  error_message?: string;
  user_friendly_message?: string;
  execution_time_ms?: number;
  points_earned: number;
  is_first_solve: boolean;
  total_score: number;
  new_rank?: NewRank;
  newly_awarded_badges: NewBadge[];
}

export interface AttemptResponse {
  id: string;
  challenge_id: string;
  user_input: string;
  result: 'success' | 'fail' | 'error';
  bug_found: boolean;
  actual_output?: string;
  expected_output?: string;
  error_type?: ErrorCode;
  error_message?: string;
  points_earned: number;
  is_first_solve: boolean;
  hints_used: number;
  execution_time_ms?: number;
  created_at: string;
}

export interface AttemptHistoryResponse {
  attempts: AttemptResponse[];
  total_attempts: number;
  successful_attempts: number;
}

// ============================================================
// Stats Types
// ============================================================

export interface AIVerifierStats {
  total_score: number;
  bugs_found: number;
  challenges_completed: number;
  current_streak: number;
  highest_streak: number;
  rank: string;
  rank_icon: string;
}

// ============================================================
// Badge Types
// ============================================================

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  earned_at?: string;
}

export interface UserBadgesResponse {
  earned_badges: Badge[];
  available_badges: Badge[];
}

// ============================================================
// Leaderboard Types
// ============================================================

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  bugs_found: number;
}

export interface LeaderboardResponse {
  period: 'weekly' | 'monthly' | 'all_time';
  entries: LeaderboardEntry[];
  user_rank?: number;
}

// ============================================================
// Hint Types
// ============================================================

export interface HintRequest {
  hint_level: number;
}

export interface HintResponse {
  hint_level: number;
  hint_text: string;
  hints_remaining: number;
  total_hints: number;
}

// ============================================================
// Chat Types (for AI interaction)
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  codeBlock?: {
    code: string;
    language: string;
  };
  is_prescripted?: boolean;
}

export interface AICodeResponse {
  code: string;
  is_prescripted: boolean;
}

// ============================================================
// Judge Types (for Pyodide execution)
// ============================================================

export interface JudgeRequest {
  type: 'runJudge';
  id: string;
  payload: {
    userInput: string;
    buggyCode: string;
    correctCode: string;
    functionName: string;
    expectedOutputType: string;
    comparisonConfig: ComparisonConfig;
  };
}

export interface JudgeResult {
  success: boolean;
  bugFound: boolean;
  userInput: string;
  parsedInput?: unknown;
  actualResult: string;
  expectedResult: string;
  errorType?: ErrorCode;
  errorMessage?: string;
  userFriendlyMessage?: string;
  executionTimeMs: number;
}
