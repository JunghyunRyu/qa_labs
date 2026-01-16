/**
 * Daily Bounty API client
 */

import { get } from '@/lib/api';
import type { DailyBountyStatus, DailyBountyHistory } from '@/types/daily-bounty';

const DAILY_BOUNTY_ENDPOINT = '/v1/daily-bounty';

/**
 * 오늘의 일일 현상금 상태 조회
 */
export async function getDailyBountyStatus(): Promise<DailyBountyStatus> {
  return get<DailyBountyStatus>(DAILY_BOUNTY_ENDPOINT);
}

/**
 * 일일 현상금 완료 기록 조회
 * @param days 조회 기간 (기본 7일, 최대 30일)
 */
export async function getDailyBountyHistory(days: number = 7): Promise<DailyBountyHistory> {
  return get<DailyBountyHistory>(`${DAILY_BOUNTY_ENDPOINT}/history?days=${days}`);
}
