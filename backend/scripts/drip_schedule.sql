-- ============================================================
-- QA Arena Drip Schedule SQL
-- 비공개 문제들을 주 2회(월/목) 자동 공개 스케줄링
-- ============================================================
--
-- 실행 방법 (EC2):
--   docker exec -i qa_arena_postgres_prod psql -U qa_arena -d qa_arena < backend/scripts/drip_schedule.sql
--
-- 스케줄 전략:
--   - 주 2회: 목요일, 월요일 순서로 공개
--   - 시작일: 다음 주 목요일 (09:00 KST = 00:00 UTC)
--   - 난이도 순서: Very Easy → Easy → Medium → Hard
--   - 각 회차당 1개 문제
--   - 한 번 실행하면 published_at이 설정되고, 해당 날짜가 되면 자동 공개
--
-- ============================================================

-- ============================================================
-- 1. 현재 상태 확인
-- ============================================================

SELECT '=== 현재 문제 상태 ===' as info;

SELECT
    COUNT(*) as total_problems,
    COUNT(*) FILTER (WHERE is_visible = true AND (published_at IS NULL OR published_at <= NOW())) as currently_visible,
    COUNT(*) FILTER (WHERE is_visible = true AND published_at > NOW()) as scheduled_future,
    COUNT(*) FILTER (WHERE is_visible = false) as hidden
FROM problems;

-- ============================================================
-- 2. 스케줄 대상 확인 (비공개 문제들)
-- ============================================================

SELECT '=== 스케줄 대상 문제 (비공개) ===' as info;

SELECT id, slug, title, difficulty, domain
FROM problems
WHERE is_visible = false
ORDER BY
    CASE difficulty
        WHEN 'Very Easy' THEN 1
        WHEN 'Easy' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Hard' THEN 4
    END,
    domain,
    id
LIMIT 20;

-- ============================================================
-- 3. 스케줄 미리보기 (UPDATE 전 확인)
-- ============================================================

SELECT '=== 스케줄 미리보기 ===' as info;

WITH hidden_problems AS (
    SELECT
        id,
        slug,
        title,
        difficulty,
        domain,
        ROW_NUMBER() OVER (
            ORDER BY
                CASE difficulty
                    WHEN 'Very Easy' THEN 1
                    WHEN 'Easy' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Hard' THEN 4
                END,
                domain,
                id
        ) as seq
    FROM problems
    WHERE is_visible = false
),
schedule AS (
    SELECT
        id,
        slug,
        title,
        difficulty,
        domain,
        seq,
        -- 시작일: 다음 주 목요일 09:00 KST (= 00:00 UTC)
        -- seq 1: Week 1 목요일
        -- seq 2: Week 2 월요일
        -- seq 3: Week 2 목요일
        -- seq 4: Week 3 월요일 ...
        -- 홀수 seq: 목요일 (week_num * 7일)
        -- 짝수 seq: 월요일 (week_num * 7 + 4일, 목요일 다음 월요일)
        CASE
            WHEN seq % 2 = 1 THEN  -- 목요일 (1번째, 3번째, 5번째...)
                DATE_TRUNC('week', NOW() + INTERVAL '1 week') + INTERVAL '3 days'  -- 다음 주 목요일
                + (((seq - 1) / 2) * 7 || ' days')::interval
            ELSE  -- 월요일 (2번째, 4번째, 6번째...)
                DATE_TRUNC('week', NOW() + INTERVAL '1 week') + INTERVAL '7 days'  -- 다다음 주 월요일
                + (((seq - 2) / 2) * 7 || ' days')::interval
        END as scheduled_date
    FROM hidden_problems
)
SELECT
    seq as "#",
    slug,
    difficulty,
    domain,
    TO_CHAR(scheduled_date, 'YYYY-MM-DD (Dy)') as "공개일(UTC)",
    CASE
        WHEN seq % 2 = 1 THEN 'Thu'
        ELSE 'Mon'
    END as "요일",
    ((seq + 1) / 2) as "주차"
FROM schedule
ORDER BY scheduled_date
LIMIT 30;

-- ============================================================
-- 4. 실제 UPDATE 실행 (주석 해제 후 실행)
-- ============================================================

-- !!! 주의: 아래 UPDATE를 실행하면 실제 스케줄이 적용됩니다 !!!

WITH hidden_problems AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            ORDER BY
                CASE difficulty
                    WHEN 'Very Easy' THEN 1
                    WHEN 'Easy' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Hard' THEN 4
                END,
                domain,
                id
        ) as seq
    FROM problems
    WHERE is_visible = false
),
schedule AS (
    SELECT
        id,
        CASE
            WHEN seq % 2 = 1 THEN  -- 목요일
                DATE_TRUNC('week', NOW() + INTERVAL '1 week') + INTERVAL '3 days'
                + (((seq - 1) / 2) * 7 || ' days')::interval
            ELSE  -- 월요일
                DATE_TRUNC('week', NOW() + INTERVAL '1 week') + INTERVAL '7 days'
                + (((seq - 2) / 2) * 7 || ' days')::interval
        END as scheduled_date
    FROM hidden_problems
)
UPDATE problems p
SET
    is_visible = true,
    published_at = s.scheduled_date
FROM schedule s
WHERE p.id = s.id;

SELECT '=== UPDATE 완료 ===' as info;

-- ============================================================
-- 5. 스케줄 적용 후 확인 쿼리
-- ============================================================

/*
-- 주별 공개 예정 요약
SELECT
    TO_CHAR(DATE_TRUNC('week', published_at), 'YYYY-MM-DD') as week_start,
    COUNT(*) as problem_count,
    STRING_AGG(difficulty, ', ' ORDER BY published_at) as difficulties
FROM problems
WHERE is_visible = true AND published_at > NOW()
GROUP BY DATE_TRUNC('week', published_at)
ORDER BY week_start
LIMIT 20;

-- 다음 5개 공개 예정 문제
SELECT
    slug,
    title,
    difficulty,
    domain,
    TO_CHAR(published_at, 'YYYY-MM-DD (Dy) HH24:MI') as "공개일(UTC)",
    EXTRACT(DAY FROM published_at - NOW())::int as "D-Day"
FROM problems
WHERE is_visible = true AND published_at > NOW()
ORDER BY published_at
LIMIT 5;
*/

-- ============================================================
-- 6. 유틸리티: 특정 문제 공개일 수동 변경
-- ============================================================

/*
-- 예: 특정 문제를 즉시 공개
UPDATE problems
SET is_visible = true, published_at = NOW()
WHERE slug = 'your-problem-slug';

-- 예: 특정 문제를 특정 날짜에 공개
UPDATE problems
SET is_visible = true, published_at = '2026-02-01 00:00:00+00'::timestamptz
WHERE slug = 'your-problem-slug';

-- 예: 특정 문제 비공개로 전환
UPDATE problems
SET is_visible = false
WHERE slug = 'your-problem-slug';
*/
