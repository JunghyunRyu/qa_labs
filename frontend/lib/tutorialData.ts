/**
 * Tutorial Data - 하드코딩된 튜토리얼 문제 데이터
 *
 * DB 의존성 없이 프론트엔드에서 직접 사용하는 튜토리얼 데이터
 */

import type { TutorialProblem, TutorialStep } from "@/types/tutorial";

/**
 * 튜토리얼용 문제: is_even (짝수 판별 함수)
 *
 * - 가장 직관적이고 이해하기 쉬운 함수
 * - 음수 경계 케이스로 버그 탐지 학습
 */
export const TUTORIAL_PROBLEM: TutorialProblem = {
  id: "tutorial-is-even",
  title: "짝수 판별 함수 테스트",
  description: `## 문제 설명

\`is_even\` 함수는 주어진 정수가 짝수인지 판별합니다.

## 함수 시그니처

\`\`\`python
def is_even(n: int) -> bool:
    \"\"\"
    주어진 정수가 짝수인지 판별합니다.

    Args:
        n: 판별할 정수

    Returns:
        짝수이면 True, 홀수이면 False
    \"\"\"
\`\`\`

## 예시

| 입력 | 출력 | 설명 |
|------|------|------|
| \`is_even(4)\` | \`True\` | 4는 짝수 |
| \`is_even(3)\` | \`False\` | 3은 홀수 |
| \`is_even(0)\` | \`True\` | 0은 짝수 |
| \`is_even(-2)\` | \`True\` | -2도 짝수! |

## 핵심 포인트

**음수도 짝수일 수 있습니다!** -2, -4, -6은 모두 짝수입니다.
`,
  functionSignature: "def is_even(n: int) -> bool",

  // 정상 구현 (Golden Code)
  goldenCode: `def is_even(n):
    """주어진 정수가 짝수인지 판별합니다."""
    return n % 2 == 0`,

  // 버그 있는 구현 (Buggy Code) - 음수 처리 실패
  buggyCode: `def is_even(n):
    """주어진 정수가 짝수인지 판별합니다."""
    if n < 0:
        return False  # BUG: 음수 짝수도 False 반환
    return n % 2 == 0`,

  // 초기 테스트 코드 (Step 1에서 사용)
  initialTestCode: `from target import is_even

def test_basic_even():
    """기본 짝수 테스트"""
    assert is_even(2) == True
    assert is_even(4) == True

def test_basic_odd():
    """기본 홀수 테스트"""
    assert is_even(1) == False
    assert is_even(3) == False
`,

  // Ghost Code (Step 2에서 표시)
  ghostCode: `
def test_negative_even():
    """음수 짝수 테스트 - 버그를 찾는 핵심!"""
    assert is_even(-2) == True  # 음수도 짝수!
    assert is_even(-4) == True
`,
};

/**
 * 튜토리얼 4단계 정의
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "정상 동작 확인",
    description:
      "먼저 테스트 코드가 정상 구현에서 통과하는지 확인해봅시다. 이것이 테스트의 기본입니다.",
    guide: '"테스트 실행" 버튼을 클릭하세요',
    targetSelector: '[data-tutorial="run-test"]',
    expectedAction: "click",
    useGoldenCode: true,
  },
  {
    id: 2,
    title: "버그를 찾는 테스트 추가",
    description:
      "기본 테스트만으로는 모든 버그를 찾을 수 없습니다. 음수에 대한 테스트를 추가해서 숨겨진 버그를 찾아봅시다.",
    guide: "아래 코드를 에디터에 추가하세요 (복사 버튼 사용 가능)",
    targetSelector: '[data-tutorial="editor"]',
    expectedAction: "type",
    expectedCode: "def test_negative_even",
    ghostCode: TUTORIAL_PROBLEM.ghostCode,
  },
  {
    id: 3,
    title: "버그 탐지 경험",
    description:
      "이제 버그가 있는 코드에 대해 테스트를 실행해봅시다. 우리가 추가한 테스트가 버그를 잡아낼 수 있을까요?",
    guide: '"테스트 실행" 버튼을 다시 클릭하세요',
    targetSelector: '[data-tutorial="run-test"]',
    expectedAction: "click",
    useGoldenCode: false, // 이 단계에서 버그 코드로 전환
  },
  {
    id: 4,
    title: "첫 번째 버그 킬!",
    description:
      '축하합니다! 테스트가 실패했다는 것은 버그를 발견했다는 뜻입니다. 이것이 바로 "Mutation Testing"의 핵심입니다.',
    guide: '"채점하기" 버튼을 클릭하여 점수를 확인하세요',
    targetSelector: '[data-tutorial="submit"]',
    expectedAction: "submit",
    isLast: true,
  },
];

/**
 * 단계별 성공 메시지 (v1.2 UX 개선)
 */
export const STEP_SUCCESS_MESSAGES: Record<
  string,
  {
    title: string;
    message: string;
    explanation?: string;
    nextAction: string;
  }
> = {
  step1: {
    title: "테스트 통과!",
    message:
      "모든 테스트가 통과했습니다. 정상적인 코드에서 테스트가 잘 작동하네요!",
    explanation: `is_even(2)는 2 % 2 == 0 이므로 True → 통과
is_even(4)는 4 % 2 == 0 이므로 True → 통과
is_even(1)은 1 % 2 == 1 이므로 False → 통과
is_even(3)은 3 % 2 == 1 이므로 False → 통과`,
    nextAction: "이제 '다음 단계로' 버튼을 눌러 테스트를 추가해봅시다!",
  },
  step2: {
    title: "코드 추가 완료!",
    message: "음수 테스트 케이스를 추가했습니다.",
    nextAction: "'다음 단계로' 버튼을 눌러 버그를 찾아봅시다!",
  },
  step3: {
    title: "버그 발견!",
    message: "테스트가 실패했습니다. 이것은 버그를 찾았다는 의미입니다!",
    explanation: `is_even(-2)는 -2 % 2 == 0 이므로 True여야 하는데...
버그 코드는 음수를 모두 False로 반환합니다!
→ 테스트 실패 = 버그 탐지 성공!`,
    nextAction: "'다음 단계로' 버튼을 눌러 채점을 완료합시다!",
  },
};

/**
 * 튜토리얼 완료 메시지
 */
export const TUTORIAL_COMPLETION = {
  title: "첫 번째 버그 킬(Bug Kill) 달성!",
  message: `축하합니다! 당신은 방금 테스트 코드로 버그를 잡아냈습니다.

**배운 것:**
- 테스트 코드는 버그를 찾기 위한 것입니다
- 경계 케이스(음수, 0, 최대값 등)를 테스트하는 것이 중요합니다
- 테스트가 실패하면 버그를 발견한 것입니다!

이제 실제 문제들을 풀어보세요. 더 많은 버그를 잡을수록 더 높은 점수를 받을 수 있습니다!`,
  ctaLabel: "문제 풀러 가기",
  ctaHref: "/problems",
};

/**
 * localStorage 키
 */
export const TUTORIAL_STORAGE_KEY = "qa-arena-tutorial-completed";

/**
 * 튜토리얼 완료 여부 확인 (localStorage 기반 - 동기 체크)
 */
export function isTutorialCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
}

/**
 * 튜토리얼 완료 저장 (localStorage + API)
 * - localStorage: 즉시 저장 (UI 반응성)
 * - API: 로그인 사용자의 경우 서버에도 저장
 */
export async function markTutorialCompleted(): Promise<void> {
  if (typeof window === "undefined") return;

  // localStorage에 즉시 저장
  localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");

  // 로그인 사용자인 경우 API 호출 (비동기, 실패해도 무시)
  try {
    const { completeTutorial } = await import("@/lib/api/auth");
    await completeTutorial();
  } catch {
    // API 호출 실패 시 무시 (localStorage에는 이미 저장됨)
    console.debug("Tutorial completion API call failed (user may not be logged in)");
  }
}

/**
 * 서버 상태와 localStorage 동기화
 * - 로그인 시 서버에 tutorial_completed_at이 있으면 localStorage에 반영
 */
export function syncTutorialStatus(tutorialCompletedAt: string | null): void {
  if (typeof window === "undefined") return;

  if (tutorialCompletedAt) {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  }
}

/**
 * 튜토리얼 완료 상태 초기화 (개발/테스트용)
 */
export function resetTutorialCompletion(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}
