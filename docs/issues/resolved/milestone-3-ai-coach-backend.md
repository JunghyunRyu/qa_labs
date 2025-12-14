# Milestone 3: AI 코치 백엔드

**우선순위**: P0-P1
**의존성**: Milestone 1 (anonymous_id 지원)
**예상 작업량**: 대

---

## 목표

대화형 AI 코치 기능의 백엔드를 구현합니다. 사용자가 문제 풀이 중 AI와 대화하며 힌트를 얻을 수 있도록 합니다.

---

## 배경

기획서 v0.2의 AI 코치 요구사항:

- `COACH` 모드에서 `/ai/chat` 호출
- AI는 "정답/완성본 제공"이 아니라 **QA 관점**(누락 케이스/경계값/반례/검증 전략) 중심으로 답변
- 가드레일: 정답 코드 제공 금지
- 대화 저장 (회원)

현재 코드베이스에는 AI Chat API, ai_conversations/ai_messages 테이블이 **전혀 없습니다**.

---

## Todo List

### 1. [DB] ai_conversations 테이블 생성

- [ ] **마이그레이션 파일 생성**: `backend/alembic/versions/xxx_create_ai_tables.py`
- [ ] **테이블 정의**:
  ```sql
  CREATE TABLE ai_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable
      anonymous_id VARCHAR(36),  -- nullable
      problem_id INTEGER NOT NULL REFERENCES problems(id),
      mode VARCHAR(10) NOT NULL DEFAULT 'COACH',  -- 'OFF', 'COACH'
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

      -- 게스트 또는 회원 중 하나는 있어야 함
      CONSTRAINT chk_ai_conv_owner CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
  );

  CREATE INDEX idx_ai_conv_user_id ON ai_conversations(user_id);
  CREATE INDEX idx_ai_conv_anonymous_id ON ai_conversations(anonymous_id);
  CREATE INDEX idx_ai_conv_problem_id ON ai_conversations(problem_id);
  ```

### 2. [DB] ai_messages 테이블 생성

- [ ] **테이블 정의**:
  ```sql
  CREATE TABLE ai_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL,  -- 'user', 'assistant'
      content TEXT NOT NULL,
      token_estimate INTEGER,  -- 토큰 사용량 추정
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

      CONSTRAINT chk_ai_msg_role CHECK (role IN ('user', 'assistant'))
  );

  CREATE INDEX idx_ai_msg_conversation ON ai_messages(conversation_id);
  ```

### 3. [BE] AI 모델 정의

- [ ] **파일 생성**: `backend/app/models/ai_conversation.py`
  ```python
  class AIConversation(Base):
      __tablename__ = "ai_conversations"

      id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
      user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
      anonymous_id = Column(String(36), nullable=True)
      problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
      mode = Column(String(10), nullable=False, default="COACH")
      created_at = Column(DateTime(timezone=True), server_default=func.now())
      updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

      # Relationships
      messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")
      problem = relationship("Problem")
      user = relationship("User")
  ```

- [ ] **파일 생성**: `backend/app/models/ai_message.py`
  ```python
  class AIMessage(Base):
      __tablename__ = "ai_messages"

      id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
      conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id"), nullable=False)
      role = Column(String(10), nullable=False)  # 'user', 'assistant'
      content = Column(Text, nullable=False)
      token_estimate = Column(Integer, nullable=True)
      created_at = Column(DateTime(timezone=True), server_default=func.now())

      # Relationships
      conversation = relationship("AIConversation", back_populates="messages")
  ```

- [ ] **__init__.py 업데이트**: `backend/app/models/__init__.py`

### 4. [BE] AI 스키마 정의

- [ ] **파일 생성**: `backend/app/schemas/ai.py`
  ```python
  class AIChatMode(str, Enum):
      OFF = "OFF"
      COACH = "COACH"

  class AIChatRequest(BaseModel):
      problem_id: int
      submission_id: Optional[UUID] = None
      mode: AIChatMode = AIChatMode.COACH
      message: str
      code_context: Optional[str] = None  # 현재 작성 중인 코드

  class AIChatResponse(BaseModel):
      reply: str
      conversation_id: UUID
      message_id: UUID
      token_estimate: Optional[int] = None

  class AIMessageResponse(BaseModel):
      id: UUID
      role: str
      content: str
      created_at: datetime

  class AIConversationResponse(BaseModel):
      id: UUID
      problem_id: int
      mode: str
      created_at: datetime
      updated_at: datetime
      messages: List[AIMessageResponse] = []

  class AIConversationListResponse(BaseModel):
      conversations: List[AIConversationResponse]
      total: int
  ```

### 5. [BE] AI Chat API 구현

- [ ] **파일 생성**: `backend/app/api/ai.py`
- [ ] **엔드포인트 구현**:

  ```python
  router = APIRouter(prefix="/ai", tags=["AI Coach"])

  @router.post("/chat", response_model=AIChatResponse)
  @limiter.limit(...)  # 동적 레이트리밋
  async def chat(
      request: Request,
      chat_request: AIChatRequest,
      db: Session = Depends(get_db),
      current_user: Optional[User] = Depends(get_current_user_optional),
  ):
      """AI 코치와 대화"""
      # 1. 모드 확인
      if chat_request.mode == AIChatMode.OFF:
          raise HTTPException(400, "AI mode is OFF")

      # 2. 사용자/게스트 식별
      anonymous_id = request.cookies.get("qa_anonymous_id") if not current_user else None

      # 3. 대화 생성 또는 조회
      # 4. AI 응답 생성
      # 5. 메시지 저장
      # 6. 응답 반환

  @router.get("/conversations", response_model=AIConversationListResponse)
  async def list_conversations(
      problem_id: Optional[int] = None,
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user),  # 회원 전용
  ):
      """대화 목록 조회"""

  @router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
  async def get_conversation(
      conversation_id: UUID,
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user),  # 회원 전용
  ):
      """대화 상세 조회"""
  ```

### 6. [BE] AI 코치 서비스

- [ ] **파일 생성**: `backend/app/services/ai_coach_service.py`
- [ ] **시스템 프롬프트 정의**:
  ```python
  COACH_SYSTEM_PROMPT = """
  당신은 QA/테스트 코드 작성을 도와주는 AI 코치입니다.

  ## 역할
  - 사용자가 더 나은 테스트 코드를 작성할 수 있도록 힌트와 질문을 제공합니다.
  - QA 관점에서 누락된 테스트 케이스, 경계값, 반례를 찾도록 유도합니다.

  ## 금지사항
  - 절대로 완성된 테스트 코드나 정답을 직접 제공하지 마세요.
  - 함수의 전체 구현을 보여주지 마세요.
  - 코드 블록은 최소한으로 사용하고, 힌트 형태로 제공하세요.

  ## 권장사항
  - 질문으로 사용자의 사고를 유도하세요.
  - "~를 테스트해 보셨나요?" 형태로 힌트를 주세요.
  - 경계값, 예외 케이스, 엣지 케이스를 언급하세요.
  - 사용자의 현재 코드에 대한 피드백을 제공하세요.

  ## 응답 형식
  - 한국어로 답변합니다.
  - 간결하고 명확하게 답변합니다.
  - 코드 블록 사용 시 10줄을 넘기지 마세요.
  """
  ```

- [ ] **서비스 클래스 구현**:
  ```python
  class AICoachService:
      def __init__(self, db: Session):
          self.db = db
          self.llm_client = LLMClient()

      async def generate_response(
          self,
          conversation: AIConversation,
          user_message: str,
          code_context: Optional[str] = None,
          problem: Problem = None,
      ) -> Tuple[str, int]:
          """AI 응답 생성"""
          # 1. 대화 이력 구성
          # 2. 컨텍스트 구성 (문제 정보, 코드 컨텍스트)
          # 3. LLM 호출
          # 4. 응답 후처리 (가드레일)
          # 5. 토큰 추정
          return response, token_estimate

      def apply_guardrails(self, response: str) -> str:
          """가드레일 적용 - 과도한 코드 블록 감지 및 축약"""
          # 코드 블록 감지
          # 10줄 초과 시 축약 또는 경고 추가
          pass
  ```

### 7. [BE] AI 응답 후처리 필터

- [ ] **가드레일 구현** (ai_coach_service.py 내):
  ```python
  def apply_guardrails(self, response: str) -> str:
      """가드레일 적용"""
      import re

      # 코드 블록 패턴 찾기
      code_blocks = re.findall(r'```[\s\S]*?```', response)

      for block in code_blocks:
          lines = block.split('\n')
          if len(lines) > 12:  # 언어 표시 + 10줄 + 닫기
              # 축약 또는 경고 추가
              warning = "\n\n> 힌트: 전체 코드보다는 핵심 아이디어에 집중해 보세요."
              response = response.replace(block, block[:500] + "\n...(축약됨)" + warning)

      return response
  ```

### 8. [BE] AI 전용 레이트리밋

- [ ] **파일 수정**: `backend/app/core/rate_limiter.py`
- [ ] **AI 전용 레이트리밋 함수 추가**:
  ```python
  def get_ai_rate_limit_key(request: Request, user: Optional[User]) -> str:
      if user:
          return f"ai:user:{user.id}"
      anonymous_id = request.cookies.get("qa_anonymous_id", "")
      ip = get_client_ip(request)
      return f"ai:guest:{ip}:{anonymous_id}"
  ```

- [ ] **config.py에 설정 추가**:
  ```python
  RATE_LIMIT_AI_GUEST = "5/minute;30/day"
  RATE_LIMIT_AI_MEMBER = "10/minute;200/day"
  ```

### 9. [BE] AI 호출 로깅

- [ ] **구조화 로그 추가**:
  ```python
  import structlog

  logger = structlog.get_logger()

  # 성공 시
  logger.info(
      "AI_CHAT",
      user_id=str(user.id) if user else None,
      anonymous_id=anonymous_id,
      conversation_id=str(conversation.id),
      problem_id=problem_id,
      tokens=token_estimate,
  )

  # 에러 시
  logger.error(
      "AI_CHAT_ERROR",
      user_id=str(user.id) if user else None,
      provider="openai",
      error=str(e),
  )
  ```

### 10. [BE] 라우터 등록

- [ ] **파일 수정**: `backend/app/main.py`
  ```python
  from app.api import ai

  app.include_router(ai.router, prefix="/api/v1")
  ```

---

## 관련 파일

| 파일 | 작업 유형 |
|------|-----------|
| `backend/alembic/versions/xxx_create_ai_tables.py` | 신규 생성 |
| `backend/app/models/ai_conversation.py` | 신규 생성 |
| `backend/app/models/ai_message.py` | 신규 생성 |
| `backend/app/models/__init__.py` | 수정 |
| `backend/app/schemas/ai.py` | 신규 생성 |
| `backend/app/api/ai.py` | 신규 생성 |
| `backend/app/services/ai_coach_service.py` | 신규 생성 |
| `backend/app/core/rate_limiter.py` | 수정 |
| `backend/app/core/config.py` | 수정 |
| `backend/app/main.py` | 수정 |

---

## 완료 조건

- [ ] `/api/v1/ai/chat` API 정상 동작
- [ ] 대화 이력 DB 저장/조회 가능
- [ ] AI 가드레일로 정답 코드 제공 억제
- [ ] 게스트/회원별 레이트리밋 동작
- [ ] 구조화된 로그 기록

---

## API 명세

### POST /api/v1/ai/chat

**Request**:
```json
{
  "problem_id": 1,
  "submission_id": "uuid",  // optional
  "mode": "COACH",
  "message": "이 함수에서 어떤 경계값을 테스트해야 할까요?",
  "code_context": "def test_function():\n    ..."  // optional
}
```

**Response**:
```json
{
  "reply": "좋은 질문이에요! 이 함수의 입력값 범위를 생각해 보세요...",
  "conversation_id": "uuid",
  "message_id": "uuid",
  "token_estimate": 150
}
```

### GET /api/v1/ai/conversations

**Query Parameters**:
- `problem_id`: 특정 문제의 대화만 조회 (optional)

**Response**:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "problem_id": 1,
      "mode": "COACH",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "messages": []
    }
  ],
  "total": 1
}
```

### GET /api/v1/ai/conversations/{id}

**Response**:
```json
{
  "id": "uuid",
  "problem_id": 1,
  "mode": "COACH",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "질문...",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "답변...",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## 테스트 케이스

1. **AI Chat 기본 테스트**
   - COACH 모드로 메시지 전송 → 응답 수신
   - OFF 모드로 메시지 전송 → 400 에러

2. **가드레일 테스트**
   - "정답 코드를 알려줘" 요청 → 힌트만 제공
   - 긴 코드 블록 응답 → 축약 처리

3. **대화 저장 테스트**
   - 회원: 대화 저장 및 조회 가능
   - 게스트: 대화 저장되지만 조회 불가 (로그인 필요)

4. **레이트리밋 테스트**
   - 게스트: 6번째 분당 요청 시 429
   - 회원: 11번째 분당 요청 시 429

5. **로깅 테스트**
   - 성공 시 AI_CHAT 로그
   - 실패 시 AI_CHAT_ERROR 로그

---

## 주의사항

- LLM 호출 비용을 고려하여 토큰 제한 설정
- 가드레일은 완벽하지 않으므로 시스템 프롬프트에 강하게 명시
- 대화 이력이 너무 길어지면 컨텍스트 윈도우 초과 → 최근 N개만 포함
- 에러 발생 시 사용자에게는 일반화된 메시지, 서버에는 상세 로그
