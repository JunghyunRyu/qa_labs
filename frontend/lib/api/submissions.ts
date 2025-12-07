/** Submissions API client */

import { post, get } from "@/lib/api";
import type { Submission, SubmissionCreate } from "@/types/problem";

const SUBMISSIONS_ENDPOINT = "/v1/submissions";

/**
 * Create a new submission
 */
export async function createSubmission(
  data: SubmissionCreate
): Promise<Submission> {
  return post<Submission>(SUBMISSIONS_ENDPOINT, data);
}

/**
 * Get submission result by ID
 */
export async function getSubmission(id: string): Promise<Submission> {
  return get<Submission>(`${SUBMISSIONS_ENDPOINT}/${id}`);
}

