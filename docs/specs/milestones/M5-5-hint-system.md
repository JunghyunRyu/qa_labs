# M5-5: 단계형 힌트 시스템

## 개요
- **목표**: 사용자가 단계별로 힌트를 요청할 수 있는 시스템 (기본 → 중간 → 강함)
- **우선순위**: Medium
- **예상 작업량**: 2-3일

## 기능 요구사항

### 핵심 기능
1. **3단계 힌트 시스템**
   - Level 1 (기본): 방향성만 제시, 코드 없음
   - Level 2 (중간): 구체적 접근법 + 의사코드
   - Level 3 (강함): 실제 코드 예시 포함

2. **점진적 공개**
   - 다음 레벨 힌트는 이전 레벨 확인 후에만 요청 가능
   - 힌트 사용 여부 기록 (통계용)

3. **힌트 비용 시스템 (선택)**
   - 힌트 사용 시 획득 점수 차감 고려
   - 예: Level 3 힌트 사용 시 최대 점수 80점으로 제한

### UI 디자인

#### 힌트 버튼 영역
```
┌─────────────────────────────────────────────────┐
│ 💡 힌트가 필요하신가요?                         │
├─────────────────────────────────────────────────┤
│ [Level 1: 기본]  [Level 2: 중간]  [Level 3: 강함]│
│    ✓ 확인됨         🔒 잠김         🔒 잠김    │
└─────────────────────────────────────────────────┘
```

#### 힌트 내용 표시
```
┌─────────────────────────────────────────────────┐
│ 💡 힌트 Level 1                            [×] │
├─────────────────────────────────────────────────┤
│ 이 문제는 입력값의 유효성 검사가 핵심입니다.   │
│                                                 │
│ 다음 사항을 고려해보세요:                       │
│ • 빈 입력에 대한 처리                           │
│ • 타입이 잘못된 경우의 처리                     │
│ • 경계값 (최소/최대)                           │
│                                                 │
│ [더 구체적인 힌트 보기 (Level 2) →]             │
└─────────────────────────────────────────────────┘
```

### 힌트 레벨별 내용
| 레벨 | 내용 | 점수 영향 |
|------|------|----------|
| Level 1 | 방향성, 고려사항 목록 | 없음 |
| Level 2 | 접근법, 의사코드, 테스트 카테고리 | -10점 (선택) |
| Level 3 | 실제 pytest 코드 예시 | -20점 (선택) |

## 기술 구현

### 데이터 구조
```typescript
// types/hint.ts
interface HintLevel {
  level: 1 | 2 | 3;
  title: string;
  description: string;
  scorePenalty: number;
}

interface HintContent {
  level: HintLevel['level'];
  content: string;
  codeExample?: string;
  considerations?: string[];
}

interface HintState {
  problemId: number;
  viewedLevels: Set<HintLevel['level']>;
  currentLevel: HintLevel['level'] | null;
}

// 백엔드 응답
interface ProblemHints {
  problemId: number;
  hints: {
    level1: string;
    level2: string;
    level3: string;
  };
}
```

### 힌트 생성 (백엔드)
```python
# app/services/hint_service.py
from openai import OpenAI

class HintService:
    def __init__(self):
        self.client = OpenAI()

    async def generate_hints(self, problem: Problem) -> dict:
        """문제에 대한 3단계 힌트 생성"""

        base_prompt = f"""
문제: {problem.title}
설명: {problem.description_md}
테스트 포인트: {problem.summary}

이 문제에 대한 pytest 테스트 작성 힌트를 3단계로 생성해주세요.
"""

        level1_prompt = base_prompt + """
Level 1 (기본 힌트):
- 방향성만 제시
- 코드 없이 텍스트로만
- 어떤 종류의 테스트가 필요한지 힌트
- 100자 이내
"""

        level2_prompt = base_prompt + """
Level 2 (중간 힌트):
- 구체적인 테스트 카테고리 제시
- 의사코드 수준의 접근법
- 테스트 케이스 아이디어 목록
- 200자 이내
"""

        level3_prompt = base_prompt + """
Level 3 (강한 힌트):
- 실제 pytest 코드 예시 1개
- @pytest.mark.parametrize 사용
- 단, 정답을 모두 주지 않고 일부만
- 코드 포함 300자 이내
"""

        # 각 레벨 힌트 생성
        hints = {}
        for level, prompt in [
            ('level1', level1_prompt),
            ('level2', level2_prompt),
            ('level3', level3_prompt),
        ]:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
            )
            hints[level] = response.choices[0].message.content

        return hints
```

### 프론트엔드 Store
```typescript
// stores/hintStore.ts
interface HintStore {
  // State
  hintsCache: Map<number, ProblemHints>;
  viewedHints: Map<number, Set<number>>; // problemId -> viewed levels
  isLoading: boolean;

  // Actions
  fetchHints: (problemId: number) => Promise<void>;
  viewHint: (problemId: number, level: 1 | 2 | 3) => void;
  getAvailableLevels: (problemId: number) => number[];
  hasViewedLevel: (problemId: number, level: number) => boolean;
}

export const useHintStore = create<HintStore>()(
  persist(
    (set, get) => ({
      hintsCache: new Map(),
      viewedHints: new Map(),
      isLoading: false,

      fetchHints: async (problemId) => {
        if (get().hintsCache.has(problemId)) return;

        set({ isLoading: true });
        try {
          const hints = await api.get(`/problems/${problemId}/hints`);
          set((state) => ({
            hintsCache: new Map(state.hintsCache).set(problemId, hints),
          }));
        } finally {
          set({ isLoading: false });
        }
      },

      viewHint: (problemId, level) => {
        set((state) => {
          const viewed = new Set(state.viewedHints.get(problemId) || []);
          viewed.add(level);
          return {
            viewedHints: new Map(state.viewedHints).set(problemId, viewed),
          };
        });
      },

      getAvailableLevels: (problemId) => {
        const viewed = get().viewedHints.get(problemId) || new Set();
        // Level N을 보려면 Level N-1을 봐야 함
        const available: number[] = [1]; // Level 1은 항상 가능
        if (viewed.has(1)) available.push(2);
        if (viewed.has(2)) available.push(3);
        return available;
      },

      hasViewedLevel: (problemId, level) => {
        return get().viewedHints.get(problemId)?.has(level) ?? false;
      },
    }),
    {
      name: 'qa-arena-hints',
      partialize: (state) => ({
        viewedHints: Array.from(state.viewedHints.entries()),
      }),
    }
  )
);
```

### HintPanel 컴포넌트
```tsx
// components/HintPanel.tsx
function HintPanel({ problemId }: { problemId: number }) {
  const {
    hintsCache,
    viewedHints,
    isLoading,
    fetchHints,
    viewHint,
    getAvailableLevels,
  } = useHintStore();

  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    fetchHints(problemId);
  }, [problemId]);

  const hints = hintsCache.get(problemId);
  const availableLevels = getAvailableLevels(problemId);
  const viewedLevels = viewedHints.get(problemId) || new Set();

  const handleViewHint = (level: 1 | 2 | 3) => {
    if (!availableLevels.includes(level)) return;
    viewHint(problemId, level);
    setSelectedLevel(level);
  };

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        <h3 className="font-medium text-yellow-800">힌트가 필요하신가요?</h3>
      </div>

      {/* 힌트 레벨 버튼 */}
      <div className="flex gap-2 mb-4">
        {([1, 2, 3] as const).map((level) => {
          const isAvailable = availableLevels.includes(level);
          const isViewed = viewedLevels.has(level);
          const isSelected = selectedLevel === level;

          return (
            <button
              key={level}
              onClick={() => handleViewHint(level)}
              disabled={!isAvailable}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg border text-sm transition-colors",
                isSelected
                  ? "bg-yellow-200 border-yellow-400"
                  : isAvailable
                  ? "bg-white border-yellow-300 hover:bg-yellow-100"
                  : "bg-gray-100 border-gray-200 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-center gap-1">
                {!isAvailable && <Lock className="w-3 h-3" />}
                {isViewed && <Check className="w-3 h-3 text-green-500" />}
                <span>Level {level}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {level === 1 && '기본'}
                {level === 2 && '중간'}
                {level === 3 && '강함'}
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 힌트 내용 */}
      {selectedLevel && hints && (
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-800">
              Level {selectedLevel} 힌트
            </span>
            <button
              onClick={() => setSelectedLevel(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {hints.hints[`level${selectedLevel}`]}
            </ReactMarkdown>
          </div>

          {/* 다음 레벨 유도 */}
          {selectedLevel < 3 && availableLevels.includes(selectedLevel + 1 as 1 | 2 | 3) && (
            <button
              onClick={() => handleViewHint((selectedLevel + 1) as 1 | 2 | 3)}
              className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
            >
              더 구체적인 힌트 보기 (Level {selectedLevel + 1})
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## 백엔드 API

### 엔드포인트
```
GET /api/v1/problems/{problem_id}/hints
Response: {
  "problem_id": 1,
  "hints": {
    "level1": "...",
    "level2": "...",
    "level3": "..."
  }
}

POST /api/v1/problems/{problem_id}/hints/view
Body: { "level": 1 }
Response: { "success": true }
```

## 고려사항

### 힌트 품질
- 각 문제마다 사전에 힌트 생성하여 저장
- 또는 요청 시 실시간 생성 (캐싱)
- 힌트가 너무 직접적이지 않도록 조절

### 점수 영향 (선택적)
- 힌트 사용 여부를 제출 시 함께 기록
- 리더보드에서 힌트 사용자 구분 (선택)
- 또는 단순 학습 도구로만 사용 (점수 영향 없음)

### 저장 전략
- 힌트 본 기록은 localStorage에 저장
- 서버에도 기록하여 통계 분석
- 문제별 힌트 사용률 추적

## 테스트 케이스
- [ ] Level 1 힌트 표시
- [ ] Level 2는 Level 1 확인 후에만 활성화
- [ ] Level 3는 Level 2 확인 후에만 활성화
- [ ] 힌트 접기/펼치기
- [ ] 힌트 내용 마크다운 렌더링
- [ ] 힌트 본 기록 persist
- [ ] API 에러 시 graceful fallback

## 관련 마일스톤
- M5-3: AI 퀵 프롬프트 (힌트 대신 AI에게 질문)
- 추후: 게이미피케이션 (힌트 사용 배지 등)

---
*생성일: 2024-12-24*
