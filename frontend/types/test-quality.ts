/**
 * Test Quality Evaluation Types.
 *
 * Phase 4-1: 테스트 품질 평가 시스템을 위한 TypeScript 타입 정의.
 * Backend schemas/test_quality.py와 동기화.
 */

// ============================================================================
// Enum 정의
// ============================================================================

export type AnalysisScope = "submission" | "problem_rubric";

export type AnalysisStatus = "PENDING" | "RUNNING" | "SUCCESS" | "ERROR";

export type QualityGrade = "A" | "B" | "C" | "D" | "F";

// ============================================================================
// 카테고리 정의
// ============================================================================

export type ValueType =
  | "normal"
  | "boundary"
  | "edge"
  | "negative"
  | "extreme"
  | "unknown";

export type InputDiversity =
  | "single"
  | "multiple"
  | "empty"
  | "duplicate"
  | "mixed_types"
  | "unknown";

export type TestPurpose =
  | "happy_path"
  | "error_handling"
  | "boundary_check"
  | "equivalence_partition"
  | "state_transition"
  | "unknown";

// ============================================================================
// 카테고리 한글 매핑
// ============================================================================

export const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  normal: "정상값",
  boundary: "경계값",
  edge: "엣지케이스",
  negative: "음수/비정상",
  extreme: "극단값",
  unknown: "미분류",
};

export const INPUT_DIVERSITY_LABELS: Record<InputDiversity, string> = {
  single: "단일 입력",
  multiple: "복수 입력",
  empty: "빈 입력",
  duplicate: "중복 요소",
  mixed_types: "혼합 타입",
  unknown: "미분류",
};

export const TEST_PURPOSE_LABELS: Record<TestPurpose, string> = {
  happy_path: "정상 경로",
  error_handling: "에러 처리",
  boundary_check: "경계 검사",
  equivalence_partition: "동치 분할",
  state_transition: "상태 전이",
  unknown: "미분류",
};

export const GRADE_LABELS: Record<QualityGrade, string> = {
  A: "우수",
  B: "양호",
  C: "보통",
  D: "미흡",
  F: "부족",
};

export const GRADE_COLORS: Record<QualityGrade, string> = {
  A: "text-green-600 dark:text-green-400",
  B: "text-blue-600 dark:text-blue-400",
  C: "text-yellow-600 dark:text-yellow-400",
  D: "text-orange-600 dark:text-orange-400",
  F: "text-red-600 dark:text-red-400",
};

export const GRADE_BG_COLORS: Record<QualityGrade, string> = {
  A: "bg-green-100 dark:bg-green-900/30",
  B: "bg-blue-100 dark:bg-blue-900/30",
  C: "bg-yellow-100 dark:bg-yellow-900/30",
  D: "bg-orange-100 dark:bg-orange-900/30",
  F: "bg-red-100 dark:bg-red-900/30",
};

// ============================================================================
// AntiPattern 관련 타입
// ============================================================================

export interface AntiPatternDetail {
  type: string;
  penalty: number;
  location: string;
  line?: number;
  description?: string;
}

export const ANTIPATTERN_LABELS: Record<string, string> = {
  NO_ASSERTION: "Assertion 없음",
  EXCEPTION_SWALLOWED: "예외 무시",
  MAGIC_NUMBER: "매직 넘버",
  DUPLICATE_TEST: "중복 테스트",
  EMPTY_TEST: "빈 테스트",
};

// ============================================================================
// Per-Test 분류 결과
// ============================================================================

export interface TestCaseAnalysis {
  name: string;
  value_types: string[];
  input_diversities: string[];
  test_purposes: string[];
  antipatterns: AntiPatternDetail[];
  confidence: number;
}

// ============================================================================
// 점수 세부 내역
// ============================================================================

export interface ScoringBreakdown {
  value_type_score: number;
  input_diversity_score: number;
  test_purpose_score: number;
  antipattern_penalty: number;
  final_score: number;
}

// ============================================================================
// 제출 분석 결과
// ============================================================================

export interface TestQualityAnalysis {
  parser_version: string;
  scoring_version: string;
  test_count: number;
  effective_test_count: number;
  value_types: string[];
  input_diversities: string[];
  test_purposes: string[];
  antipatterns: AntiPatternDetail[];
  per_test: TestCaseAnalysis[];
  scoring_breakdown?: ScoringBreakdown;
  overall_confidence: number;
}

// ============================================================================
// 문제 루브릭 분석 결과
// ============================================================================

export interface ExpectedCategories {
  value_types: string[];
  input_diversities: string[];
  test_purposes: string[];
}

export interface RubricWeights {
  value_type_coverage: number;
  diversity_coverage: number;
  purpose_coverage: number;
}

export interface RubricAnalysis {
  parser_version: string;
  scoring_version: string;
  expected_categories: ExpectedCategories;
  weights: RubricWeights;
  difficulty_factor: number;
}

// ============================================================================
// AnalysisRun 타입
// ============================================================================

export interface AnalysisRunResponse {
  id: number;
  submission_id?: string;
  problem_id?: number;
  scope: AnalysisScope;
  status: AnalysisStatus;
  parser_version: string;
  scoring_version: string;
  source_hash: string;
  confidence_score?: number;
  result?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

// ============================================================================
// API 응답 타입
// ============================================================================

export interface SubmissionQualityResponse {
  submission_id: string;
  test_quality_score?: number;
  test_quality_grade?: QualityGrade;
  test_quality_analysis?: TestQualityAnalysis;
  analysis_run?: AnalysisRunResponse;
}

export interface ProblemRubricResponse {
  problem_id: number;
  rubric_score?: number;
  rubric_analysis?: RubricAnalysis;
  analysis_run?: AnalysisRunResponse;
}

export interface QualityStatisticsResponse {
  grade_distribution: Record<string, number>;
  average_score: number;
  analyzed_submissions: number;
}

// ============================================================================
// 힌트 관련 타입 (Phase 3-2)
// ============================================================================

export type HintDifficulty = "easy" | "medium" | "hard";

export interface TestHint {
  category: string;
  hint_text: string;
  difficulty: HintDifficulty;
  question: string;
}

export interface HintGenerationResult {
  summary: string;
  hints: TestHint[];
  encouragement: string;
  next_step: string;
}

// ============================================================================
// 테스트 생성 관련 타입 (Phase 3-1, Admin용)
// ============================================================================

export interface GeneratedTest {
  test_name: string;
  test_code: string;
  target_categories: string[];
  rationale: string;
}

export interface CoverageImprovement {
  value_types_added: string[];
  diversities_added: string[];
  purposes_added: string[];
}

export interface TestGenerationResult {
  generated_tests: GeneratedTest[];
  complete_test_file: string;
  coverage_improvement: CoverageImprovement;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 점수에 따른 등급 반환
 */
export function getGradeFromScore(score: number): QualityGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

/**
 * 등급에 따른 색상 클래스 반환
 */
export function getGradeColor(grade: QualityGrade): string {
  return GRADE_COLORS[grade];
}

/**
 * 등급에 따른 배경색 클래스 반환
 */
export function getGradeBgColor(grade: QualityGrade): string {
  return GRADE_BG_COLORS[grade];
}

/**
 * 점수에 따른 색상 반환
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * 카테고리 커버리지 비율 계산
 */
export function calculateCoverage(
  covered: string[],
  total: number
): { count: number; percentage: number } {
  const uniqueCovered = new Set(
    covered.filter((c) => c.toLowerCase() !== "unknown")
  );
  return {
    count: uniqueCovered.size,
    percentage: total > 0 ? (uniqueCovered.size / total) * 100 : 0,
  };
}

// 전체 카테고리 수
export const TOTAL_VALUE_TYPES = 5;
export const TOTAL_INPUT_DIVERSITIES = 5;
export const TOTAL_TEST_PURPOSES = 5;
