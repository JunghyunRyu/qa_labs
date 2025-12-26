# M4-2: 코드 자동 저장 기능

## 개요
- **목표**: 사용자가 작성 중인 코드를 자동으로 저장하여 페이지 새로고침/이탈 시에도 복구 가능
- **우선순위**: High
- **예상 작업량**: 2-3일

## 기능 요구사항

### 핵심 기능
1. **자동 저장**
   - 코드 변경 후 2초 디바운스로 localStorage에 저장
   - 문제별로 별도 저장 (key: `qa-arena-code-{problemId}`)
   - 저장 시 타임스탬프 기록

2. **코드 복구**
   - 페이지 로드 시 저장된 코드 자동 복구
   - 복구 시 사용자에게 알림 표시
   - "새로 시작" 버튼으로 초기 템플릿 복원 가능

3. **수동 저장/복구**
   - `Ctrl+S`: 수동 저장 (브라우저 기본 동작 방지)
   - 저장 상태 인디케이터 (저장됨/저장 중/변경됨)

4. **제출 후 처리**
   - 채점 성공 시 저장된 코드 삭제 여부 선택
   - 제출 이력과 연동 (선택사항)

### UI 디자인

```
┌─────────────────────────────────────────────┐
│ 테스트 코드 작성                [●저장됨] │
├─────────────────────────────────────────────┤
│                                             │
│  [코드 에디터]                              │
│                                             │
├─────────────────────────────────────────────┤
│ 마지막 저장: 2분 전    [새로 시작] [채점]  │
└─────────────────────────────────────────────┘
```

### 저장 상태 인디케이터
| 상태 | 아이콘 | 색상 |
|------|--------|------|
| 저장됨 | ● (filled circle) | green-500 |
| 저장 중 | ○ (spinner) | blue-500 |
| 변경됨 (미저장) | ◐ (half circle) | yellow-500 |

## 기술 구현

### 데이터 구조
```typescript
interface SavedCode {
  problemId: number;
  code: string;
  savedAt: string; // ISO timestamp
  templateVersion?: string; // 템플릿 버전 추적
}

// localStorage key: "qa-arena-code-{problemId}"
```

### 저장 로직
```typescript
// useCodeAutosave.ts
function useCodeAutosave(problemId: number, code: string) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // 디바운스 저장
  useEffect(() => {
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      setSaveStatus('saving');
      localStorage.setItem(`qa-arena-code-${problemId}`, JSON.stringify({
        problemId,
        code,
        savedAt: new Date().toISOString(),
      }));
      setSaveStatus('saved');
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, problemId]);

  return { saveStatus };
}
```

### 복구 로직
```typescript
// 페이지 로드 시
function loadSavedCode(problemId: number): SavedCode | null {
  const saved = localStorage.getItem(`qa-arena-code-${problemId}`);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}
```

### 복구 알림 UI
```tsx
{savedCode && (
  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
    <p className="text-sm text-blue-800">
      이전에 작성하던 코드가 있습니다. (저장: {formatTimeAgo(savedCode.savedAt)})
    </p>
    <div className="flex gap-2 mt-2">
      <button onClick={restoreCode} className="btn-primary-sm">복구</button>
      <button onClick={discardSaved} className="btn-secondary-sm">새로 시작</button>
    </div>
  </div>
)}
```

## 고려사항

### 저장 용량 관리
- localStorage 용량 제한 (~5MB)
- 오래된 저장 데이터 자동 정리 (30일 이상)
- 저장 실패 시 사용자 알림

### 충돌 처리
- 여러 탭에서 동시 편집 시 충돌 가능
- `storage` 이벤트로 다른 탭 변경 감지
- 충돌 시 최신 버전 선택 또는 병합 UI

### 보안
- 민감한 코드는 저장하지 않음 (API 키 등 패턴 감지)
- 로그인 사용자의 경우 서버 저장 옵션 (Phase 6)

## 테스트 케이스
- [ ] 코드 입력 후 자동 저장 확인
- [ ] 페이지 새로고침 후 복구 확인
- [ ] "새로 시작" 버튼 동작
- [ ] 저장 상태 인디케이터 정확성
- [ ] `Ctrl+S` 수동 저장
- [ ] 채점 성공 후 저장 데이터 처리
- [ ] localStorage 용량 초과 시 처리

---
*생성일: 2024-12-24*
