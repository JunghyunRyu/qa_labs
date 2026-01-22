/**
 * AI Verifier Store
 *
 * AI Verifier Track 상태 관리 스토어입니다.
 * - 챌린지 정보
 * - 에디터 코드
 * - 실행 결과
 * - 통계
 */

import { create } from 'zustand';
import type { AIChallenge, AttemptResult } from '@/types/ai-verifier';

interface AIVerifierState {
  // 챌린지
  challenge: AIChallenge | null;
  setChallenge: (challenge: AIChallenge | null) => void;

  // 에디터 코드
  code: string;
  previousCode: string | null;  // Diff용
  setCode: (code: string) => void;
  applyCode: (code: string) => void;

  // 실행 결과
  lastResult: AttemptResult | null;
  setLastResult: (result: AttemptResult | null) => void;

  // 통계
  attemptCount: number;
  incrementAttemptCount: () => void;

  // 초기화
  reset: () => void;
}

export const useAIVerifierStore = create<AIVerifierState>((set) => ({
  challenge: null,
  setChallenge: (challenge) => set({ challenge }),

  code: '',
  previousCode: null,
  setCode: (code) => set({ code }),
  applyCode: (code) => set((state) => ({
    previousCode: state.code,
    code,
  })),

  lastResult: null,
  setLastResult: (result) => set({ lastResult: result }),

  attemptCount: 0,
  incrementAttemptCount: () => set((state) => ({
    attemptCount: state.attemptCount + 1,
  })),

  reset: () => set({
    challenge: null,
    code: '',
    previousCode: null,
    lastResult: null,
    attemptCount: 0,
  }),
}));
