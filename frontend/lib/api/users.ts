/**
 * User-related API functions.
 */

import { get, del } from "../api";
import type {
  UserSubmissionsResponse,
  UserStatisticsResponse,
  ResultFilter,
} from "@/types/submission";

const USERS_BASE = "/v1/users";

/**
 * Get paginated list of current user's submissions.
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param result - Optional result filter (pass, partial, fail, test_fail, error)
 * @param days - Optional filter for recent N days (7, 30)
 */
export async function getMySubmissions(
  page: number = 1,
  pageSize: number = 10,
  result?: ResultFilter,
  days?: number
): Promise<UserSubmissionsResponse> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("page_size", pageSize.toString());

  if (result) {
    params.set("result", result);
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

/**
 * Delete current user's account permanently.
 * This removes all user data including submissions, bookmarks, etc.
 */
export async function deleteMyAccount(): Promise<void> {
  await del(`${USERS_BASE}/me`);
}
