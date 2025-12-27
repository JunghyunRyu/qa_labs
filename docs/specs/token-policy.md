# Token Policy (SDD Spec)

- Product: QA-Arena / QA-Labs Arena
- Doc: docs/spec/token-policy.md
- Version: v0.2
- Status: Implemented
- Date (KST): 2025-12-28
- Owner: Product/Backend

## 0. 목적 (Purpose)

본 문서는 QA-Arena의 **토큰(usage quota) 정책**을 스펙으로 고정한다.  
구현(Backend/API/UI/DB)은 본 스펙의 규칙을 **그대로 만족**해야 한다.

## 1. 범위 (Scope)

### 포함 (In-Scope)
- 회원(로그인 사용자)의 토큰 버킷 정책
- 일/월 리셋 규칙 (KST 기준)
- 기능별 토큰 비용(차감 여부 포함)
- 토큰 부족/쿨다운/중복 요청에 대한 표준 오류 규격
- UI 표기 규칙(최소 문구/버튼 비용)

### 제외 (Out-of-Scope)
- 결제/구독/유료 플랜(추후 문서로 분리)
- 비회원(게스트) 정책(별도 문서/버전에서 정의)
- 토큰 구매/환불/관리자 조정 UI

## 2. 용어 (Terminology)

- **Token**: 사용량 1회 단위. “요청형 AI 기능”에 대해 차감된다.
- **Daily Free**: 하루에 제공되는 무료 토큰(일 3회).
- **Monthly Allowance**: 월간 토큰(월 100회).
- **KST**: Asia/Seoul 기준 시간대.
- **Action Type**: 토큰 차감 대상 기능의 유형.

## 3. 정책 요약 (User-Facing Summary)

- 채점 후 자동 AI 피드백(기본)은 **무료(제출 1건당 1회 자동 생성)** 입니다.
- AI 코치(채팅), AI 힌트, 심화 분석, 피드백 재생성은 **토큰을 사용**합니다.
- 토큰은 **매일 00:00(KST)**, **매월 1일 00:00(KST)**에 리셋됩니다.

## 4. 토큰 버킷 규칙 (Buckets)

### 4.1 회원 기본 제공량
- **Daily Free**: 3 tokens / day
- **Monthly Allowance**: 100 tokens / month

### 4.2 리셋 기준
- Daily Free 리셋: 매일 00:00 KST
- Monthly Allowance 리셋: 매월 1일 00:00 KST

### 4.3 차감 우선순위 (Consumption Priority)
1) Daily Free에서 먼저 차감  
2) Daily Free 소진 시 Monthly Allowance에서 차감  
3) 둘 다 부족하면 요청 거부(표준 에러 반환)

### 4.4 요청 시점 리셋(Request-time Reset)
스케줄러(cron)가 없어도 동작하도록, 매 요청 시 다음을 수행한다.
- 현재 시간이 `daily_reset_at` 이상이면 `daily_used = 0`으로 리셋하고 다음 리셋 시각 재계산
- 현재 시간이 `monthly_reset_at` 이상이면 `monthly_used = 0`으로 리셋하고 다음 리셋 시각 재계산

> 구현은 “요청 시점에 리셋 체크”를 기본으로 한다. (운영 단순화)

## 5. 기능별 과금 규칙 (Cost Table)

### 5.1 Action Type 정의
- `AI_CHAT_COACH` : AI 코치(채팅)
- `AI_HINT` : AI 힌트 요청
- `FEEDBACK_DEEP` : 심화 분석(Deep Dive)
- `FEEDBACK_REGENERATE` : 피드백 재생성(Regenerate)

### 5.2 비용 표
| 기능 | Action Type | 토큰 비용 | 비고 |
|---|---|---:|---|
| AI 코치(채팅) | AI_CHAT_COACH | 1 | 사용자 요청형 |
| AI 힌트 요청 | AI_HINT | 1 | 사용자 요청형 |
| 채점 후 자동 AI 피드백(기본) | (none) | 0 | 제출 1건당 1회 자동 생성(캐시) |
| 심화 분석(Deep Dive) | FEEDBACK_DEEP | 2 | 고급 모델 비용 반영 |
| 피드백 재생성 | FEEDBACK_REGENERATE | 1 | 쿨다운 + 중복 차감 방지 |

### 5.3 무료 기능(토큰 차감 없음)
- `Base Feedback`: 채점 완료 후 자동 생성되는 “기본 피드백”은 **0 토큰**
- 단, **제출(submission) 1건당 1회 생성**이 원칙이며 이후는 캐시 재사용

## 6. 표준 동작 규약 (Invariants)

### 6.1 토큰 차감은 “요청형 버튼”에서만 발생해야 한다
- 사용자가 “행동”을 명시적으로 요청한 경우(버튼/엔드포인트 호출)에만 차감한다.
- 자동 생성(채점 후 기본 피드백)은 토큰 차감이 없어야 한다.

### 6.2 중복 차감 방지 (Idempotency)
다음 조건에서는 **토큰이 추가로 차감되면 안 된다**.
- 네트워크 재시도(클라이언트 retry), 더블 클릭, 브라우저 새로고침 등으로 동일 요청이 중복 수행되는 경우
- 동일 submission에 대해 “이미 생성된 결과”를 재조회하는 경우

권장 방식(둘 중 하나):
- (A) `idempotency_key`를 요청에 포함시키고 서버에서 1회만 처리
- (B) 서버에서 (user_id, action_type, submission_id, time_window) 기준으로 락/중복 체크

## 7. 제한 및 보호(Abuse/Cost Guardrails)

### 7.1 쿨다운(Cooldown)
- 동일 submission에 대해:
  - `FEEDBACK_DEEP`: 최소 60초 쿨다운
  - `FEEDBACK_REGENERATE`: 최소 30초 쿨다운
- 쿨다운 중 요청 시 표준 에러 반환: `COOLDOWN_ACTIVE`

### 7.2 출력 제한(Output Bound)
- 기본 피드백은 길이/항목 수 제한 (ai-feedback.md 참조)
- 심화 분석은 별도 제한을 두되, 무제한 텍스트 금지

## 8. API 레벨 규격 (Backend Contract)

### 8.1 공통 응답(토큰 상태)
토큰 차감이 발생하는 엔드포인트는 응답에 다음을 포함해야 한다.

```json
{
  "token_state": {
    "daily_free_limit": 3,
    "daily_free_used": 1,
    "daily_free_reset_at": "2025-12-26T00:00:00+09:00",
    "monthly_limit": 100,
    "monthly_used": 10,
    "monthly_reset_at": "2026-01-01T00:00:00+09:00"
  }
}
```

### 8.2 표준 오류 규격
- HTTP 402(또는 429/403 중 팀 표준) + JSON 바디
- 권장: “토큰 부족=402”, “쿨다운/레이트리밋=429”

```json
{
  "error": {
    "code": "TOKEN_INSUFFICIENT",
    "message": "토큰이 부족합니다.",
    "details": {
      "daily_free_remaining": 0,
      "monthly_remaining": 0,
      "next_daily_reset_at": "2025-12-26T00:00:00+09:00",
      "next_monthly_reset_at": "2026-01-01T00:00:00+09:00"
    }
  }
}
```

#### 오류 코드 목록 (고정)
- `TOKEN_INSUFFICIENT`
- `COOLDOWN_ACTIVE`
- `IDEMPOTENCY_CONFLICT` (선택)
- `RATE_LIMITED` (선택)
- `INVALID_ACTION` (선택)

## 9. UI 표기 규칙 (Frontend Requirements)

### 9.1 라벨/문구(최소)
- 기본 피드백 영역: `자동 피드백: 무료(제출당 1회)`
- 버튼: 비용을 괄호로 표시
  - `AI 힌트 (1)`
  - `AI 코치 (1)`
  - `심화 분석 (2)`
  - `재생성 (1)`

### 9.2 토큰 카운터 표시(권장)
- `오늘 무료: 2/3` 및 `이번 달: 90/100` (또는 잔여)
- 리셋 시각을 툴팁/보조 텍스트로 제공

## 10. 테스트 케이스(DoD)

### DoD-1: 리셋
- KST 00:00 경계에서 daily_free_used가 리셋된다.
- 매월 1일 00:00 경계에서 monthly_used가 리셋된다.

### DoD-2: 우선순위 차감
- daily 남아 있으면 daily만 증가한다.
- daily 소진 후 monthly가 증가한다.

### DoD-3: 무료 기본 피드백
- 기본 피드백 생성/조회에서 토큰 차감이 없다.
- 동일 submission 재조회 시 LLM 재호출이 없다.

### DoD-4: 중복 차감 방지
- 더블 클릭/재시도에도 토큰이 1회만 차감된다.

### DoD-5: 쿨다운
- 쿨다운 중 요청은 거부되며 COOLDOWN_ACTIVE를 반환한다.
