/**
 * Tutorial Store - Zustand 기반 튜토리얼 상태 관리
 *
 * localStorage와 연동하여 튜토리얼 완료 상태를 유지합니다.
 */

import { create } from "zustand";
import type { TutorialState, StepCompletedState } from "@/types/tutorial";
import {
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  markTutorialCompleted,
} from "@/lib/tutorialData";

const TOTAL_STEPS = TUTORIAL_STEPS.length;

const initialStepCompleted: StepCompletedState = {
  step1: false,
  step2: false,
  step3: false,
  step4: false,
};

/**
 * 튜토리얼 상태 스토어
 */
export const useTutorialStore = create<TutorialState>()((set, get) => ({
  // Initial state
  isActive: false,
  currentStep: 1,
  isCompleted: false,
  stepCompleted: { ...initialStepCompleted },
  useGoldenCode: true,
  lastTestPassed: null,

  // v1.1: Modal and FullScreen states
  showModal: false,
  showTutorial: false,

  /**
   * 환영 모달 열기
   */
  openModal: () => {
    set({ showModal: true });
  },

  /**
   * 환영 모달 닫기 (건너뛰기)
   */
  closeModal: () => {
    markTutorialCompleted();
    set({ showModal: false, isCompleted: true });
  },

  /**
   * 튜토리얼 시작 (모달에서 시작 버튼 클릭)
   */
  startTutorial: () => {
    set({
      showModal: false,
      showTutorial: true,
      isActive: true,
      currentStep: 1,
      stepCompleted: { ...initialStepCompleted },
      useGoldenCode: true,
      lastTestPassed: null,
    });
  },

  /**
   * 튜토리얼 닫기 (나가기 버튼 - 완료 저장 안 함)
   */
  closeTutorial: () => {
    set({
      showTutorial: false,
      isActive: false,
      currentStep: 1,
      stepCompleted: { ...initialStepCompleted },
    });
  },

  /**
   * 다음 단계로 이동
   */
  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;

      // Step 3에서는 buggy code로 전환
      const useGoldenCode = nextStep < 3;

      set({
        currentStep: nextStep,
        useGoldenCode,
        lastTestPassed: null,
      });
    }
  },

  /**
   * 이전 단계로 이동
   */
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      const useGoldenCode = prevStep < 3;

      set({
        currentStep: prevStep,
        useGoldenCode,
        lastTestPassed: null,
      });
    }
  },

  /**
   * 특정 단계 완료 처리
   */
  completeStep: (step: number) => {
    const stepKey = `step${step}` as keyof StepCompletedState;
    set((state) => ({
      stepCompleted: {
        ...state.stepCompleted,
        [stepKey]: true,
      },
    }));
  },

  /**
   * 튜토리얼 건너뛰기
   */
  skipTutorial: () => {
    markTutorialCompleted();
    set({
      isActive: false,
      isCompleted: true,
      currentStep: 1,
      stepCompleted: { ...initialStepCompleted },
    });
  },

  /**
   * 튜토리얼 완료
   */
  completeTutorial: () => {
    markTutorialCompleted();
    set({
      showTutorial: false,
      isActive: false,
      isCompleted: true,
      stepCompleted: {
        step1: true,
        step2: true,
        step3: true,
        step4: true,
      },
    });
  },

  /**
   * 튜토리얼 초기화 (개발/테스트용)
   */
  resetTutorial: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    }
    set({
      isActive: false,
      currentStep: 1,
      isCompleted: false,
      stepCompleted: { ...initialStepCompleted },
      useGoldenCode: true,
      lastTestPassed: null,
    });
  },

  /**
   * Golden/Buggy 코드 전환
   */
  setUseGoldenCode: (value: boolean) => {
    set({ useGoldenCode: value });
  },

  /**
   * 마지막 테스트 결과 설정
   */
  setLastTestPassed: (passed: boolean | null) => {
    set({ lastTestPassed: passed });
  },
}));

/**
 * 튜토리얼 완료 여부 확인 (SSR-safe)
 */
export function checkTutorialCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
}

/**
 * 현재 단계 정보 가져오기
 */
export function getCurrentStepInfo(currentStep: number) {
  return TUTORIAL_STEPS.find((step) => step.id === currentStep) || null;
}

/**
 * 단계 완료 여부 확인
 */
export function isStepCompleted(
  stepCompleted: StepCompletedState,
  step: number
): boolean {
  const stepKey = `step${step}` as keyof StepCompletedState;
  return stepCompleted[stepKey] || false;
}
