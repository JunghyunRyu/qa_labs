/**
 * 테스트 품질 분석 결과 한글 레이블 매핑
 */

// 값 유형 (Value Types)
export const VALUE_TYPE_LABELS: Record<string, string> = {
  normal: "일반값",
  boundary: "경계값",
  edge: "엣지케이스",
  negative: "음수값",
  extreme: "극단값",
  unknown: "미분류",
};

// 입력 다양성 (Input Diversities)
export const INPUT_DIVERSITY_LABELS: Record<string, string> = {
  single: "단일 값",
  multiple: "복수 값",
  empty: "빈 값",
  duplicate: "중복 값",
  mixed_types: "혼합 타입",
  unknown: "미분류",
};

// 테스트 목적 (Test Purposes)
export const TEST_PURPOSE_LABELS: Record<string, string> = {
  happy_path: "정상 경로",
  error_handling: "에러 처리",
  boundary_check: "경계 검증",
  state_transition: "상태 전이",
  performance: "성능 테스트",
  unknown: "미분류",
};

// 품질 등급 설명
export const QUALITY_GRADE_INFO: Record<string, { name: string; bonus: number; color: string }> = {
  A: { name: "우수", bonus: 15, color: "blue" },
  B: { name: "양호", bonus: 10, color: "green" },
  C: { name: "보통", bonus: 5, color: "yellow" },
  D: { name: "미흡", bonus: 2, color: "orange" },
  F: { name: "부족", bonus: 0, color: "red" },
};

// 다음 등급까지 필요한 점수
export const GRADE_THRESHOLDS: Record<string, number> = {
  A: 90,
  B: 75,
  C: 60,
  D: 40,
  F: 0,
};

/**
 * 값 유형 배열을 한글로 변환
 */
export function formatValueTypes(types: string[]): string[] {
  return types
    .filter((t) => t !== "unknown")
    .map((t) => VALUE_TYPE_LABELS[t] || t);
}

/**
 * 입력 다양성 배열을 한글로 변환
 */
export function formatInputDiversities(diversities: string[]): string[] {
  return diversities
    .filter((d) => d !== "unknown")
    .map((d) => INPUT_DIVERSITY_LABELS[d] || d);
}

/**
 * 테스트 목적 배열을 한글로 변환
 */
export function formatTestPurposes(purposes: string[]): string[] {
  return purposes
    .filter((p) => p !== "unknown")
    .map((p) => TEST_PURPOSE_LABELS[p] || p);
}

/**
 * 현재 등급에서 다음 등급까지 필요한 점수 계산
 */
export function getPointsToNextGrade(currentScore: number, currentGrade: string): { nextGrade: string; pointsNeeded: number } | null {
  const grades = ["F", "D", "C", "B", "A"];
  const currentIndex = grades.indexOf(currentGrade);

  if (currentIndex === -1 || currentIndex === grades.length - 1) {
    return null; // 이미 A등급이거나 등급을 찾을 수 없음
  }

  const nextGrade = grades[currentIndex + 1];
  const nextThreshold = GRADE_THRESHOLDS[nextGrade];
  const pointsNeeded = Math.ceil(nextThreshold - currentScore);

  return { nextGrade, pointsNeeded };
}

/**
 * 낮은 점수 축을 식별하여 개선 제안 생성
 */
export function getImprovementSuggestions(
  valueTypeScore: number,
  inputDiversityScore: number,
  testPurposeScore: number
): string[] {
  const suggestions: string[] = [];
  const maxScore = 35; // 각 축의 최대 가중치 점수 (0.35 * 100)

  // 가장 낮은 점수 축 식별 (가중치 적용 후)
  const scores = [
    { name: "value_type", score: valueTypeScore, max: maxScore },
    { name: "input_diversity", score: inputDiversityScore, max: 30 },
    { name: "test_purpose", score: testPurposeScore, max: maxScore },
  ];

  // 점수가 낮은 순으로 정렬
  scores.sort((a, b) => (a.score / a.max) - (b.score / b.max));

  // 상위 2개 낮은 축에 대해 제안
  for (const axis of scores.slice(0, 2)) {
    const ratio = axis.score / axis.max;
    if (ratio < 0.7) { // 70% 미만인 경우에만 제안
      if (axis.name === "value_type") {
        suggestions.push("경계값, 엣지케이스, 음수값 테스트 추가");
      } else if (axis.name === "input_diversity") {
        suggestions.push("다양한 입력 조합 (빈 값, 복수 값 등) 테스트");
      } else if (axis.name === "test_purpose") {
        suggestions.push("에러 처리, 상태 전이 테스트 추가");
      }
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("현재 테스트 품질이 우수합니다!");
  }

  return suggestions;
}
