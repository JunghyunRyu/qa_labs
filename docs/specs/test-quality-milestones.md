# 테스트 품질 평가 시스템 - 마일스톤

> **테크 스펙**: [test-quality-system.md](./test-quality-system.md)
> **최종 업데이트**: 2024-12

---

## 진행 상황 요약

| Phase | 상태 | 완료율 |
|-------|------|--------|
| Phase 0: 스파이크 | 진행 중 | 3/5 |
| Phase 1: 스키마 | 대기 | 0/5 |
| Phase 2: 분석 엔진 | 대기 | 0/4 |
| Phase 3: AI 연계 | 대기 | 0/3 |
| Phase 4: 프론트엔드 | 대기 | 0/4 |

---

## Phase 0: 스파이크 (스키마 없이)

> **목적**: 분류 정확도 검증 후 스키마 확정
> **산출물**: 샘플 분석 리포트, 카테고리 정의 확정

### 체크리스트

- [x] **P0-1**: TestCaseParser 구현
  - [x] AST 파싱 기본 구조
  - [x] `@pytest.mark.parametrize` 1급 지원
  - [x] fixture 감지
  - [x] `pytest.raises` 감지
  - 파일: `backend/app/services/test_case_parser.py`

- [x] **P0-2**: 분류 로직 구현 (룰 기반)
  - [x] ValueType 분류기
  - [x] InputDiversity 분류기
  - [x] TestPurpose 분류기
  - [x] AntiPattern 감지기
  - 파일: `backend/app/services/test_quality_classifier.py`

- [x] **P0-3**: confidence 계산 로직 구현
  - [x] UNKNOWN 값 비율 기반 신뢰도 계산
  - [x] parametrize 케이스 포함 계산

- [ ] **P0-4**: 스파이크 실행 스크립트 작성
  - 파일: `backend/scripts/coverage_spike.py`

- [ ] **P0-5**: 샘플 데이터로 검증 및 리포트 생성
  - [ ] 20~30개 문제/제출 샘플 수집
  - [ ] 분석 결과 리포트 생성
  - [ ] 카테고리 정의 조정 (필요시)

### 완료 기준
- [ ] parametrize 케이스가 올바르게 파싱됨
- [ ] confidence 0.7 이상인 샘플이 70% 이상
- [ ] 카테고리 분류 결과가 직관적으로 맞음

---

## Phase 1: 스키마 확정

> **선행 조건**: Phase 0 완료
> **주의**: Alembic 마이그레이션 전 반드시 백업 ([backup_restore.md](./backup_restore.md))

### 체크리스트

- [ ] **P1-1**: 스파이크 결과 반영하여 스키마 확정
  - [ ] 카테고리 정의 최종 확정
  - [ ] JSONB 구조 최종 확정

- [ ] **P1-2**: Pydantic 스키마 정의
  - 파일: `backend/app/schemas/test_quality.py`

- [ ] **P1-3**: SQLAlchemy 모델 정의
  - 파일: `backend/app/models/test_quality.py`
  - [ ] submissions 테이블 확장
  - [ ] analysis_runs 테이블 생성
  - [ ] problems 테이블 확장

- [ ] **P1-4**: Alembic 마이그레이션
  - [ ] 백업 완료 확인
  - [ ] 마이그레이션 파일 생성
  - [ ] 로컬 테스트
  - [ ] 프로덕션 적용

- [ ] **P1-5**: Repository 클래스 구현
  - 파일: `backend/app/repositories/test_quality_repository.py`

---

## Phase 2: 분석 엔진 + API

> **선행 조건**: Phase 1 완료

### 체크리스트

- [ ] **P2-1**: TestQualityAnalyzer 구현
  - [ ] 포화 함수 적용
  - [ ] 중복 가산 방지 로직
  - [ ] AntiPattern 감점 적용
  - 파일: `backend/app/services/test_quality_analyzer.py`

- [ ] **P2-2**: API 엔드포인트 구현 (권한 분리)
  - [ ] Admin 전용 엔드포인트
  - [ ] 사용자 엔드포인트
  - 파일: `backend/app/api/test_quality.py`

- [ ] **P2-3**: 제출 채점 후 자동 분석 연동
  - 수정 파일: `backend/app/services/submission_service.py`

- [ ] **P2-4**: 단위 테스트 작성
  - 파일: `backend/tests/services/test_quality_analyzer_test.py`

---

## Phase 3: AI 연계

> **선행 조건**: Phase 2 완료

### 체크리스트

- [ ] **P3-1**: Admin용 AI 테스트 생성 서비스
  - 파일: `backend/app/services/ai_test_generator.py`

- [ ] **P3-2**: 사용자용 텍스트 힌트 생성 서비스
  - 파일: `backend/app/services/test_hint_generator.py`

- [ ] **P3-3**: AI 피드백과 연동
  - 수정 파일: `backend/app/services/ai_feedback_engine.py`

---

## Phase 4: 프론트엔드

> **선행 조건**: Phase 2 완료 (Phase 3과 병렬 가능)

### 체크리스트

- [ ] **P4-1**: TypeScript 타입 정의
  - 파일: `frontend/types/test-quality.ts`

- [ ] **P4-2**: 품질 분석 컴포넌트 구현
  - [ ] QualityGauge.tsx
  - [ ] BreakdownChart.tsx
  - [ ] AntiPatternList.tsx
  - 디렉토리: `frontend/components/test-quality/`

- [ ] **P4-3**: Admin 대시보드 구현
  - 파일: `frontend/app/admin/test-quality/page.tsx`

- [ ] **P4-4**: 제출 결과 페이지에 품질 분석 추가
  - 수정 파일: `frontend/app/problems/[slug]/page.tsx`

---

## 작업 로그

> 세션별 진행 상황 기록

### 2024-12-21 (세션 1)
- [x] **P0-1 완료**: TestCaseParser 구현
  - AST 파싱 기본 구조
  - `@pytest.mark.parametrize` 1급 지원 (multi-param, nested values 포함)
  - fixture 감지 (함수 파라미터 기반)
  - `pytest.raises` 감지 (context manager, exception type 추출)
  - assertion 분석 (Equal, NotEqual, In, True, False 등)
  - pytest markers 감지 (skip, xfail 등)
- [x] 단위 테스트 34개 작성 및 통과
  - 파일: `backend/tests/test_test_case_parser.py`
- [x] **P0-2 완료**: TestQualityClassifier 구현
  - ValueType 분류기 (NORMAL, BOUNDARY, EDGE, NEGATIVE, EXTREME)
  - InputDiversity 분류기 (SINGLE, MULTIPLE, EMPTY, DUPLICATE, MIXED_TYPES)
  - TestPurpose 분류기 (HAPPY_PATH, ERROR_HANDLING, BOUNDARY_CHECK 등)
  - AntiPattern 감지기 (NO_ASSERTION, EXCEPTION_SWALLOWED 등)
- [x] **P0-3 완료**: confidence 계산 로직 구현
  - UNKNOWN 비율 기반 신뢰도 계산
  - 테스트별/전체 신뢰도 산출
- [x] 단위 테스트 49개 작성 및 통과
  - 파일: `backend/tests/test_test_quality_classifier.py`

---

## 참고

### 세션 재개 시 확인 사항
1. 이 파일의 체크리스트 상태 확인
2. 현재 Phase의 미완료 항목 파악
3. 테크 스펙 참조: [test-quality-system.md](./test-quality-system.md)

### 관련 명령어
```bash
# 스파이크 실행
python backend/scripts/coverage_spike.py

# 마이그레이션 (Phase 1)
cd backend && alembic upgrade head

# 테스트 실행 (Parser)
pytest backend/tests/test_test_case_parser.py -v

# 테스트 실행 (Analyzer - Phase 2)
pytest backend/tests/services/test_quality_analyzer_test.py
```
