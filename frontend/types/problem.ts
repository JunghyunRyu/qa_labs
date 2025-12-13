/** Problem and Submission types */

export interface Problem {
  id: number;
  slug: string;
  title: string;
  description_md: string;
  function_signature: string;
  golden_code: string;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
  skills?: string[];
  created_at: string;
}

export interface ProblemListItem {
  id: number;
  slug: string;
  title: string;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
  skills?: string[];
  description_md?: string;  // For preview in list view
}

export interface ProblemListResponse {
  problems: ProblemListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BookmarkedProblemItem {
  id: number;
  slug: string;
  title: string;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
  skills?: string[];
  bookmarked_at: string;
}

export interface BookmarkedProblemListResponse {
  problems: BookmarkedProblemItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BookmarkStatusResponse {
  is_bookmarked: boolean;
}

export interface SubmissionProgress {
  step: "initializing" | "testing_golden" | "testing_buggy" | "generating_feedback";
  message: string;
  percent: number;
  current?: number;
  total?: number;
}

export interface Submission {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  problem_id: number;
  code: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILURE" | "ERROR";
  score: number;
  killed_mutants?: number;
  total_mutants?: number;
  execution_log?: Record<string, unknown>;
  feedback_json?: Record<string, unknown>;
  progress?: SubmissionProgress;
  created_at: string;
}

export interface SubmissionCreate {
  problem_id: number;
  code: string;
}

