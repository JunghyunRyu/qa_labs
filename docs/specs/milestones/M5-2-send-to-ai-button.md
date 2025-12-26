# M5-2: 테스트 포인트 옆 "AI로 보내기" 버튼

## 개요
- **목표**: 각 테스트 포인트 항목 옆에 "AI로 보내기" 버튼을 추가하여 AI 채팅으로 빠르게 질문
- **우선순위**: High
- **예상 작업량**: 1일

## 기능 요구사항

### 핵심 기능
1. **버튼 위치 및 디자인**
   - 각 테스트 포인트 항목 우측에 작은 아이콘 버튼
   - hover 시에만 표시 (또는 항상 표시 옵션)
   - 클릭 시 해당 내용을 AI 채팅 입력창에 자동 삽입

2. **전송 동작**
   - AI 채팅 패널이 닫혀있으면 자동으로 열림
   - 입력창에 프리셋 프롬프트 + 선택된 테스트 포인트 삽입
   - 자동 전송 옵션 (설정 가능)

3. **프롬프트 템플릿**
   ```
   다음 테스트 포인트에 대해 설명해주세요:

   "{테스트 포인트 내용}"

   이 테스트 포인트를 커버하는 pytest 코드 예시를 보여주세요.
   ```

### UI 디자인

```
┌─────────────────────────────────────────────────┐
│ 🎯 핵심 테스트 포인트                           │
├─────────────────────────────────────────────────┤
│ • 빈 리스트 입력 시 빈 리스트 반환    [🤖]     │
│ • 중복 요소 처리 방식                  [🤖]     │
│ • 음수 포함 시 정렬 순서               [🤖]     │
│ • None 값 처리                         [🤖]     │
└─────────────────────────────────────────────────┘

[🤖] = AI로 보내기 버튼 (hover 시 표시)
```

### 버튼 상태
| 상태 | 표시 |
|------|------|
| 기본 | 투명/숨김 |
| Hover | 보라색 아이콘 표시 |
| 클릭 | 짧은 애니메이션 + 체크 표시 |
| 전송 중 | 스피너 |

## 기술 구현

### 컴포넌트 구조
```tsx
// TestPointItem.tsx
interface TestPointItemProps {
  content: string;
  onSendToAI: (content: string) => void;
}

function TestPointItem({ content, onSendToAI }: TestPointItemProps) {
  const [isSent, setIsSent] = useState(false);

  const handleSendToAI = () => {
    onSendToAI(content);
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2000);
  };

  return (
    <li className="flex items-start justify-between group">
      <span className="flex-1">{content}</span>
      <button
        onClick={handleSendToAI}
        className={cn(
          "ml-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-purple-100 text-purple-600"
        )}
        title="AI에게 질문하기"
      >
        {isSent ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </button>
    </li>
  );
}
```

### AI 채팅 연동
```typescript
// useAIChat hook 확장
interface UseAIChatReturn {
  // 기존 기능
  messages: Message[];
  sendMessage: (content: string) => void;

  // 새 기능
  prefillMessage: (content: string) => void;
  sendWithTemplate: (templateId: string, context: Record<string, string>) => void;
  openAndPrefill: (content: string) => void;
}

function useAIChat(): UseAIChatReturn {
  const { setIsAIChatOpen } = useLayoutStore();

  const openAndPrefill = useCallback((content: string) => {
    setIsAIChatOpen(true);
    // 약간의 딜레이 후 prefill (패널 애니메이션 대기)
    setTimeout(() => {
      prefillMessage(content);
    }, 100);
  }, []);

  // ...
}
```

### 프롬프트 템플릿 관리
```typescript
// promptTemplates.ts
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
} as const;

export function applyTemplate(
  templateId: keyof typeof AI_PROMPT_TEMPLATES,
  context: Record<string, string>
): string {
  let result = AI_PROMPT_TEMPLATES[templateId].template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}
```

## 고려사항

### 사용자 경험
- 버튼이 텍스트 가독성을 방해하지 않도록 함
- 모바일에서는 탭 대신 롱프레스로 메뉴 표시
- 전송 후 시각적 피드백 (체크 아이콘)

### 접근성
- 키보드로 버튼 접근 가능 (Tab)
- aria-label로 버튼 설명
- 포커스 시 버튼 표시

### 설정 옵션
- 버튼 항상 표시 / hover 시만 표시
- 자동 전송 여부
- 기본 프롬프트 템플릿 선택

## 테스트 케이스
- [ ] 버튼 hover 시 표시
- [ ] 클릭 시 AI 채팅 열림
- [ ] 프롬프트 템플릿 적용
- [ ] 입력창에 텍스트 삽입
- [ ] 전송 후 피드백 표시
- [ ] 키보드 네비게이션
- [ ] 모바일 터치 동작

## 관련 마일스톤
- M5-3: AI 퀵 프롬프트 (프롬프트 템플릿 공유)
- M5-4: 선택-전송 (유사한 AI 전송 로직)

---
*생성일: 2024-12-24*
