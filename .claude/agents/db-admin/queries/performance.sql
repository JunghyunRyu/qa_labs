-- =====================================================
-- DB Admin Agent - 성능 분석 쿼리 모음
-- =====================================================

-- -----------------------------------------------------
-- 1. 테이블 크기 및 통계
-- -----------------------------------------------------

-- 테이블별 크기 (전체)
SELECT
    schemaname,
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS data_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows
FROM pg_catalog.pg_statio_user_tables
JOIN pg_stat_user_tables USING (relid)
ORDER BY pg_total_relation_size(relid) DESC;

-- 데이터베이스 전체 크기
SELECT
    pg_database.datname AS database,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();


-- -----------------------------------------------------
-- 2. 인덱스 분석
-- -----------------------------------------------------

-- 인덱스 사용률 (가장 많이 사용되는 순)
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 미사용 인덱스 (삭제 후보)
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE '%pkey%'  -- PK 제외
ORDER BY pg_relation_size(indexrelid) DESC;

-- 인덱스 중복 확인
SELECT
    a.indrelid::regclass AS table_name,
    a.indexrelid::regclass AS index1,
    b.indexrelid::regclass AS index2,
    pg_size_pretty(pg_relation_size(a.indexrelid)) AS index1_size
FROM pg_index a
JOIN pg_index b ON a.indrelid = b.indrelid
    AND a.indexrelid != b.indexrelid
    AND a.indkey::text LIKE b.indkey::text || '%'
WHERE NOT a.indisunique AND NOT b.indisunique;


-- -----------------------------------------------------
-- 3. 쿼리 성능
-- -----------------------------------------------------

-- 느린 쿼리 TOP 10 (pg_stat_statements 필요)
-- SELECT
--     query,
--     calls,
--     ROUND(total_time::numeric, 2) AS total_time_ms,
--     ROUND(mean_time::numeric, 2) AS avg_time_ms,
--     ROUND(stddev_time::numeric, 2) AS stddev_ms,
--     rows
-- FROM pg_stat_statements
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- 현재 실행 중인 쿼리
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start AS duration,
    LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- 장시간 실행 쿼리 (5분 이상)
SELECT
    pid,
    usename,
    NOW() - query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE state = 'active'
AND NOW() - query_start > interval '5 minutes';


-- -----------------------------------------------------
-- 4. VACUUM 분석
-- -----------------------------------------------------

-- Dead Tuples 현황 (VACUUM 필요 테이블)
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_percent,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- VACUUM 권장 테이블 (dead > 10%)
SELECT
    relname AS table_name,
    n_dead_tup AS dead_tuples,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_percent
FROM pg_stat_user_tables
WHERE n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0) > 10
ORDER BY dead_percent DESC;


-- -----------------------------------------------------
-- 5. 연결 및 락
-- -----------------------------------------------------

-- 현재 연결 현황
SELECT
    usename,
    client_addr,
    state,
    COUNT(*) AS connections
FROM pg_stat_activity
GROUP BY usename, client_addr, state
ORDER BY connections DESC;

-- 락 대기 현황
SELECT
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_query,
    blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;


-- -----------------------------------------------------
-- 6. 캐시 적중률
-- -----------------------------------------------------

-- 테이블 캐시 적중률
SELECT
    relname AS table_name,
    heap_blks_read AS disk_reads,
    heap_blks_hit AS cache_hits,
    ROUND(
        heap_blks_hit * 100.0 / NULLIF(heap_blks_hit + heap_blks_read, 0),
        2
    ) AS cache_hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read DESC;

-- 인덱스 캐시 적중률
SELECT
    indexrelname AS index_name,
    idx_blks_read AS disk_reads,
    idx_blks_hit AS cache_hits,
    ROUND(
        idx_blks_hit * 100.0 / NULLIF(idx_blks_hit + idx_blks_read, 0),
        2
    ) AS cache_hit_ratio
FROM pg_statio_user_indexes
WHERE idx_blks_hit + idx_blks_read > 0
ORDER BY idx_blks_read DESC;
