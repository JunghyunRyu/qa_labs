#!/bin/bash
# =============================================================================
# QA Labs Security Patch Diagnostic Script
# 보안 패치 관련 문제를 진단하는 스크립트
#
# Usage: ./scripts/diagnose_security.sh [--all|--tokens|--scores|--auth]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_SERVICE="postgres"
DB_USER="qa_arena"
DB_NAME="qa_arena"

echo "========================================"
echo "QA Labs Security Diagnostic"
echo "========================================"
echo ""

# Helper function to run DB query
run_query() {
    docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
        psql -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null || echo "ERROR"
}

# Helper function for status output
check_status() {
    local name=$1
    local result=$2
    local expected=$3

    if [ "$result" = "$expected" ] || [ "$result" -eq "$expected" ] 2>/dev/null; then
        echo -e "  ${GREEN}[OK]${NC} $name"
        return 0
    else
        echo -e "  ${RED}[FAIL]${NC} $name (got: $result, expected: $expected)"
        return 1
    fi
}

# =============================================================================
# P0-1: Token Race Condition Check
# =============================================================================
check_tokens() {
    echo "----------------------------------------"
    echo "P0-1: Token Race Condition Check"
    echo "----------------------------------------"

    # Check for negative token balances
    local negative_tokens=$(run_query "SELECT COUNT(*) FROM users WHERE token_balance - token_used < 0;")
    negative_tokens=$(echo "$negative_tokens" | tr -d ' ')
    check_status "No negative token balances" "$negative_tokens" "0"

    # Check for users with token_used > token_balance + daily_bonus
    local over_used=$(run_query "SELECT COUNT(*) FROM users WHERE token_used > token_balance + 100;")
    over_used=$(echo "$over_used" | tr -d ' ')
    check_status "No over-used tokens" "$over_used" "0"

    # Check recent token transactions for anomalies (same user, <1 sec apart)
    local rapid_deductions=$(run_query "
        SELECT COUNT(*) FROM (
            SELECT user_id, created_at,
                   LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) as prev_at
            FROM token_transactions
            WHERE created_at > NOW() - INTERVAL '1 hour'
        ) t WHERE created_at - prev_at < INTERVAL '1 second';
    ")
    rapid_deductions=$(echo "$rapid_deductions" | tr -d ' ')

    if [ "$rapid_deductions" != "ERROR" ] && [ "$rapid_deductions" -gt "5" ] 2>/dev/null; then
        echo -e "  ${YELLOW}[WARN]${NC} Rapid token deductions detected: $rapid_deductions"
    else
        echo -e "  ${GREEN}[OK]${NC} No suspicious rapid deductions"
    fi

    echo ""
}

# =============================================================================
# P0-2: Score Manipulation Check
# =============================================================================
check_scores() {
    echo "----------------------------------------"
    echo "P0-2: Score Manipulation Check"
    echo "----------------------------------------"

    # Check verification rate (should be ~20% for client submissions)
    local total_client=$(run_query "
        SELECT COUNT(*) FROM submissions
        WHERE execution_mode = 'client'
        AND created_at > NOW() - INTERVAL '24 hours';
    ")
    total_client=$(echo "$total_client" | tr -d ' ')

    local verified_count=$(run_query "
        SELECT COUNT(*) FROM submissions
        WHERE execution_mode = 'client'
        AND verification_status IS NOT NULL
        AND created_at > NOW() - INTERVAL '24 hours';
    ")
    verified_count=$(echo "$verified_count" | tr -d ' ')

    if [ "$total_client" != "0" ] && [ "$total_client" != "ERROR" ]; then
        local rate=$((verified_count * 100 / total_client))
        if [ "$rate" -ge "15" ]; then
            echo -e "  ${GREEN}[OK]${NC} Verification rate: ${rate}% (target: 20%+)"
        else
            echo -e "  ${YELLOW}[WARN]${NC} Low verification rate: ${rate}%"
        fi
    else
        echo -e "  ${YELLOW}[INFO]${NC} No client submissions in last 24h"
    fi

    # Check for mismatched scores
    local mismatches=$(run_query "
        SELECT COUNT(*) FROM submissions
        WHERE verification_status = 'mismatch'
        AND created_at > NOW() - INTERVAL '7 days';
    ")
    mismatches=$(echo "$mismatches" | tr -d ' ')

    if [ "$mismatches" != "ERROR" ] && [ "$mismatches" -gt "0" ] 2>/dev/null; then
        echo -e "  ${RED}[ALERT]${NC} Score mismatches found: $mismatches"

        # Show details
        echo "  Recent mismatches:"
        run_query "
            SELECT id, score, server_score, (score - server_score) as diff
            FROM submissions
            WHERE verification_status = 'mismatch'
            AND created_at > NOW() - INTERVAL '7 days'
            ORDER BY created_at DESC
            LIMIT 5;
        " | while read line; do
            echo "    $line"
        done
    else
        echo -e "  ${GREEN}[OK]${NC} No score mismatches"
    fi

    # Check high scores (70+) without verification
    local unverified_high=$(run_query "
        SELECT COUNT(*) FROM submissions
        WHERE execution_mode = 'client'
        AND score >= 70
        AND verification_status IS NULL
        AND created_at > NOW() - INTERVAL '24 hours';
    ")
    unverified_high=$(echo "$unverified_high" | tr -d ' ')

    if [ "$unverified_high" != "ERROR" ] && [ "$unverified_high" -gt "0" ] 2>/dev/null; then
        echo -e "  ${YELLOW}[WARN]${NC} Unverified high scores: $unverified_high"
    else
        echo -e "  ${GREEN}[OK]${NC} All high scores verified"
    fi

    echo ""
}

# =============================================================================
# P1: Auth Security Check
# =============================================================================
check_auth() {
    echo "----------------------------------------"
    echo "P1: Authentication Security Check"
    echo "----------------------------------------"

    # Check for old guest submissions that were migrated
    local old_migrations=$(run_query "
        SELECT COUNT(*) FROM submissions
        WHERE anonymous_id IS NULL
        AND user_id IS NOT NULL
        AND created_at < NOW() - INTERVAL '7 days'
        AND updated_at > created_at + INTERVAL '1 minute';
    ")
    old_migrations=$(echo "$old_migrations" | tr -d ' ')
    echo -e "  ${GREEN}[INFO]${NC} Migrated submissions: $old_migrations"

    # Check recent login activity
    local recent_logins=$(run_query "
        SELECT COUNT(*) FROM users
        WHERE last_login_at > NOW() - INTERVAL '24 hours';
    ")
    recent_logins=$(echo "$recent_logins" | tr -d ' ')
    echo -e "  ${GREEN}[INFO]${NC} Users logged in (24h): $recent_logins"

    # Check for suspicious rapid logins (same user, multiple logins in short time)
    local rapid_logins=$(run_query "
        SELECT COUNT(*) FROM (
            SELECT id,
                   last_login_at,
                   LAG(last_login_at) OVER (PARTITION BY id ORDER BY last_login_at) as prev_login
            FROM users
            WHERE last_login_at > NOW() - INTERVAL '1 hour'
        ) t WHERE last_login_at - prev_login < INTERVAL '1 minute';
    ")
    rapid_logins=$(echo "$rapid_logins" | tr -d ' ')

    if [ "$rapid_logins" != "ERROR" ] && [ "$rapid_logins" -gt "10" ] 2>/dev/null; then
        echo -e "  ${YELLOW}[WARN]${NC} Rapid login attempts: $rapid_logins"
    else
        echo -e "  ${GREEN}[OK]${NC} No suspicious login patterns"
    fi

    echo ""
}

# =============================================================================
# Service Health Check
# =============================================================================
check_services() {
    echo "----------------------------------------"
    echo "Service Health Check"
    echo "----------------------------------------"

    # Check Docker containers
    local containers=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | jq -r '.[] | "\(.Service):\(.State)"' 2>/dev/null || docker compose -f "$COMPOSE_FILE" ps 2>/dev/null)

    for service in backend frontend postgres redis celery_worker; do
        if echo "$containers" | grep -q "$service.*running\|$service.*Up"; then
            echo -e "  ${GREEN}[OK]${NC} $service is running"
        else
            echo -e "  ${RED}[FAIL]${NC} $service is not running"
        fi
    done

    # Check Redis connection
    local redis_ping=$(docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null || echo "FAIL")
    if [ "$redis_ping" = "PONG" ]; then
        echo -e "  ${GREEN}[OK]${NC} Redis responding"
    else
        echo -e "  ${RED}[FAIL]${NC} Redis not responding"
    fi

    echo ""
}

# =============================================================================
# Recent Errors Check
# =============================================================================
check_errors() {
    echo "----------------------------------------"
    echo "Recent Error Logs (last 100 lines)"
    echo "----------------------------------------"

    echo "Backend errors:"
    docker compose -f "$COMPOSE_FILE" logs --tail=100 backend 2>/dev/null | grep -i "error\|exception\|fail" | tail -5 || echo "  No errors found"

    echo ""
    echo "Celery errors:"
    docker compose -f "$COMPOSE_FILE" logs --tail=100 celery_worker 2>/dev/null | grep -i "error\|exception\|fail" | tail -5 || echo "  No errors found"

    echo ""
}

# =============================================================================
# Main
# =============================================================================
main() {
    local mode="${1:---all}"

    case "$mode" in
        --tokens)
            check_tokens
            ;;
        --scores)
            check_scores
            ;;
        --auth)
            check_auth
            ;;
        --services)
            check_services
            ;;
        --errors)
            check_errors
            ;;
        --all|*)
            check_services
            check_tokens
            check_scores
            check_auth
            check_errors
            ;;
    esac

    echo "========================================"
    echo "Diagnostic Complete"
    echo "========================================"
}

main "$@"
