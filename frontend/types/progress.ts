/** Progress Dashboard Types */

export interface DifficultyStats {
  difficulty: string;
  submission_count: number;
  avg_score: number;
  success_rate: number;
}

export interface DomainStats {
  domain: string;
  submission_count: number;
  avg_score: number;
}

export interface SkillStats {
  skill: string;
  submission_count: number;
  avg_score: number;
}

export interface ProgressSummary {
  total_submissions: number;
  success_submissions: number;
  avg_score: number;
  avg_kill_ratio: number;
  best_score: number;
  recent_avg_score: number;
  difficulty_stats: DifficultyStats[];
  domain_stats: DomainStats[];
  skill_stats: SkillStats[];
}

export interface ProgressEmpty {
  message: string;
  has_data: false;
}

export type ProgressSummaryResponse = ProgressSummary | ProgressEmpty;

export interface TimelineEntry {
  date: string;
  submission_count: number;
  avg_score: number;
  avg_kill_ratio: number;
}

export interface ProgressTimeline {
  entries: TimelineEntry[];
  range: string;
  total_submissions: number;
}

export type TimeRange = "7d" | "30d" | "90d" | "all";

export function isProgressEmpty(
  response: ProgressSummaryResponse
): response is ProgressEmpty {
  return "has_data" in response && response.has_data === false;
}
