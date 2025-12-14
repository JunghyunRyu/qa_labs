# QA-Arena 문제 풀이 페이지 UX 개선 스펙

## 📋 개요

### 현재 문제점
1. **수직 스크롤 문제**: 문제 설명과 코드 에디터가 수직 배치되어 코드 작성 시 문제를 참조하려면 스크롤 필요
2. **공간 비효율**: AI 챗봇이 우측에 항상 표시되어 코드 에디터 공간 압박
3. **코드 에디터 우선순위 낮음**: 핵심 기능인 코드 작성 영역이 좁음

### 개선 목표
- 문제를 보면서 동시에 코드 작성 가능
- 코드 에디터에 최대한 넓은 공간 할당
- AI 챗봇은 필요할 때만 사용 (온디맨드)

---

## 🏗️ 아키텍처

### 레이아웃 구조
```
┌─────────────────────────────────────────────────────────────┐
│  Header (고정, h-14)                                         │
├─────────────────────┬───────────────────────────────────────┤
│                     │                                       │
│   문제 패널          │←→│       코드 에디터 패널              │
│   (리사이즈 가능)    │   │       (flex-1)                    │
│   default: 35-40%   │   │                                   │
│   min: 20-25%       │   │                                   │
│   max: 55-60%       │   │                                   │
│                     │   │                                   │
│   [접기 버튼]        │   │                         [채점하기] │
│                     │   │                                   │
├─────────────────────┴───────────────────────────────────────┤
│                                                    [🤖 FAB] │ ← 플로팅 버튼 (AI)
└─────────────────────────────────────────────────────────────┘
```

### 컴포넌트 트리
```
ProblemSolverLayout
├── Header
├── ResizableSplitPanel
│   ├── ProblemPanel (left)
│   │   ├── CollapsedState (접힌 상태)
│   │   └── ExpandedState (펼친 상태)
│   │       ├── ProblemHeader
│   │       ├── ProblemMeta (난이도, 태그)
│   │       ├── FunctionSignature
│   │       ├── Description
│   │       └── Examples
│   └── CodeEditorPanel (right)
│       ├── EditorHeader (언어 선택 등)
│       ├── MonacoEditor / CodeMirror
│       └── ActionBar (채점 버튼)
└── FloatingAIChat
    ├── FAB (Floating Action Button)
    └── ChatDrawer
        ├── DrawerHeader
        ├── MessageList
        └── InputArea
```

---

## 🔧 핵심 컴포넌트 상세

### 1. ResizableSplitPanel

**목적**: 좌우 패널을 드래그로 리사이즈 가능하게 함

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| leftPanel | ReactNode | required | 왼쪽 패널 컨텐츠 |
| rightPanel | ReactNode | required | 오른쪽 패널 컨텐츠 |
| defaultLeftWidth | number | 35 | 기본 왼쪽 너비 (%) |
| minLeftWidth | number | 20 | 최소 너비 (%) |
| maxLeftWidth | number | 60 | 최대 너비 (%) |
| storageKey | string | 'panel-width' | localStorage 키 |

**동작**:
- 마우스 드래그로 경계선 이동
- 더블클릭 시 기본값으로 리셋
- 설정값 localStorage 자동 저장
- 리사이즈 중 텍스트 선택 방지 (user-select: none)

**라이브러리 대안**:
- `react-resizable-panels` (추천, 가볍고 접근성 좋음)
- `react-split-pane` (레거시지만 안정적)
- `allotment` (VSCode 스타일)

```bash
npm install react-resizable-panels
```

### 2. ProblemPanel

**상태**:
- `expanded`: 전체 표시 (기본)
- `collapsed`: 아이콘만 표시 (세로 바 형태)

**접기 시 동작**:
- 너비가 40-60px로 축소
- 세로 텍스트 "문제 설명" 표시
- 클릭 시 다시 펼침
- 코드 에디터가 나머지 공간 자동 확장

### 3. CodeEditorPanel

**에디터 추천**:
- Monaco Editor (VSCode 기반, 기능 풍부)
- CodeMirror 6 (가볍고 커스터마이즈 용이)

**필수 기능**:
- 문법 하이라이팅 (Python)
- 자동 들여쓰기
- 줄 번호 표시
- 키보드 단축키 (Ctrl+Enter: 실행)

```bash
npm install @monaco-editor/react
# 또는
npm install @codemirror/lang-python @uiw/react-codemirror
```

### 4. FloatingAIChat

**구성**:
- **FAB (Floating Action Button)**: 우측 하단 고정, 클릭 시 드로어 열기
- **Drawer**: 우측에서 슬라이드인, 너비 384px (w-96)

**상태 관리**:
- 열림/닫힘 상태
- 메시지 히스토리
- 입력 값

**애니메이션**:
```css
/* 드로어 트랜지션 */
transform: translateX(0);     /* 열림 */
transform: translateX(100%);  /* 닫힘 */
transition: transform 300ms ease-out;
```

**오버레이**: 드로어 열릴 때 배경 딤 처리 (클릭 시 닫힘)

---

## 📱 반응형 고려사항

### 브레이크포인트
| 화면 | 너비 | 레이아웃 |
|------|------|----------|
| Desktop | ≥1024px | 좌우 분할 (기본) |
| Tablet | 768-1023px | 좌우 분할 (비율 조정) |
| Mobile | <768px | 탭 전환 방식 |

### 모바일 대응
- 좌우 분할 대신 **탭 UI**로 전환
- 탭: [문제] [코드] [AI]
- 스와이프로 탭 전환

```jsx
// 예시
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? <TabLayout /> : <SplitLayout />;
```

---

## 💾 상태 관리

### 저장할 설정 (localStorage)
```javascript
{
  "qa-arena-settings": {
    "panelWidth": 40,           // 문제 패널 너비 %
    "isProblemCollapsed": false, // 문제 패널 접힘 여부
    "editorFontSize": 14,       // 에디터 폰트 크기
    "theme": "dark"             // 테마
  }
}
```

### 키보드 단축키
| 단축키 | 동작 |
|--------|------|
| Ctrl + Enter | 코드 채점 |
| Ctrl + B | 문제 패널 토글 |
| Ctrl + / | AI 챗봇 토글 |
| Escape | 드로어/모달 닫기 |

---

## 🎨 스타일 가이드

### 색상 팔레트 (다크 테마 기준)
```css
--bg-primary: #111827;    /* gray-900 */
--bg-secondary: #1f2937;  /* gray-800 */
--bg-tertiary: #374151;   /* gray-700 */
--text-primary: #f9fafb;  /* gray-50 */
--text-secondary: #9ca3af; /* gray-400 */
--accent-blue: #3b82f6;   /* blue-500 */
--accent-green: #22c55e;  /* green-500 */
--accent-purple: #8b5cf6; /* purple-500 */
```

### 리사이즈 핸들 스타일
```css
.resize-handle {
  width: 4px;
  background: var(--bg-tertiary);
  cursor: col-resize;
  transition: background 150ms;
}

.resize-handle:hover,
.resize-handle.active {
  background: var(--accent-blue);
}
```

---

## ✅ 구현 체크리스트

### Phase 1: 기본 레이아웃 (MVP)
- [ ] 좌우 스플릿 레이아웃 구현
- [ ] 드래그 리사이즈 기능
- [ ] 문제 패널 접기/펼치기
- [ ] 기본 코드 에디터 통합

### Phase 2: AI 챗봇 개선
- [ ] 플로팅 버튼 UI
- [ ] 슬라이드 드로어 구현
- [ ] 오버레이 및 닫기 동작

### Phase 3: 사용자 경험 향상
- [ ] 설정 localStorage 저장
- [ ] 키보드 단축키
- [ ] 반응형 (모바일 탭 UI)
- [ ] 애니메이션/트랜지션

### Phase 4: 고급 기능
- [ ] 문제 패널 내 검색
- [ ] 에디터 테마 선택
- [ ] 코드 자동 저장
- [ ] 전체화면 모드

---

## 📚 참고 라이브러리

| 용도 | 라이브러리 | 비고 |
|------|-----------|------|
| 스플릿 패널 | `react-resizable-panels` | 가볍고 현대적 |
| 코드 에디터 | `@monaco-editor/react` | VSCode 경험 |
| 코드 에디터 (경량) | `@uiw/react-codemirror` | 빠른 로딩 |
| 아이콘 | `lucide-react` | 일관된 디자인 |
| 애니메이션 | `framer-motion` | 부드러운 UX |
| 상태관리 | `zustand` | 간단하고 가벼움 |

---

## 🔗 참고 사이트 (벤치마킹)

1. **LeetCode** - 대표적인 좌우 분할 레이아웃
2. **HackerRank** - 문제/에디터 분리 구조
3. **CodeSandbox** - 멀티 패널 리사이징
4. **VSCode Web** - 에디터 UX 참고

---

*이 문서는 QA-Arena 문제 풀이 페이지 UX 개선을 위한 기술 스펙입니다.*
*최종 수정: 2024*
