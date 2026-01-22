/**
 * 테스트 포인트 필터링 유틸리티
 * summary에서 스포일러(버그 설명)를 제거하고 "기능 검증" 단위로 추상화
 *
 * 핵심 원칙: "지도(Map)를 주되, 정답지(Answer)는 주지 않는다"
 */

/**
 * 키워드 기반 기능 검증 라벨 매핑
 * 스포일러 키워드 → 추상화된 테스트 요구사항
 */
const KEYWORD_TO_LABEL: Array<{ keywords: string[]; label: string }> = [
  // 대소문자 관련
  {
    keywords: ["case_sensitive", "대소문자"],
    label: "대소문자 구분 옵션(case_sensitive) 동작 검증",
  },
  // 빈 입력 관련
  {
    keywords: ["빈 문자열", "빈 입력", "empty", '""'],
    label: "빈 입력(empty input) 처리 검증",
  },
  // 공백 관련
  {
    keywords: ["공백", "whitespace", "space", "' '"],
    label: "공백 문자 처리 검증",
  },
  // 경계값 관련
  {
    keywords: ["마지막 문자", "off-by-one", "끝에 있는"],
    label: "문자열 경계(off-by-one) 검증",
  },
  {
    keywords: ["경계값", "boundary"],
    label: "경계값 처리 검증",
  },
  // 0 관련
  {
    keywords: ["0을 양수로", "is_positive(0)"],
    label: "경계값(0) 처리 검증",
  },
  // 부호 관련
  {
    keywords: ["부호 판단", "부호를 반대로"],
    label: "부호 판단 로직 검증",
  },
  // 음수 관련
  {
    keywords: ["음수", "negative", "절댓값"],
    label: "음수 입력 처리 검증",
  },
  // truthiness 관련
  {
    keywords: ["진리값", "truthiness", "truthy"],
    label: "0 vs 비-0 값 구분 검증",
  },
  // 특수문자 관련
  {
    keywords: ["특수문자", "special char"],
    label: "특수문자 처리 검증",
  },
  // 동등 분할 관련
  {
    keywords: ["equivalence partitioning", "동등 분할", "파티션"],
    label: "동등 분할(Equivalence Partitioning) 검증",
  },
  // 타입 관련
  {
    keywords: ["TypeError", "타입"],
    label: "입력 타입 검증",
  },
  // ValueError 관련
  {
    keywords: ["ValueError", "길이", "1글자"],
    label: "입력 값 유효성 검증",
  },
];

/**
 * 버그 설명을 추상화된 "기능 검증" 라벨로 변환
 *
 * 전략:
 * 1. 키워드 매칭으로 가장 적합한 라벨 찾기
 * 2. 매칭 실패 시 일반화된 라벨 생성
 */
function convertToTestRequirement(bugDescription: string): string {
  // 1. 키워드 매칭 시도
  for (const { keywords, label } of KEYWORD_TO_LABEL) {
    if (keywords.some((kw) => bugDescription.toLowerCase().includes(kw.toLowerCase()))) {
      return label;
    }
  }

  // 2. 매칭 실패 시: 콜론/마침표 앞부분만 추출하고 정리
  const shortDesc = bugDescription
    .split(/[:.]/)
    [0]
    .trim()
    // 스포일러 키워드 제거
    .replace(/잘못|오류|버그|실패|처리함|반환함|구현함|못함/g, "")
    .trim();

  // 너무 짧거나 비어있으면 일반화된 라벨
  if (!shortDesc || shortDesc.length < 3) {
    return "해당 기능 검증";
  }

  // "XXX 검증" 형태로 반환
  return `${shortDesc} 검증`;
}

/**
 * summary 필드에서 스포일러를 제거하고 추상화된 테스트 요구사항으로 변환
 *
 * 입력 예시:
 * 🎯 **이 문제에서 검증할 테스트 포인트**
 * 📏 **경계값 분석**
 *   • case_sensitive=False인 경우에도 대소문자를 무시하지 않고...
 *
 * 출력 예시:
 * 🎯 **이 문제에서 검증할 테스트 포인트**
 * 📏 **경계값 분석**
 *   • 대소문자 구분 옵션(case_sensitive) 동작 검증
 */
export function filterSpoilersFromSummary(summary: string): string {
  if (!summary) return summary;

  const lines = summary.split("\n");
  const seenLabels = new Set<string>(); // 중복 라벨 방지

  const filteredLines = lines.map((line) => {
    // bullet point (•)가 있는 줄만 필터링
    if (line.includes("•")) {
      const bulletMatch = line.match(/•\s*(.+)$/);
      if (bulletMatch) {
        const bugDescription = bulletMatch[1].trim();
        const label = convertToTestRequirement(bugDescription);

        // 중복 라벨 스킵
        if (seenLabels.has(label)) {
          return null; // 나중에 필터링
        }
        seenLabels.add(label);

        // 원래 들여쓰기 유지
        const indent = line.match(/^(\s*)/)?.[1] || "  ";
        return `${indent}• ${label}`;
      }
    }
    return line;
  });

  // null (중복) 제거 후 반환
  return filteredLines.filter((line) => line !== null).join("\n");
}

/**
 * summary가 스포일러를 포함하는지 검사 (디버깅용)
 */
export function containsSpoilers(summary: string): boolean {
  if (!summary) return false;

  const spoilerIndicators = [
    "잘못 처리함",
    "잘못 반환함",
    "잘못 구현함",
    "버그:",
    "버그가 있",
    "is_positive(0)이 True",
    "를 반환함",
    "을 반환함",
    "못함",
    "실패",
  ];

  return spoilerIndicators.some((indicator) => summary.includes(indicator));
}
