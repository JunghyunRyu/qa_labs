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

## 🎯 역할 분리 원칙

### 핵심 철학
- **좌측(문제 패널)**: "정답에 필요한 공식 스펙/계약 + 빠른 네비게이션"만 제공하는 **권위 있는 단일 소스(SSOT)**
- **우측(AI 도우미)**: "이해/설계/디버깅을 돕는 대화형 보조 도구" (개인화/상황 대응)

> 좌측은 **정리된 문서**, 우측은 **상호작용형 코치**가 되어야 중복이 줄고 UX가 선명해집니다.

### 좌측 문제 패널에 포함할 내용 (AI가 있어도 '여기엔 반드시')

#### 1. Contract (반환 객체 인터페이스) 고정 노출
- `make_lru_cache(capacity)`가 반환하는 객체의 메서드/동작 규칙
- 예: `get`/`put`, miss 처리, get이 access order 갱신 여부, 동일 키 put 시 갱신 규칙 등
- ⚠️ 이건 **힌트가 아니라 스펙**이므로 AI로 보내면 오히려 혼선 발생

#### 2. 핵심 테스트 포인트 + "포인트별 AI 연결 버튼"
- 현재처럼 핵심 포인트 표시
- 각 포인트 옆에 **"AI에게 이 포인트로 테스트 아이디어 요청"** 버튼 (원클릭 프롬프트 전송)

#### 3. 2~3개 최소 예시 (짧은 시퀀스)
- 스펙 해석을 고정시키는 정도까지만
- ❌ 정답 테스트 수준으로 길게는 금지

#### 4. 평가 기준 요약 (Mutation Score / 로컬 vs 제출 차이)
- "왜 이 문제에서 이렇게 채점되는지" 한 문단

#### 5. 용어는 '사전 페이지'보다 '툴팁'
- LRU/MRU, eviction, hit/miss 정도를 짧게
- 긴 설명은 우측 AI가 담당

### 우측 AI 도우미에 포함할 내용 (좌측과 겹치지 않게)

#### 1. "퀵 프롬프트" 버튼 4개 상단 고정
```
┌─────────────────────────────────────┐
│  [스펙 요약]  [테스트 제안]          │
│  [놓친 이유]  [로그 분석]            │
└─────────────────────────────────────┘
```

| 버튼 | 프롬프트 |
|------|----------|
| 스펙 요약 | "이 문제의 스펙을 내 말로 요약해줘" |
| 테스트 제안 | "핵심 테스트 포인트별로 테스트 시나리오 2개씩만 제안해줘" |
| 놓친 이유 | "내 테스트가 뮤턴트를 놓치는 이유를 추정해줘(현재 코드 기준)" |
| 로그 분석 | "실패 로그를 붙여넣으면 원인 가설 3개로 분류해줘" |

#### 2. 선택-전송 (Selection to AI)
- 좌측/우측 텍스트(테스트 포인트, 예시, 에러 로그)를 **드래그**하면
- **"AI에게 묻기"** 미니 액션이 뜨고
- 선택한 텍스트가 AI 입력창에 자동 삽입
- 이거 하나만 넣어도 "좌측 보강 + AI 존재"가 충돌 없이 시너지

#### 3. 힌트는 단계형으로 (치팅 방지 + 만족도)
| 단계 | 내용 | 제한 |
|------|------|------|
| 기본 | 체크리스트/사고 프레임 | 무제한 |
| 중간 | 시퀀스 설계 아이디어 | 3회/문제 |
| 강함 | 거의 정답에 가까운 가이드 | 1회/문제 (점수 차감) |

### 연결 UX (좌측 ↔ 우측)에서 가장 중요한 것

> 좌측의 각 섹션(Contract/포인트/예시/용어)마다 **"AI로 이어지는 명확한 트리거"**를 제공

- 사용자 입장: "읽다가 막히면 바로 AI로"가 자연스럽게
- 반대로 AI 패널이 있어도, 좌측에 계약이 없으면 사용자는 계속 흔들림

### 구현 우선순위 (빠르게 가치 확인)

| 순위 | 기능 | 예상 효과 |
|------|------|----------|
| 1 | 좌측 Contract 고정 + 예시 2개 | 스펙 명확화 |
| 2 | 테스트 포인트 옆 "AI로 보내기" 버튼 | 좌우 연결 |
| 3 | AI 퀵 프롬프트 4개 | 진입장벽 낮춤 |
| 4 | 선택-전송 (드래그 → AI 질문) | 고급 UX |

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

### Phase 1: 기본 레이아웃 (MVP) ✅ 완료
- [x] 좌우 스플릿 레이아웃 구현 (`ResizableSplitPanel.tsx`)
- [x] 드래그 리사이즈 기능 (`react-resizable-panels`)
- [x] 문제 패널 접기/펼치기 (`ProblemPanel.tsx`)
- [x] 기본 코드 에디터 통합 (`CodeEditorPanel.tsx`, CodeMirror)

### Phase 2: AI 챗봇 개선 ✅ 완료
- [x] 플로팅 버튼 UI (`FloatingAIChat.tsx`)
- [x] 슬라이드 드로어 구현 (`framer-motion`)
- [x] 오버레이 및 닫기 동작 (ESC 키 지원)

### Phase 3: 사용자 경험 향상 ✅ 완료
- [x] 설정 localStorage 저장 (`layoutStore.ts`, zustand persist)
- [x] 키보드 단축키 (`useKeyboardShortcuts.ts`)
  - `Ctrl+B`: 문제 패널 토글
  - `Ctrl+/`: AI 챗봇 토글
  - `Ctrl+Enter`: 코드 채점
  - `Alt+P`: 문제 피킹 오버레이
  - `Alt+F`: 포커스 모드
  - `ESC`: 드로어/모달 닫기
- [x] 반응형 모바일 탭 UI (`MobileTabLayout.tsx`)
- [x] 애니메이션/트랜지션 (`framer-motion`)

### Phase 4: 고급 기능 (부분 구현)
- [ ] 문제 패널 내 검색
- [x] 에디터 테마 선택 (다크모드 지원)
- [ ] 코드 자동 저장
- [x] 전체화면 모드 (포커스 모드로 대체)

### Phase 5: 역할 분리 및 AI 연동 개선 🆕
- [ ] 좌측 Contract(반환 객체 인터페이스) 고정 노출
- [ ] 테스트 포인트 옆 "AI로 보내기" 버튼
- [ ] AI 퀵 프롬프트 4개 (스펙 요약/테스트 제안/놓친 이유/로그 분석)
- [ ] 선택-전송 (드래그 → AI 질문)
- [ ] 단계형 힌트 시스템 (기본/중간/강함)

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
*최종 수정: 2024-12-24*
