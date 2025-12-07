#!/bin/bash
# Cherry-pick 충돌 자동 해결 스크립트 (Bash)
# EC2 서버에서 실행: bash scripts/auto_resolve_cherry_pick.sh

set -e

echo "Cherry-pick 충돌 자동 해결 시작..."

# 충돌 파일 목록
CONFLICT_FILES=(
  "frontend/lib/api/__tests__/problems.test.ts"
  "frontend/lib/api/admin.ts"
  "frontend/lib/api/problems.ts"
  "frontend/lib/api/submissions.ts"
  "frontend/next.config.ts"
)

RESOLVED=false

for file in "${CONFLICT_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo ""
    echo "처리 중: $file"
    
    # 충돌 마커 확인
    if grep -q "^<<<<<<< HEAD" "$file"; then
      echo "  충돌 발견!"
      
      # problems.test.ts의 경우 import 경로 수정
      if [[ "$file" == *"problems.test.ts"* ]]; then
        # 상대 경로를 절대 경로로 변경
        sed -i "s|from '../../api'|from '@/lib/api'|g" "$file"
        sed -i "s|from '\.\./\.\./api'|from '@/lib/api'|g" "$file"
      fi
      
      # 임시 파일 생성
      TEMP_FILE=$(mktemp)
      
      # 충돌 마커 제거 (incoming 변경사항 채택)
      # awk를 사용하여 충돌 해결
      awk '
        /^<<<<<<< HEAD/ { in_conflict=1; next }
        /^=======/ { if (in_conflict) { in_conflict=2; next } }
        /^>>>>>>> / { if (in_conflict==2) { in_conflict=0; next } }
        { if (in_conflict==0 || in_conflict==2) print }
      ' "$file" > "$TEMP_FILE"
      
      mv "$TEMP_FILE" "$file"
      
      echo "  충돌 해결 완료"
      RESOLVED=true
    else
      echo "  충돌 없음"
    fi
  else
    echo "  파일 없음: $file"
  fi
done

if [ "$RESOLVED" = true ]; then
  echo ""
  echo "충돌 해결 완료! 다음 명령어를 실행하세요:"
  echo "  git add frontend/lib/api/__tests__/problems.test.ts"
  echo "  git add frontend/lib/api/admin.ts"
  echo "  git add frontend/lib/api/problems.ts"
  echo "  git add frontend/lib/api/submissions.ts"
  echo "  git add frontend/next.config.ts"
  echo "  git cherry-pick --continue"
else
  echo ""
  echo "충돌이 발견되지 않았습니다."
  echo "수동으로 확인이 필요할 수 있습니다."
fi
