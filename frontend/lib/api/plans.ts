/**
 * Plan API functions (PR5: UX/Pricing)
 */

import { get } from "../api";
import type {
  PlanMeResponse,
  PlansCompareResponse,
  PlanKey,
  FeatureKey,
} from "@/types/plan";

const PLANS_BASE = "/v1/plans";

/**
 * Get current user's plan information.
 */
export async function getMyPlan(): Promise<PlanMeResponse> {
  return get<PlanMeResponse>(`${PLANS_BASE}/me`);
}

/**
 * Get all plans for comparison.
 */
export async function getPlansCompare(): Promise<PlansCompareResponse> {
  return get<PlansCompareResponse>(`${PLANS_BASE}/compare`);
}

/**
 * Check if current user has a specific feature.
 *
 * @param feature - Feature key to check
 */
export async function hasFeature(feature: FeatureKey): Promise<boolean> {
  try {
    const response = await getMyPlan();
    return response.plan.features.includes(feature);
  } catch {
    return false;
  }
}

/**
 * Get remaining token count.
 */
export async function getTokenRemaining(): Promise<{
  monthly: number;
  daily_free: number;
}> {
  try {
    const response = await getMyPlan();
    return {
      monthly: response.token_status.monthly_remaining,
      daily_free: response.token_status.daily_free_remaining,
    };
  } catch {
    return { monthly: 0, daily_free: 0 };
  }
}

/**
 * Check if user can use AI feature (has tokens).
 */
export async function canUseAI(): Promise<boolean> {
  try {
    const tokens = await getTokenRemaining();
    return tokens.monthly > 0 || tokens.daily_free > 0;
  } catch {
    return false;
  }
}

/**
 * Get upgrade URL for a specific plan.
 *
 * @param planKey - Target plan key
 */
export function getUpgradeUrl(planKey: PlanKey): string {
  // 현재는 /pricing 페이지로 리다이렉트
  // 추후 결제 연동 시 실제 결제 URL로 변경
  return `/pricing?plan=${planKey}`;
}

/**
 * Format plan name for display.
 *
 * @param planKey - Plan key
 */
export function getPlanDisplayName(planKey: PlanKey): string {
  const names: Record<PlanKey, string> = {
    free: 'Free',
    lite: 'Lite',
    pro: 'Pro',
  };
  return names[planKey] || planKey;
}
