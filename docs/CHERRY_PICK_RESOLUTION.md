# Cherry-pick 충돌 해결 가이드

## 상황
`local/frontend-api-url-fix` 브랜치의 커밋 `738fcea`를 `main` 브랜치로 cherry-pick할 때 충돌 발생

## 충돌 파일 목록
1. `frontend/lib/api/__tests__/problems.test.ts`
2. `frontend/lib/api/admin.ts`
3. `frontend/lib/api/problems.ts`
4. `frontend/lib/api/submissions.ts`
5. `frontend/next.config.ts`

## 해결 방법

### 1. 각 파일의 충돌 확인
```bash
git status
```

### 2. 각 파일의 충돌 해결

#### `frontend/lib/api/__tests__/problems.test.ts`
- **충돌 원인**: import 경로 차이
- **해결**: `@/lib/api` 경로 사용 (incoming 변경사항 채택)
- **예상 최종 상태**:
```typescript
import { get } from '@/lib/api';
import { ApiError } from '@/lib/api';
```

#### `frontend/lib/api/admin.ts`
- **충돌 원인**: import 경로 또는 API 호출 방식 차이
- **해결**: `@/lib/api` 경로 유지 (incoming 변경사항 채택)

#### `frontend/lib/api/problems.ts`
- **충돌 원인**: import 경로 또는 API 호출 방식 차이
- **해결**: `@/lib/api` 경로 유지 (incoming 변경사항 채택)

#### `frontend/lib/api/submissions.ts`
- **충돌 원인**: import 경로 또는 API 호출 방식 차이
- **해결**: `@/lib/api` 경로 유지 (incoming 변경사항 채택)

#### `frontend/next.config.ts`
- **충돌 원인**: 환경 변수 설정 차이
- **해결**: incoming 변경사항 확인 후 적절히 병합

### 3. 충돌 해결 후 진행

```bash
# 충돌 해결된 파일들을 스테이징
git add frontend/lib/api/__tests__/problems.test.ts
git add frontend/lib/api/admin.ts
git add frontend/lib/api/problems.ts
git add frontend/lib/api/submissions.ts
git add frontend/next.config.ts

# Cherry-pick 계속 진행
git cherry-pick --continue
```

### 4. Cherry-pick 취소 (필요시)
```bash
git cherry-pick --abort
```

## 일반적인 충돌 해결 원칙
1. **Import 경로**: `@/lib/api` 절대 경로 사용 (프로젝트 표준)
2. **API 호출 방식**: incoming 변경사항 채택 (cherry-pick의 목적)
3. **환경 설정**: 두 변경사항을 모두 고려하여 병합
