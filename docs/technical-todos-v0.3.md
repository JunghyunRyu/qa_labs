# v0.3 - AI-Assist 모드 1차 도입

> 작성일: 2025-01-27  
> 목표: AI 사용을 전제로 한 평가 모드 구현  
> 환경: EC2 (13.125.154.68, Ubuntu, /home/ubuntu/qa_labs)  
> 관련 문서: [qa-arena-spec.md](qa-arena-spec.md), [ToDoList.md](ToDoList.md)

---

## 개요

v0.3 마일스톤은 AI-Assist 모드를 구현하는 것을 목표로 합니다. AI 사용을 전제로 한 평가 모드에서 사용자가 AI를 어떻게 활용했는지 기록하고, 이를 기반으로 평가할 수 있도록 합니다.

### 완료 조건

- [ ] 데이터베이스 스키마에 `ai_assist` 플래그와 `ai_usage_notes` 필드가 추가됨
- [ ] Backend API가 AI-Assist 모드를 지원함
- [ ] Frontend UI가 AI-Assist 모드를 표시하고 입력을 받을 수 있음
- [ ] AI-Assist 모드 문제에서 `ai_usage_notes`가 필수 입력으로 검증됨

---

## 1. 데이터베이스 스키마 확장

### 1.1. Problems 테이블 확장

**목적**: 문제에 AI-Assist 모드 플래그 추가

#### 1.1.1. Alembic 마이그레이션 생성

- [ ] 마이그레이션 파일 생성
  ```bash
  cd backend
  alembic revision -m "add_ai_assist_to_problems"
  ```

- [ ] 마이그레이션 스크립트 작성
  ```python
  # alembic/versions/xxxx_add_ai_assist_to_problems.py
  def upgrade():
      op.add_column('problems', 
          sa.Column('ai_assist', sa.Boolean(), nullable=False, server_default='false'))
      op.create_index('ix_problems_ai_assist', 'problems', ['ai_assist'])

  def downgrade():
      op.drop_index('ix_problems_ai_assist', 'problems')
      op.drop_column('problems', 'ai_assist')
  ```

- [ ] 인덱스 추가 (필요 시)
  - [ ] AI-Assist 모드 문제 필터링을 위한 인덱스
  - [ ] `CREATE INDEX ix_problems_ai_assist ON problems(ai_assist);`

#### EC2에서 마이그레이션 실행

```bash
# EC2 서버 접속
ssh -i C:\pem\my_proton_key.pem ubuntu@13.125.154.68

# 마이그레이션 실행
cd /home/ubuntu/qa_labs
docker exec qa_arena_backend_prod alembic upgrade head

# 마이그레이션 확인
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena
\d problems
# ai_assist 컬럼이 추가되었는지 확인
```

#### 1.1.2. 모델 및 스키마 수정

- [ ] `app/models/problem.py` 수정
  ```python
  class Problem(Base):
      # ... 기존 필드들 ...
      ai_assist = Column(Boolean, default=False, nullable=False, index=True)
  ```

- [ ] `app/schemas/problem.py` 수정
  ```python
  class ProblemBase(BaseModel):
      # ... 기존 필드들 ...
      ai_assist: bool = False

  class ProblemDetailResponse(ProblemBase):
      # ai_assist 필드 자동 포함됨
      pass
  ```

### 1.2. Submissions 테이블 확장

**목적**: 제출에 AI 사용 내역 필드 추가

#### 1.2.1. Alembic 마이그레이션 생성

- [ ] 마이그레이션 파일 생성
  ```bash
  alembic revision -m "add_ai_usage_notes_to_submissions"
  ```

- [ ] 마이그레이션 스크립트 작성
  ```python
  def upgrade():
      op.add_column('submissions', 
          sa.Column('ai_usage_notes', sa.Text(), nullable=True))

  def downgrade():
      op.drop_column('submissions', 'ai_usage_notes')
  ```

- [ ] NULL 허용 확인
  - [ ] AI-Free 모드에서는 NULL
  - [ ] AI-Assist 모드에서는 필수 (애플리케이션 레벨 검증)

#### EC2에서 마이그레이션 실행

```bash
# 마이그레이션 실행
docker exec qa_arena_backend_prod alembic upgrade head

# 스키마 확인
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena
\d submissions
# ai_usage_notes 컬럼이 추가되었는지 확인
```

#### 1.2.2. 모델 및 스키마 수정

- [ ] `app/models/submission.py` 수정
  ```python
  class Submission(Base):
      # ... 기존 필드들 ...
      ai_usage_notes = Column(Text, nullable=True)
  ```

- [ ] `app/schemas/submission.py` 수정
  ```python
  class SubmissionCreate(BaseModel):
      problem_id: int
      code: str
      ai_usage_notes: Optional[str] = None  # AI-Assist 모드에서 필수

  class SubmissionResponse(BaseModel):
      # ... 기존 필드들 ...
      ai_usage_notes: Optional[str] = None
  ```

### 1.3. 마이그레이션 실행 및 검증

#### 작업 내용

- [ ] 마이그레이션 스크립트 검증
  - [ ] 롤백 테스트
    ```bash
    # 롤백 테스트
    docker exec qa_arena_backend_prod alembic downgrade -1
    docker exec qa_arena_backend_prod alembic upgrade head
    ```
  - [ ] 기존 데이터 호환성 확인
    - [ ] 기존 문제의 `ai_assist`는 `false`로 설정됨
    - [ ] 기존 제출의 `ai_usage_notes`는 `NULL`로 유지됨

- [ ] 테스트 데이터 업데이트
  - [ ] AI-Assist 모드 문제 샘플 추가
    ```python
    # scripts/seed_problems.py 또는 수동으로
    problem = Problem(
        slug="ai-assist-example",
        title="AI-Assist 모드 예제 문제",
        ai_assist=True,
        # ... 기타 필드들 ...
    )
    ```
  - [ ] AI-Assist 모드 제출 샘플 추가

---

## 2. Backend API 확장

### 2.1. 문제 생성/조회 API 확장

**목적**: 문제 API가 `ai_assist` 필드를 지원하도록 확장

#### 2.1.1. 문제 생성 API 수정

- [ ] `POST /api/admin/problems` 수정
  - [ ] `ProblemCreateWithBuggy` 스키마에 `ai_assist` 필드 추가
    ```python
    class ProblemCreateWithBuggy(BaseModel):
        # ... 기존 필드들 ...
        ai_assist: bool = False
    ```
  - [ ] 문제 생성 시 `ai_assist` 값 저장
    ```python
    problem = Problem(
        # ... 기존 필드들 ...
        ai_assist=problem_data.ai_assist,
    )
    ```

#### 2.1.2. 문제 조회 API 수정

- [ ] `GET /api/v1/problems/{id}` 수정
  - [ ] 응답에 `ai_assist` 필드 포함
    - [ ] `ProblemDetailResponse` 스키마에 이미 포함됨 (모델 수정 시 자동)
  - [ ] AI-Assist 모드일 때 추가 안내 메시지 (옵션)
    ```python
    if problem.ai_assist:
        response["ai_assist_notice"] = "이 문제는 AI-Assist 모드입니다. AI 사용 내역을 기록해주세요."
    ```

### 2.2. 제출 API 확장

**목적**: 제출 API가 `ai_usage_notes` 필드를 지원하도록 확장

#### 2.2.1. 제출 생성 API 수정

- [ ] `POST /api/v1/submissions` 수정
  - [ ] `SubmissionCreate` 스키마에 `ai_usage_notes` 필드 추가
    ```python
    class SubmissionCreate(BaseModel):
        problem_id: int
        code: str
        ai_usage_notes: Optional[str] = None
    ```
  - [ ] AI-Assist 모드 문제일 때 `ai_usage_notes` 필수 검증
    ```python
    async def create_submission(
        submission_data: SubmissionCreate,
        db: Session = Depends(get_db),
    ):
        problem = problem_repo.get_by_id(submission_data.problem_id)
        
        # AI-Assist 모드 검증
        if problem.ai_assist and not submission_data.ai_usage_notes:
            raise HTTPException(
                status_code=400,
                detail="AI-Assist 모드 문제에서는 ai_usage_notes가 필수입니다."
            )
    ```
  - [ ] AI-Free 모드 문제일 때 `ai_usage_notes` NULL 허용
    - [ ] 기본값이 `None`이므로 자동으로 처리됨

#### 2.2.2. 제출 조회 API 수정

- [ ] `GET /api/v1/submissions/{id}` 수정
  - [ ] 응답에 `ai_usage_notes` 필드 포함
    - [ ] `SubmissionResponse` 스키마에 이미 포함됨
  - [ ] Admin API에서만 노출 (옵션)
    ```python
    # 일반 사용자는 자신의 제출만 조회 가능
    # Admin은 모든 제출 조회 가능
    if current_user.role != "admin" and submission.user_id != current_user.id:
        # ai_usage_notes 필드 제거 (옵션)
        response.ai_usage_notes = None
    ```

### 2.3. AI-Assist 모드 검증 로직

**목적**: Submission Service에서 AI-Assist 모드 검증

#### 작업 내용

- [ ] `app/services/submission_service.py` 수정
  - [ ] 문제의 `ai_assist` 플래그 확인
    ```python
    def process_submission(self, submission_id: UUID) -> None:
        submission = self.submission_repo.get_by_id(submission_id)
        problem = self.problem_repo.get_by_id(submission.problem_id)
        
        # AI-Assist 모드 검증 (이미 API 레벨에서 검증됨)
        # 여기서는 추가 검증 또는 로깅
        if problem.ai_assist:
            logger.info(f"Processing AI-Assist mode submission: {submission_id}")
    ```
  - [ ] AI-Assist 모드일 때 `ai_usage_notes` 필수 검증
    - [ ] API 레벨에서 이미 검증되지만, 서비스 레벨에서도 확인
  - [ ] AI-Free 모드일 때 `ai_usage_notes` NULL 허용
    - [ ] 기본 동작

#### 테스트

```bash
# AI-Assist 모드 문제에 ai_usage_notes 없이 제출 (실패해야 함)
curl -X POST http://localhost/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "code": "test code"
  }'
# 400 Bad Request 응답 확인

# ai_usage_notes 포함하여 제출 (성공해야 함)
curl -X POST http://localhost/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "code": "test code",
    "ai_usage_notes": "ChatGPT를 사용하여 테스트 케이스를 작성했습니다."
  }'
```

---

## 3. Frontend UI 확장

### 3.1. 문제 상세 페이지 수정

**목적**: 문제 상세 페이지에 AI-Assist 모드 표시

#### 작업 내용

- [ ] AI-Assist 모드 표시
  - [ ] `frontend/app/problems/[id]/page.tsx` 수정
    ```typescript
    // 문제 데이터에 ai_assist 필드가 포함됨
    const { problem } = await getProblem(id);
    
    return (
      <div>
        {problem.ai_assist && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <strong>AI-Assist 모드:</strong> 이 문제는 AI 사용을 허용합니다. 
            AI 사용 내역을 기록해주세요.
          </div>
        )}
        {/* 기존 문제 설명 등 */}
      </div>
    );
    ```
  - [ ] AI-Assist 모드 안내 메시지 추가
    - [ ] 시각적으로 구분되는 배지 또는 알림

#### 타입 정의 업데이트

- [ ] `frontend/types/problem.ts` 수정
  ```typescript
  export interface Problem {
    // ... 기존 필드들 ...
    ai_assist: boolean;
  }
  ```

### 3.2. 제출 폼 수정

**목적**: 제출 폼에 AI 사용 내역 입력 필드 추가

#### 작업 내용

- [ ] `frontend/components/CodeEditor.tsx` 또는 제출 컴포넌트 수정
  - [ ] AI-Assist 모드일 때 `ai_usage_notes` 입력 필드 표시
    ```typescript
    const [aiUsageNotes, setAiUsageNotes] = useState("");
    
    return (
      <div>
        <CodeEditor ... />
        
        {problem.ai_assist && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              AI 사용 내역 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={aiUsageNotes}
              onChange={(e) => setAiUsageNotes(e.target.value)}
              placeholder="어떤 AI를 사용했는지, 어떤 프롬프트를 사용했는지 기록해주세요."
              className="w-full p-2 border rounded"
              rows={4}
              required
            />
          </div>
        )}
      </div>
    );
    ```
  - [ ] 필수 입력 표시 및 검증
    - [ ] `required` 속성 추가
    - [ ] 제출 전 검증
  - [ ] AI-Free 모드일 때 필드 숨김
    - [ ] `problem.ai_assist`가 `false`일 때 필드 숨김

#### 제출 API 호출 수정

- [ ] `frontend/lib/api/submissions.ts` 수정
  ```typescript
  export async function createSubmission(
    problemId: number,
    code: string,
    aiUsageNotes?: string
  ): Promise<Submission> {
    const response = await fetch("/api/v1/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: problemId,
        code,
        ai_usage_notes: aiUsageNotes,
      }),
    });
    return response.json();
  }
  ```

### 3.3. 제출 결과 페이지 수정

**목적**: 제출 결과에 AI 사용 내역 표시

#### 작업 내용

- [ ] AI 사용 내역 표시
  - [ ] `frontend/components/SubmissionResult.tsx` 수정
    ```typescript
    return (
      <div>
        {/* 기존 결과 표시 */}
        
        {submission.ai_usage_notes && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">AI 사용 내역</h3>
            <p className="text-sm whitespace-pre-wrap">
              {submission.ai_usage_notes}
            </p>
          </div>
        )}
      </div>
    );
    ```
  - [ ] AI-Assist 모드 제출임을 명시
    - [ ] 배지 또는 아이콘으로 표시

#### 타입 정의 업데이트

- [ ] `frontend/types/problem.ts` 수정
  ```typescript
  export interface Submission {
    // ... 기존 필드들 ...
    ai_usage_notes?: string;
  }
  ```

### 3.4. Admin UI 확장

**목적**: Admin 문제 생성 폼에 AI-Assist 모드 옵션 추가

#### 작업 내용

- [ ] 문제 생성 폼 수정
  - [ ] `frontend/app/admin/problems/new/page.tsx` 수정
    ```typescript
    const [aiAssist, setAiAssist] = useState(false);
    
    return (
      <form>
        {/* 기존 폼 필드들 */}
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiAssist}
              onChange={(e) => setAiAssist(e.target.checked)}
              className="mr-2"
            />
            AI-Assist 모드 활성화
          </label>
          <p className="text-sm text-gray-600 mt-1">
            AI 사용을 허용하는 문제로 설정합니다. 
            사용자는 AI 사용 내역을 기록해야 합니다.
          </p>
        </div>
      </form>
    );
    ```
  - [ ] AI-Assist 모드 설명 추가
    - [ ] 도움말 텍스트 또는 툴팁

---

## 4. 평가 로직 확장 (옵션)

### 4.1. AI 사용 내역 기반 평가

**목적**: AI 사용 내역을 기반으로 평가 항목 설계

#### 작업 내용

- [ ] 평가 항목 설계 문서화
  - [ ] 프롬프트 품질 평가 기준
    - [ ] 명확성
    - [ ] 구체성
    - [ ] 목적 적합성
  - [ ] AI 답변 검증 태도 평가 기준
    - [ ] AI 답변을 그대로 사용했는지
    - [ ] 검증 및 수정을 했는지
  - [ ] 테스트 설계 능력 평가 기준
    - [ ] AI를 활용하여 테스트 케이스를 확장했는지
    - [ ] 엣지 케이스를 고려했는지

### 4.2. AI 피드백 확장 (향후)

**목적**: AI 피드백에 AI 사용 내역 평가 추가

#### 작업 내용

- [ ] `ai_usage_notes`를 고려한 피드백 생성
  - [ ] `app/services/ai_feedback_engine.py` 수정
    - [ ] `ai_usage_notes`를 프롬프트에 포함
    - [ ] AI 사용 품질에 대한 피드백 추가
- [ ] 프롬프트 품질 피드백 추가
  - [ ] 프롬프트 개선 제안
  - [ ] AI 활용 방법 개선 제안

---

## 완료 체크리스트

### 필수 항목

- [ ] 데이터베이스 스키마에 `ai_assist`와 `ai_usage_notes` 필드가 추가됨
- [ ] Backend API가 AI-Assist 모드를 지원함
- [ ] Frontend UI가 AI-Assist 모드를 표시하고 입력을 받을 수 있음
- [ ] AI-Assist 모드 문제에서 `ai_usage_notes`가 필수 입력으로 검증됨

### 검증 방법

1. **데이터베이스 확인**: 마이그레이션 후 스키마 확인
2. **API 테스트**: AI-Assist 모드 문제에 `ai_usage_notes` 없이 제출 시 400 에러 확인
3. **UI 테스트**: AI-Assist 모드 문제에서 입력 필드 표시 확인
4. **E2E 테스트**: 전체 플로우 테스트 (문제 조회 → 제출 → 결과 확인)

---

## 다음 단계

v0.3 완료 후 다음 마일스톤으로 진행:
- [v0.4 - 외부 베타/지인 테스트](technical-todos-v0.4.md)

---

## 참고 문서

- [프로젝트 사양서](qa-arena-spec.md)
- [비즈니스 TODO](ToDoList.md) - AI-Assist 모드 컨셉 참고

