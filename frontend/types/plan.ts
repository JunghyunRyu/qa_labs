/**
 * Plan 관련 타입 정의 (PR5: UX/Pricing)
 */

export type PlanKey = 'free' | 'lite' | 'pro';

export type FeatureKey =
  | 'ai_coach'
  | 'ai_hint'
  | 'feedback_regenerate'
  | 'feedback_deep'
  | 'success_analysis'
  | 'priority_queue';

export type LimitKey =
  | 'monthly_tokens'
  | 'daily_free'
  | 'daily_ai_cap';

export interface PlanFeature {
  key: FeatureKey;
  name: string;
  description: string;
  included: boolean;
}

export interface PlanLimit {
  key: LimitKey;
  name: string;
  value: number;
  unit: string;
}

export interface PlanConfig {
  key: PlanKey;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: PlanFeature[];
  limits: PlanLimit[];
  is_popular?: boolean;
  badge?: string;
}

export interface UserPlan {
  plan_key: PlanKey;
  plan_name: string;
  started_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  features: FeatureKey[];
  limits: Record<LimitKey, number>;
}

export interface PlanCompare {
  current: UserPlan;
  plans: PlanConfig[];
}

// API Response types
export interface PlanMeResponse {
  plan: UserPlan;
  token_status: {
    monthly_remaining: number;
    daily_free_remaining: number;
    next_reset: string | null;
  };
}

export interface PlansCompareResponse {
  current_plan: PlanKey;
  plans: PlanConfig[];
}

// Plan 설정 상수 (클라이언트용)
export const PLAN_CONFIGS: Record<PlanKey, PlanConfig> = {
  free: {
    key: 'free',
    name: 'Free',
    description: '무료로 시작하기',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      { key: 'ai_coach', name: 'AI 코치', description: 'AI와 대화하며 학습', included: true },
      { key: 'ai_hint', name: 'AI 힌트', description: '단계별 힌트 제공', included: true },
      { key: 'feedback_regenerate', name: '피드백 재생성', description: '피드백 다시 받기', included: true },
      { key: 'feedback_deep', name: '심화 분석', description: '상세 코드 분석', included: false },
      { key: 'success_analysis', name: '성공 분석', description: '100점 달성 분석', included: false },
      { key: 'priority_queue', name: '우선 처리', description: '빠른 채점', included: false },
    ],
    limits: [
      { key: 'monthly_tokens', name: '월간 토큰', value: 50, unit: '개' },
      { key: 'daily_free', name: '일일 무료', value: 3, unit: '회' },
      { key: 'daily_ai_cap', name: '일일 AI 호출', value: 30, unit: '회' },
    ],
  },
  lite: {
    key: 'lite',
    name: 'Lite',
    description: '더 많은 연습이 필요할 때',
    price_monthly: 9900,
    price_yearly: 99000,
    is_popular: true,
    badge: '인기',
    features: [
      { key: 'ai_coach', name: 'AI 코치', description: 'AI와 대화하며 학습', included: true },
      { key: 'ai_hint', name: 'AI 힌트', description: '단계별 힌트 제공', included: true },
      { key: 'feedback_regenerate', name: '피드백 재생성', description: '피드백 다시 받기', included: true },
      { key: 'feedback_deep', name: '심화 분석', description: '상세 코드 분석', included: false },
      { key: 'success_analysis', name: '성공 분석', description: '100점 달성 분석', included: true },
      { key: 'priority_queue', name: '우선 처리', description: '빠른 채점', included: false },
    ],
    limits: [
      { key: 'monthly_tokens', name: '월간 토큰', value: 300, unit: '개' },
      { key: 'daily_free', name: '일일 무료', value: 5, unit: '회' },
      { key: 'daily_ai_cap', name: '일일 AI 호출', value: 100, unit: '회' },
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    description: '전문가를 위한 모든 기능',
    price_monthly: 29900,
    price_yearly: 299000,
    features: [
      { key: 'ai_coach', name: 'AI 코치', description: 'AI와 대화하며 학습', included: true },
      { key: 'ai_hint', name: 'AI 힌트', description: '단계별 힌트 제공', included: true },
      { key: 'feedback_regenerate', name: '피드백 재생성', description: '피드백 다시 받기', included: true },
      { key: 'feedback_deep', name: '심화 분석', description: '상세 코드 분석', included: true },
      { key: 'success_analysis', name: '성공 분석', description: '100점 달성 분석', included: true },
      { key: 'priority_queue', name: '우선 처리', description: '빠른 채점', included: true },
    ],
    limits: [
      { key: 'monthly_tokens', name: '월간 토큰', value: 1000, unit: '개' },
      { key: 'daily_free', name: '일일 무료', value: 10, unit: '회' },
      { key: 'daily_ai_cap', name: '일일 AI 호출', value: 500, unit: '회' },
    ],
  },
};

// Helper functions
export function formatPrice(price: number): string {
  if (price === 0) return '무료';
  return `${price.toLocaleString()}원`;
}

export function getPlanBadgeColor(planKey: PlanKey): string {
  switch (planKey) {
    case 'free':
      return 'bg-gray-100 text-gray-800';
    case 'lite':
      return 'bg-blue-100 text-blue-800';
    case 'pro':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
