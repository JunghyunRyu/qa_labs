#!/bin/bash
# Cherry-pick 충돌 해결 스크립트
# EC2 서버에서 실행: bash scripts/resolve_cherry_pick_conflicts.sh

set -e

echo "Cherry-pick 충돌 해결 시작..."

# 충돌 파일 목록
CONFLICT_FILES=(
  "frontend/lib/api/__tests__/problems.test.ts"
  "frontend/lib/api/admin.ts"
  "frontend/lib/api/problems.ts"
  "frontend/lib/api/submissions.ts"
  "frontend/next.config.ts"
)

# 각 파일의 충돌 해결
for file in "${CONFLICT_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "처리 중: $file"
    
    # 충돌 마커 확인
    if grep -q "^<<<<<<< HEAD" "$file"; then
      echo "  충돌 발견: $file"
      # 충돌 해결은 수동으로 필요할 수 있음
    else
      echo "  충돌 없음: $file"
    fi
  else
    echo "  파일 없음: $file"
  fi
done

echo ""
echo "충돌 해결 후 다음 명령어를 실행하세요:"
echo "  git add frontend/lib/api/__tests__/problems.test.ts"
echo "  git add frontend/lib/api/admin.ts"
echo "  git add frontend/lib/api/problems.ts"
echo "  git add frontend/lib/api/submissions.ts"
echo "  git add frontend/next.config.ts"
echo "  git cherry-pick --continue"
