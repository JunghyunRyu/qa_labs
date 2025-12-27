# Milestone 6: 성장 대시보드 프론트엔드

**우선순위**: P2
**의존성**: Milestone 5 (성장 대시보드 백엔드)
**예상 작업량**: 중

---

## 목표

사용자 성장 대시보드 페이지를 구현합니다. 제출 통계, 점수 추이, 난이도/태그별 성과를 시각화합니다.

---

## 배경

기획서 v0.2의 성장 대시보드 요구사항:

- 최근 N회 평균 점수, 평균 kill ratio
- 난이도별 성과
- 일/주 단위 시계열 차트

현재 코드베이스에는 대시보드 페이지가 **없습니다**.

---

## Todo List

### 1. [FE] 대시보드 페이지

- [ ] **파일 생성**: `frontend/app/dashboard/page.tsx`
- [ ] **레이아웃**:
  ```tsx
  export default function DashboardPage() {
    const { data: summary, isLoading } = useSWR('/api/v1/progress/summary');

    if (!isAuthenticated) {
      redirect('/auth/login');
    }

    return (
      <div className="container mx-auto py-8">
        <h1>성장 대시보드</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressSummaryCard ... />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <ProgressTimeline />
          <DifficultyBreakdown />
        </div>

        <div className="mt-8">
          <TagBreakdown />
        </div>
      </div>
    );
  }
  ```
- [ ] **인증 체크**: 비로그인 시 로그인 페이지로 리다이렉트

### 2. [FE] 요약 카드 컴포넌트

- [ ] **파일 생성**: `frontend/components/ProgressSummaryCard.tsx`
- [ ] **Props**:
  ```typescript
  interface ProgressSummaryCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }
  ```
- [ ] **카드 종류**:
  - 총 제출 수
  - 평균 점수
  - 성공률
  - 평균 Kill Ratio
- [ ] **디자인**:
  - 아이콘 + 큰 숫자 + 부제목
  - 트렌드 화살표 (선택)

### 3. [FE] 타임라인 차트

- [ ] **파일 생성**: `frontend/components/ProgressTimeline.tsx`
- [ ] **라이브러리**: recharts
- [ ] **차트 유형**: Line Chart
- [ ] **데이터 표시**:
  - X축: 날짜
  - Y축: 점수 (0-100)
  - 선: 평균 점수, kill ratio (선택적으로 토글)
- [ ] **인터랙션**:
  - 호버 시 툴팁
  - 기간 필터 (7d, 30d, 90d)
- [ ] **예시**:
  ```tsx
  import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={timelineData}>
      <XAxis dataKey="date" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Line type="monotone" dataKey="avg_score" stroke="#8884d8" />
      <Line type="monotone" dataKey="avg_kill_ratio" stroke="#82ca9d" />
    </LineChart>
  </ResponsiveContainer>
  ```

### 4. [FE] 난이도별 성과 차트

- [ ] **파일 생성**: `frontend/components/DifficultyBreakdown.tsx`
- [ ] **차트 유형**: Bar Chart 또는 Pie Chart
- [ ] **데이터 표시**:
  - EASY: 초록
  - MEDIUM: 주황
  - HARD: 빨강
  - 각 난이도별: 제출 수, 평균 점수, 성공률
- [ ] **레이아웃**:
  - 차트 + 범례
  - 호버 시 상세 정보

### 5. [FE] 태그별 성과 차트

- [ ] **파일 생성**: `frontend/components/TagBreakdown.tsx`
- [ ] **차트 유형**: Radar Chart 또는 Horizontal Bar Chart
- [ ] **데이터 표시**:
  - 상위 10개 태그
  - 각 태그별: 제출 수, 평균 점수
- [ ] **강점/약점 시각화**:
  - 평균 이상: 강점 (초록 표시)
  - 평균 이하: 약점 (빨강 표시)

### 6. [FE] Progress API 클라이언트

- [ ] **파일 생성**: `frontend/lib/api/progress.ts`
  ```typescript
  import { api } from '../api';

  export interface ProgressSummary {
    total_submissions: number;
    success_submissions: number;
    avg_score: number;
    avg_kill_ratio: number;
    best_score: number;
    recent_avg_score: number;
    difficulty_stats: DifficultyStats[];
    tag_stats: TagStats[];
  }

  export interface TimelineEntry {
    date: string;
    submission_count: number;
    avg_score: number;
    avg_kill_ratio: number;
  }

  export async function getSummary(): Promise<ProgressSummary> {
    return api.get('/api/v1/progress/summary');
  }

  export async function getTimeline(range: string = '30d'): Promise<{
    entries: TimelineEntry[];
    range: string;
    total_submissions: number;
  }> {
    return api.get(`/api/v1/progress/timeline?range=${range}`);
  }
  ```

### 7. [FE] 기간 선택 필터

- [ ] **파일 생성/수정**: `frontend/components/TimeRangeFilter.tsx`
- [ ] **옵션**: 7일, 30일, 90일, 전체
- [ ] **UI**: 버튼 그룹 또는 드롭다운
- [ ] **상태 관리**:
  - URL 파라미터로 상태 관리 (`?range=30d`)
  - useSearchParams 활용
- [ ] **예시**:
  ```tsx
  const ranges = ['7d', '30d', '90d', 'all'];

  <div className="flex gap-2">
    {ranges.map(r => (
      <button
        key={r}
        onClick={() => setRange(r)}
        className={range === r ? 'bg-blue-500 text-white' : 'bg-gray-200'}
      >
        {r === 'all' ? '전체' : r}
      </button>
    ))}
  </div>
  ```

### 8. [FE] 로딩/빈 상태 처리

- [ ] **로딩 상태**:
  - 스켈레톤 UI (차트 영역)
  - 숫자 카드는 플레이스홀더
- [ ] **빈 상태**:
  - 제출 이력이 없을 때
  - "아직 제출 기록이 없습니다. 첫 문제를 풀어보세요!"
  - 문제 목록으로 이동 버튼

### 9. [FE] 헤더에 대시보드 링크 추가

- [ ] **파일 수정**: `frontend/components/Header.tsx`
- [ ] **조건**: 로그인 사용자에게만 표시
- [ ] **위치**: 문제 목록 옆 또는 사용자 메뉴 내
- [ ] **예시**:
  ```tsx
  {isLoggedIn && (
    <Link href="/dashboard" className="...">
      성장 대시보드
    </Link>
  )}
  ```

---

## 관련 파일

| 파일 | 작업 유형 |
|------|-----------|
| `frontend/app/dashboard/page.tsx` | 신규 생성 |
| `frontend/components/ProgressSummaryCard.tsx` | 신규 생성 |
| `frontend/components/ProgressTimeline.tsx` | 신규 생성 |
| `frontend/components/DifficultyBreakdown.tsx` | 신규 생성 |
| `frontend/components/TagBreakdown.tsx` | 신규 생성 |
| `frontend/components/TimeRangeFilter.tsx` | 신규 생성 |
| `frontend/lib/api/progress.ts` | 신규 생성 |
| `frontend/components/Header.tsx` | 수정 |

---

## 완료 조건

- [ ] 대시보드 페이지 접근 가능 (회원 전용)
- [ ] 요약 카드 4개 정상 표시
- [ ] 타임라인 차트 렌더링
- [ ] 난이도별 성과 차트 렌더링
- [ ] 태그별 성과 차트 렌더링
- [ ] 기간 필터 동작
- [ ] 로딩/빈 상태 처리

---

## UI/UX 참고

### 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header                                                              │
├─────────────────────────────────────────────────────────────────────┤
│ 성장 대시보드                                                        │
│                                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│ │ 총 제출 │ │ 평균점수│ │ 성공률  │ │Kill Ratio│                    │
│ │   42    │ │  78.5   │ │  83%   │ │  0.72   │                    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                    │
│                                                                     │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐    │
│ │ 점수 추이                   │ │ 난이도별 성과               │    │
│ │ [7d] [30d] [90d] [전체]     │ │                             │    │
│ │                             │ │   ████ EASY (15)            │    │
│ │     ╱╲                      │ │   ██████ MEDIUM (20)        │    │
│ │    ╱  ╲   ╱╲               │ │   ████ HARD (7)             │    │
│ │   ╱    ╲ ╱  ╲              │ │                             │    │
│ │  ╱      ╳    ╲             │ │                             │    │
│ └─────────────────────────────┘ └─────────────────────────────┘    │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │ 태그별 성과                                                  │    │
│ │                                                              │    │
│ │ array        ████████████████ 80.1                          │    │
│ │ string       ██████████████ 76.3                            │    │
│ │ hash         ████████████ 72.5                              │    │
│ │ recursion    ████████ 65.0                                  │    │
│ └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 요약 카드 디자인

```
┌─────────────────────┐
│ 📊                  │
│ 총 제출             │
│                     │
│      42             │  ← 큰 숫자
│                     │
│ 이번 주 +5 ↑        │  ← 트렌드 (선택)
└─────────────────────┘
```

### 모바일 레이아웃

- 요약 카드: 2열 그리드
- 차트: 1열 (세로 스크롤)
- 기간 필터: 가로 스크롤 버튼

---

## 테스트 케이스

1. **페이지 접근 테스트**
   - 로그인 사용자 → 대시보드 표시
   - 비로그인 사용자 → 로그인 페이지로 리다이렉트

2. **데이터 로딩 테스트**
   - API 로딩 중 → 스켈레톤 표시
   - 로딩 완료 → 데이터 표시

3. **빈 상태 테스트**
   - 제출 이력 없음 → 빈 상태 메시지 표시

4. **기간 필터 테스트**
   - 7d 선택 → 7일 데이터만 표시
   - 90d 선택 → 90일 데이터 표시
   - URL 파라미터 반영 확인

5. **차트 인터랙션 테스트**
   - 호버 시 툴팁 표시
   - 반응형 리사이즈

6. **다크모드 테스트**
   - 차트 색상 다크모드 대응

---

## 의존성

- `recharts`: 차트 라이브러리
  ```bash
  npm install recharts
  ```
- `swr` 또는 `react-query`: 데이터 페칭 (기존 사용 중인 것 활용)

---

## 주의사항

- recharts는 SSR과 호환성 이슈가 있을 수 있음 → `dynamic import`로 클라이언트에서만 로드
  ```tsx
  import dynamic from 'next/dynamic';
  const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
  ```
- 차트 컬러는 테마(라이트/다크)에 맞게 조정
- 모바일에서 차트가 너무 작아지지 않도록 최소 높이 설정
- 데이터가 많을 때 차트 성능 고려 (데이터 포인트 제한)
