/** Problem and Submission types */

export interface Problem {
  id: number;
  slug: string;
  title: string;
  description_md: string;
  function_signature: string;
  golden_code: string;
  difficulty: "Easy" | "Medium" | "Hard";
  skills?: string[];
  created_at: string;
}

export interface ProblemListItem {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
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

export interface Submission {
  id: string;
  user_id: string;
  problem_id: number;
  code: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILURE" | "ERROR";
  score: number;
  killed_mutants?: number;
  total_mutants?: number;
  execution_log?: Record<string, unknown>;
  feedback_json?: Record<string, unknown>;
  created_at: string;
}

export interface SubmissionCreate {
  problem_id: number;
  code: string;
}

