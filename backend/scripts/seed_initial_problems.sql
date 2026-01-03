-- Seed & Drip: 초기 문제 공개 스크립트
-- 실행 시점: 마이그레이션 (j0k1l2m3n4o5_add_visibility_fields.py) 적용 후
-- 실행 방법 (EC2):
--   1. 마이그레이션: docker exec qa_arena_backend_prod alembic upgrade head
--   2. Seed 실행:    cat backend/scripts/seed_initial_problems.sql | docker exec -i qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena

-- 1단계: 모든 문제 비공개 처리 (안전장치)
UPDATE problems
SET is_visible = false, published_at = NULL
WHERE is_visible IS NULL OR is_visible = true;

-- 2단계: 메인 페이지 showcase 문제들 즉시 공개 (18개)
-- 기준: frontend/app/page.tsx의 showcase + recommendedProblems에서 참조하는 모든 문제
UPDATE problems
SET is_visible = true, published_at = NOW()
WHERE slug IN (
  -- common (3개)
  'problem-e04',    -- 점수 등급 계산 함수 테스트 (Easy)
  'problem-h01',    -- 장바구니 복합 할인 계산 테스트 (Hard)
  'problem-m02',    -- 할인 계산기 조합 테스트 (Medium)

  -- commerce (3개)
  'problem-e05',    -- 입장료 계산 함수 테스트 (Easy)
  'problem-e06',    -- 배송비 계산 함수 테스트 (Easy)
  'problem-h02',    -- CSV 고객 데이터 변환 테스트 (Hard)

  -- saas (3개)
  'problem-sa-e01', -- API 필수 파라미터 검증 테스트 (Easy)
  'problem-m01',    -- 이메일 주소 유효성 검증 테스트 (Medium)
  'problem-h07',    -- Rate Limiter 토큰 버킷 테스트 (Hard)

  -- fintech (3개)
  'problem-ft-e01', -- 출금 가능 여부 판단 테스트 (Easy)
  'problem-ft-e03', -- 거래 금액 구간별 수수료 계산 테스트 (Easy)
  'problem-h04',    -- 계층형 예외 처리 주문 테스트 (Hard)

  -- platform (3개)
  'problem-pl-e01', -- JWT 토큰 형식 검증 테스트 (Easy)
  'problem-h09',    -- 서킷브레이커 상태 머신 테스트 (Hard)
  'problem-m07',    -- 비결정적 코드의 결정적 테스트 (Medium)

  -- content (3개)
  'problem-e03',    -- 장바구니 아이템 검증 테스트 (Easy)
  'problem-m08',    -- 페이지네이션 응답 헬퍼 테스트 (Medium)
  'problem-ct-h01'  -- 안전한 마크다운 HTML 변환기 테스트 (Hard)
);

-- 3단계: 결과 확인
SELECT
  COUNT(*) FILTER (WHERE is_visible = true) as visible_count,
  COUNT(*) FILTER (WHERE is_visible = false) as hidden_count,
  COUNT(*) as total_count
FROM problems;

-- 공개된 문제 목록 확인
SELECT slug, title, difficulty, domain, is_visible, published_at
FROM problems
WHERE is_visible = true
ORDER BY domain, difficulty;
