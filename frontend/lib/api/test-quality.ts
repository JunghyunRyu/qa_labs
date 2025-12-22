/**
 * Test Quality API client.
 *
 * Phase 4: 테스트 품질 평가 API 클라이언트.
 */

import { get, post } from "@/lib/api";
import type {
  SubmissionQualityResponse,
  HintGenerationResult,
  QualityStatisticsResponse,
  TestGenerationResult,
} from "@/types/test-quality";

const TEST_QUALITY_ENDPOINT = "/v1/test-quality";
const ADMIN_ENDPOINT = "/v1/admin";

// ============================================================================
// User Endpoints
// ============================================================================

/**
 * 제출의 테스트 품질 분석 결과 조회
 */
export async function getSubmissionQuality(
  submissionId: string
): Promise<SubmissionQualityResponse> {
  return get<SubmissionQualityResponse>(
    `${TEST_QUALITY_ENDPOINT}/submissions/${submissionId}/quality`
  );
}

/**
 * 제출에 대한 테스트 개선 힌트 조회
 */
export async function getTestHints(
  submissionId: string,
  maxHints: number = 3
): Promise<HintGenerationResult> {
  return get<HintGenerationResult>(
    `${TEST_QUALITY_ENDPOINT}/submissions/${submissionId}/hints?max_hints=${maxHints}`
  );
}

// ============================================================================
// Admin Endpoints
// ============================================================================

/**
 * 제출 품질 분석 실행 (Admin)
 */
export async function analyzeSubmission(
  submissionId: string
): Promise<SubmissionQualityResponse> {
  return post<SubmissionQualityResponse>(
    `${TEST_QUALITY_ENDPOINT}/admin/analyze-submission/${submissionId}`,
    {}
  );
}

/**
 * 문제 루브릭 분석 실행 (Admin)
 */
export async function analyzeProblem(
  problemId: number
): Promise<{ problem_id: number; rubric_score: number }> {
  return post<{ problem_id: number; rubric_score: number }>(
    `${TEST_QUALITY_ENDPOINT}/admin/analyze-problem/${problemId}`,
    {}
  );
}

/**
 * 테스트 품질 통계 조회 (Admin)
 */
export async function getQualityStatistics(): Promise<QualityStatisticsResponse> {
  return get<QualityStatisticsResponse>(
    `${TEST_QUALITY_ENDPOINT}/admin/statistics`
  );
}

/**
 * 테스트 생성 (Admin) - 부족한 카테고리 커버
 */
export async function generateTestsForProblem(
  problemId: number,
  options: {
    maxTests?: number;
    submissionId?: string;
  } = {}
): Promise<TestGenerationResult> {
  const params = new URLSearchParams();
  if (options.maxTests) {
    params.set("max_tests", options.maxTests.toString());
  }
  if (options.submissionId) {
    params.set("submission_id", options.submissionId);
  }

  const queryString = params.toString();
  const url = `${ADMIN_ENDPOINT}/test-quality/generate-tests/${problemId}${
    queryString ? `?${queryString}` : ""
  }`;

  return post<TestGenerationResult>(url, {});
}
