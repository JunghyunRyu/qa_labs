/**
 * Tutorial System Type Definitions
 *
 * QA Arena 온보딩 튜토리얼 시스템의 타입 정의
 */

/** 튜토리얼 단계에서 기대하는 사용자 행동 */
export type TutorialAction = "click" | "type" | "submit";

/** 가이드 버블 위치 */
export type BubblePosition = "top" | "bottom" | "left" | "right";

/** 튜토리얼 단계 정의 */
export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  guide: string;
  targetSelector: string;
  expectedAction: TutorialAction;
  expectedCode?: string; // type 액션에서 감지할 코드
  ghostCode?: string; // 에디터에 표시할 가이드 코드
  useGoldenCode?: boolean; // true면 정상 코드, false면 버그 코드 사용
  isLast?: boolean;
}

/** 하드코딩된 튜토리얼 문제 데이터 */
export interface TutorialProblem {
  id: string;
  title: string;
  description: string;
  functionSignature: string;
  goldenCode: string;
  buggyCode: string;
  initialTestCode: string;
  ghostCode: string;
}

/** Step별 완료 상태 */
export interface StepCompletedState {
  step1: boolean; // 테스트 실행 클릭
  step2: boolean; // 코드 추가 감지
  step3: boolean; // 버그 테스트 실행
  step4: boolean; // 채점 완료
}

/** 튜토리얼 상태 (Zustand Store) */
export interface TutorialState {
  // Core state
  isActive: boolean;
  currentStep: number; // 1-4
  isCompleted: boolean;

  // Step별 완료 상태
  stepCompleted: StepCompletedState;

  // 현재 사용할 target 코드 (golden vs buggy)
  useGoldenCode: boolean;

  // 테스트 결과 상태
  lastTestPassed: boolean | null;

  // v1.1: Modal and FullScreen states
  showModal: boolean;
  showTutorial: boolean;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  startTutorial: () => void;
  closeTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: number) => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  setUseGoldenCode: (value: boolean) => void;
  setLastTestPassed: (passed: boolean | null) => void;
}

/** TutorialOverlay Props */
export interface TutorialOverlayProps {
  isActive: boolean;
  targetSelector: string;
  children?: React.ReactNode;
}

/** GuideBubble Props */
export interface GuideBubbleProps {
  title: string;
  content: string | React.ReactNode;
  position: BubblePosition;
  targetRect: DOMRect | null;
  showSkip?: boolean;
  showNext?: boolean;
  showPrev?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
}

/** StepIndicator Props */
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

/** TutorialEditor Props (CodeEditor 확장) */
export interface TutorialEditorProps {
  value: string;
  onChange: (value: string) => void;
  ghostText?: string;
  ghostTextStartLine?: number;
  readOnly?: boolean;
  height?: string;
}

/** ConfettiEffect Props */
export interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  duration?: number;
}

/** 테스트 실행 결과 (간소화) */
export interface TutorialTestResult {
  passed: boolean;
  output: string;
  failedTests?: string[];
}
