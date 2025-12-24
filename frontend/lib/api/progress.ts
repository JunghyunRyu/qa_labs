/** Progress API client */

import { get } from "@/lib/api";
import type {
  ProgressSummaryResponse,
  ProgressTimeline,
  DifficultyStats,
  SkillStats,
  TimeRange,
} from "@/types/progress";

const PROGRESS_ENDPOINT = "/v1/progress";

/**
 * Get user progress summary
 */
export async function getProgressSummary(): Promise<ProgressSummaryResponse> {
  return get<ProgressSummaryResponse>(`${PROGRESS_ENDPOINT}/summary`);
}

/**
 * Get progress timeline
 */
export async function getProgressTimeline(
  range: TimeRange = "30d"
): Promise<ProgressTimeline> {
  return get<ProgressTimeline>(`${PROGRESS_ENDPOINT}/timeline?range=${range}`);
}

/**
 * Get difficulty statistics
 */
export async function getDifficultyStats(): Promise<{
  difficulty_stats: DifficultyStats[];
}> {
  return get<{ difficulty_stats: DifficultyStats[] }>(
    `${PROGRESS_ENDPOINT}/difficulty`
  );
}

/**
 * Get skill statistics
 */
export async function getSkillStats(): Promise<{ skill_stats: SkillStats[] }> {
  return get<{ skill_stats: SkillStats[] }>(`${PROGRESS_ENDPOINT}/skills`);
}
