# 테스트 품질 평가 시스템 - 마일스톤

> **테크 스펙**: [test-quality-system.md](./test-quality-system.md)
> **최종 업데이트**: 2024-12

---

## 진행 상황 요약

| Phase | 상태 | 완료율 |
|-------|------|--------|
| Phase 0: 스파이크 | ✅ 완료 | 5/5 |
| Phase 1: 스키마 | ✅ 완료 | 5/5 |
| Phase 2: 분석 엔진 | ✅ 완료 | 4/4 |
| Phase 3: AI 연계 | ✅ 완료 | 3/3 |
| Phase 4: 프론트엔드 | ✅ 완료 | 4/4 |

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

- [x] **P0-4**: 스파이크 실행 스크립트 작성
  - 파일: `backend/scripts/coverage_spike.py`

- [x] **P0-5**: 샘플 데이터로 검증 및 리포트 생성
  - [x] 25개 샘플 테스트 코드 작성
  - [x] 분석 결과 리포트 생성 (`backend/scripts/spike_report.json`)
  - [x] 카테고리 정의 확인 완료 (조정 불필요)

### 완료 기준
- [x] parametrize 케이스가 올바르게 파싱됨 (effective_test_count 정확)
- [x] confidence 0.7 이상인 샘플이 70% 이상 (100% 달성)
- [x] 카테고리 분류 결과가 직관적으로 맞음 (검증 완료)

---

## Phase 1: 스키마 확정

> **선행 조건**: Phase 0 완료
> **주의**: Alembic 마이그레이션 전 반드시 백업 ([backup_restore.md](./backup_restore.md))

### 체크리스트

- [x] **P1-1**: 스파이크 결과 반영하여 스키마 확정
  - [x] 카테고리 정의 최종 확정
  - [x] JSONB 구조 최종 확정

- [x] **P1-2**: Pydantic 스키마 정의
  - 파일: `backend/app/schemas/test_quality.py`

- [x] **P1-3**: SQLAlchemy 모델 정의
  - 파일: `backend/app/models/test_quality.py`
  - [x] submissions 테이블 확장
  - [x] analysis_runs 테이블 생성
  - [x] problems 테이블 확장

- [x] **P1-4**: Alembic 마이그레이션
  - [x] 마이그레이션 파일 생성 (`a1b2c3d4e5f6`)
  - [x] 로컬 테스트
  - [x] 프로덕션 적용

- [x] **P1-5**: Repository 클래스 구현
  - 파일: `backend/app/repositories/test_quality_repository.py`

---

## Phase 2: 분석 엔진 + API

> **선행 조건**: Phase 1 완료

### 체크리스트

- [x] **P2-1**: TestQualityAnalyzer 구현
  - [x] 포화 함수 적용
  - [x] 중복 가산 방지 로직
  - [x] AntiPattern 감점 적용
  - 파일: `backend/app/services/test_quality_analyzer.py`

- [x] **P2-2**: API 엔드포인트 구현 (권한 분리)
  - [x] Admin 전용 엔드포인트
  - [x] 사용자 엔드포인트
  - 파일: `backend/app/api/test_quality.py`

- [x] **P2-3**: 제출 채점 후 자동 분석 연동
  - 수정 파일: `backend/app/services/submission_service.py`
  - 수정 파일: `backend/app/api/submissions.py` (클라이언트 실행)

- [x] **P2-4**: 단위 테스트 작성
  - 파일: `backend/tests/test_test_quality_analyzer.py`
  - 테스트 30개 작성 및 통과

---

## Phase 3: AI 연계

> **선행 조건**: Phase 2 완료

### 체크리스트

- [x] **P3-1**: Admin용 AI 테스트 생성 서비스
  - 파일: `backend/app/services/ai_test_generator.py`
  - [x] 부족한 카테고리 커버 테스트 생성
  - [x] 코드 구문 유효성 검사
  - [x] API 엔드포인트: `POST /api/v1/admin/test-quality/generate-tests/{problem_id}`
  - [x] 단위 테스트 21개 작성 및 통과

- [x] **P3-2**: 사용자용 텍스트 힌트 생성 서비스
  - 파일: `backend/app/services/test_hint_generator.py`
  - [x] 코드 미포함 정책 (중간 수준: 개념 언급 허용)
  - [x] 사고 유도 질문 포함
  - [x] API 엔드포인트: `GET /api/v1/test-quality/submissions/{id}/hints`
  - [x] 단위 테스트 18개 작성 및 통과

- [x] **P3-3**: AI 피드백과 연동
  - 수정 파일: `backend/app/services/ai_feedback_engine.py`
  - [x] `test_quality_analysis` 파라미터 추가
  - [x] 프롬프트에 품질 분석 섹션 추가
  - [x] 하위 호환성 유지
  - [x] 단위 테스트 10개 작성 및 통과

---

## Phase 4: 프론트엔드

> **선행 조건**: Phase 2 완료 (Phase 3과 병렬 가능)

### 체크리스트

- [x] **P4-1**: TypeScript 타입 정의
  - 파일: `frontend/types/test-quality.ts`
  - [x] 카테고리 Enum/Type 정의
  - [x] 한글 라벨 매핑
  - [x] API 응답 타입 정의
  - [x] 유틸리티 함수 추가

- [x] **P4-2**: 품질 분석 컴포넌트 구현
  - [x] QualityGauge.tsx (원형 게이지)
  - [x] BreakdownChart.tsx (점수 세부/커버리지)
  - [x] AntiPatternList.tsx (안티패턴 목록)
  - [x] HintDisplay.tsx (힌트 표시)
  - [x] TestQualityPanel.tsx (통합 패널)
  - 디렉토리: `frontend/components/test-quality/`

- [x] **P4-3**: Admin 대시보드 구현
  - 파일: `frontend/app/admin/test-quality/page.tsx`
  - [x] 등급별 통계 카드
  - [x] 파이 차트/막대 차트
  - [x] 등급별 상세 테이블

- [x] **P4-4**: 제출 결과 페이지에 품질 분석 추가
  - 수정 파일: `frontend/components/SubmissionResult.tsx`
  - [x] TestQualityPanel 통합
  - [x] 힌트 로드 기능

---

## 작업 로그

> 세션별 진행 상황 기록

### 2024-12-22 (세션 6)
- [x] **Phase 4 완료**: 프론트엔드 구현
  - P4-1: TypeScript 타입 정의
    - `frontend/types/test-quality.ts` 신규 생성
    - 모든 백엔드 스키마 타입 정의
    - 한글 라벨 매핑 (VALUE_TYPE_LABELS 등)
    - 유틸리티 함수 (getGradeFromScore, getScoreColor 등)
  - P4-2: 품질 분석 컴포넌트
    - `QualityGauge.tsx`: 원형 SVG 게이지 (등급별 그라디언트)
    - `BreakdownChart.tsx`: 점수 세부 막대 차트, 커버리지 진행률
    - `AntiPatternList.tsx`: 안티패턴 목록 (심각도별 그룹화)
    - `HintDisplay.tsx`: 사용자 힌트 표시
    - `TestQualityPanel.tsx`: 통합 패널 (접기/펼치기, 힌트 로드)
  - P4-3: Admin 대시보드
    - `frontend/app/admin/test-quality/page.tsx` 신규 생성
    - 통계 카드 (분석된 제출, 평균 점수, 최다 등급)
    - 파이 차트/막대 차트 (recharts)
    - 등급별 상세 테이블
  - P4-4: 제출 결과 페이지 연동
    - `SubmissionResult.tsx`에 TestQualityPanel 추가
    - Submission 타입 확장 (test_quality_* 필드)
    - API 클라이언트: `frontend/lib/api/test-quality.ts`

### 2024-12-22 (세션 5)
- [x] **Phase 3 완료**: AI 연계 기능 구현
  - P3-3: AI 피드백 연동
    - `generate_feedback()`에 `test_quality_analysis` 파라미터 추가
    - `_build_quality_analysis_section()` 헬퍼 함수 추가
    - 품질 분석 결과를 프롬프트에 포함 (커버/부족 카테고리, 안티패턴)
    - 하위 호환성 유지 (Optional 파라미터)
  - P3-2: 사용자용 힌트 생성 서비스
    - `test_hint_generator.py` 신규 생성
    - 정책: 코드 금지, 테스트 기법 언급 허용 (중간 수준)
    - API: `GET /api/v1/test-quality/submissions/{id}/hints`
    - 기본 힌트 폴백 구현
  - P3-1: Admin용 AI 테스트 생성 서비스
    - `ai_test_generator.py` 신규 생성
    - 부족한 카테고리 커버 테스트 생성
    - API: `POST /api/v1/admin/test-quality/generate-tests/{problem_id}`
    - 코드 구문 유효성 검사 함수 포함
  - 단위 테스트 총 49개 작성 및 통과
    - P3-3: 10개
    - P3-2: 18개
    - P3-1: 21개

### 2024-12-22 (세션 4)
- [x] **Phase 2 완료**: 분석 엔진 + API 구현
  - P2-1: TestQualityAnalyzer 구현
    - 포화 함수 (0→0, 1→40, 2→70, 3→85, 4→95, 5→100)
    - 중복 가산 방지 (MIN_UNIQUE_TESTS_FOR_CATEGORY = 2)
    - AntiPattern 감점 적용
    - 등급 결정 (A:90+, B:75+, C:60+, D:40+, F:0+)
  - P2-2: API 엔드포인트
    - User: `/api/v1/test-quality/submissions/{id}/quality`
    - Admin: `/api/v1/test-quality/admin/analyze-submission/{id}`
    - Admin: `/api/v1/test-quality/admin/analyze-problem/{id}`
    - Admin: `/api/v1/test-quality/admin/statistics`
  - P2-3: 자동 분석 연동
    - 서버사이드: SubmissionService.process_submission()
    - 클라이언트사이드: submissions.py create_submission()
  - P2-4: 단위 테스트 30개 작성 및 통과

### 2024-12-22 (세션 3)
- [x] **Phase 1 완료**: 스키마 확정
  - P1-2: Pydantic 스키마 정의 (`backend/app/schemas/test_quality.py`)
    - AnalysisScope, AnalysisStatus, QualityGrade Enums
    - TestQualityAnalysis, RubricAnalysis JSONB 스키마
    - AnalysisRun CRUD 스키마
  - P1-3: SQLAlchemy 모델 정의
    - AnalysisRun 테이블 (4개 CHECK constraints)
    - Submission 확장 (test_quality_score, grade, analysis)
    - Problem 확장 (rubric_score, analysis)
  - P1-4: Alembic 마이그레이션 (`a1b2c3d4e5f6`)
    - 로컬 테스트 완료
    - 프로덕션 적용 완료
  - P1-5: TestQualityRepository 구현
  - 단위 테스트 23개 작성 및 통과

### 2024-12-21 (세션 2)
- [x] **P0-4 완료**: coverage_spike.py 스크립트 완성
  - 샘플 테스트 코드 25개 내장 (다양한 패턴 커버)
  - DB 연동 옵션 (`--db` 플래그)
  - JSON 리포트 출력
  - 완료 기준 자동 체크
- [x] **P0-5 완료**: 샘플 데이터 검증
  - 25개 샘플 테스트 코드 작성 및 검증
  - 분석 성공률: 92% (23/25, 실패는 빈파일/구문오류로 예상된 결과)
  - confidence 평균 99.3%, 전체 100% >= 0.7
- [x] **Phase 0 완료**: 스파이크 검증 성공
  - 모든 완료 기준 충족
  - 카테고리 분류 결과 직관적으로 맞음
  - Phase 1 (스키마 확정) 진행 가능

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
