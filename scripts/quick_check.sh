#!/bin/bash
# =============================================================================
# QA Labs Quick Health Check
# 빠른 상태 확인 스크립트 (1분 이내 실행)
#
# Usage: ./scripts/quick_check.sh
# =============================================================================

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_SERVICE="postgres"
DB_USER="qa_arena_user"
DB_NAME="qa_arena"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "QA Labs Quick Check - $(date)"
echo "================================"

# 1. Docker containers
echo -n "Docker containers: "
running=$(docker compose -f "$COMPOSE_FILE" ps --status running -q 2>/dev/null | wc -l)
if [ "$running" -ge 6 ]; then
    echo -e "${GREEN}OK${NC} ($running running)"
else
    echo -e "${RED}FAIL${NC} (only $running running)"
fi

# 2. Backend health
echo -n "Backend API: "
health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$health" = "200" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC} (HTTP $health)"
fi

# 3. Database
echo -n "Database: "
db_check=$(docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" 2>/dev/null | grep -c "1")
if [ "$db_check" -gt 0 ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

# 4. Redis
echo -n "Redis: "
redis_ping=$(docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null)
if [ "$redis_ping" = "PONG" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

# 5. Recent submissions (last hour)
echo -n "Submissions (1h): "
submissions=$(docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM submissions WHERE created_at > NOW() - INTERVAL '1 hour'" 2>/dev/null | tr -d ' ')
echo "$submissions"

# 6. Error rate (last hour)
echo -n "Errors (1h): "
errors=$(docker compose -f "$COMPOSE_FILE" logs --since 1h backend 2>/dev/null | grep -c "ERROR" || echo "0")
if [ "$errors" -lt 10 ]; then
    echo -e "${GREEN}$errors${NC}"
else
    echo -e "${YELLOW}$errors${NC}"
fi

# 7. Token issues
echo -n "Token issues: "
negative=$(docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE token_balance - token_used < 0" 2>/dev/null | tr -d ' ')
if [ "$negative" = "0" ]; then
    echo -e "${GREEN}None${NC}"
else
    echo -e "${RED}$negative users with negative balance${NC}"
fi

# 8. Score mismatches
echo -n "Score mismatches (7d): "
mismatches=$(docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM submissions WHERE verification_status = 'mismatch' AND created_at > NOW() - INTERVAL '7 days'" 2>/dev/null | tr -d ' ')
if [ "$mismatches" = "0" ] || [ -z "$mismatches" ]; then
    echo -e "${GREEN}None${NC}"
else
    echo -e "${RED}$mismatches${NC}"
fi

echo "================================"
echo "Git: $(git log -1 --format='%h %s' 2>/dev/null || echo 'N/A')"
