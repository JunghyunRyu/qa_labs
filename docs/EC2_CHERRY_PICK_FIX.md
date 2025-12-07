# EC2 서버 Cherry-pick 충돌 해결 가이드

## 빠른 해결 방법

EC2 서버에서 다음 명령어를 순서대로 실행하세요:

### 1. 충돌 상태 확인
```bash
git status
```

### 2. 줄바꿈 변환 (Windows에서 작성된 경우 필요)
```bash
# 스크립트의 줄바꿈을 Linux 형식으로 변환
sed -i 's/\r$//' scripts/auto_resolve_cherry_pick.sh
```

### 3. 자동 해결 스크립트 실행 (권장)
```bash
bash scripts/auto_resolve_cherry_pick.sh
```

또는 PowerShell 사용 시:
```powershell
pwsh scripts/auto_resolve_cherry_pick.ps1
```

### 4. 수동 해결 (자동 해결이 안 될 경우)

각 파일을 열어서 충돌 마커(`<<<<<<<`, `=======`, `>>>>>>>`)를 찾고 해결하세요.

#### `frontend/lib/api/__tests__/problems.test.ts`
- **변경**: import 경로를 `@/lib/api`로 통일
- **최종 상태**:
```typescript
import { get } from '@/lib/api';
import { ApiError } from '@/lib/api';
```

#### `frontend/lib/api/admin.ts`
- **변경**: incoming 변경사항 채택 (보통 `@/lib/api` 경로 유지)

#### `frontend/lib/api/problems.ts`
- **변경**: incoming 변경사항 채택 (보통 `@/lib/api` 경로 유지)

#### `frontend/lib/api/submissions.ts`
- **변경**: incoming 변경사항 채택 (보통 `@/lib/api` 경로 유지)

#### `frontend/next.config.ts`
- **변경**: incoming 변경사항 확인 후 적절히 병합

### 5. 충돌 해결 후 진행
```bash
# 모든 충돌 파일 스테이징
git add frontend/lib/api/__tests__/problems.test.ts
git add frontend/lib/api/admin.ts
git add frontend/lib/api/problems.ts
git add frontend/lib/api/submissions.ts
git add frontend/next.config.ts

# Cherry-pick 계속
git cherry-pick --continue
```

### 6. Cherry-pick 취소 (문제 발생 시)
```bash
git cherry-pick --abort
```

## 충돌 해결 원칙

1. **Import 경로**: `@/lib/api` 절대 경로 사용 (프로젝트 표준)
2. **API 호출**: incoming 변경사항 채택 (cherry-pick의 목적)
3. **환경 설정**: 두 변경사항을 모두 고려하여 병합

## 문제 해결

충돌 해결 중 문제가 발생하면:
1. `git cherry-pick --abort`로 취소
2. 충돌 파일들을 다시 확인
3. 필요시 수동으로 해결
