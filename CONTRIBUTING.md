# 기여 가이드

QA-Arena 프로젝트에 기여해 주셔서 감사합니다!

## 개발 가이드라인

### 코드 스타일

#### Python (Backend)
- **포맷터**: `black` 사용
- **린터**: `flake8` 또는 `pylint` 사용
- **타입 힌팅**: 가능한 모든 함수에 타입 힌팅 추가
- **문서화**: 모든 공개 함수/클래스에 docstring 추가

```bash
# 코드 포맷팅
black backend/

# 린팅
flake8 backend/
```

#### TypeScript/JavaScript (Frontend)
- **포맷터**: `prettier` 사용
- **린터**: ESLint 사용 (Next.js 기본 설정)
- **타입**: TypeScript 사용, `any` 타입 지양

```bash
# 코드 포맷팅
npm run format

# 린팅
npm run lint
```

### Git 워크플로우

#### 브랜치 전략
- `main`: 프로덕션 배포용 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치
- `milestone/*`: Milestone별 개발 브랜치

#### 커밋 메시지 규칙

커밋 메시지는 다음 형식을 따릅니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 업무 수정, 패키지 매니저 설정 등

**예시:**
```
feat(api): 문제 목록 조회 API 구현

- GET /api/v1/problems 엔드포인트 추가
- 페이징 기능 구현
- 단위 테스트 작성

Closes #123
```

### 개발 프로세스

1. **이슈 확인**: 작업할 이슈를 확인하거나 새 이슈 생성
2. **브랜치 생성**: `git checkout -b feature/feature-name`
3. **개발**: 기능 구현 및 테스트 작성
4. **테스트**: 모든 테스트 통과 확인
5. **커밋**: 의미 있는 커밋 메시지와 함께 커밋
6. **푸시**: 원격 저장소에 푸시
7. **Pull Request**: PR 생성 및 코드 리뷰 요청

### 테스트 작성

#### Backend 테스트
- `pytest` 사용
- 모든 API 엔드포인트에 대한 테스트 작성
- 서비스 레이어 단위 테스트 작성
- 테스트 커버리지 80% 이상 유지

```bash
# 테스트 실행
cd backend
pytest

# 커버리지 확인
pytest --cov=app --cov-report=html
```

#### Frontend 테스트
- Jest + React Testing Library 사용 (추후 추가 예정)
- 컴포넌트 테스트 작성
- E2E 테스트 작성 (추후 추가 예정)

### 코드 리뷰

- 모든 PR은 최소 1명 이상의 리뷰어 승인 필요
- 리뷰어는 코드 스타일, 로직, 테스트 커버리지 확인
- 리뷰 코멘트에 대해 적극적으로 소통

### Milestone 기반 개발

프로젝트는 Milestone 기반으로 개발됩니다:

1. **개발**: 기능 구현
2. **테스트**: 테스트 작성 및 실행
3. **검증**: 모든 테스트 통과 확인
4. **머지**: 브랜치 머지

각 Milestone의 상세 내용은 `qa-arena-milestones.md`를 참고하세요.

## 환경 설정

### 개발 환경
- Python 3.11+
- Node.js 18+
- Docker Desktop (선택사항)

### IDE 설정
- VS Code 권장
- Python 확장 설치
- ESLint, Prettier 확장 설치

## 질문 및 지원

프로젝트에 대한 질문이나 이슈가 있으시면 GitHub Issues를 통해 문의해 주세요.

## 라이선스

기여하신 코드는 프로젝트의 라이선스에 따라 배포됩니다.

