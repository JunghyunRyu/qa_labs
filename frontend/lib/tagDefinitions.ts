/**
 * 태그 정의 및 분류 시스템
 * Phase 1: 프론트엔드에서 태그 분류/라벨링
 */

export type TagCategory = "ENV" | "CONCEPT" | "DOMAIN" | "CONTEXT" | "OTHER";

export interface TagDefinition {
  slug: string;
  labelKo: string;
  labelEn?: string;
  category: TagCategory;
  priority: number; // 낮을수록 먼저 노출
  hidden?: boolean; // true면 노출하지 않음
}

export interface TagViewModel {
  slug: string;
  labelKo: string;
  category: TagCategory;
  priority: number;
}

// 카테고리 순서 (노출 우선순위)
const CATEGORY_ORDER: Record<TagCategory, number> = {
  ENV: 0,
  CONCEPT: 1,
  DOMAIN: 2,
  CONTEXT: 3,
  OTHER: 4,
};

/**
 * 태그 정의 맵
 * 스펙 문서 섹션 4의 라벨 매핑 테이블 기반
 */
export const TAG_DEFINITIONS: Record<string, TagDefinition> = {
  // === ENV (환경/형식) ===
  python: {
    slug: "python",
    labelKo: "Python",
    category: "ENV",
    priority: 10,
  },
  pytest: {
    slug: "pytest",
    labelKo: "Pytest",
    category: "ENV",
    priority: 11,
  },
  "unit-test": {
    slug: "unit-test",
    labelKo: "단위 테스트",
    category: "ENV",
    priority: 12,
  },
  "integration-test": {
    slug: "integration-test",
    labelKo: "통합 테스트",
    category: "ENV",
    priority: 13,
  },

  // === CONCEPT (테스트 개념/기법) ===
  "dependency-injection": {
    slug: "dependency-injection",
    labelKo: "의존성 주입",
    category: "CONCEPT",
    priority: 20,
  },
  "deterministic-test": {
    slug: "deterministic-test",
    labelKo: "결정적 테스트",
    category: "CONCEPT",
    priority: 21,
  },
  "flaky-test": {
    slug: "flaky-test",
    labelKo: "불안정 테스트",
    category: "CONCEPT",
    priority: 22,
  },
  "exception-handling": {
    slug: "exception-handling",
    labelKo: "예외 처리",
    category: "CONCEPT",
    priority: 23,
  },
  "error-propagation": {
    slug: "error-propagation",
    labelKo: "오류 전파",
    category: "CONCEPT",
    priority: 24,
  },
  "multi-layer-validation": {
    slug: "multi-layer-validation",
    labelKo: "다층 검증",
    category: "CONCEPT",
    priority: 25,
  },
  "boundary-value-analysis": {
    slug: "boundary-value-analysis",
    labelKo: "경계값 분석",
    category: "CONCEPT",
    priority: 26,
  },
  "type-coercion": {
    slug: "type-coercion",
    labelKo: "타입 변환",
    category: "CONCEPT",
    priority: 27,
  },
  testability: {
    slug: "testability",
    labelKo: "테스트 용이성",
    category: "CONCEPT",
    priority: 99, // 우선순위 낮게
  },
  "boundary analysis": {
    slug: "boundary analysis",
    labelKo: "경계값 분석",
    category: "CONCEPT",
    priority: 26,
  },
  "boundary value analysis": {
    slug: "boundary value analysis",
    labelKo: "경계값 분석",
    category: "CONCEPT",
    priority: 26,
  },
  "boundary-value": {
    slug: "boundary-value",
    labelKo: "경계값",
    category: "CONCEPT",
    priority: 26,
  },
  mock: {
    slug: "mock",
    labelKo: "모킹",
    category: "CONCEPT",
    priority: 28,
  },
  retry: {
    slug: "retry",
    labelKo: "재시도",
    category: "CONCEPT",
    priority: 29,
  },
  backoff: {
    slug: "backoff",
    labelKo: "백오프",
    category: "CONCEPT",
    priority: 30,
  },
  "state-management": {
    slug: "state-management",
    labelKo: "상태 관리",
    category: "CONCEPT",
    priority: 31,
  },
  "time-control": {
    slug: "time-control",
    labelKo: "시간 제어",
    category: "CONCEPT",
    priority: 32,
  },
  "time-mock": {
    slug: "time-mock",
    labelKo: "시간 모킹",
    category: "CONCEPT",
    priority: 33,
  },
  "rate-limiter": {
    slug: "rate-limiter",
    labelKo: "속도 제한",
    category: "CONCEPT",
    priority: 34,
  },
  "token-bucket": {
    slug: "token-bucket",
    labelKo: "토큰 버킷",
    category: "CONCEPT",
    priority: 35,
  },
  "log-analysis": {
    slug: "log-analysis",
    labelKo: "로그 분석",
    category: "CONCEPT",
    priority: 36,
  },
  monitoring: {
    slug: "monitoring",
    labelKo: "모니터링",
    category: "CONCEPT",
    priority: 37,
  },
  "data transformation": {
    slug: "data transformation",
    labelKo: "데이터 변환",
    category: "CONCEPT",
    priority: 38,
  },
  "multi-step processing": {
    slug: "multi-step processing",
    labelKo: "다단계 처리",
    category: "CONCEPT",
    priority: 39,
  },
  "pipeline testing": {
    slug: "pipeline testing",
    labelKo: "파이프라인 테스트",
    category: "CONCEPT",
    priority: 40,
  },
  "text-validation": {
    slug: "text-validation",
    labelKo: "텍스트 검증",
    category: "CONCEPT",
    priority: 41,
  },

  // === DOMAIN (도메인/데이터) ===
  dictionary: {
    slug: "dictionary",
    labelKo: "딕셔너리",
    category: "DOMAIN",
    priority: 30,
  },
  "dictionary-operations": {
    slug: "dictionary-operations",
    labelKo: "딕셔너리 연산",
    category: "DOMAIN",
    priority: 31,
  },
  "key-validation": {
    slug: "key-validation",
    labelKo: "키 검증",
    category: "DOMAIN",
    priority: 32,
  },
  "dictionary operations": {
    slug: "dictionary operations",
    labelKo: "딕셔너리 연산",
    category: "DOMAIN",
    priority: 31,
  },
  "key validation": {
    slug: "key validation",
    labelKo: "키 검증",
    category: "DOMAIN",
    priority: 32,
  },
  datetime: {
    slug: "datetime",
    labelKo: "날짜/시간",
    category: "DOMAIN",
    priority: 33,
  },
  random: {
    slug: "random",
    labelKo: "랜덤",
    category: "DOMAIN",
    priority: 34,
  },
  number: {
    slug: "number",
    labelKo: "숫자",
    category: "DOMAIN",
    priority: 35,
  },
  string: {
    slug: "string",
    labelKo: "문자열",
    category: "DOMAIN",
    priority: 36,
  },
  "arithmetic-operations": {
    slug: "arithmetic-operations",
    labelKo: "산술 연산",
    category: "DOMAIN",
    priority: 37,
  },
  "basic-math": {
    slug: "basic-math",
    labelKo: "기본 수학",
    category: "DOMAIN",
    priority: 38,
  },
  "basic math": {
    slug: "basic math",
    labelKo: "기본 수학",
    category: "DOMAIN",
    priority: 38,
  },
  "arithmetic operations": {
    slug: "arithmetic operations",
    labelKo: "산술 연산",
    category: "DOMAIN",
    priority: 37,
  },
  csv: {
    slug: "csv",
    labelKo: "CSV",
    category: "DOMAIN",
    priority: 39,
  },
  "floating point precision": {
    slug: "floating point precision",
    labelKo: "부동소수점 정밀도",
    category: "DOMAIN",
    priority: 40,
  },
  "numeric accuracy": {
    slug: "numeric accuracy",
    labelKo: "수치 정확도",
    category: "DOMAIN",
    priority: 41,
  },
  temperature: {
    slug: "temperature",
    labelKo: "온도",
    category: "DOMAIN",
    priority: 42,
  },
  math: {
    slug: "math",
    labelKo: "수학",
    category: "DOMAIN",
    priority: 43,
  },
  statistics: {
    slug: "statistics",
    labelKo: "통계",
    category: "DOMAIN",
    priority: 44,
  },
  parsing: {
    slug: "parsing",
    labelKo: "파싱",
    category: "DOMAIN",
    priority: 45,
  },
  "string analysis": {
    slug: "string analysis",
    labelKo: "문자열 분석",
    category: "DOMAIN",
    priority: 46,
  },
  "string validation": {
    slug: "string validation",
    labelKo: "문자열 검증",
    category: "DOMAIN",
    priority: 47,
  },
  "boolean logic": {
    slug: "boolean logic",
    labelKo: "불리언 로직",
    category: "DOMAIN",
    priority: 48,
  },
  api: {
    slug: "api",
    labelKo: "API",
    category: "DOMAIN",
    priority: 49,
  },

  // === CONTEXT (실무 맥락) ===
  "business-logic": {
    slug: "business-logic",
    labelKo: "비즈니스 로직",
    category: "CONTEXT",
    priority: 40,
  },
  validation: {
    slug: "validation",
    labelKo: "입력 검증",
    category: "CONTEXT",
    priority: 41,
  },

  // === 폐기/미노출 권장 ===
  qa: {
    slug: "qa",
    labelKo: "QA",
    category: "OTHER",
    priority: 999,
    hidden: true,
  },
  testing: {
    slug: "testing",
    labelKo: "테스팅",
    category: "OTHER",
    priority: 999,
    hidden: true,
  },
};

// 난이도 값 (태그에서 제외) - 소문자로 비교
const DIFFICULTY_TAGS = ["very easy", "easy", "medium", "hard"];

/**
 * 태그 slug 배열을 TagViewModel 배열로 변환
 * - 난이도 태그 제외
 * - hidden 태그 제외
 * - 카테고리/우선순위 순으로 정렬
 */
export function toTagViewModels(slugs: string[]): TagViewModel[] {
  return slugs
    .filter((slug) => !DIFFICULTY_TAGS.includes(slug.toLowerCase()))
    .map((slug) => {
      const def = TAG_DEFINITIONS[slug.toLowerCase()];
      if (def) {
        // hidden 태그는 null 반환하여 필터링
        if (def.hidden) {
          return null;
        }
        return {
          slug: def.slug,
          labelKo: def.labelKo,
          category: def.category,
          priority: def.priority,
        };
      }
      // 정의되지 않은 태그는 OTHER로 분류
      return {
        slug,
        labelKo: slug,
        category: "OTHER" as TagCategory,
        priority: 500,
      };
    })
    .filter((tag): tag is TagViewModel => tag !== null)
    .sort((a, b) => {
      // 1차: 카테고리 순서
      const categoryDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
      if (categoryDiff !== 0) return categoryDiff;
      // 2차: 우선순위
      return a.priority - b.priority;
    });
}

/**
 * 태그를 최대 개수만큼 자르고 나머지 개수 반환
 */
export function sliceTags(
  tags: TagViewModel[],
  maxVisible: number = 6
): { visible: TagViewModel[]; hiddenCount: number } {
  if (tags.length <= maxVisible) {
    return { visible: tags, hiddenCount: 0 };
  }
  return {
    visible: tags.slice(0, maxVisible),
    hiddenCount: tags.length - maxVisible,
  };
}

/**
 * 카테고리별 한글 라벨
 */
export const CATEGORY_LABELS: Record<TagCategory, string> = {
  ENV: "환경",
  CONCEPT: "개념",
  DOMAIN: "도메인",
  CONTEXT: "맥락",
  OTHER: "기타",
};
