-- Drip Schedule: 59개 문제 주 2회 자동 공개 스크립트
-- 실행 시점: seed_initial_problems.sql 실행 후
-- 실행 방법 (EC2):
--   cat backend/scripts/drip_schedule.sql | docker exec -i qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena
--
-- 스케줄: 주 2회 (월/목), 각 2개씩
-- 기간: 약 15주 (4개월)

-- ============================================================
-- Week 1: 시작 후 첫 주 (Mon +3일, Thu +6일)
-- ============================================================

-- Week 1 Mon (+3일): Very Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '3 days'
WHERE slug IN ('problem-ve01', 'problem-ve02');

-- Week 1 Thu (+6일): Very Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '6 days'
WHERE slug IN ('problem-ve03', 'problem-ve04');

-- ============================================================
-- Week 2 (Mon +10일, Thu +13일)
-- ============================================================

-- Week 2 Mon: Very Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '10 days'
WHERE slug IN ('problem-ve05', 'problem-ve06');

-- Week 2 Thu: Very Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '13 days'
WHERE slug IN ('problem-ve07', 'problem-ve08');

-- ============================================================
-- Week 3 (Mon +17일, Thu +20일)
-- ============================================================

-- Week 3 Mon: Very Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '17 days'
WHERE slug IN ('problem-ve09', 'problem-cm-ve01');

-- Week 3 Thu: Very Easy 도메인별 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '20 days'
WHERE slug IN ('problem-ct-ve01', 'problem-ft-ve01');

-- ============================================================
-- Week 4 (Mon +24일, Thu +27일)
-- ============================================================

-- Week 4 Mon: Very Easy + Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '24 days'
WHERE slug IN ('problem-ft-ve02', 'problem-pl-ve01');

-- Week 4 Thu: Very Easy + Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '27 days'
WHERE slug IN ('problem-pl-ve02', 'problem-sa-ve01');

-- ============================================================
-- Week 5 (Mon +31일, Thu +34일) - Easy 시작
-- ============================================================

-- Week 5 Mon: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '31 days'
WHERE slug IN ('problem-e01', 'problem-e02');

-- Week 5 Thu: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '34 days'
WHERE slug IN ('problem-e07', 'problem-e08');

-- ============================================================
-- Week 6 (Mon +38일, Thu +41일)
-- ============================================================

-- Week 6 Mon: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '38 days'
WHERE slug IN ('problem-e09', 'problem-e10');

-- Week 6 Thu: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '41 days'
WHERE slug IN ('problem-e11', 'problem-e12');

-- ============================================================
-- Week 7 (Mon +45일, Thu +48일)
-- ============================================================

-- Week 7 Mon: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '45 days'
WHERE slug IN ('problem-e13', 'problem-e14');

-- Week 7 Thu: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '48 days'
WHERE slug IN ('problem-e15', 'problem-e16');

-- ============================================================
-- Week 8 (Mon +52일, Thu +55일)
-- ============================================================

-- Week 8 Mon: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '52 days'
WHERE slug IN ('problem-e17', 'problem-e18');

-- Week 8 Thu: Easy 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '55 days'
WHERE slug IN ('problem-e19', 'problem-e20');

-- ============================================================
-- Week 9 (Mon +59일, Thu +62일) - Easy 도메인별
-- ============================================================

-- Week 9 Mon: Easy 도메인별 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '59 days'
WHERE slug IN ('problem-co-e01', 'problem-fp-e01');

-- Week 9 Thu: Easy 도메인별 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '62 days'
WHERE slug IN ('problem-ft-e02', 'problem-md-e01');

-- ============================================================
-- Week 10 (Mon +66일, Thu +69일)
-- ============================================================

-- Week 10 Mon: Easy 도메인별 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '66 days'
WHERE slug IN ('problem-pl-e02', 'problem-pl-e03');

-- Week 10 Thu: Easy 도메인별 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '69 days'
WHERE slug IN ('problem-sa-e02', 'problem-m03');

-- ============================================================
-- Week 11 (Mon +73일, Thu +76일) - Medium 시작
-- ============================================================

-- Week 11 Mon: Medium 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '73 days'
WHERE slug IN ('problem-m04', 'problem-m05');

-- Week 11 Thu: Medium 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '76 days'
WHERE slug IN ('problem-m06', 'problem-m09');

-- ============================================================
-- Week 12 (Mon +80일, Thu +83일)
-- ============================================================

-- Week 12 Mon: Medium 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '80 days'
WHERE slug IN ('problem-m10', 'problem-m11');

-- Week 12 Thu: Medium 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '83 days'
WHERE slug IN ('problem-m12', 'problem-m13');

-- ============================================================
-- Week 13 (Mon +87일, Thu +90일)
-- ============================================================

-- Week 13 Mon: Medium 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '87 days'
WHERE slug IN ('problem-m14', 'problem-co-m01');

-- Week 13 Thu: Medium 도메인별 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '90 days'
WHERE slug IN ('problem-fp-m01', 'problem-md-m01');

-- ============================================================
-- Week 14 (Mon +94일, Thu +97일) - Hard 시작
-- ============================================================

-- Week 14 Mon: Hard 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '94 days'
WHERE slug IN ('problem-h03', 'problem-h05');

-- Week 14 Thu: Hard 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '97 days'
WHERE slug IN ('problem-h06', 'problem-h08');

-- ============================================================
-- Week 15 (Mon +101일, Thu +104일)
-- ============================================================

-- Week 15 Mon: Hard 2개
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '101 days'
WHERE slug IN ('problem-h10', 'problem-h11');

-- Week 15 Thu: Hard 2개 (마지막)
UPDATE problems SET is_visible = true, published_at = NOW() + INTERVAL '104 days'
WHERE slug IN ('problem-h12', 'problem-ct-h01');

-- ============================================================
-- 결과 확인
-- ============================================================

-- 공개 상태 요약
SELECT
  COUNT(*) FILTER (WHERE is_visible = true AND published_at <= NOW()) as "즉시공개",
  COUNT(*) FILTER (WHERE is_visible = true AND published_at > NOW()) as "예약공개",
  COUNT(*) FILTER (WHERE is_visible = false) as "비공개",
  COUNT(*) as "전체"
FROM problems;

-- 주별 공개 예정 확인 (첫 4주)
SELECT
  slug,
  title,
  difficulty,
  domain,
  published_at,
  EXTRACT(WEEK FROM published_at) - EXTRACT(WEEK FROM NOW()) as "주차"
FROM problems
WHERE is_visible = true AND published_at > NOW()
ORDER BY published_at
LIMIT 20;
