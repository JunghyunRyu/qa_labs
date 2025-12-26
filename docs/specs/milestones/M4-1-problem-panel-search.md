# M4-1: 문제 패널 내 검색 기능

## 개요
- **목표**: 문제 설명 내에서 키워드 검색 및 하이라이트
- **우선순위**: Medium
- **예상 작업량**: 2-3일

## 기능 요구사항

### 핵심 기능
1. **검색 입력창**
   - 문제 패널 상단에 검색 아이콘 버튼
   - 클릭 시 검색 입력창 표시/숨김 토글
   - `Ctrl+F` 단축키로 활성화

2. **실시간 검색**
   - 입력 시 실시간으로 매칭 텍스트 하이라이트
   - 매칭 개수 표시 (예: "3/10")
   - 대소문자 구분 옵션

3. **네비게이션**
   - 이전/다음 매칭으로 이동 버튼
   - `Enter`: 다음 매칭, `Shift+Enter`: 이전 매칭
   - 현재 매칭 위치로 자동 스크롤

### UI 디자인

```
┌─────────────────────────────────────┐
│ [🔍] 문제 제목                    [×] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 검색어 입력...     3/10 [↑][↓] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... 문제 설명 (하이라이트 적용) ... │
│                                     │
└─────────────────────────────────────┘
```

### 하이라이트 스타일
```css
.search-highlight {
  background-color: #fef08a; /* yellow-200 */
  border-radius: 2px;
  padding: 0 2px;
}

.search-highlight-current {
  background-color: #fb923c; /* orange-400 */
  outline: 2px solid #f97316;
}
```

## 기술 구현

### 컴포넌트 구조
```
ProblemPanel
├── ProblemSearchBar (신규)
│   ├── SearchInput
│   ├── MatchCounter
│   └── NavigationButtons
└── ProblemContent
    └── HighlightedText (신규)
```

### 상태 관리
```typescript
interface SearchState {
  isSearchOpen: boolean;
  searchQuery: string;
  matches: SearchMatch[];
  currentMatchIndex: number;
  caseSensitive: boolean;
}

interface SearchMatch {
  startIndex: number;
  endIndex: number;
  elementRef: HTMLElement;
}
```

### 구현 방식
1. **텍스트 파싱**: ReactMarkdown 렌더링 후 텍스트 노드 탐색
2. **하이라이트**: `mark` 태그로 감싸기 또는 CSS `::highlight` pseudo-element
3. **스크롤**: `scrollIntoView({ behavior: 'smooth', block: 'center' })`

## 테스트 케이스
- [ ] 검색창 열기/닫기 (클릭, 단축키)
- [ ] 실시간 검색 및 하이라이트
- [ ] 매칭 개수 정확성
- [ ] 이전/다음 네비게이션
- [ ] 대소문자 구분 토글
- [ ] 검색어 없을 때 하이라이트 제거
- [ ] 긴 문서에서 성능

## 참고
- VS Code 검색 UX 참고
- `Ctrl+F` 브라우저 기본 동작과 충돌 방지 필요

---
*생성일: 2025-12-24*
