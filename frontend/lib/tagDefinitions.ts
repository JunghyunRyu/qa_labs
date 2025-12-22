/**
 * 태그 정의 및 분류 시스템 (표준화 버전)
 *
 * 총 49개의 표준 태그를 정의합니다.
 * - ENV: 2개 (테스트 환경/유형)
 * - CONCEPT: 20개 (테스트 기법/개념)
 * - DOMAIN: 15개 (데이터 타입/기술 도메인)
 * - CONTEXT: 12개 (비즈니스 도메인)
 */

export type TagCategory = "ENV" | "CONCEPT" | "DOMAIN" | "CONTEXT" | "OTHER";

export interface TagDefinition {
  slug: string;
  labelKo: string;
  category: TagCategory;
  priority: number; // 낮을수록 먼저 노출
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
 * 표준 태그 정의 맵 (49개)
 */
export const TAG_DEFINITIONS: Record<string, TagDefinition> = {
  // === ENV (2개) ===
  "단위 테스트": {
    slug: "단위 테스트",
    labelKo: "단위 테스트",
    category: "ENV",
    priority: 10,
  },
  "통합 테스트": {
    slug: "통합 테스트",
    labelKo: "통합 테스트",
    category: "ENV",
    priority: 11,
  },

  // === CONCEPT (20개) ===
  "경계값 분석": {
    slug: "경계값 분석",
    labelKo: "경계값 분석",
    category: "CONCEPT",
    priority: 20,
  },
  "동등 분할": {
    slug: "동등 분할",
    labelKo: "동등 분할",
    category: "CONCEPT",
    priority: 21,
  },
  "조합 테스트": {
    slug: "조합 테스트",
    labelKo: "조합 테스트",
    category: "CONCEPT",
    priority: 22,
  },
  "결정 테이블": {
    slug: "결정 테이블",
    labelKo: "결정 테이블",
    category: "CONCEPT",
    priority: 23,
  },
  "상태 기반 테스트": {
    slug: "상태 기반 테스트",
    labelKo: "상태 기반 테스트",
    category: "CONCEPT",
    priority: 24,
  },
  "예외 처리": {
    slug: "예외 처리",
    labelKo: "예외 처리",
    category: "CONCEPT",
    priority: 25,
  },
  "입력 검증": {
    slug: "입력 검증",
    labelKo: "입력 검증",
    category: "CONCEPT",
    priority: 26,
  },
  모킹: {
    slug: "모킹",
    labelKo: "모킹",
    category: "CONCEPT",
    priority: 27,
  },
  픽스처: {
    slug: "픽스처",
    labelKo: "픽스처",
    category: "CONCEPT",
    priority: 28,
  },
  "시간 제어": {
    slug: "시간 제어",
    labelKo: "시간 제어",
    category: "CONCEPT",
    priority: 29,
  },
  "의존성 주입": {
    slug: "의존성 주입",
    labelKo: "의존성 주입",
    category: "CONCEPT",
    priority: 30,
  },
  "재시도/복원력": {
    slug: "재시도/복원력",
    labelKo: "재시도/복원력",
    category: "CONCEPT",
    priority: 31,
  },
  "Rate Limit": {
    slug: "Rate Limit",
    labelKo: "Rate Limit",
    category: "CONCEPT",
    priority: 32,
  },
  캐시: {
    slug: "캐시",
    labelKo: "캐시",
    category: "CONCEPT",
    priority: 33,
  },
  동시성: {
    slug: "동시성",
    labelKo: "동시성",
    category: "CONCEPT",
    priority: 34,
  },
  보안: {
    slug: "보안",
    labelKo: "보안",
    category: "CONCEPT",
    priority: 35,
  },
  "Null 처리": {
    slug: "Null 처리",
    labelKo: "Null 처리",
    category: "CONCEPT",
    priority: 36,
  },
  "다중 조건": {
    slug: "다중 조건",
    labelKo: "다중 조건",
    category: "CONCEPT",
    priority: 37,
  },
  "데이터 변환": {
    slug: "데이터 변환",
    labelKo: "데이터 변환",
    category: "CONCEPT",
    priority: 38,
  },
  "기본 테스트": {
    slug: "기본 테스트",
    labelKo: "기본 테스트",
    category: "CONCEPT",
    priority: 39,
  },

  // === DOMAIN (15개) ===
  문자열: {
    slug: "문자열",
    labelKo: "문자열",
    category: "DOMAIN",
    priority: 200,
  },
  정수: {
    slug: "정수",
    labelKo: "정수",
    category: "DOMAIN",
    priority: 201,
  },
  부동소수점: {
    slug: "부동소수점",
    labelKo: "부동소수점",
    category: "DOMAIN",
    priority: 202,
  },
  불리언: {
    slug: "불리언",
    labelKo: "불리언",
    category: "DOMAIN",
    priority: 203,
  },
  리스트: {
    slug: "리스트",
    labelKo: "리스트",
    category: "DOMAIN",
    priority: 204,
  },
  딕셔너리: {
    slug: "딕셔너리",
    labelKo: "딕셔너리",
    category: "DOMAIN",
    priority: 205,
  },
  "날짜/시간": {
    slug: "날짜/시간",
    labelKo: "날짜/시간",
    category: "DOMAIN",
    priority: 206,
  },
  JSON: {
    slug: "JSON",
    labelKo: "JSON",
    category: "DOMAIN",
    priority: 207,
  },
  CSV: {
    slug: "CSV",
    labelKo: "CSV",
    category: "DOMAIN",
    priority: 208,
  },
  API: {
    slug: "API",
    labelKo: "API",
    category: "DOMAIN",
    priority: 209,
  },
  파싱: {
    slug: "파싱",
    labelKo: "파싱",
    category: "DOMAIN",
    priority: 210,
  },
  페이지네이션: {
    slug: "페이지네이션",
    labelKo: "페이지네이션",
    category: "DOMAIN",
    priority: 211,
  },
  파일시스템: {
    slug: "파일시스템",
    labelKo: "파일시스템",
    category: "DOMAIN",
    priority: 212,
  },
  통계: {
    slug: "통계",
    labelKo: "통계",
    category: "DOMAIN",
    priority: 213,
  },
  "중첩 구조": {
    slug: "중첩 구조",
    labelKo: "중첩 구조",
    category: "DOMAIN",
    priority: 214,
  },

  // === CONTEXT (12개) ===
  이메일: {
    slug: "이메일",
    labelKo: "이메일",
    category: "CONTEXT",
    priority: 300,
  },
  비밀번호: {
    slug: "비밀번호",
    labelKo: "비밀번호",
    category: "CONTEXT",
    priority: 301,
  },
  전화번호: {
    slug: "전화번호",
    labelKo: "전화번호",
    category: "CONTEXT",
    priority: 302,
  },
  "가격/할인": {
    slug: "가격/할인",
    labelKo: "가격/할인",
    category: "CONTEXT",
    priority: 303,
  },
  장바구니: {
    slug: "장바구니",
    labelKo: "장바구니",
    category: "CONTEXT",
    priority: 304,
  },
  결제: {
    slug: "결제",
    labelKo: "결제",
    category: "CONTEXT",
    priority: 305,
  },
  배송비: {
    slug: "배송비",
    labelKo: "배송비",
    category: "CONTEXT",
    priority: 306,
  },
  금융: {
    slug: "금융",
    labelKo: "금융",
    category: "CONTEXT",
    priority: 307,
  },
  "인증/권한": {
    slug: "인증/권한",
    labelKo: "인증/권한",
    category: "CONTEXT",
    priority: 308,
  },
  티켓팅: {
    slug: "티켓팅",
    labelKo: "티켓팅",
    category: "CONTEXT",
    priority: 309,
  },
  알림: {
    slug: "알림",
    labelKo: "알림",
    category: "CONTEXT",
    priority: 310,
  },
  "교육/등급": {
    slug: "교육/등급",
    labelKo: "교육/등급",
    category: "CONTEXT",
    priority: 311,
  },
};

// 난이도 값 (태그에서 제외) - 소문자로 비교
const DIFFICULTY_TAGS = ["very easy", "easy", "medium", "hard"];

/**
 * 태그 slug 배열을 TagViewModel 배열로 변환
 * - 난이도 태그 제외
 * - 카테고리/우선순위 순으로 정렬
 */
export function toTagViewModels(slugs: string[]): TagViewModel[] {
  return slugs
    .filter((slug) => !DIFFICULTY_TAGS.includes(slug.toLowerCase()))
    .map((slug) => {
      // 표준 태그 검색
      const def = TAG_DEFINITIONS[slug];
      if (def) {
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

/**
 * 표준 태그 목록 (검증용)
 */
export const STANDARD_TAGS = new Set(Object.keys(TAG_DEFINITIONS));
