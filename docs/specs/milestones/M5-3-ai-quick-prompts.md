# M5-3: AI 퀵 프롬프트 4개

## 개요
- **목표**: AI 채팅에 빠른 질문을 위한 4가지 프리셋 버튼 제공
- **우선순위**: High
- **예상 작업량**: 1-2일

## 기능 요구사항

### 4가지 퀵 프롬프트

1. **📋 스펙 요약**
   - 현재 문제의 핵심 요구사항을 간결하게 요약
   - 함수 시그니처, 입출력 타입, 주요 제약조건 포함

2. **🧪 테스트 제안**
   - 현재 문제에 대한 테스트 케이스 아이디어 제안
   - 경계값, 예외 상황, 일반 케이스 포함

3. **🔍 놓친 이유**
   - 제출 실패 후 어떤 케이스를 놓쳤는지 분석
   - AI 피드백 결과와 연계하여 설명

4. **📊 로그 분석**
   - 에러 로그/테스트 출력 분석
   - 실패 원인 진단 및 해결 방향 제시

### UI 디자인

```
┌─────────────────────────────────────────────────┐
│ 💬 AI 어시스턴트                           [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [이전 대화 내용]                               │
│                                                 │
├─────────────────────────────────────────────────┤
│ 빠른 질문:                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│ │📋 스펙요약│ │🧪 테스트  │ │🔍 놓친이유│ │📊로그││
│ └──────────┘ └──────────┘ └──────────┘ └──────┘│
├─────────────────────────────────────────────────┤
│ [메시지 입력...]                         [전송] │
└─────────────────────────────────────────────────┘
```

### 버튼 상태
| 상태 | 표시 |
|------|------|
| 기본 | 아웃라인 버튼 |
| Hover | 배경색 채움 |
| 비활성화 | 회색 + 툴팁 (예: "제출 후 사용 가능") |
| 로딩 | 스피너 + 버튼 비활성화 |

## 기술 구현

### 프롬프트 정의
```typescript
// quickPrompts.ts
export interface QuickPrompt {
  id: string;
  icon: string;
  label: string;
  shortLabel: string;
  description: string;
  template: string;
  requiresContext?: ('problem' | 'submission' | 'feedback' | 'logs')[];
  isAvailable: (context: PromptContext) => boolean;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'spec-summary',
    icon: '📋',
    label: '스펙 요약',
    shortLabel: '스펙',
    description: '현재 문제의 핵심 요구사항을 요약합니다',
    template: `현재 문제 "{problemTitle}"의 스펙을 간결하게 요약해주세요.

다음 내용을 포함해주세요:
1. 함수 시그니처와 반환 타입
2. 핵심 입력 조건과 제약사항
3. 예외 처리 요구사항
4. 테스트 시 주의해야 할 포인트

---
문제 설명:
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
    template: `문제 "{problemTitle}"에 대한 테스트 케이스를 제안해주세요.

다음 카테고리별로 제안해주세요:
1. **Happy Path**: 정상 동작 케이스
2. **경계값**: 최소/최대, 빈 입력 등
3. **예외 상황**: 에러가 발생해야 하는 케이스
4. **엣지 케이스**: 특수한 상황

각 케이스에 대해 입력값과 예상 결과를 포함해주세요.

---
문제 설명:
{problemDescription}

핵심 테스트 포인트:
{testPoints}`,
    requiresContext: ['problem'],
    isAvailable: (ctx) => !!ctx.problem,
  },

  {
    id: 'missed-cases',
    icon: '🔍',
    label: '놓친 이유',
    shortLabel: '놓침',
    description: '실패한 테스트 케이스를 분석합니다',
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
    template: `다음 로그/에러를 분석해주세요:

\`\`\`
{logs}
\`\`\`

다음을 알려주세요:
1. 에러의 원인은 무엇인가요?
2. 이 에러를 해결하려면 어떻게 해야 하나요?
3. 비슷한 에러를 방지하기 위한 팁`,
    requiresContext: ['logs'],
    isAvailable: (ctx) => !!ctx.logs && ctx.logs.length > 0,
  },
];
```

### 컨텍스트 수집
```typescript
// usePromptContext.ts
interface PromptContext {
  problem?: {
    id: number;
    title: string;
    description: string;
    testPoints: string[];
  };
  submission?: {
    code: string;
    score: number;
    status: string;
  };
  feedback?: {
    content: string;
    suggestions: string[];
  };
  logs?: string;
}

function usePromptContext(): PromptContext {
  const { currentProblem } = useProblemStore();
  const { latestSubmission, latestFeedback } = useSubmissionStore();
  const { logs } = useLogsStore();

  return {
    problem: currentProblem ? {
      id: currentProblem.id,
      title: currentProblem.title,
      description: currentProblem.description_md,
      testPoints: extractTestPoints(currentProblem.summary),
    } : undefined,
    submission: latestSubmission,
    feedback: latestFeedback,
    logs,
  };
}
```

### QuickPromptBar 컴포넌트
```tsx
// QuickPromptBar.tsx
function QuickPromptBar({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const context = usePromptContext();

  const handleClick = (prompt: QuickPrompt) => {
    if (!prompt.isAvailable(context)) return;

    const filledPrompt = fillPromptTemplate(prompt.template, context);
    onSelectPrompt(filledPrompt);
  };

  return (
    <div className="flex gap-2 p-2 border-t border-gray-200">
      <span className="text-xs text-gray-500 self-center">빠른 질문:</span>
      {QUICK_PROMPTS.map((prompt) => {
        const available = prompt.isAvailable(context);
        return (
          <button
            key={prompt.id}
            onClick={() => handleClick(prompt)}
            disabled={!available}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              available
                ? "border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            )}
            title={available ? prompt.description : "필요한 정보가 없습니다"}
          >
            <span className="mr-1">{prompt.icon}</span>
            <span className="hidden sm:inline">{prompt.label}</span>
            <span className="sm:hidden">{prompt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
```

## 고려사항

### 컨텍스트 의존성
- "놓친 이유"는 제출 후에만 활성화
- "로그 분석"은 에러 로그가 있을 때만 활성화
- 비활성화된 버튼에는 이유를 툴팁으로 표시

### 토큰 제한
- 프롬프트 길이 제한 (문제 설명 축약)
- 긴 로그는 마지막 N줄만 포함

### 사용성
- 버튼 클릭 시 즉시 전송 vs 입력창에 삽입
- 사용자 설정으로 선택 가능

## 테스트 케이스
- [ ] 각 버튼 클릭 시 올바른 프롬프트 생성
- [ ] 컨텍스트에 따른 버튼 활성화/비활성화
- [ ] 프롬프트 템플릿 변수 치환
- [ ] 비활성 버튼 툴팁 표시
- [ ] 모바일에서 버튼 레이아웃
- [ ] 제출 전/후 버튼 상태 변화

## 관련 마일스톤
- M5-2: AI로 보내기 버튼 (유사한 프롬프트 전송 로직)
- M5-5: 단계형 힌트 시스템 (AI 응답 연계)

---
*생성일: 2024-12-24*
