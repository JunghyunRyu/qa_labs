# API Reference

> Claude Context 전용 - REST API 엔드포인트 명세

---

## Base URL

- **로컬**: `http://localhost:8000/api/v1`
- **프로덕션**: `https://qa-arena.qalabs.kr/api/v1`

---

## 인증

### 인증 방식
- **JWT (HTTP Only Cookie)**: access_token, refresh_token
- **OAuth Providers**: GitHub, Google

### 인증 헤더
인증이 필요한 엔드포인트는 쿠키 기반 JWT를 사용합니다.
별도의 Authorization 헤더는 불필요합니다.

---

## API 엔드포인트

### Auth (`/api/v1/auth`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/github/login` | GitHub OAuth 시작 | - |
| GET | `/github/callback` | GitHub OAuth 콜백 | - |
| GET | `/google/login` | Google OAuth 시작 | - |
| GET | `/google/callback` | Google OAuth 콜백 | - |
| POST | `/logout` | 로그아웃 (쿠키 삭제) | Optional |
| POST | `/refresh` | 토큰 갱신 | Required |
| GET | `/status` | 인증 상태 확인 | Optional |
| GET | `/token-status` | 토큰 잔액 조회 | Required |

---

### Problems (`/api/v1/problems`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/` | 문제 목록 조회 | - |
| GET | `/{slug}` | 문제 상세 조회 | - |
| GET | `/{slug}/hints` | 힌트 조회 | Optional |
| GET | `/bookmarked` | 북마크 목록 | Required |
| POST | `/{problem_id}/bookmark` | 북마크 토글 | Required |

#### Query Parameters (목록 조회)
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| difficulty | string | 난이도 필터 (Very Easy, Easy, Medium, Hard) |
| domain | string | 도메인 필터 (common, fintech, commerce, saas, platform, content) |
| search | string | 검색어 |
| page | int | 페이지 번호 (기본: 1) |
| limit | int | 페이지 크기 (기본: 20) |

---

### Submissions (`/api/v1/submissions`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/` | 제출 생성 | Optional |
| GET | `/{submission_id}` | 제출 상세 조회 | - |
| GET | `/` | 제출 목록 조회 | Optional |
| POST | `/{submission_id}/verify` | 서버 검증 요청 | - |
| GET | `/{submission_id}/progress` | 진행 상태 조회 | - |

#### 제출 생성 Request Body
```json
{
  "problem_id": 1,
  "code": "def test_example():\n    ...",
  "execution_mode": "client",
  "client_result": {
    "score": 100,
    "killed_mutants": 5,
    "total_mutants": 5,
    "execution_log": {...}
  }
}
```

#### Submission Status
| 상태 | 설명 |
|------|------|
| PENDING | 대기 중 |
| RUNNING | 실행 중 |
| SUCCESS | 성공 |
| FAILURE | 실패 (테스트 실패) |
| ERROR | 오류 (실행 오류) |

---

### AI Features (`/api/v1/ai`)

| Method | Endpoint | 설명 | 인증 | 토큰 |
|--------|----------|------|------|------|
| POST | `/coach/chat` | AI 코치 대화 | Required | 1 |
| GET | `/coach/history/{problem_id}` | 대화 기록 조회 | Required | - |
| DELETE | `/coach/history/{problem_id}` | 대화 기록 삭제 | Required | - |

#### AI Coach Request Body
```json
{
  "problem_id": 1,
  "message": "이 문제에서 어떤 테스트 케이스를 작성해야 할까요?",
  "code": "def test_example():\n    ..."
}
```

---

### Feedback (`/api/v1/feedback`)

| Method | Endpoint | 설명 | 인증 | 토큰 |
|--------|----------|------|------|------|
| POST | `/generate` | 피드백 생성 | Optional | 0-2 |
| GET | `/{submission_id}` | 피드백 조회 | - | - |
| POST | `/regenerate/{submission_id}` | 피드백 재생성 | Required | 1 |

#### Feedback Types
| 타입 | 토큰 비용 | 설명 |
|------|----------|------|
| basic | 0 | 기본 피드백 |
| deep | 2 | 심화 분석 |
| regenerate | 1 | 재생성 |

---

### Tokens (`/api/v1/tokens`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/balance` | 토큰 잔액 조회 | Required |
| GET | `/transactions` | 거래 내역 조회 | Required |
| POST | `/daily-bonus` | 일일 보너스 수령 | Required |

---

### Users (`/api/v1/users`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/me` | 내 정보 조회 | Required |
| PATCH | `/me` | 내 정보 수정 | Required |
| DELETE | `/me` | 계정 삭제 (Soft Delete) | Required |
| POST | `/me/accept-terms` | 이용약관 동의 | Required |

---

### Progress (`/api/v1/progress`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/dashboard` | 대시보드 통계 | Required |
| GET | `/problems` | 문제별 진행 현황 | Required |
| GET | `/submissions` | 제출 이력 | Required |

---

### Plans (`/api/v1/plans`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/me` | 내 플랜 정보 조회 | Required |
| GET | `/compare` | 전체 플랜 비교 (Pricing 페이지용) | - |
| POST | `/check-feature` | 특정 기능 사용 가능 여부 확인 | Required |
| GET | `/limits/{limit_key}` | 특정 제한 값 조회 | Required |
| GET | `/{plan_key}` | 특정 플랜 정보 조회 | - |

#### Plan Keys
| 값 | 설명 |
|----|------|
| free | 무료 플랜 |
| lite | 라이트 플랜 |
| pro | 프로 플랜 |

---

### Test Quality (`/api/v1/test-quality`)

| Method | Endpoint | 설명 | 인증 | 토큰 |
|--------|----------|------|------|------|
| GET | `/submissions/{submission_id}/quality` | 제출 품질 분석 조회 | Optional | - |
| POST | `/analyze` | 코드 직접 분석 (테스트용) | - | - |
| GET | `/submissions/{submission_id}/hints` | 테스트 개선 힌트 조회 | Required | 1 |

#### Admin Endpoints
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/admin/analyze-submission/{submission_id}` | 제출 품질 수동 분석 | Admin |
| POST | `/admin/analyze-problem/{problem_id}` | 문제 루브릭 생성 | Admin |
| GET | `/admin/statistics` | 품질 통계 조회 | Admin |
| GET | `/admin/runs` | 분석 실행 이력 조회 | Admin |

---

### Health (`/healthz`)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/` | 서버 상태 확인 | - |
| GET | `/db` | DB 연결 확인 | - |
| GET | `/redis` | Redis 연결 확인 | - |

---

### Admin (`/api/admin`)

> 관리자 전용 (미노출)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/stats` | 시스템 통계 | Required |
| POST | `/problems/generate` | 문제 생성 | Required |
| POST | `/tokens/grant` | 토큰 지급 | Required |

---

## 에러 응답 형식

```json
{
  "detail": "에러 메시지",
  "error_code": "ERROR_CODE",
  "timestamp": "2026-01-09T12:00:00Z"
}
```

### 주요 에러 코드

| HTTP | 에러 코드 | 설명 |
|------|----------|------|
| 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스 없음 |
| 409 | ALREADY_EXISTS | 중복 |
| 429 | RATE_LIMITED | 요청 제한 |
| 500 | INTERNAL_ERROR | 서버 오류 |

### 토큰 관련 에러

| 에러 코드 | 설명 |
|----------|------|
| INSUFFICIENT_TOKENS | 토큰 부족 |
| DAILY_BONUS_EXHAUSTED | 일일 보너스 소진 |
| TOKEN_EXPIRED | 토큰 만료 |

---

## Rate Limiting

| 대상 | 제한 |
|------|------|
| 비회원 제출 | 5/분, 30/일 |
| 회원 제출 | 10/분, 200/일 |
| AI 기능 | 토큰 기반 |

---

## 관련 문서

- 에러 처리 상세: `docs/specs/ERROR_HANDLING.md`
- 토큰 정책: `docs/specs/token-policy.md`
- 제출 상태 흐름: `docs/specs/SUBMISSION_STATUS_FLOW.md`

---

*최종 업데이트: 2026-01-10*
