/** Problem and Submission types */

export interface BuggyImplementation {
  id: number;
  buggy_code: string;
  bug_description?: string;
  weight: number;
}

export type DomainType = "common" | "fintech" | "commerce" | "saas" | "platform" | "content";

export interface Problem {
  id: number;
  slug: string;
  title: string;
  description_md: string;
  function_signature: string;
  golden_code: string;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
  domain: DomainType;
  skills?: string[];
  summary?: string;  // 핵심 테스트 포인트 요약 (마크다운)
  created_at: string;
  buggy_implementations: BuggyImplementation[];
}

export interface ProblemListItem {
  id: number;
  slug: string;
  title: string;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard";
  domain: DomainType;
  skills?: string[];
  summary?: string;  // 핵심 테스트 포인트 요약
  description_md?: string;  // For preview in list view
  success_rate?: number | null;  // 0.0~1.0, null if < 5 submissions
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
  // Test Quality Analysis (Phase 4)
  test_quality_score?: number;
  test_quality_grade?: "A" | "B" | "C" | "D" | "F";
  test_quality_analysis?: Record<string, unknown>;
}

/** Client-side execution result (from Pyodide) */
export interface ClientExecutionResult {
  golden_code_passed: boolean;
  mutants_killed: number;
  total_mutants: number;
  score: number;
  details?: Array<{
    mutant_id: string;
    killed: boolean;
    test_output?: string;
    execution_time?: number;
  }>;
  total_execution_time?: number;
}

export interface SubmissionCreate {
  problem_id: number;
  code: string;
  /** If provided, server skips Celery task and saves results directly */
  client_result?: ClientExecutionResult;
}

