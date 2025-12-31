/**
 * AI 퀵 프롬프트 정의 (M5-3)
 *
 * 4가지 빠른 질문 버튼:
 * 1. 스펙 요약 - 문제 요구사항 정리
 * 2. 테스트 제안 - 테스트 케이스 아이디어
 * 3. 놓친 이유 - 실패 케이스 분석
 * 4. 로그 분석 - 에러 로그 해석
 */

export interface PromptContext {
  problem?: {
    id: number;
    title: string;
    description: string;
    functionSignature: string;
    summary?: string;
  };
  submission?: {
    code: string;
    score: number;
    status: string;
  };
  feedback?: {
    content: string;
  };
  logs?: string;
}

export interface QuickPrompt {
  id: string;
  icon: string;
  label: string;
  shortLabel: string;
  description: string;
  disabledReason?: string;
  template: string;
  requiresContext: ('problem' | 'submission' | 'feedback' | 'logs')[];
  isAvailable: (context: PromptContext) => boolean;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'spec-summary',
    icon: '📋',
    label: '스펙 요약',
    shortLabel: '스펙',
    description: '현재 문제의 핵심 요구사항을 요약합니다',
    template: `현재 문제의 스펙을 간결하게 요약해주세요.

다음 내용을 포함해주세요:
1. 함수 시그니처와 반환 타입
2. 핵심 입력 조건과 제약사항
3. 예외 처리 요구사항
4. 테스트 시 주의해야 할 포인트

---
**함수 시그니처:**
{functionSignature}

**문제 설명:**
{problemDescription}`,
    requiresContext: ['problem'],
    isAvailable: (ctx) => !!ctx.problem,
  },

  {
    id: 'test-suggestions',
    icon: '🧪',
    label: '테스트 제안',
    shortLabel: '테스트',
    description: '테스트 케이스 아이디어를 제안합니다',
    template: `이 문제에 대한 테스트 케이스를 제안해주세요.

다음 카테고리별로 제안해주세요:
1. **Happy Path**: 정상 동작 케이스
2. **경계값**: 최소/최대, 빈 입력 등
3. **예외 상황**: 에러가 발생해야 하는 케이스
4. **엣지 케이스**: 특수한 상황

각 케이스에 대해 입력값과 예상 결과를 포함해주세요.

---
**함수 시그니처:**
{functionSignature}

**핵심 테스트 포인트:**
{summary}`,
    requiresContext: ['problem'],
    isAvailable: (ctx) => !!ctx.problem,
  },

  {
    id: 'missed-cases',
    icon: '🔍',
    label: '놓친 이유',
    shortLabel: '놓침',
    description: '실패한 테스트 케이스를 분석합니다',
    disabledReason: '제출 후 사용 가능',
    template: `제출한 테스트 코드가 일부 케이스를 놓쳤습니다. 분석해주세요.

**내 테스트 코드:**
\`\`\`python
{userCode}
\`\`\`

**AI 피드백:**
{aiFeedback}

**점수:** {score}/100

다음을 알려주세요:
1. 어떤 유형의 테스트 케이스가 부족한가요?
2. 놓친 케이스를 잡기 위한 구체적인 테스트 코드 예시
3. 점수를 높이기 위한 우선순위 제안`,
    requiresContext: ['submission', 'feedback'],
    isAvailable: (ctx) => !!ctx.submission && !!ctx.feedback,
  },

  {
    id: 'log-analysis',
    icon: '📊',
    label: '로그 분석',
    shortLabel: '로그',
    description: '에러 로그를 분석하고 해결책을 제시합니다',
    disabledReason: '로그가 없습니다',
    template: `다음 로그/에러를 분석해주세요:

\`\`\`
{logs}
\`\`\`

다음을 알려주세요:
1. 에러의 원인은 무엇인가요?
2. 이 에러를 해결하려면 어떻게 해야 하나요?
3. 비슷한 에러를 방지하기 위한 팁`,
    requiresContext: ['logs'],
    isAvailable: (ctx) => !!ctx.logs && ctx.logs.trim().length > 0,
  },
];

/**
 * 프롬프트 템플릿에 컨텍스트 값 채우기
 */
export function fillPromptTemplate(template: string, context: PromptContext): string {
  let result = template;

  // Problem context
  if (context.problem) {
    result = result.replace(/{problemTitle}/g, context.problem.title);
    result = result.replace(/{problemDescription}/g, truncateText(context.problem.description, 2000));
    result = result.replace(/{functionSignature}/g, context.problem.functionSignature);
    result = result.replace(/{summary}/g, context.problem.summary || '(없음)');
  }

  // Submission context
  if (context.submission) {
    result = result.replace(/{userCode}/g, truncateText(context.submission.code, 3000));
    result = result.replace(/{score}/g, String(context.submission.score));
  }

  // Feedback context
  if (context.feedback) {
    result = result.replace(/{aiFeedback}/g, truncateText(context.feedback.content, 1500));
  }

  // Logs context
  if (context.logs) {
    result = result.replace(/{logs}/g, truncateText(context.logs, 2000, 'tail'));
  }

  return result;
}

/**
 * 텍스트 길이 제한 (토큰 절약)
 */
function truncateText(text: string, maxLength: number, mode: 'head' | 'tail' = 'head'): string {
  if (text.length <= maxLength) return text;

  if (mode === 'tail') {
    // 마지막 N 문자 (로그용)
    return '...\n' + text.slice(-maxLength);
  }

  // 앞부분 N 문자
  return text.slice(0, maxLength) + '\n...';
}

/**
 * 특정 프롬프트가 사용 가능한지 확인하고 이유 반환
 */
export function getPromptAvailability(
  prompt: QuickPrompt,
  context: PromptContext
): { available: boolean; reason?: string } {
  if (prompt.isAvailable(context)) {
    return { available: true };
  }

  // 비활성화 이유 결정
  if (prompt.disabledReason) {
    return { available: false, reason: prompt.disabledReason };
  }

  // 필요한 컨텍스트 기반 이유 생성
  const missing: string[] = [];
  if (prompt.requiresContext.includes('submission') && !context.submission) {
    missing.push('제출 기록');
  }
  if (prompt.requiresContext.includes('feedback') && !context.feedback) {
    missing.push('AI 피드백');
  }
  if (prompt.requiresContext.includes('logs') && !context.logs) {
    missing.push('로그');
  }

  if (missing.length > 0) {
    return { available: false, reason: `${missing.join(', ')}이 필요합니다` };
  }

  return { available: false, reason: '사용할 수 없습니다' };
}
