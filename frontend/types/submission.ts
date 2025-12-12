/**
 * Submission types for user submission history and statistics.
 */

export type SubmissionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILURE" | "ERROR";
export type Difficulty = "Very Easy" | "Easy" | "Medium" | "Hard";

/**
 * Submission list item with problem info.
 */
export interface SubmissionListItem {
  id: string;
  problem_id: number;
  problem_title: string;
  problem_difficulty: Difficulty;
  status: SubmissionStatus;
  score: number;
  killed_mutants?: number;
  total_mutants?: number;
  created_at: string;
}

/**
 * Paginated user submissions response.
 */
export interface UserSubmissionsResponse {
  submissions: SubmissionListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Difficulty-based statistics.
 */
export interface DifficultyStats {
  attempted: number;
  solved: number;
}

/**
 * Recent activity (daily submission count).
 */
export interface RecentActivity {
  date: string; // YYYY-MM-DD
  submissions: number;
}

/**
 * User statistics response.
 */
export interface UserStatisticsResponse {
  total_submissions: number;
  total_problems_attempted: number;
  total_problems_solved: number;
  success_rate: number; // 0.0 ~ 100.0
  avg_score: number;
  best_score: number;
  by_difficulty: Record<Difficulty, DifficultyStats>;
  recent_activity: RecentActivity[];
}

/**
 * Filter options for submissions list.
 */
export interface SubmissionFilters {
  status?: SubmissionStatus;
  days?: number; // 7, 30, or undefined for all
}
