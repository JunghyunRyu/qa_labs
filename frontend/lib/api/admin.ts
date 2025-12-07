/** Admin API client */

import { post } from "@/lib/api";

const ADMIN_ENDPOINT = "/api/admin";

export interface ProblemGenerateRequest {
  goal: string;
  language?: string;
  testing_framework?: string;
  skills_to_assess?: string[];
  difficulty?: string;
  problem_style?: string;
}

export interface BuggyImplementationCreate {
  buggy_code: string;
  bug_description?: string;
  weight?: number;
}

export interface ProblemCreateWithBuggy {
  slug: string;
  title: string;
  description_md: string;
  function_signature: string;
  golden_code: string;
  difficulty: string;
  skills?: string[];
  buggy_implementations?: BuggyImplementationCreate[];
}

export interface GeneratedProblem {
  title: string;
  function_signature: string;
  golden_code: string;
  buggy_implementations: Array<{
    bug_description: string;
    buggy_code: string;
    weight: number;
  }>;
  description_md: string;
  initial_test_template: string;
  tags: string[];
  difficulty: string;
}

/**
 * Generate a problem using AI
 */
export async function generateProblem(
  request: ProblemGenerateRequest
): Promise<GeneratedProblem> {
  return post<GeneratedProblem>(`${ADMIN_ENDPOINT}/problems/ai-generate`, request);
}

/**
 * Create a problem with buggy implementations
 */
export async function createProblem(
  problem: ProblemCreateWithBuggy
): Promise<any> {
  return post(`${ADMIN_ENDPOINT}/problems`, problem);
}

