# Changelog 엔트리 템플릿

> 변경 로그 작성 시 사용하는 템플릿

---

## 기본 형식

```markdown
## [버전] - YYYY-MM-DD

### Added
- 새로운 기능 설명

### Changed
- 변경된 기능 설명

### Fixed
- 버그 수정 설명

### Deprecated
- 더 이상 권장하지 않는 기능

### Removed
- 제거된 기능

### Security
- 보안 관련 변경
```

---

## 카테고리 가이드

### Added (추가)
새로운 기능이나 엔드포인트 추가

```markdown
### Added
- 환불 API 엔드포인트 추가 (`POST /api/v1/payments/refund`)
- AI 코치 대화 히스토리 기능
- 다크모드 지원
- 문제 북마크 기능
```

### Changed (변경)
기존 기능의 동작이 변경됨

```markdown
### Changed
- 문제 목록 기본 페이지 크기 20 → 30으로 변경
- AI 피드백 응답 포맷 개선
- 로그인 플로우 UX 개선
- 제출 결과 상세 정보 추가
```

### Fixed (수정)
버그 수정

```markdown
### Fixed
- 경계값 120에서 나이 검증 실패하는 버그 수정
- OAuth 로그인 후 리다이렉션 오류 수정
- 모바일에서 코드 에디터 스크롤 문제 해결
- 제출 결과 폴링 타임아웃 문제 수정
```

### Deprecated (지원 중단 예정)
향후 버전에서 제거될 기능 경고

```markdown
### Deprecated
- `/api/v1/submit` 엔드포인트 (v2에서 제거 예정, `/api/v1/submissions` 사용)
- `legacy_score` 필드 (다음 버전에서 제거)
```

### Removed (제거)
제거된 기능

```markdown
### Removed
- 레거시 인증 방식 제거
- 사용하지 않는 `/api/v1/old-endpoint` 제거
- 구버전 테마 지원 중단
```

### Security (보안)
보안 관련 변경 (취약점 수정 포함)

```markdown
### Security
- XSS 취약점 수정 (코드 에디터 입력)
- SQL 인젝션 방지 강화
- JWT 토큰 만료 시간 단축 (24h → 12h)
- Rate limiting 강화
```

---

## 실제 예시

### 마일스톤 릴리스
```markdown
## [1.0.0] - 2026-01-09

### Added
- 뮤테이션 테스트 기반 채점 시스템
- GitHub/Google OAuth 인증
- AI 코치 및 피드백 기능
- 클라이언트 사이드 테스트 실행 (Pyodide)
- 토큰 기반 AI 기능 과금 시스템

### Changed
- 문제 난이도 표기 개선 (Very Easy ~ Hard)
- 제출 결과 UI 전면 개편

### Fixed
- 초기 릴리스로 해당 없음
```

### 버그 수정 릴리스
```markdown
## [1.0.1] - 2026-01-10

### Fixed
- Google OAuth 리다이렉트 URI 400 에러 수정
- 제출 후 결과 로딩 무한 대기 문제 해결
- 모바일에서 코드 에디터 줄바꿈 오류 수정

### Security
- 제출 코드 샌드박스 격리 강화
```

### 기능 추가 릴리스
```markdown
## [1.1.0] - 2026-01-15

### Added
- 문제 검색 기능 (제목, 카테고리, 난이도)
- 사용자 대시보드 통계 차트
- 문제 추천 알고리즘
- Discord 웹훅 알림

### Changed
- AI 피드백 품질 개선 (GPT-5.2 적용)
- 문제 목록 로딩 속도 50% 개선

### Deprecated
- `/api/v1/problems/search` (통합 검색 API로 대체 예정)
```

---

## 작성 규칙

1. **시제**: 과거형 사용 ("추가됨" X, "추가" O, 영어는 과거분사)
2. **간결성**: 한 줄에 한 항목
3. **구체성**: 무엇이 어떻게 변경되었는지 명시
4. **참조**: 관련 이슈/PR 번호 포함 가능 `(#123)`

### 좋은 예시
```markdown
- 문제 북마크 기능 추가 (#45)
- 나이 검증에서 경계값 120 처리 오류 수정 (#52)
- 제출 API 응답에 `execution_time` 필드 추가
```

### 나쁜 예시
```markdown
- 버그 수정 (너무 모호)
- 기능 개선 (구체적이지 않음)
- 코드 정리 (사용자에게 의미 없음)
```

---

## 파일 위치

```
qa_labs/
└── CHANGELOG.md    # 프로젝트 루트에 위치
```

---

*Changelog 엔트리 템플릿 v1.0*
