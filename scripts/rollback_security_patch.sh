#!/bin/bash
# =============================================================================
# QA Labs Security Patch Rollback Script
# 보안 패치를 원복하는 스크립트
#
# Usage: ./scripts/rollback_security_patch.sh [patch-id]
#
# Patch IDs:
#   p0-1-token-lock    : 토큰 비관적 잠금 원복
#   p0-2-verification  : 검증률 원복 (20% → 5%, 70점 → 90점)
#   p1-1-migration     : 게스트 마이그레이션 7일 제한 원복
#   all                : 전체 원복 (특정 커밋으로 리버트)
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "========================================"
echo "QA Labs Security Patch Rollback"
echo "========================================"
echo ""

# =============================================================================
# Safety confirmation
# =============================================================================
confirm() {
    echo -e "${YELLOW}WARNING: This will modify production code!${NC}"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " response
    if [ "$response" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
}

# =============================================================================
# Git-based full rollback
# =============================================================================
rollback_all() {
    echo "Full rollback to pre-patch state"
    echo ""

    # Find the commit before security patches
    echo "Recent commits:"
    git log --oneline -10
    echo ""

    read -p "Enter commit hash to revert to: " commit_hash

    if [ -z "$commit_hash" ]; then
        echo "No commit specified. Aborted."
        exit 1
    fi

    confirm

    echo "Creating rollback branch..."
    git checkout -b "rollback-$(date +%Y%m%d-%H%M%S)"

    echo "Reverting to $commit_hash..."
    git revert --no-commit HEAD...$commit_hash

    echo ""
    echo -e "${YELLOW}Review the changes and then:${NC}"
    echo "  git commit -m 'Rollback security patches'"
    echo "  git push origin HEAD"
    echo "  ./scripts/deploy.sh"
}

# =============================================================================
# P0-1: Token Lock Rollback
# =============================================================================
rollback_p0_1() {
    echo "P0-1: Rolling back token pessimistic lock..."
    echo ""

    local file="backend/app/services/token_service.py"

    # Show the change to be reverted
    echo "Current implementation uses pessimistic locking (SELECT FOR UPDATE)"
    echo "Rollback will remove the locking mechanism"
    echo ""

    confirm

    # Create a patch to revert
    cat > /tmp/rollback_p0_1.patch << 'PATCH'
--- a/backend/app/services/token_service.py
+++ b/backend/app/services/token_service.py
@@ -89,16 +89,10 @@ class TokenService:
         submission_id: Optional[UUID] = None,
     ) -> Tuple[bool, str]:
         """
-        토큰 차감 (비관적 잠금 적용).
-
-        [P0 Fix] SELECT FOR UPDATE로 동시 요청 시 race condition 방지
+        토큰 차감.
         """
-        # [P0 Fix] 비관적 잠금으로 동시성 문제 방지
-        locked_user = self.token_repo.get_user_with_lock(user.id)
-        if not locked_user:
-            return False, "user_not_found"
-
-        self._check_and_reset_if_needed(locked_user)
+        self._check_and_reset_if_needed(user)

         # Daily bonus 먼저 체크
-        if locked_user.daily_bonus_remaining > 0:
+        if user.daily_bonus_remaining > 0:
PATCH

    echo "Patch created at /tmp/rollback_p0_1.patch"
    echo ""
    echo -e "${YELLOW}Apply with:${NC}"
    echo "  git apply /tmp/rollback_p0_1.patch"
    echo "  git add $file"
    echo "  git commit -m 'Rollback P0-1: Remove token pessimistic lock'"
}

# =============================================================================
# P0-2: Verification Rate Rollback
# =============================================================================
rollback_p0_2() {
    echo "P0-2: Rolling back verification rates..."
    echo ""

    local file="backend/app/services/verification_service.py"

    echo "Current: 20% sampling, 70 threshold"
    echo "Rollback: 5% sampling, 90 threshold"
    echo ""

    confirm

    # Inline edit commands
    echo "Run these commands to rollback:"
    echo ""
    echo "sed -i 's/RANDOM_SAMPLE_RATE = 0.20/RANDOM_SAMPLE_RATE = 0.05/' $file"
    echo "sed -i 's/HIGH_SCORE_THRESHOLD = 70/HIGH_SCORE_THRESHOLD = 90/' $file"
    echo "sed -i 's/MEDIUM_SCORE_THRESHOLD = 50/# MEDIUM_SCORE_THRESHOLD = 50/' $file"
    echo ""
    echo "Then commit:"
    echo "  git add $file"
    echo "  git commit -m 'Rollback P0-2: Restore original verification rates'"
}

# =============================================================================
# P1-1: Guest Migration Rollback
# =============================================================================
rollback_p1_1() {
    echo "P1-1: Rolling back guest migration 7-day limit..."
    echo ""

    local file="backend/app/api/auth.py"

    echo "Current: 7-day migration limit"
    echo "Rollback: No time limit"
    echo ""

    confirm

    echo "Remove these lines from $file:"
    echo ""
    echo "  migration_cutoff = datetime.now(timezone.utc) - timedelta(days=7)"
    echo "  Submission.created_at >= migration_cutoff"
    echo ""
    echo "Then commit:"
    echo "  git add $file"
    echo "  git commit -m 'Rollback P1-1: Remove migration time limit'"
}

# =============================================================================
# Quick service restart
# =============================================================================
restart_services() {
    echo "Restarting services..."
    docker compose -f "$COMPOSE_FILE" restart backend celery_worker
    echo "Services restarted."
}

# =============================================================================
# Main
# =============================================================================
main() {
    local patch_id="${1:-help}"

    case "$patch_id" in
        p0-1-token-lock|p0-1)
            rollback_p0_1
            ;;
        p0-2-verification|p0-2)
            rollback_p0_2
            ;;
        p1-1-migration|p1-1)
            rollback_p1_1
            ;;
        all)
            rollback_all
            ;;
        restart)
            restart_services
            ;;
        help|*)
            echo "Usage: $0 [patch-id]"
            echo ""
            echo "Patch IDs:"
            echo "  p0-1    : 토큰 비관적 잠금 원복"
            echo "  p0-2    : 검증률 원복 (20% → 5%)"
            echo "  p1-1    : 게스트 마이그레이션 7일 제한 원복"
            echo "  all     : 전체 원복 (git revert)"
            echo "  restart : 서비스 재시작만"
            echo ""
            echo "Example:"
            echo "  $0 p0-2"
            ;;
    esac

    echo ""
    echo "========================================"
    echo "Rollback instructions complete"
    echo "========================================"
}

main "$@"
