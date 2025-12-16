/**
 * 태그 정의 및 분류 시스템
 * 태그는 한국어로 저장되며, 이 파일은 카테고리/우선순위 정보를 제공합니다.
 */

export type TagCategory = "ENV" | "CONCEPT" | "DOMAIN" | "CONTEXT" | "OTHER";

export interface TagDefinition {
  slug: string;
  labelKo: string;
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
 * 태그 정의 맵 (한국어 키 사용)
 */
export const TAG_DEFINITIONS: Record<string, TagDefinition> = {
  // === ENV (환경/테스트 유형) ===
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

  // === CONCEPT (테스트 기법/개념) ===
  // 핵심 테스트 기법
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
  "페어와이즈 테스트": {
    slug: "페어와이즈 테스트",
    labelKo: "페어와이즈 테스트",
    category: "CONCEPT",
    priority: 23,
  },
  "결정 테이블": {
    slug: "결정 테이블",
    labelKo: "결정 테이블",
    category: "CONCEPT",
    priority: 24,
  },
  "상태 기반 테스트": {
    slug: "상태 기반 테스트",
    labelKo: "상태 기반 테스트",
    category: "CONCEPT",
    priority: 25,
  },
  "기본 테스트": {
    slug: "기본 테스트",
    labelKo: "기본 테스트",
    category: "CONCEPT",
    priority: 26,
  },

  // 오류/예외 처리
  "오류 처리": {
    slug: "오류 처리",
    labelKo: "오류 처리",
    category: "CONCEPT",
    priority: 30,
  },
  "예외 처리": {
    slug: "예외 처리",
    labelKo: "예외 처리",
    category: "CONCEPT",
    priority: 31,
  },
  "예외 테스트": {
    slug: "예외 테스트",
    labelKo: "예외 테스트",
    category: "CONCEPT",
    priority: 32,
  },
  "오류 전파": {
    slug: "오류 전파",
    labelKo: "오류 전파",
    category: "CONCEPT",
    priority: 33,
  },
  "입력 검증": {
    slug: "입력 검증",
    labelKo: "입력 검증",
    category: "CONCEPT",
    priority: 34,
  },
  "다층 검증": {
    slug: "다층 검증",
    labelKo: "다층 검증",
    category: "CONCEPT",
    priority: 35,
  },

  // 경계값 분석 세부
  "범위 검증": {
    slug: "범위 검증",
    labelKo: "범위 검증",
    category: "CONCEPT",
    priority: 40,
  },
  "인덱스 검증": {
    slug: "인덱스 검증",
    labelKo: "인덱스 검증",
    category: "CONCEPT",
    priority: 41,
  },
  "이변수 경계": {
    slug: "이변수 경계",
    labelKo: "이변수 경계",
    category: "CONCEPT",
    priority: 42,
  },
  "사변수 경계": {
    slug: "사변수 경계",
    labelKo: "사변수 경계",
    category: "CONCEPT",
    priority: 43,
  },
  "의존적 경계": {
    slug: "의존적 경계",
    labelKo: "의존적 경계",
    category: "CONCEPT",
    priority: 44,
  },
  "다차원 경계": {
    slug: "다차원 경계",
    labelKo: "다차원 경계",
    category: "CONCEPT",
    priority: 45,
  },
  "시간 기반 경계": {
    slug: "시간 기반 경계",
    labelKo: "시간 기반 경계",
    category: "CONCEPT",
    priority: 46,
  },
  "문자열 길이 경계": {
    slug: "문자열 길이 경계",
    labelKo: "문자열 길이 경계",
    category: "CONCEPT",
    priority: 47,
  },
  경계값: {
    slug: "경계값",
    labelKo: "경계값",
    category: "CONCEPT",
    priority: 48,
  },
  "엣지 케이스": {
    slug: "엣지 케이스",
    labelKo: "엣지 케이스",
    category: "CONCEPT",
    priority: 49,
  },

  // 조합 테스트 세부
  "불리언 조합": {
    slug: "불리언 조합",
    labelKo: "불리언 조합",
    category: "CONCEPT",
    priority: 50,
  },
  "삼변수 조합": {
    slug: "삼변수 조합",
    labelKo: "삼변수 조합",
    category: "CONCEPT",
    priority: 51,
  },
  "다수준 조합": {
    slug: "다수준 조합",
    labelKo: "다수준 조합",
    category: "CONCEPT",
    priority: 52,
  },
  "오변수 조합": {
    slug: "오변수 조합",
    labelKo: "오변수 조합",
    category: "CONCEPT",
    priority: 53,
  },
  "선택적 매개변수": {
    slug: "선택적 매개변수",
    labelKo: "선택적 매개변수",
    category: "CONCEPT",
    priority: 54,
  },
  "제약 조건 처리": {
    slug: "제약 조건 처리",
    labelKo: "제약 조건 처리",
    category: "CONCEPT",
    priority: 55,
  },
  "null 처리": {
    slug: "null 처리",
    labelKo: "null 처리",
    category: "CONCEPT",
    priority: 56,
  },
  "다중 파라미터": {
    slug: "다중 파라미터",
    labelKo: "다중 파라미터",
    category: "CONCEPT",
    priority: 57,
  },
  "다중 조건": {
    slug: "다중 조건",
    labelKo: "다중 조건",
    category: "CONCEPT",
    priority: 58,
  },
  "접근 제어": {
    slug: "접근 제어",
    labelKo: "접근 제어",
    category: "CONCEPT",
    priority: 59,
  },
  "알림 로직": {
    slug: "알림 로직",
    labelKo: "알림 로직",
    category: "CONCEPT",
    priority: 60,
  },

  // 테스트 인프라/패턴
  "의존성 주입": {
    slug: "의존성 주입",
    labelKo: "의존성 주입",
    category: "CONCEPT",
    priority: 70,
  },
  "결정적 테스트": {
    slug: "결정적 테스트",
    labelKo: "결정적 테스트",
    category: "CONCEPT",
    priority: 71,
  },
  "플래키 테스트": {
    slug: "플래키 테스트",
    labelKo: "플래키 테스트",
    category: "CONCEPT",
    priority: 72,
  },
  모킹: {
    slug: "모킹",
    labelKo: "모킹",
    category: "CONCEPT",
    priority: 73,
  },
  픽스처: {
    slug: "픽스처",
    labelKo: "픽스처",
    category: "CONCEPT",
    priority: 74,
  },
  "테스트 용이성": {
    slug: "테스트 용이성",
    labelKo: "테스트 용이성",
    category: "CONCEPT",
    priority: 75,
  },
  "클래스 테스트": {
    slug: "클래스 테스트",
    labelKo: "클래스 테스트",
    category: "CONCEPT",
    priority: 76,
  },
  "상태 격리": {
    slug: "상태 격리",
    labelKo: "상태 격리",
    category: "CONCEPT",
    priority: 77,
  },
  "Setup/Teardown": {
    slug: "Setup/Teardown",
    labelKo: "Setup/Teardown",
    category: "CONCEPT",
    priority: 78,
  },
  "상태 관리": {
    slug: "상태 관리",
    labelKo: "상태 관리",
    category: "CONCEPT",
    priority: 79,
  },
  "시간 제어": {
    slug: "시간 제어",
    labelKo: "시간 제어",
    category: "CONCEPT",
    priority: 80,
  },
  "시간 모킹": {
    slug: "시간 모킹",
    labelKo: "시간 모킹",
    category: "CONCEPT",
    priority: 81,
  },

  // 고급 패턴
  재시도: {
    slug: "재시도",
    labelKo: "재시도",
    category: "CONCEPT",
    priority: 90,
  },
  백오프: {
    slug: "백오프",
    labelKo: "백오프",
    category: "CONCEPT",
    priority: 91,
  },
  "Rate Limit": {
    slug: "Rate Limit",
    labelKo: "Rate Limit",
    category: "CONCEPT",
    priority: 92,
  },
  "토큰 버킷": {
    slug: "토큰 버킷",
    labelKo: "토큰 버킷",
    category: "CONCEPT",
    priority: 93,
  },
  "서킷 브레이커": {
    slug: "서킷 브레이커",
    labelKo: "서킷 브레이커",
    category: "CONCEPT",
    priority: 94,
  },
  회복탄력성: {
    slug: "회복탄력성",
    labelKo: "회복탄력성",
    category: "CONCEPT",
    priority: 95,
  },
  "MSA 패턴": {
    slug: "MSA 패턴",
    labelKo: "MSA 패턴",
    category: "CONCEPT",
    priority: 96,
  },
  "상태 머신": {
    slug: "상태 머신",
    labelKo: "상태 머신",
    category: "CONCEPT",
    priority: 97,
  },
  "상태 전이": {
    slug: "상태 전이",
    labelKo: "상태 전이",
    category: "CONCEPT",
    priority: 98,
  },

  // 데이터 처리
  "데이터 변환": {
    slug: "데이터 변환",
    labelKo: "데이터 변환",
    category: "CONCEPT",
    priority: 100,
  },
  "다단계 처리": {
    slug: "다단계 처리",
    labelKo: "다단계 처리",
    category: "CONCEPT",
    priority: 101,
  },
  "파이프라인 테스트": {
    slug: "파이프라인 테스트",
    labelKo: "파이프라인 테스트",
    category: "CONCEPT",
    priority: 102,
  },
  "워크플로우 테스트": {
    slug: "워크플로우 테스트",
    labelKo: "워크플로우 테스트",
    category: "CONCEPT",
    priority: 103,
  },
  "다중 함수 조정": {
    slug: "다중 함수 조정",
    labelKo: "다중 함수 조정",
    category: "CONCEPT",
    priority: 104,
  },
  "복잡한 조건": {
    slug: "복잡한 조건",
    labelKo: "복잡한 조건",
    category: "CONCEPT",
    priority: 105,
  },
  "로그 분석": {
    slug: "로그 분석",
    labelKo: "로그 분석",
    category: "CONCEPT",
    priority: 106,
  },
  모니터링: {
    slug: "모니터링",
    labelKo: "모니터링",
    category: "CONCEPT",
    priority: 107,
  },

  // === DOMAIN (도메인/데이터 타입) ===
  // 문자열
  문자열: {
    slug: "문자열",
    labelKo: "문자열",
    category: "DOMAIN",
    priority: 200,
  },
  "문자열 처리": {
    slug: "문자열 처리",
    labelKo: "문자열 처리",
    category: "DOMAIN",
    priority: 201,
  },
  "문자열 검증": {
    slug: "문자열 검증",
    labelKo: "문자열 검증",
    category: "DOMAIN",
    priority: 202,
  },
  "문자열 분석": {
    slug: "문자열 분석",
    labelKo: "문자열 분석",
    category: "DOMAIN",
    priority: 203,
  },
  "문자열 기초": {
    slug: "문자열 기초",
    labelKo: "문자열 기초",
    category: "DOMAIN",
    priority: 204,
  },
  "형식 검증": {
    slug: "형식 검증",
    labelKo: "형식 검증",
    category: "DOMAIN",
    priority: 205,
  },
  "데이터 포맷팅": {
    slug: "데이터 포맷팅",
    labelKo: "데이터 포맷팅",
    category: "DOMAIN",
    priority: 206,
  },
  "텍스트 검증": {
    slug: "텍스트 검증",
    labelKo: "텍스트 검증",
    category: "DOMAIN",
    priority: 207,
  },

  // 숫자
  정수: {
    slug: "정수",
    labelKo: "정수",
    category: "DOMAIN",
    priority: 210,
  },
  "정수 범위": {
    slug: "정수 범위",
    labelKo: "정수 범위",
    category: "DOMAIN",
    priority: 211,
  },
  숫자: {
    slug: "숫자",
    labelKo: "숫자",
    category: "DOMAIN",
    priority: 212,
  },
  "산술 연산": {
    slug: "산술 연산",
    labelKo: "산술 연산",
    category: "DOMAIN",
    priority: 213,
  },
  "기본 수학": {
    slug: "기본 수학",
    labelKo: "기본 수학",
    category: "DOMAIN",
    priority: 214,
  },
  수학: {
    slug: "수학",
    labelKo: "수학",
    category: "DOMAIN",
    priority: 215,
  },
  "부동소수점 정밀도": {
    slug: "부동소수점 정밀도",
    labelKo: "부동소수점 정밀도",
    category: "DOMAIN",
    priority: 216,
  },
  "수치 정확도": {
    slug: "수치 정확도",
    labelKo: "수치 정확도",
    category: "DOMAIN",
    priority: 217,
  },
  나눗셈: {
    slug: "나눗셈",
    labelKo: "나눗셈",
    category: "DOMAIN",
    priority: 218,
  },

  // 불리언/비교
  "불리언 로직": {
    slug: "불리언 로직",
    labelKo: "불리언 로직",
    category: "DOMAIN",
    priority: 220,
  },
  "비교 연산": {
    slug: "비교 연산",
    labelKo: "비교 연산",
    category: "DOMAIN",
    priority: 221,
  },
  "비교 연산자": {
    slug: "비교 연산자",
    labelKo: "비교 연산자",
    category: "DOMAIN",
    priority: 222,
  },
  "양수/음수 값": {
    slug: "양수/음수 값",
    labelKo: "양수/음수 값",
    category: "DOMAIN",
    priority: 223,
  },

  // 자료구조
  딕셔너리: {
    slug: "딕셔너리",
    labelKo: "딕셔너리",
    category: "DOMAIN",
    priority: 230,
  },
  "딕셔너리 연산": {
    slug: "딕셔너리 연산",
    labelKo: "딕셔너리 연산",
    category: "DOMAIN",
    priority: 231,
  },
  "키 검증": {
    slug: "키 검증",
    labelKo: "키 검증",
    category: "DOMAIN",
    priority: 232,
  },
  리스트: {
    slug: "리스트",
    labelKo: "리스트",
    category: "DOMAIN",
    priority: 233,
  },
  "리스트 연산": {
    slug: "리스트 연산",
    labelKo: "리스트 연산",
    category: "DOMAIN",
    priority: 234,
  },
  "리스트 검증": {
    slug: "리스트 검증",
    labelKo: "리스트 검증",
    category: "DOMAIN",
    priority: 235,
  },
  정렬: {
    slug: "정렬",
    labelKo: "정렬",
    category: "DOMAIN",
    priority: 236,
  },
  "중첩 구조": {
    slug: "중첩 구조",
    labelKo: "중첩 구조",
    category: "DOMAIN",
    priority: 237,
  },
  "자료구조 테스트": {
    slug: "자료구조 테스트",
    labelKo: "자료구조 테스트",
    category: "DOMAIN",
    priority: 238,
  },

  // 날짜/시간
  "날짜/시간": {
    slug: "날짜/시간",
    labelKo: "날짜/시간",
    category: "DOMAIN",
    priority: 240,
  },
  "날짜 검증": {
    slug: "날짜 검증",
    labelKo: "날짜 검증",
    category: "DOMAIN",
    priority: 241,
  },
  윤년: {
    slug: "윤년",
    labelKo: "윤년",
    category: "DOMAIN",
    priority: 242,
  },
  랜덤: {
    slug: "랜덤",
    labelKo: "랜덤",
    category: "DOMAIN",
    priority: 243,
  },

  // 파일/데이터
  CSV: {
    slug: "CSV",
    labelKo: "CSV",
    category: "DOMAIN",
    priority: 250,
  },
  JSON: {
    slug: "JSON",
    labelKo: "JSON",
    category: "DOMAIN",
    priority: 251,
  },
  경로: {
    slug: "경로",
    labelKo: "경로",
    category: "DOMAIN",
    priority: 252,
  },
  파일시스템: {
    slug: "파일시스템",
    labelKo: "파일시스템",
    category: "DOMAIN",
    priority: 253,
  },
  파싱: {
    slug: "파싱",
    labelKo: "파싱",
    category: "DOMAIN",
    priority: 254,
  },
  통계: {
    slug: "통계",
    labelKo: "통계",
    category: "DOMAIN",
    priority: 255,
  },
  온도: {
    slug: "온도",
    labelKo: "온도",
    category: "DOMAIN",
    priority: 256,
  },

  // API/네트워크
  API: {
    slug: "API",
    labelKo: "API",
    category: "DOMAIN",
    priority: 260,
  },
  "API 검증": {
    slug: "API 검증",
    labelKo: "API 검증",
    category: "DOMAIN",
    priority: 261,
  },
  "응답 처리": {
    slug: "응답 처리",
    labelKo: "응답 처리",
    category: "DOMAIN",
    priority: 262,
  },
  페이지네이션: {
    slug: "페이지네이션",
    labelKo: "페이지네이션",
    category: "DOMAIN",
    priority: 263,
  },
  "오프셋 계산": {
    slug: "오프셋 계산",
    labelKo: "오프셋 계산",
    category: "DOMAIN",
    priority: 264,
  },
  캐시: {
    slug: "캐시",
    labelKo: "캐시",
    category: "DOMAIN",
    priority: 265,
  },
  TTL: {
    slug: "TTL",
    labelKo: "TTL",
    category: "DOMAIN",
    priority: 266,
  },
  필터: {
    slug: "필터",
    labelKo: "필터",
    category: "DOMAIN",
    priority: 267,
  },
  검색: {
    slug: "검색",
    labelKo: "검색",
    category: "DOMAIN",
    priority: 268,
  },

  // === CONTEXT (실무 비즈니스 도메인) ===
  // 실무 도메인
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

  // 비즈니스 로직
  "비즈니스 로직": {
    slug: "비즈니스 로직",
    labelKo: "비즈니스 로직",
    category: "CONTEXT",
    priority: 310,
  },
  검증: {
    slug: "검증",
    labelKo: "검증",
    category: "CONTEXT",
    priority: 311,
  },
  "가격 계산": {
    slug: "가격 계산",
    labelKo: "가격 계산",
    category: "CONTEXT",
    priority: 312,
  },
  "가격 로직": {
    slug: "가격 로직",
    labelKo: "가격 로직",
    category: "CONTEXT",
    priority: 313,
  },
  할인: {
    slug: "할인",
    labelKo: "할인",
    category: "CONTEXT",
    priority: 314,
  },
  "할인 로직": {
    slug: "할인 로직",
    labelKo: "할인 로직",
    category: "CONTEXT",
    priority: 315,
  },
  장바구니: {
    slug: "장바구니",
    labelKo: "장바구니",
    category: "CONTEXT",
    priority: 316,
  },
  결제: {
    slug: "결제",
    labelKo: "결제",
    category: "CONTEXT",
    priority: 317,
  },
  이커머스: {
    slug: "이커머스",
    labelKo: "이커머스",
    category: "CONTEXT",
    priority: 318,
  },
  "주문 검증": {
    slug: "주문 검증",
    labelKo: "주문 검증",
    category: "CONTEXT",
    priority: 319,
  },
  배송비: {
    slug: "배송비",
    labelKo: "배송비",
    category: "CONTEXT",
    priority: 320,
  },
  "연령별 할인": {
    slug: "연령별 할인",
    labelKo: "연령별 할인",
    category: "CONTEXT",
    priority: 321,
  },
  티켓팅: {
    slug: "티켓팅",
    labelKo: "티켓팅",
    category: "CONTEXT",
    priority: 322,
  },
  "등급 계산": {
    slug: "등급 계산",
    labelKo: "등급 계산",
    category: "CONTEXT",
    priority: 323,
  },
  교육: {
    slug: "교육",
    labelKo: "교육",
    category: "CONTEXT",
    priority: 324,
  },
  "보험 로직": {
    slug: "보험 로직",
    labelKo: "보험 로직",
    category: "CONTEXT",
    priority: 325,
  },
  "요금 계산": {
    slug: "요금 계산",
    labelKo: "요금 계산",
    category: "CONTEXT",
    priority: 326,
  },
  "구간 겹침": {
    slug: "구간 겹침",
    labelKo: "구간 겹침",
    category: "CONTEXT",
    priority: 327,
  },
  "구간 테스트": {
    slug: "구간 테스트",
    labelKo: "구간 테스트",
    category: "CONTEXT",
    priority: 328,
  },
  "Luhn 알고리즘": {
    slug: "Luhn 알고리즘",
    labelKo: "Luhn 알고리즘",
    category: "CONTEXT",
    priority: 329,
  },
  "체크섬 검증": {
    slug: "체크섬 검증",
    labelKo: "체크섬 검증",
    category: "CONTEXT",
    priority: 330,
  },
  "객체 생명주기": {
    slug: "객체 생명주기",
    labelKo: "객체 생명주기",
    category: "CONTEXT",
    priority: 331,
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
      // 한국어 태그 그대로 검색
      const def = TAG_DEFINITIONS[slug];
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
      // 정의되지 않은 태그는 OTHER로 분류 (한국어 그대로 표시)
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
