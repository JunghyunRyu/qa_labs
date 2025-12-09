# Task 완료 시 워크플로우

## 개발 워크플로우 원칙
짧은 개발과 테스트를 반복하여 목표를 달성하는 방식으로 개발을 진행합니다.

## Task 완료 시 (필수)

### 1. 테스트 실행
의미 있는 결과를 도출하는 테스트를 **반드시 진행**합니다.

#### Backend
```bash
cd backend
pytest

# 또는 특정 테스트
pytest tests/test_api.py -v
```

#### Frontend
```bash
cd frontend
npm run test
```

### 2. 변경사항 커밋
테스트가 통과한 후 변경사항을 커밋합니다.

```bash
git add .
git commit -m "feat(scope): 기능 설명

- 상세 내용
- 변경 사항

Closes #이슈번호"
```

## Milestone 완료 시 (필수)

### 변경사항 푸시
```bash
git push origin main
# 또는
git push origin <브랜치명>
```

## 개발 시작 전 체크리스트

### 1. 문서 확인
- **세션 시작 시**: `docs/specs/qa-arena-spec.md` 확인
- **개발 시작 전**: `docs/todo_actions/qa-arena-technical-todos.md` 확인
- **작업 순서**: `technical-todos-v*.md`에서 `[x]` 체크되지 않은 항목부터

### 2. 특정 상황별 문서
- **에러 처리**: `docs/specs/ERROR_HANDLING.md`
- **배포**: `docs/specs/deployment.md`
- **운영/인시던트**: `docs/specs/operations.md`
- **Git 워크플로우**: `docs/specs/git-workflow.md`

## 대규모 변경사항 처리

### 200줄 이상 변경 시
- 'Use Allowlist' 설정이 활성화되어 있어도 **사용자의 명시적 확인 요청**
- 변경 범위와 영향도를 먼저 설명
- 단계별 진행 제안

## 코드 품질 체크 (권장)

### Backend
```bash
# 포맷팅 체크
black --check backend/

# 린팅
flake8 backend/

# 타입 체크 (mypy 사용 시)
mypy backend/
```

### Frontend
```bash
# 린팅
npm run lint

# 타입 체크
npx tsc --noEmit
```

## 배포 전 체크리스트

### 로컬 테스트
1. 모든 테스트 통과 확인
2. Docker 환경에서 빌드 성공 확인
3. 로컬에서 전체 스택 실행 확인

### 프로덕션 배포
1. Git 커밋 및 푸시
2. EC2에서 배포 스크립트 실행 또는 `/deploy` 명령어 사용
3. 배포 후 헬스 체크
4. 로그 모니터링

## 테스트 커버리지 목표
- **Backend**: 80% 이상 유지
- **Frontend**: 추후 정의

## 브랜치 전략 (CONTRIBUTING.md 참고)
- `main`: 프로덕션 배포용
- `develop`: 개발 통합
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정
- `milestone/*`: Milestone별 개발
