/** Problems API client */

import { get, post, del } from "@/lib/api";
import type { Problem, ProblemListResponse, BookmarkedProblemListResponse, BookmarkStatusResponse } from "@/types/problem";

const PROBLEMS_ENDPOINT = "/v1/problems";

export interface GetProblemsParams {
  page?: number;
  pageSize?: number;
  difficulty?: string;
  search?: string;
  tags?: string[];
}

/**
 * Get paginated and filtered list of problems
 */
export async function getProblems(
  params: GetProblemsParams = {}
): Promise<ProblemListResponse> {
  const { page = 1, pageSize = 10, difficulty, search, tags } = params;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (difficulty) {
    queryParams.append("difficulty", difficulty);
  }
  if (search) {
    queryParams.append("search", search);
  }
  if (tags && tags.length > 0) {
    queryParams.append("tags", tags.join(","));
  }

  return get<ProblemListResponse>(`${PROBLEMS_ENDPOINT}?${queryParams.toString()}`);
}

/**
 * Get problem detail by ID
 */
export async function getProblem(id: number): Promise<Problem> {
  return get<Problem>(`${PROBLEMS_ENDPOINT}/${id}`);
}

/**
 * Get paginated list of bookmarked problems
 */
export async function getBookmarkedProblems(
  page: number = 1,
  pageSize: number = 10
): Promise<BookmarkedProblemListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  return get<BookmarkedProblemListResponse>(`${PROBLEMS_ENDPOINT}/bookmarked?${params.toString()}`);
}

/**
 * Add a problem to bookmarks
 */
export async function addBookmark(problemId: number): Promise<{ message: string }> {
  return post<{ message: string }>(`${PROBLEMS_ENDPOINT}/${problemId}/bookmark`);
}

/**
 * Remove a problem from bookmarks
 */
export async function removeBookmark(problemId: number): Promise<{ message: string }> {
  return del<{ message: string }>(`${PROBLEMS_ENDPOINT}/${problemId}/bookmark`);
}

/**
 * Get bookmark status for a problem
 */
export async function getBookmarkStatus(problemId: number): Promise<BookmarkStatusResponse> {
  return get<BookmarkStatusResponse>(`${PROBLEMS_ENDPOINT}/${problemId}/bookmark/status`);
}

