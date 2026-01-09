-- =====================================================
-- DB Admin Agent - 데이터 분석 쿼리 모음
-- QA Labs 프로젝트 특화
-- =====================================================

-- -----------------------------------------------------
-- 1. 사용자 통계
-- -----------------------------------------------------

-- 사용자 현황 요약
SELECT
    COUNT(*) AS total_users,
    COUNT(CASE WHEN provider = 'github' THEN 1 END) AS github_users,
    COUNT(CASE WHEN provider = 'google' THEN 1 END) AS google_users,
    COUNT(CASE WHEN is_admin THEN 1 END) AS admin_users,
    SUM(tokens) AS total_tokens
FROM users;

-- 일별 신규 가입자
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS new_users,
    COUNT(CASE WHEN provider = 'github' THEN 1 END) AS github,
    COUNT(CASE WHEN provider = 'google' THEN 1 END) AS google
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 활성 사용자 (최근 7일 제출)
SELECT COUNT(DISTINCT user_id) AS active_users
FROM submissions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
AND user_id IS NOT NULL;


-- -----------------------------------------------------
-- 2. 문제 통계
-- -----------------------------------------------------

-- 난이도별 문제 현황
SELECT
    difficulty,
    COUNT(*) AS problem_count,
    COUNT(CASE WHEN is_active THEN 1 END) AS active_count
FROM problems
GROUP BY difficulty
ORDER BY
    CASE difficulty
        WHEN 'very_easy' THEN 1
        WHEN 'easy' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'hard' THEN 4
    END;

-- 카테고리별 문제 현황
SELECT
    category,
    COUNT(*) AS problem_count,
    ROUND(AVG(
        SELECT COUNT(*) FROM buggy_implementations bi WHERE bi.problem_id = p.id
    ), 1) AS avg_mutants
FROM problems p
GROUP BY category
ORDER BY problem_count DESC;

-- 문제별 제출 통계
SELECT
    p.id,
    p.title,
    p.difficulty,
    COUNT(s.id) AS submission_count,
    ROUND(AVG(s.score), 2) AS avg_score,
    COUNT(CASE WHEN s.score = 100 THEN 1 END) AS perfect_count,
    ROUND(
        COUNT(CASE WHEN s.score = 100 THEN 1 END) * 100.0 / NULLIF(COUNT(s.id), 0),
        2
    ) AS success_rate
FROM problems p
LEFT JOIN submissions s ON p.id = s.problem_id
GROUP BY p.id, p.title, p.difficulty
ORDER BY submission_count DESC;


-- -----------------------------------------------------
-- 3. 제출 통계
-- -----------------------------------------------------

-- 제출 현황 요약
SELECT
    COUNT(*) AS total_submissions,
    COUNT(CASE WHEN is_guest THEN 1 END) AS guest_submissions,
    COUNT(CASE WHEN NOT is_guest THEN 1 END) AS member_submissions,
    ROUND(AVG(score), 2) AS avg_score,
    ROUND(AVG(execution_time_ms), 2) AS avg_execution_time,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed
FROM submissions;

-- 일별 제출 추이
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS submissions,
    COUNT(CASE WHEN is_guest THEN 1 END) AS guest,
    COUNT(CASE WHEN NOT is_guest THEN 1 END) AS member,
    ROUND(AVG(score), 2) AS avg_score
FROM submissions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 시간대별 제출 분포
SELECT
    EXTRACT(HOUR FROM created_at) AS hour,
    COUNT(*) AS submission_count
FROM submissions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- 제출 상태별 현황
SELECT
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM submissions
GROUP BY status
ORDER BY count DESC;


-- -----------------------------------------------------
-- 4. 점수 분석
-- -----------------------------------------------------

-- 점수 분포
SELECT
    CASE
        WHEN score = 100 THEN '100 (Perfect)'
        WHEN score >= 80 THEN '80-99'
        WHEN score >= 60 THEN '60-79'
        WHEN score >= 40 THEN '40-59'
        WHEN score >= 20 THEN '20-39'
        ELSE '0-19'
    END AS score_range,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM submissions
WHERE status = 'completed'
GROUP BY
    CASE
        WHEN score = 100 THEN '100 (Perfect)'
        WHEN score >= 80 THEN '80-99'
        WHEN score >= 60 THEN '60-79'
        WHEN score >= 40 THEN '40-59'
        WHEN score >= 20 THEN '20-39'
        ELSE '0-19'
    END
ORDER BY
    CASE
        WHEN score_range = '100 (Perfect)' THEN 1
        WHEN score_range = '80-99' THEN 2
        WHEN score_range = '60-79' THEN 3
        WHEN score_range = '40-59' THEN 4
        WHEN score_range = '20-39' THEN 5
        ELSE 6
    END;

-- 난이도별 평균 점수
SELECT
    p.difficulty,
    COUNT(s.id) AS submissions,
    ROUND(AVG(s.score), 2) AS avg_score,
    ROUND(AVG(s.killed_mutants * 1.0 / NULLIF(s.total_mutants, 0) * 100), 2) AS avg_kill_rate
FROM submissions s
JOIN problems p ON s.problem_id = p.id
WHERE s.status = 'completed'
GROUP BY p.difficulty;


-- -----------------------------------------------------
-- 5. AI 기능 사용 통계
-- -----------------------------------------------------

-- 토큰 사용 현황
SELECT
    feature_type,
    COUNT(*) AS usage_count,
    SUM(tokens_used) AS total_tokens,
    ROUND(AVG(tokens_used), 2) AS avg_tokens
FROM token_transactions
GROUP BY feature_type
ORDER BY total_tokens DESC;

-- 일별 토큰 사용량
SELECT
    DATE(created_at) AS date,
    SUM(tokens_used) AS tokens_used,
    COUNT(DISTINCT user_id) AS unique_users
FROM token_transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- AI 대화 통계
SELECT
    context_type,
    COUNT(*) AS conversation_count,
    SUM(message_count) AS total_messages
FROM ai_conversations
GROUP BY context_type;


-- -----------------------------------------------------
-- 6. 피드백 분석
-- -----------------------------------------------------

-- 피드백 유형별 현황
SELECT
    feedback_type,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM feedbacks
GROUP BY feedback_type
ORDER BY count DESC;

-- 피드백 생성 추이
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS feedback_count,
    COUNT(CASE WHEN feedback_type = 'ai' THEN 1 END) AS ai_generated,
    COUNT(CASE WHEN feedback_type = 'basic' THEN 1 END) AS basic
FROM feedbacks
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;


-- -----------------------------------------------------
-- 7. 데이터 무결성 검사
-- -----------------------------------------------------

-- 고아 레코드 확인: 존재하지 않는 user_id 참조
SELECT 'submissions with invalid user_id' AS issue,
       COUNT(*) AS count
FROM submissions s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL AND u.id IS NULL

UNION ALL

-- 존재하지 않는 problem_id 참조
SELECT 'submissions with invalid problem_id' AS issue,
       COUNT(*) AS count
FROM submissions s
LEFT JOIN problems p ON s.problem_id = p.id
WHERE p.id IS NULL

UNION ALL

-- 피드백 없는 완료된 제출
SELECT 'completed submissions without feedback' AS issue,
       COUNT(*) AS count
FROM submissions s
LEFT JOIN feedbacks f ON s.id = f.submission_id
WHERE s.status = 'completed' AND f.id IS NULL;

-- 중복 데이터 확인
SELECT
    email,
    COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
