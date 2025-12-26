# M5-4: 선택-전송 (드래그 → AI 질문)

## 개요
- **목표**: 문제 설명에서 텍스트를 드래그 선택하면 AI에게 질문할 수 있는 기능
- **우선순위**: Medium
- **예상 작업량**: 2-3일

## 기능 요구사항

### 핵심 기능
1. **텍스트 선택 감지**
   - 문제 패널 내 텍스트 드래그 선택 감지
   - 코드 블록 선택도 지원
   - 최소 선택 길이 제한 (10자 이상)

2. **플로팅 액션 버튼**
   - 선택 영역 근처에 팝오버 버튼 표시
   - "AI에게 질문" 버튼
   - 선택 해제 시 자동 숨김

3. **질문 유형 선택**
   - 설명해줘
   - 예시 보여줘
   - 테스트 코드로 작성해줘

### UI 디자인

```
문제 설명 패널에서:
┌────────────────────────────────────────────────┐
│ ... 입력값이 비어있는 경우 ValueError를        │
│     [████████████████████████]                 │
│     raise해야 합니다. ...     ┌──────────────┐ │
│                               │ 🤖 AI에게    │ │
│                               │ ├ 설명해줘   │ │
│                               │ ├ 예시 보여줘│ │
│                               │ └ 테스트 작성│ │
│                               └──────────────┘ │
└────────────────────────────────────────────────┘

[████] = 선택된 텍스트
```

### 플로팅 메뉴 동작
| 이벤트 | 동작 |
|--------|------|
| 텍스트 선택 완료 | 메뉴 표시 (0.3초 딜레이) |
| 메뉴 항목 클릭 | AI 채팅으로 전송 + 메뉴 숨김 |
| 다른 곳 클릭 | 메뉴 숨김 |
| 스크롤 | 메뉴 숨김 |
| Escape 키 | 메뉴 숨김 |

## 기술 구현

### 텍스트 선택 감지 훅
```typescript
// useTextSelection.ts
interface TextSelection {
  text: string;
  rect: DOMRect | null;
  isValid: boolean;
}

function useTextSelection(containerRef: RefObject<HTMLElement>): TextSelection {
  const [selection, setSelection] = useState<TextSelection>({
    text: '',
    rect: null,
    isValid: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection({ text: '', rect: null, isValid: false });
        return;
      }

      // 선택이 컨테이너 내부인지 확인
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 10) {
        setSelection({ text: '', rect: null, isValid: false });
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        rect,
        isValid: true,
      });
    };

    // 약간의 딜레이로 선택 완료 감지
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, 300);
    };

    document.addEventListener('selectionchange', debouncedHandler);
    return () => {
      document.removeEventListener('selectionchange', debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [containerRef]);

  return selection;
}
```

### 플로팅 메뉴 컴포넌트
```tsx
// SelectionActionMenu.tsx
interface SelectionActionMenuProps {
  selection: TextSelection;
  onAction: (actionType: string, selectedText: string) => void;
  onDismiss: () => void;
}

const ACTIONS = [
  { id: 'explain', icon: '💡', label: '설명해줘' },
  { id: 'example', icon: '📝', label: '예시 보여줘' },
  { id: 'test', icon: '🧪', label: '테스트 작성' },
];

function SelectionActionMenu({
  selection,
  onAction,
  onDismiss,
}: SelectionActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 위치 계산
  const menuStyle = useMemo(() => {
    if (!selection.rect) return {};

    return {
      position: 'fixed' as const,
      top: selection.rect.bottom + 8,
      left: Math.min(
        selection.rect.left,
        window.innerWidth - 200 // 메뉴 너비 고려
      ),
    };
  }, [selection.rect]);

  // 외부 클릭 감지
  useClickOutside(menuRef, onDismiss);

  // ESC 키 감지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  if (!selection.isValid || !selection.rect) return null;

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in"
    >
      <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">
        🤖 AI에게 질문
      </div>
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id, selection.text)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### 프롬프트 생성
```typescript
// selectionPrompts.ts
export function generateSelectionPrompt(
  actionType: string,
  selectedText: string,
  context?: { problemTitle?: string }
): string {
  const prompts: Record<string, string> = {
    explain: `다음 내용에 대해 자세히 설명해주세요:

"${selectedText}"

${context?.problemTitle ? `(문제: ${context.problemTitle})` : ''}

초보자도 이해할 수 있도록 쉽게 설명해주세요.`,

    example: `다음 내용에 대한 구체적인 예시를 보여주세요:

"${selectedText}"

입력값과 예상 출력값을 포함한 예시를 들어주세요.`,

    test: `다음 요구사항을 테스트하는 pytest 코드를 작성해주세요:

"${selectedText}"

@pytest.mark.parametrize를 사용하여 여러 케이스를 포함해주세요.
각 테스트 케이스에 대한 설명 주석도 추가해주세요.`,
  };

  return prompts[actionType] || selectedText;
}
```

### ProblemPanel 통합
```tsx
// ProblemPanel.tsx 수정
function ProblemPanel({ problem }: ProblemPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selection = useTextSelection(containerRef);
  const { openAndSendMessage } = useAIChat();

  const handleSelectionAction = useCallback(
    (actionType: string, selectedText: string) => {
      const prompt = generateSelectionPrompt(actionType, selectedText, {
        problemTitle: problem.title,
      });
      openAndSendMessage(prompt);
      // 선택 해제
      window.getSelection()?.removeAllRanges();
    },
    [problem.title, openAndSendMessage]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* 기존 문제 설명 컨텐츠 */}
      <ProblemDescription description_md={problem.description_md} />

      {/* 플로팅 메뉴 */}
      <SelectionActionMenu
        selection={selection}
        onAction={handleSelectionAction}
        onDismiss={() => window.getSelection()?.removeAllRanges()}
      />
    </div>
  );
}
```

## 고려사항

### 성능
- selectionchange 이벤트 디바운싱
- 메뉴 위치 계산 최적화
- 불필요한 리렌더링 방지

### 사용자 경험
- 메뉴 표시 딜레이로 실수 클릭 방지
- 선택 텍스트가 너무 길면 축약 (... 처리)
- 터치 디바이스에서는 롱프레스로 메뉴 표시

### 접근성
- 키보드로 메뉴 탐색 가능
- aria 속성 추가
- 포커스 관리

### 충돌 방지
- 기존 텍스트 선택/복사 기능과 충돌 없이 동작
- 코드 블록의 복사 버튼과 독립적

## 테스트 케이스
- [ ] 텍스트 선택 시 메뉴 표시
- [ ] 10자 미만 선택 시 메뉴 미표시
- [ ] 메뉴 항목 클릭 시 AI 채팅 전송
- [ ] 외부 클릭/ESC로 메뉴 닫힘
- [ ] 스크롤 시 메뉴 위치 업데이트 또는 닫힘
- [ ] 코드 블록 선택 지원
- [ ] 모바일 롱프레스 동작
- [ ] 화면 경계 근처 메뉴 위치 조정

## 관련 마일스톤
- M5-2: AI로 보내기 버튼 (유사한 전송 로직)
- M5-3: AI 퀵 프롬프트 (프롬프트 템플릿 공유)

---
*생성일: 2024-12-24*
