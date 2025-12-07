/** Problems API client */

import { get } from "@/lib/api";
import type { Problem, ProblemListResponse } from "@/types/problem";

const PROBLEMS_ENDPOINT = "/v1/problems";

/**
 * Get paginated list of problems
 */
export async function getProblems(
  page: number = 1,
  pageSize: number = 10
): Promise<ProblemListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  
  return get<ProblemListResponse>(`${PROBLEMS_ENDPOINT}?${params.toString()}`);
}

/**
 * Get problem detail by ID
 */
export async function getProblem(id: number): Promise<Problem> {
  return get<Problem>(`${PROBLEMS_ENDPOINT}/${id}`);
}

