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
      if (def && !def.hidden) {
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
