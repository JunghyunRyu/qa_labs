/**
 * 선택 텍스트 → AI 프롬프트 생성 (M5-4)
 */

export type SelectionActionType = "explain" | "example" | "test";

export interface SelectionAction {
  id: SelectionActionType;
  icon: string;
  label: string;
}

export const SELECTION_ACTIONS: SelectionAction[] = [
  { id: "explain", icon: "💡", label: "설명해줘" },
  { id: "example", icon: "📝", label: "예시 보여줘" },
  { id: "test", icon: "🧪", label: "테스트 작성" },
];

interface PromptContext {
  problemTitle?: string;
}

/**
 * 선택된 텍스트와 액션 타입에 따른 프롬프트 생성
 */
export function generateSelectionPrompt(
  actionType: SelectionActionType,
  selectedText: string,
  context?: PromptContext
): string {
  // 텍스트가 너무 길면 축약
  const truncatedText =
    selectedText.length > 500
      ? selectedText.slice(0, 500) + "..."
      : selectedText;

  const problemContext = context?.problemTitle
    ? `\n\n(문제: ${context.problemTitle})`
    : "";

  const prompts: Record<SelectionActionType, string> = {
    explain: `다음 내용에 대해 자세히 설명해주세요:

"${truncatedText}"${problemContext}

초보자도 이해할 수 있도록 쉽게 설명해주세요.`,

    example: `다음 내용에 대한 구체적인 예시를 보여주세요:

"${truncatedText}"${problemContext}

입력값과 예상 출력값을 포함한 예시를 들어주세요.`,

    test: `다음 요구사항을 테스트하는 pytest 코드를 작성해주세요:

"${truncatedText}"${problemContext}

@pytest.mark.parametrize를 사용하여 여러 케이스를 포함해주세요.
각 테스트 케이스에 대한 설명 주석도 추가해주세요.`,
  };

  return prompts[actionType];
}
