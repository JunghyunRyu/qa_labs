# M2: 에디터 UX 개선

> **프로젝트**: QA Arena UX 대폭 개선
> **크기**: 중
> **상태**: 대기

---

## 목표

에디터 사용 경험을 개선하여 함수 시그니처를 항상 참조 가능하게 하고, 자동 저장 상태를 명확히 표시하며, 코드 초기화 기능을 제공합니다.

---

## 범위

### 포함
- 함수 시그니처 Sticky Header (Copy 버튼 포함)
- 자동 저장 상태 인디케이터 (저장 중/저장됨/에러)
- Reset 버튼 (확인 모달 포함)
- 에디터 헤더 영역 레이아웃 통합

### 제외
- Monaco Editor 설정 변경
- IntelliSense 확장
- Undo/Redo 히스토리 관리

---

## 태스크 목록

| # | 태스크 | 파일 | 상태 |
|---|-------|------|------|
| 1 | FunctionSignatureHeader 에디터 통합 | `components/layout/CodeEditorPanel.tsx` | [x] |
| 2 | SaveStatusIndicator 컴포넌트 | `components/layout/CodeEditorPanel.tsx` | [x] (기존) |
| 3 | ResetCodeButton 컴포넌트 | `components/layout/CodeEditorPanel.tsx` | [x] (기존) |
| 4 | 에디터 영역 헤더 레이아웃 통합 | `app/problems/[id]/page.tsx` | [x] (기존) |
| 5 | useCodeDraft 훅 상태 연동 | `hooks/useCodeDraft.ts` | [x] (기존) |

---

## 관련 파일

### 수정 대상
- `frontend/app/problems/[id]/page.tsx` - 에디터 영역 레이아웃
- `frontend/hooks/useCodeDraft.ts` - 저장 상태 노출 (이미 구현됨)

### 참조 파일
- `frontend/components/CodeEditor.tsx` - Monaco Editor 래퍼
- `frontend/types/problem.ts` - 문제 타입 (function_signature)

---

## 기술 노트

### FunctionSignatureHeader 컴포넌트

```tsx
interface FunctionSignatureHeaderProps {
  signature: string;  // "def is_valid_age(age: int) -> bool"
}

// UI 구조
// ┌─────────────────────────────────────────────────────┐
// │ 📋 def is_valid_age(age: int) -> bool    [Copy]    │
// └─────────────────────────────────────────────────────┘

export function FunctionSignatureHeader({ signature }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky top-0 z-10 bg-[#161b22] border-b border-[#30363d] px-3 py-2">
      <div className="flex items-center justify-between">
        <code className="text-sm font-mono text-[#e6edf3]">
          {signature}
        </code>
        <button onClick={handleCopy} className="...">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
```

### SaveStatusIndicator 컴포넌트

```tsx
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date;
}

// UI 표시
// idle: 아무것도 표시 안 함
// saving: "저장 중..." (회색 스피너)
// saved: "저장됨 ✓" (초록색, 3초 후 페이드)
// error: "저장 실패" (빨간색)

// 위치: 에디터 우측 상단 (실행 버튼 왼쪽)
```

### ResetCodeButton 컴포넌트

```tsx
interface ResetCodeButtonProps {
  onReset: () => void;
  disabled?: boolean;
}

// 확인 모달 내용
// "초기 템플릿으로 되돌리시겠습니까?"
// "작성한 코드가 모두 삭제됩니다."
// [취소] [초기화]
```

### 에디터 헤더 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ 📋 def is_valid_age(age: int) -> bool    [Copy]        │
├─────────────────────────────────────────────────────────┤
│                                    저장됨 ✓  [Reset]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Monaco Editor                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 의존성

### 선행 마일스톤
- M1: 결과 패널 개선 (선택적)

### 후속 마일스톤
- M3: AI 코치 컨텍스트 강화

---

## 완료 조건

- [ ] 함수 시그니처가 에디터 상단에 Sticky 표시
- [ ] Copy 버튼으로 시그니처 복사 가능
- [ ] 저장 상태 인디케이터 표시 (저장 중/저장됨)
- [ ] Reset 버튼 동작 (확인 모달 포함)
- [ ] 기존 테스트 회귀 없음

---

## 테스트 체크리스트

### 단위 테스트
- [ ] Copy 버튼 클릭 시 클립보드 복사
- [ ] 저장 상태 변화에 따른 UI 변경
- [ ] Reset 확인 모달 동작

### 수동 검증
- [ ] 스크롤해도 시그니처 헤더 고정
- [ ] 자동 저장 발동 시 인디케이터 표시
- [ ] Reset 후 초기 템플릿 복원

---

## 진행 기록

| 시간 | 작업 | 결과 |
|------|------|------|
| - | 마일스톤 시작 | - |

---

## 노트

- useCodeDraft 훅에 status, lastSavedAt 이미 구현됨
- Sticky header는 z-index 관리 주의 (Monaco Editor와 충돌 방지)
- Reset 버튼은 clearDraft 함수와 연동
