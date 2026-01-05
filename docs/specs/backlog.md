# QA Labs 백로그

## P2-1: Hint 페널티 게스트 지원

### 현황
- **우선순위**: P2 (Medium)
- **상태**: 백로그
- **영향도**: 낮음 (게스트 사용자의 힌트 페널티만 미적용)

### 문제
현재 힌트 시스템은 로그인 사용자만 지원합니다. 게스트가 힌트를 조회해도 페널티가 적용되지 않아 공정성 이슈가 있습니다.

### 필요 작업
1. **DB 마이그레이션**: `hint_views` 테이블에 `anonymous_id` 컬럼 추가
   ```sql
   ALTER TABLE hint_views ADD COLUMN anonymous_id VARCHAR(64);
   CREATE INDEX idx_hint_views_anonymous_id ON hint_views(anonymous_id);
   ```

2. **모델 수정**: `backend/app/models/hint_view.py`
   ```python
   anonymous_id = Column(String(64), nullable=True, index=True)
   ```

3. **API 수정**: `backend/app/api/problems.py`
   - `get_hints()`: 게스트 조회 지원
   - `view_hint()`: 게스트 기록 지원 (anonymous_id 쿠키 사용)

4. **제출 로직 수정**: `backend/app/api/submissions.py`
   - 게스트 제출 시 anonymous_id로 힌트 페널티 조회

### 예상 소요
- 개발: 2-3시간
- 테스트: 1시간

### 트리거 조건
- 게스트 사용자 증가로 공정성 이슈 제기 시
- 힌트 시스템 리팩토링 시

---

## 완료된 보안 패치 이력

### 2025-01-05: 보안 패치 v1
- P0-1: 토큰 차감 Race Condition → 비관적 잠금
- P0-2: 클라이언트 점수 조작 → 검증률 20% + 임계값 70점
- P1-1: 게스트 제출 탈취 → 7일 마이그레이션 제한
- P1-2: JWT 검증 미흡 → payload 타입 검증
- P1-3: 에러 타입 노출 → 일반 메시지 반환
- P2-2: bookmark.problem None 체크
- P2-3: Quality 분석 재시도 로직
