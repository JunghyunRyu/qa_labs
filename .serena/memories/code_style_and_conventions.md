# 코드 스타일 및 컨벤션

## Python (Backend)

### 포맷터 및 린터
- **포맷터**: `black` 권장
- **린터**: `flake8` 또는 `pylint` 권장

### 타입 힌팅
- **모든 공개 함수에 타입 힌팅 추가 필수**
- Pydantic 모델을 적극 활용
- 예시:
```python
def process_submission(submission_id: int, code: str) -> dict:
    pass
```

### Docstring
- **모든 공개 함수/클래스에 docstring 추가 필수**
- 간단한 설명으로도 충분
- 예시:
```python
def calculate_score(results: list) -> float:
    """테스트 결과를 기반으로 점수를 계산합니다."""
    pass
```

### 네이밍 컨벤션
- 함수/변수: snake_case
- 클래스: PascalCase
- 상수: UPPER_SNAKE_CASE
- Private 멤버: _leading_underscore

### 파일 구조
- 로깅 설정: 모든 모듈 상단에 `logger = logging.getLogger(__name__)`
- Import 순서: 표준 라이브러리 → 서드파티 → 로컬 모듈

## TypeScript/JavaScript (Frontend)

### 포맷터 및 린터
- **포맷터**: `prettier`
- **린터**: ESLint (Next.js 기본 설정)

### 타입
- **TypeScript 사용 필수**
- `any` 타입 지양
- 타입 정의는 `types/` 디렉토리에 관리

### 네이밍 컨벤션
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- Private 멤버: _leadingUnderscore

### 컴포넌트 구조
- React 함수형 컴포넌트 사용
- Next.js App Router 사용
- Server Components vs Client Components 구분 명확히

## 인코딩
- **모든 파일 UTF-8 인코딩 사용 필수**
- Windows 환경에서 한글 경로/파일명 사용 시 주의
- Python 파일 상단에 명시적 인코딩 선언 불필요 (Python 3.11+)

## Git 커밋 메시지
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드
- `chore`: 빌드/패키지 매니저 설정

### 예시
```
feat(api): 문제 목록 조회 API 구현

- GET /api/v1/problems 엔드포인트 추가
- 페이징 기능 구현
- 단위 테스트 작성

Closes #123
```
