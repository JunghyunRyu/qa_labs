/**
 * AI 프롬프트 템플릿 (M5-2)
 */

export const AI_PROMPT_TEMPLATES = {
  testPointExplain: {
    id: 'test-point-explain',
    template: `다음 테스트 포인트에 대해 설명해주세요:

"{content}"

이 테스트 포인트를 커버하는 pytest 코드 예시를 보여주세요.`,
  },

  testPointImplement: {
    id: 'test-point-implement',
    template: `다음 테스트 포인트에 대한 pytest 테스트 코드를 작성해주세요:

"{content}"

@pytest.mark.parametrize를 사용하여 여러 케이스를 포함해주세요.`,
  },

  gradingResultAnalysis: {
    id: 'grading-result-analysis',
    template: `채점 결과를 분석해주세요:

📊 점수: {score}점 (버그 탐지율 {killRatio}%)
🔍 놓친 버그: {missedBugs}

위 결과를 바탕으로:
1. 놓친 버그를 잡기 위해 어떤 테스트를 추가해야 할까요?
2. 구체적인 pytest 코드 예시를 보여주세요.`,
  },
} as const;

export type PromptTemplateId = keyof typeof AI_PROMPT_TEMPLATES;

/**
 * 템플릿에 컨텍스트를 적용하여 최종 프롬프트 생성
 */
export function applyTemplate(
  templateId: PromptTemplateId,
  context: Record<string, string>
): string {
  let result: string = AI_PROMPT_TEMPLATES[templateId].template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}
