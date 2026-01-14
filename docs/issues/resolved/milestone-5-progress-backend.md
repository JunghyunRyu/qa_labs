# Milestone 5: 성장 대시보드 백엔드

**우선순위**: P1-P2
**의존성**: Milestone 1 (user_id/anonymous_id 지원)
**예상 작업량**: 중
**상태**: ✅ 완료

---

## 목표

사용자 성장 통계 API를 구현합니다. 제출 이력을 기반으로 점수, kill ratio, 난이도별/태그별 성과를 집계합니다.

---

## 배경

기획서 v0.2의 Progress API 요구사항:

- `GET /api/v1/progress/summary`: 최근 N회 평균 점수, 평균 kill ratio, 난이도별 성과
- `GET /api/v1/progress/timeline?range=90d`: 일/주 단위 시계열

현재 코드베이스에는 Progress API가 **전혀 없습니다**.

---

## Todo List

### 1. [BE] Progress Summary API

- [x] **파일 생성**: `backend/app/api/progress.py`
- [x] **엔드포인트 구현**:
  ```python
  @router.get("/summary", response_model=ProgressSummaryResponse)
  async def get_progress_summary(
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user),
  ):
      """사용자 성장 요약 조회"""
      service = ProgressService(db)
      return service.get_summary(current_user.id)
  ```
- [x] **응답 내용**:
  - 총 제출 수
  - 성공 제출 수
  - 평균 점수 (최근 N회)
  - 평균 kill ratio
  - 최고 점수
  - 난이도별 성과

### 2. [BE] Progress Timeline API

- [x] **엔드포인트 구현**:
  ```python
  @router.get("/timeline", response_model=ProgressTimelineResponse)
  async def get_progress_timeline(
      range: str = Query("30d", regex="^(7d|30d|90d|all)$"),
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user),
  ):
      """시계열 성장 데이터 조회"""
      service = ProgressService(db)
      return service.get_timeline(current_user.id, range)
  ```
- [x] **응답 내용**:
  - 일/주 단위 데이터 포인트
  - 각 포인트: 날짜, 제출 수, 평균 점수, 평균 kill ratio

### 3. [BE] 난이도별 집계

- [x] **구현 위치**: ProgressService
- [x] **집계 내용**:
  ```python
  def get_difficulty_stats(self, user_id: UUID) -> List[DifficultyStats]:
      """난이도별 통계"""
      result = self.db.query(
          Problem.difficulty,
          func.count(Submission.id).label('submission_count'),
          func.avg(Submission.score).label('avg_score'),
          func.count(case((Submission.status == 'SUCCESS', 1))).label('success_count'),
      ).join(
          Submission, Problem.id == Submission.problem_id
      ).filter(
          Submission.user_id == user_id,
          Submission.status.in_(['SUCCESS', 'FAILURE'])
      ).group_by(
          Problem.difficulty
      ).all()

      return [
          DifficultyStats(
              difficulty=row.difficulty,
              submission_count=row.submission_count,
              avg_score=row.avg_score or 0,
              success_rate=row.success_count / row.submission_count if row.submission_count > 0 else 0
          )
          for row in result
      ]
  ```

### 4. [BE] 태그별 집계

- [x] **구현 위치**: ProgressService
- [x] **집계 내용**:
  ```python
  def get_tag_stats(self, user_id: UUID) -> List[TagStats]:
      """태그별 통계"""
      # Problem.tags는 JSONB 배열
      # PostgreSQL의 jsonb_array_elements 사용
      result = self.db.execute(text("""
          SELECT
              tag,
              COUNT(s.id) as submission_count,
              AVG(s.score) as avg_score
          FROM problems p
          CROSS JOIN LATERAL jsonb_array_elements_text(p.tags) as tag
          JOIN submissions s ON p.id = s.problem_id
          WHERE s.user_id = :user_id
            AND s.status IN ('SUCCESS', 'FAILURE')
          GROUP BY tag
          ORDER BY submission_count DESC
          LIMIT 20
      """), {"user_id": str(user_id)}).fetchall()

      return [
          TagStats(
              tag=row.tag,
              submission_count=row.submission_count,
              avg_score=row.avg_score or 0
          )
          for row in result
      ]
  ```

### 5. [BE] Progress 스키마 정의

- [x] **파일 생성**: `backend/app/schemas/progress.py`
  ```python
  class DifficultyStats(BaseModel):
      difficulty: str  # 'EASY', 'MEDIUM', 'HARD'
      submission_count: int
      avg_score: float
      success_rate: float

  class TagStats(BaseModel):
      tag: str
      submission_count: int
      avg_score: float

  class ProgressSummaryResponse(BaseModel):
      total_submissions: int
      success_submissions: int
      avg_score: float
      avg_kill_ratio: float
      best_score: int
      recent_avg_score: float  # 최근 10회
      difficulty_stats: List[DifficultyStats]
      tag_stats: List[TagStats]

  class TimelineEntry(BaseModel):
      date: str  # YYYY-MM-DD
      submission_count: int
      avg_score: float
      avg_kill_ratio: float

  class ProgressTimelineResponse(BaseModel):
      entries: List[TimelineEntry]
      range: str
      total_submissions: int
  ```

### 6. [BE] Progress 서비스

- [x] **파일 생성**: `backend/app/services/progress_service.py`
  ```python
  class ProgressService:
      def __init__(self, db: Session):
          self.db = db

      def get_summary(self, user_id: UUID) -> ProgressSummaryResponse:
          """성장 요약 조회"""
          # 기본 통계
          stats = self.db.query(
              func.count(Submission.id).label('total'),
              func.count(case((Submission.status == 'SUCCESS', 1))).label('success'),
              func.avg(Submission.score).label('avg_score'),
              func.max(Submission.score).label('best_score'),
              func.avg(
                  case((
                      Submission.total_mutants > 0,
                      Submission.killed_mutants * 1.0 / Submission.total_mutants
                  ))
              ).label('avg_kill_ratio'),
          ).filter(
              Submission.user_id == user_id,
              Submission.status.in_(['SUCCESS', 'FAILURE'])
          ).first()

          # 최근 10회 평균
          recent_scores = self.db.query(Submission.score).filter(
              Submission.user_id == user_id,
              Submission.status.in_(['SUCCESS', 'FAILURE'])
          ).order_by(Submission.created_at.desc()).limit(10).all()

          recent_avg = sum(s.score for s in recent_scores) / len(recent_scores) if recent_scores else 0

          return ProgressSummaryResponse(
              total_submissions=stats.total or 0,
              success_submissions=stats.success or 0,
              avg_score=stats.avg_score or 0,
              avg_kill_ratio=stats.avg_kill_ratio or 0,
              best_score=stats.best_score or 0,
              recent_avg_score=recent_avg,
              difficulty_stats=self.get_difficulty_stats(user_id),
              tag_stats=self.get_tag_stats(user_id),
          )

      def get_timeline(self, user_id: UUID, range: str) -> ProgressTimelineResponse:
          """시계열 데이터 조회"""
          days = {'7d': 7, '30d': 30, '90d': 90, 'all': 365 * 10}[range]
          start_date = datetime.now(timezone.utc) - timedelta(days=days)

          entries = self.db.query(
              func.date(Submission.created_at).label('date'),
              func.count(Submission.id).label('submission_count'),
              func.avg(Submission.score).label('avg_score'),
              func.avg(
                  case((
                      Submission.total_mutants > 0,
                      Submission.killed_mutants * 1.0 / Submission.total_mutants
                  ))
              ).label('avg_kill_ratio'),
          ).filter(
              Submission.user_id == user_id,
              Submission.status.in_(['SUCCESS', 'FAILURE']),
              Submission.created_at >= start_date,
          ).group_by(
              func.date(Submission.created_at)
          ).order_by(
              func.date(Submission.created_at)
          ).all()

          return ProgressTimelineResponse(
              entries=[
                  TimelineEntry(
                      date=str(e.date),
                      submission_count=e.submission_count,
                      avg_score=e.avg_score or 0,
                      avg_kill_ratio=e.avg_kill_ratio or 0,
                  )
                  for e in entries
              ],
              range=range,
              total_submissions=sum(e.submission_count for e in entries),
          )
  ```

### 7. [BE] 라우터 등록

- [x] **파일 수정**: `backend/app/main.py`
  ```python
  from app.api import progress

  app.include_router(progress.router, prefix="/api/v1")
  ```

### 8. [BE] (선택) Progress 스냅샷 캐시

- [x] **목적**: 대량 데이터 시 성능 최적화
- [x] **테이블 생성**:
  ```sql
  CREATE TABLE user_progress_snapshots (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      snapshot_date DATE NOT NULL,
      total_submissions INTEGER NOT NULL,
      success_submissions INTEGER NOT NULL,
      avg_score FLOAT NOT NULL,
      avg_kill_ratio FLOAT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

      UNIQUE(user_id, snapshot_date)
  );
  ```
- [x] **일별 배치 작업**: Celery Beat으로 매일 자정에 스냅샷 생성
- [x] **우선순위**: 사용자 수 증가 시 구현

---

## 관련 파일

| 파일 | 작업 유형 |
|------|-----------|
| `backend/app/api/progress.py` | 신규 생성 |
| `backend/app/schemas/progress.py` | 신규 생성 |
| `backend/app/services/progress_service.py` | 신규 생성 |
| `backend/app/main.py` | 수정 |

---

## 완료 조건

- [x] `/api/v1/progress/summary` API 정상 동작
- [x] `/api/v1/progress/timeline` API 정상 동작
- [x] 난이도별 집계 정확성 확인
- [x] 태그별 집계 정확성 확인
- [x] 데이터 없는 신규 유저 응답 처리

---

## API 명세

### GET /api/v1/progress/summary

**Response**:
```json
{
  "total_submissions": 42,
  "success_submissions": 35,
  "avg_score": 78.5,
  "avg_kill_ratio": 0.72,
  "best_score": 100,
  "recent_avg_score": 82.3,
  "difficulty_stats": [
    {
      "difficulty": "EASY",
      "submission_count": 15,
      "avg_score": 85.2,
      "success_rate": 0.93
    },
    {
      "difficulty": "MEDIUM",
      "submission_count": 20,
      "avg_score": 75.8,
      "success_rate": 0.80
    },
    {
      "difficulty": "HARD",
      "submission_count": 7,
      "avg_score": 68.4,
      "success_rate": 0.57
    }
  ],
  "tag_stats": [
    {
      "tag": "array",
      "submission_count": 12,
      "avg_score": 80.1
    },
    {
      "tag": "string",
      "submission_count": 8,
      "avg_score": 76.3
    }
  ]
}
```

### GET /api/v1/progress/timeline

**Query Parameters**:
- `range`: `7d`, `30d`, `90d`, `all` (default: `30d`)

**Response**:
```json
{
  "entries": [
    {
      "date": "2025-01-01",
      "submission_count": 3,
      "avg_score": 75.0,
      "avg_kill_ratio": 0.68
    },
    {
      "date": "2025-01-02",
      "submission_count": 5,
      "avg_score": 82.4,
      "avg_kill_ratio": 0.75
    }
  ],
  "range": "30d",
  "total_submissions": 42
}
```

---

## 테스트 케이스

1. **Summary API 테스트**
   - 제출 이력이 있는 사용자 → 정상 응답
   - 제출 이력이 없는 신규 사용자 → 빈 응답 (0 값들)
   - 비로그인 상태 → 401 Unauthorized

2. **Timeline API 테스트**
   - 7d, 30d, 90d 각각 정상 동작
   - 기간 내 데이터가 없으면 빈 배열
   - 잘못된 range 값 → 400 Bad Request

3. **난이도별 집계 테스트**
   - EASY, MEDIUM, HARD 각각 정확한 집계
   - 특정 난이도에 제출이 없으면 해당 항목 생략

4. **태그별 집계 테스트**
   - 상위 20개 태그만 반환
   - 제출 수 기준 내림차순 정렬

5. **성능 테스트**
   - 1000개 이상 제출 이력에서 응답 시간 < 500ms

---

## 쿼리 최적화

### 인덱스 확인

```sql
-- submissions 테이블
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- problems 테이블
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
```

### N+1 방지

- 난이도별, 태그별 집계는 단일 쿼리로 처리
- JOIN 사용하여 추가 쿼리 방지

---

## 주의사항

- 인증 필수 (회원 전용 API)
- 게스트 사용자는 Progress API 사용 불가 (로그인 유도)
- 대량 데이터 시 쿼리 성능 모니터링 필요
- 태그 집계는 PostgreSQL JSONB 함수 사용 (DB 종속성)
