/**
 * Google Analytics 이벤트 유틸리티
 *
 * 사용법:
 * import { sendGAEvent } from "@/lib/analytics";
 * sendGAEvent("submit_code", { problem_id: "123", result: "pass" });
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * GA 이벤트 전송 함수
 * @param action 이벤트 이름 (예: "submit_code", "click_problem")
 * @param params 이벤트 파라미터
 */
export const sendGAEvent = (
  action: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== "undefined" && window.gtag && GA_ID) {
    window.gtag("event", action, params);
  }
};

/**
 * 코드 제출 이벤트
 */
export const trackCodeSubmit = (params: {
  problemId: number | string;
  problemSlug?: string;
  difficulty?: string;
  score?: number;
  mutantsKilled?: number;
  totalMutants?: number;
  isClientSide?: boolean;
}) => {
  sendGAEvent("submit_code", {
    problem_id: String(params.problemId),
    problem_slug: params.problemSlug || "",
    difficulty: params.difficulty || "",
    score: params.score ?? 0,
    mutants_killed: params.mutantsKilled ?? 0,
    total_mutants: params.totalMutants ?? 0,
    execution_mode: params.isClientSide ? "client" : "server",
  });
};

/**
 * 문제 조회 이벤트
 */
export const trackProblemView = (params: {
  problemId: number | string;
  problemSlug?: string;
  difficulty?: string;
  domain?: string;
}) => {
  sendGAEvent("view_problem", {
    problem_id: String(params.problemId),
    problem_slug: params.problemSlug || "",
    difficulty: params.difficulty || "",
    domain: params.domain || "",
  });
};

/**
 * 로컬 테스트 실행 이벤트
 */
export const trackLocalTest = (params: {
  problemId: number | string;
  passed: number;
  failed: number;
}) => {
  sendGAEvent("local_test", {
    problem_id: String(params.problemId),
    tests_passed: params.passed,
    tests_failed: params.failed,
    all_passed: params.failed === 0 && params.passed > 0,
  });
};
