# Milestone 4: AI 코치 프론트엔드

**우선순위**: P1
**의존성**: Milestone 3 (AI 코치 백엔드)
**예상 작업량**: 대

---

## 목표

AI 코치 패널 UI 및 대화 기능을 구현합니다. 사용자가 문제 풀이 중 AI와 실시간으로 대화할 수 있도록 합니다.

---

## 배경

기획서 v0.2의 AI 코치 UI 요구사항:

- 문제 풀이 화면 우측 패널
- 모드 토글: OFF / COACH
- 입력창 + 대화 리스트 + "저장 정책" 안내
- 회원은 대화 저장/열람 가능

현재 코드베이스에는 AI 코치 UI가 **전혀 없습니다**.

---

## Todo List

### 1. [FE] AI 패널 컴포넌트

- [ ] **파일 생성**: `frontend/components/AICoachPanel.tsx`
- [ ] **구조**:
  ```tsx
  <AICoachPanel problemId={id} codeContext={code}>
    <AIModeToggle mode={mode} onToggle={setMode} />
    <AIConversationList messages={messages} />
    <AIMessageInput onSend={handleSend} disabled={mode === 'OFF'} />
    <AISavePolicy isLoggedIn={isLoggedIn} />
  </AICoachPanel>
  ```
- [ ] **스타일**:
  - 고정 높이 (예: calc(100vh - header - padding))
  - 내부 스크롤
  - 우측 사이드바 형태

### 2. [FE] AI 모드 토글 (OFF/COACH)

- [ ] **파일 생성**: `frontend/components/AIModeToggle.tsx`
- [ ] **Props**:
  ```typescript
  interface AIModeToggleProps {
    mode: 'OFF' | 'COACH';
    onToggle: (mode: 'OFF' | 'COACH') => void;
    disabled?: boolean;
  }
  ```
- [ ] **UI**:
  - 세그먼트 버튼 또는 스위치
  - OFF: 비활성 상태 (회색)
  - COACH: 활성 상태 (브랜드 컬러)
- [ ] **localStorage 저장**:
  ```typescript
  useEffect(() => {
    localStorage.setItem('ai_coach_mode', mode);
  }, [mode]);
  ```

### 3. [FE] AI 대화 입력 컴포넌트

- [ ] **파일 생성**: `frontend/components/AIMessageInput.tsx`
- [ ] **Props**:
  ```typescript
  interface AIMessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    loading?: boolean;
  }
  ```
- [ ] **기능**:
  - 텍스트 입력 (textarea)
  - Enter로 전송, Shift+Enter로 줄바꿈
  - 전송 버튼 (아이콘)
  - 전송 중 로딩 상태
  - 빈 메시지 전송 방지
- [ ] **UI**:
  - 하단 고정
  - 입력창 + 전송 버튼

### 4. [FE] AI 대화 메시지 컴포넌트

- [ ] **파일 생성**: `frontend/components/AIMessage.tsx`
- [ ] **Props**:
  ```typescript
  interface AIMessageProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }
  ```
- [ ] **UI**:
  - 사용자 메시지: 우측 정렬, 브랜드 컬러 배경
  - AI 응답: 좌측 정렬, 회색 배경
  - 마크다운 렌더링 (react-markdown)
  - 코드 블록 하이라이팅 (syntax highlighter)
  - 타임스탬프 표시 (선택)

### 5. [FE] AI 대화 리스트 컴포넌트

- [ ] **파일 생성**: `frontend/components/AIConversationList.tsx`
- [ ] **Props**:
  ```typescript
  interface AIConversationListProps {
    messages: AIMessage[];
    loading?: boolean;
  }
  ```
- [ ] **기능**:
  - 스크롤 가능한 대화 목록
  - 새 메시지 시 자동 스크롤 (scrollIntoView)
  - 로딩 인디케이터 (AI 응답 대기 중)
  - 빈 상태 UI ("AI 코치에게 질문해 보세요!")

### 6. [FE] AI API 클라이언트

- [ ] **파일 생성**: `frontend/lib/api/ai.ts`
- [ ] **함수 구현**:
  ```typescript
  export async function sendMessage(
    problemId: number,
    message: string,
    codeContext?: string,
    submissionId?: string
  ): Promise<AIChatResponse> {
    return api.post('/api/v1/ai/chat', {
      problem_id: problemId,
      message,
      mode: 'COACH',
      code_context: codeContext,
      submission_id: submissionId,
    });
  }

  export async function getConversations(
    problemId?: number
  ): Promise<AIConversationListResponse> {
    const params = problemId ? `?problem_id=${problemId}` : '';
    return api.get(`/api/v1/ai/conversations${params}`);
  }

  export async function getConversation(
    conversationId: string
  ): Promise<AIConversationResponse> {
    return api.get(`/api/v1/ai/conversations/${conversationId}`);
  }
  ```

- [ ] **타입 정의**: `frontend/types/ai.ts`
  ```typescript
  export interface AIChatResponse {
    reply: string;
    conversation_id: string;
    message_id: string;
    token_estimate?: number;
  }

  export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }

  export interface AIConversation {
    id: string;
    problem_id: number;
    mode: string;
    created_at: string;
    updated_at: string;
    messages: AIMessage[];
  }
  ```

### 7. [FE] 저장 정책 안내

- [ ] **파일 수정**: `frontend/components/AICoachPanel.tsx` 또는 별도 컴포넌트
- [ ] **UI**:
  - 비회원: "로그인하면 대화 기록이 저장됩니다" + 로그인 링크
  - 회원: "대화 기록이 자동 저장됩니다"
- [ ] **위치**: 패널 하단 또는 입력창 위

### 8. [FE] 대화 히스토리 UI (회원 전용)

- [ ] **기능**:
  - 이전 대화 목록 드롭다운 또는 탭
  - 대화 선택 시 해당 대화 내용 로드
  - 새 대화 시작 버튼
- [ ] **조건**: 로그인 사용자만 표시
- [ ] **위치**: 패널 상단

### 9. [FE] 모바일 AI 패널

- [ ] **파일 생성**: `frontend/components/AICoachMobileDrawer.tsx`
- [ ] **트리거**:
  - 하단 FAB 버튼 (AI 아이콘)
  - 또는 Sticky 패널의 AI 토글 클릭 시
- [ ] **UI**:
  - 전체 화면 모달 또는 하단 시트 (80% 높이)
  - 닫기 버튼
  - 내용은 AICoachPanel과 동일
- [ ] **반응형**: 모바일(< lg)에서만 표시

### 10. [FE] 문제 페이지 통합

- [ ] **파일 수정**: `frontend/app/problems/[id]/page.tsx`
- [ ] **레이아웃 변경**:
  ```tsx
  <div className="flex">
    <main className="flex-1">
      {/* 문제 콘텐츠 */}
    </main>
    <aside className="hidden lg:block w-80">
      <AICoachPanel problemId={id} codeContext={code} />
    </aside>
  </div>

  {/* 모바일 FAB + Drawer */}
  <AICoachMobileFAB onClick={openDrawer} />
  <AICoachMobileDrawer isOpen={isOpen} onClose={closeDrawer} ... />
  ```
- [ ] **상태 관리**:
  - AI 모드 상태
  - 대화 메시지 상태
  - 로딩 상태

### 11. [FE] 레이트리밋 에러 처리

- [ ] **에러 핸들링**:
  ```typescript
  try {
    const response = await sendMessage(...);
  } catch (error) {
    if (error.status === 429) {
      // 레이트리밋 에러
      setError('요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
      // Retry-After 헤더가 있으면 표시
    }
  }
  ```
- [ ] **UI**: 토스트 또는 인라인 에러 메시지

---

## 관련 파일

| 파일 | 작업 유형 |
|------|-----------|
| `frontend/components/AICoachPanel.tsx` | 신규 생성 |
| `frontend/components/AIModeToggle.tsx` | 신규 생성 |
| `frontend/components/AIMessageInput.tsx` | 신규 생성 |
| `frontend/components/AIMessage.tsx` | 신규 생성 |
| `frontend/components/AIConversationList.tsx` | 신규 생성 |
| `frontend/components/AICoachMobileDrawer.tsx` | 신규 생성 |
| `frontend/lib/api/ai.ts` | 신규 생성 |
| `frontend/types/ai.ts` | 신규 생성 |
| `frontend/app/problems/[id]/page.tsx` | 수정 |

---

## 완료 조건

- [ ] AI 패널 ON/OFF 토글 동작
- [ ] 대화 전송 및 AI 응답 표시
- [ ] 마크다운/코드 블록 렌더링
- [ ] 회원 대화 히스토리 저장/조회
- [ ] 모바일에서 AI 패널 접근 가능 (FAB + Drawer)
- [ ] 레이트리밋 에러 처리

---

## UI/UX 참고

### 데스크탑 레이아웃

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header                                                              │
├───────────────────────────────────────┬─────────────────────────────┤
│                                       │ AI Coach                    │
│ 문제 설명                             │ [OFF] [COACH]               │
│                                       ├─────────────────────────────┤
│ 함수 시그니처                         │ ┌─────────────────────────┐ │
│                                       │ │ 안녕하세요! 질문해 주세요 │ │
│ 코드 에디터                           │ └─────────────────────────┘ │
│                                       │                             │
│ 결과 패널                             │ ┌─────────────────────────┐ │
│                                       │ │ 사용자: 경계값이 뭐죠?   │ │
│                                       │ └─────────────────────────┘ │
│                                       │ ┌─────────────────────────┐ │
│                                       │ │ AI: 경계값이란...       │ │
│                                       │ └─────────────────────────┘ │
│                                       ├─────────────────────────────┤
│                                       │ [메시지 입력...] [전송]    │
│                                       │ 대화 기록이 저장됩니다     │
└───────────────────────────────────────┴─────────────────────────────┘
```

### 모바일 레이아웃

```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│                                 │
│ 문제 설명                       │
│                                 │
│ 코드 에디터                     │
│                                 │
│ 결과 패널                       │
│                                 │
│                      ┌────┐     │
│                      │ AI │     │  ← FAB 버튼
│                      └────┘     │
└─────────────────────────────────┘

         ↓ FAB 클릭 시

┌─────────────────────────────────┐
│ AI Coach              [X]      │
├─────────────────────────────────┤
│ [OFF] [COACH]                   │
├─────────────────────────────────┤
│                                 │
│ 대화 내용...                    │
│                                 │
├─────────────────────────────────┤
│ [메시지 입력...]       [전송]   │
│ 로그인하면 저장됩니다           │
└─────────────────────────────────┘
```

### AI 메시지 스타일

```
┌──────────────────────────────────────────┐
│                    ┌──────────────────┐  │
│                    │ 경계값이 뭐죠?   │  │  ← 사용자 (우측, 파랑)
│                    └──────────────────┘  │
│ ┌────────────────────────────────────┐   │
│ │ 🤖 경계값(boundary value)이란      │   │  ← AI (좌측, 회색)
│ │ 입력 범위의 경계에 있는 값을       │   │
│ │ 말합니다.                          │   │
│ │                                    │   │
│ │ 예를 들어:                         │   │
│ │ - 배열이 비어있는 경우             │   │
│ │ - 요소가 하나만 있는 경우          │   │
│ │                                    │   │
│ │ 이런 케이스를 테스트해 보셨나요?   │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## 테스트 케이스

1. **모드 토글 테스트**
   - OFF → COACH 전환
   - COACH → OFF 전환
   - localStorage에 상태 저장 확인

2. **메시지 전송 테스트**
   - COACH 모드에서 메시지 입력 → 전송 → AI 응답 수신
   - OFF 모드에서 입력창 비활성화 확인
   - 빈 메시지 전송 방지

3. **마크다운 렌더링 테스트**
   - 코드 블록 하이라이팅
   - 리스트, 볼드 등 렌더링

4. **대화 히스토리 테스트 (회원)**
   - 이전 대화 목록 표시
   - 대화 선택 시 내용 로드
   - 새 대화 시작

5. **모바일 테스트**
   - FAB 버튼 표시
   - FAB 클릭 → Drawer 열림
   - Drawer 내에서 대화 가능

6. **레이트리밋 테스트**
   - 빠른 연속 요청 시 429 에러 메시지 표시

---

## 의존성

- `react-markdown`: 마크다운 렌더링
- `react-syntax-highlighter`: 코드 블록 하이라이팅
- (기존 사용 중인 라이브러리 확인 필요)

---

## 주의사항

- AI 응답 대기 중 UX 고려 (로딩 인디케이터, 타이핑 효과 등)
- 대화가 길어지면 스크롤 성능 고려
- 모바일에서 키보드가 올라왔을 때 입력창 가림 방지
- 다크모드 지원
