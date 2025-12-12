/**
 * User-related API functions.
 */

import { get } from "../api";
import type {
  UserSubmissionsResponse,
  UserStatisticsResponse,
  SubmissionStatus,
} from "@/types/submission";

const USERS_BASE = "/v1/users";

/**
 * Get paginated list of current user's submissions.
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param status - Optional status filter
 * @param days - Optional filter for recent N days (7, 30)
 */
export async function getMySubmissions(
  page: number = 1,
  pageSize: number = 10,
  status?: SubmissionStatus,
  days?: number
): Promise<UserSubmissionsResponse> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("page_size", pageSize.toString());

  if (status) {
    params.set("status", status);
  }
  if (days) {
    params.set("days", days.toString());
  }

  return get<UserSubmissionsResponse>(
    `${USERS_BASE}/me/submissions?${params.toString()}`
  );
}

/**
 * Get statistics for current user.
 */
export async function getMyStatistics(): Promise<UserStatisticsResponse> {
  return get<UserStatisticsResponse>(`${USERS_BASE}/me/statistics`);
}
