# Database Schema Reference

> Claude Context 전용 - PostgreSQL 스키마 명세

---

## 개요

- **DBMS**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **마이그레이션**: Alembic
- **마이그레이션 파일**: `backend/alembic/versions/`

---

## 테이블 관계도

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│    users    │──┬──│     submissions     │─────│       problems       │
└─────────────┘  │  └─────────────────────┘     └──────────────────────┘
                 │            │                           │
                 │            ├───────────────┐           │
                 │            ▼               ▼           ▼
                 │  ┌─────────────────┐ ┌──────────┐ ┌──────────────────────┐
                 │  │    feedbacks    │ │analysis_ │ │ buggy_implementations │
                 │  └─────────────────┘ │  runs    │ └──────────────────────┘
                 │                      └──────────┘
                 ├──────────────────────────────────────┐
                 │                                      │
                 ▼                                      ▼
┌─────────────────────┐     ┌─────────────────────┐   ┌──────────────────────┐
│  token_transactions │     │   ai_conversations  │   │  bookmarked_problems │
└─────────────────────┘     └─────────────────────┘   └──────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │     ai_messages     │
                            └─────────────────────┘
```

---

## 테이블 상세

### users

사용자 정보

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | UUID | PK | 고유 식별자 |
| email | VARCHAR(255) | NOT NULL | 이메일 (unique) |
| username | VARCHAR(50) | NOT NULL | 사용자명 |
| created_at | TIMESTAMP | NOT NULL | 가입일시 |
| github_id | VARCHAR(50) | NULL | GitHub ID (unique) |
| github_username | VARCHAR(100) | NULL | GitHub 사용자명 |
| google_id | VARCHAR(50) | NULL | Google ID (unique) |
| avatar_url | VARCHAR(500) | NULL | 프로필 이미지 |
| last_login_at | TIMESTAMP | NULL | 마지막 로그인 |
| is_active | BOOLEAN | NOT NULL | 활성 상태 |
| is_deleted | BOOLEAN | NOT NULL | 삭제 여부 (Soft Delete) |
| deleted_at | TIMESTAMP | NULL | 삭제 시각 |
| token_balance | INTEGER | NOT NULL | 월간 토큰 잔액 (기본: 50) |
| token_used | INTEGER | NOT NULL | 사용한 토큰 |
| token_reset_at | TIMESTAMP | NULL | 토큰 리셋 시각 |
| daily_bonus_used | INTEGER | NOT NULL | 일일 보너스 사용 횟수 (최대: 3) |
| daily_bonus_reset_at | TIMESTAMP | NULL | 보너스 리셋 시각 |
| tier | VARCHAR(20) | NOT NULL | 티어 (free/premium) |
| plan_key | VARCHAR(20) | NOT NULL | 플랜 (free/lite/pro) |
| plan_started_at | TIMESTAMP | NULL | 플랜 시작일 |
| plan_expires_at | TIMESTAMP | NULL | 플랜 만료일 |
| terms_accepted_at | TIMESTAMP | NULL | 이용약관 동의 시각 |

#### 인덱스
- `ix_users_email` (email)
- `ix_users_github_id` (github_id)
- `ix_users_google_id` (google_id)

---

### problems

문제 정보

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | INTEGER | PK | 고유 식별자 (Auto Increment) |
| slug | VARCHAR(100) | NOT NULL | URL 슬러그 (unique) |
| title | VARCHAR(200) | NOT NULL | 문제 제목 |
| description_md | TEXT | NOT NULL | 문제 설명 (Markdown) |
| function_signature | TEXT | NOT NULL | 함수 시그니처 |
| golden_code | TEXT | NOT NULL | 정답 코드 |
| difficulty | VARCHAR(20) | NOT NULL | 난이도 |
| domain | VARCHAR(20) | NOT NULL | 도메인 |
| skills | JSONB | NULL | 스킬 태그 |
| summary | TEXT | NULL | 핵심 요약 |
| short_description | VARCHAR(200) | NULL | 짧은 설명 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| published_at | TIMESTAMP | NULL | 공개일시 |
| is_visible | BOOLEAN | NOT NULL | 노출 여부 |
| rubric_score | FLOAT | NULL | 루브릭 점수 |
| rubric_analysis | JSONB | NULL | 루브릭 분석 |
| hints | JSONB | NULL | 힌트 (level1, level2, level3) |
| sample_code | TEXT | NULL | 샘플 코드 |

#### Difficulty 값
- Very Easy
- Easy
- Medium
- Hard

#### Domain 값
- common
- fintech
- commerce
- saas
- platform
- content

#### 인덱스
- `ix_problems_slug` (slug)
- `ix_problems_domain` (domain)

---

### buggy_implementations

버그 코드 (Mutant)

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | INTEGER | PK | 고유 식별자 |
| problem_id | INTEGER | FK | 문제 ID |
| buggy_code | TEXT | NOT NULL | 버그 코드 |
| bug_description | VARCHAR(255) | NULL | 버그 설명 |
| weight | INTEGER | NOT NULL | 가중치 (기본: 1) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

#### 관계
- `problems.id` → `buggy_implementations.problem_id` (CASCADE)

#### 인덱스
- `ix_buggy_implementations_problem_id` (problem_id)

---

### submissions

제출 정보

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK | 사용자 ID (NULL 가능: 비회원) |
| anonymous_id | VARCHAR(36) | NULL | 비회원 식별자 |
| problem_id | INTEGER | FK | 문제 ID |
| code | TEXT | NOT NULL | 제출 코드 |
| status | VARCHAR(20) | NOT NULL | 상태 |
| score | INTEGER | NOT NULL | 점수 (0-100) |
| killed_mutants | INTEGER | NULL | 잡은 Mutant 수 |
| total_mutants | INTEGER | NULL | 전체 Mutant 수 |
| execution_log | JSONB | NULL | 실행 로그 |
| feedback_json | JSONB | NULL | 피드백 JSON |
| progress | JSONB | NULL | 진행 상태 |
| created_at | TIMESTAMP | NOT NULL | 제출일시 |
| test_quality_score | FLOAT | NULL | 테스트 품질 점수 |
| test_quality_grade | VARCHAR(1) | NULL | 품질 등급 (A/B/C/D/F) |
| test_quality_analysis | JSONB | NULL | 품질 분석 |
| execution_mode | VARCHAR(10) | NOT NULL | 실행 모드 (client/server) |
| verified | BOOLEAN | NOT NULL | 서버 검증 완료 여부 |
| verification_status | VARCHAR(20) | NULL | 검증 상태 |
| server_score | INTEGER | NULL | 서버 검증 점수 |
| verification_triggered_by | VARCHAR(50) | NULL | 검증 트리거 사유 |
| verified_at | TIMESTAMP | NULL | 검증 완료 시각 |
| code_hash | VARCHAR(64) | NULL | 코드 해시 (중복 감지) |

#### Status 값
- PENDING
- RUNNING
- SUCCESS
- FAILURE
- ERROR

#### Verification Status 값
- pending
- verified
- mismatch

#### 인덱스
- `ix_submissions_user_id` (user_id)
- `ix_submissions_anonymous_id` (anonymous_id)
- `ix_submissions_problem_id` (problem_id)
- `ix_submissions_status` (status)
- `ix_submissions_execution_mode` (execution_mode)
- `ix_submissions_verified` (verified)
- `ix_submissions_code_hash` (code_hash)

#### 제약조건
- `submissions_user_or_anonymous_check`: user_id 또는 anonymous_id 중 하나는 NOT NULL

---

### token_transactions

토큰 거래 내역 (APPEND ONLY)

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK | 사용자 ID |
| action_type | VARCHAR(50) | NOT NULL | 액션 유형 |
| source_type | VARCHAR(50) | NOT NULL | 출처 유형 |
| amount | INTEGER | NOT NULL | 금액 (+: 지급, -: 차감) |
| balance_before | INTEGER | NOT NULL | 거래 전 잔액 |
| balance_after | INTEGER | NOT NULL | 거래 후 잔액 |
| submission_id | UUID | FK | 관련 제출 ID |
| idempotency_key | VARCHAR(100) | NULL | 멱등성 키 (unique) |
| description | VARCHAR(500) | NULL | 거래 설명 |
| created_at | TIMESTAMP | NOT NULL | 거래일시 |

#### Action Types
| 값 | 설명 |
|----|------|
| ai_coach | AI 코치 사용 |
| ai_hint | AI 힌트 사용 |
| feedback_base | 기본 피드백 |
| feedback_deep | 심화 분석 |
| feedback_regenerate | 피드백 재생성 |
| success_analysis | 성공 분석 |
| daily_grant | 일일 보너스 지급 |
| monthly_reset | 월간 리셋 |
| admin_adjustment | 관리자 조정 |
| expired | 만료 차감 |

#### Source Types
| 값 | 설명 |
|----|------|
| daily_bonus | 일일 무료 보너스 |
| monthly | 월간 할당 |
| top_up | 추가 충전 |
| admin_grant | 관리자 지급 |
| refund | 환불 |
| system | 시스템 조정 |

---

### ai_conversations

AI 대화 세션

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK | 사용자 ID (NULL 가능: 비회원) |
| anonymous_id | VARCHAR(36) | NULL | 비회원 식별자 |
| problem_id | INTEGER | FK | 문제 ID |
| mode | VARCHAR(10) | NOT NULL | 모드 (OFF/COACH, 기본: COACH) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

#### 인덱스
- `ix_ai_conversations_user_id` (user_id)
- `ix_ai_conversations_anonymous_id` (anonymous_id)
- `ix_ai_conversations_problem_id` (problem_id)

#### 제약조건
- `chk_ai_conv_owner`: user_id 또는 anonymous_id 중 하나는 NOT NULL

---

### ai_messages

AI 대화 메시지

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | UUID | PK | 고유 식별자 |
| conversation_id | UUID | FK | 대화 세션 ID |
| role | VARCHAR(10) | NOT NULL | 역할 (user/assistant) |
| content | TEXT | NOT NULL | 메시지 내용 |
| token_estimate | INTEGER | NULL | 토큰 추정치 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

#### 인덱스
- `ix_ai_messages_conversation_id` (conversation_id)

#### 제약조건
- `chk_ai_msg_role`: role IN ('user', 'assistant')

---

### bookmarked_problems

북마크

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | INTEGER | PK | 고유 식별자 |
| user_id | UUID | FK | 사용자 ID |
| problem_id | INTEGER | FK | 문제 ID |
| created_at | TIMESTAMP | NOT NULL | 북마크 일시 |

#### 제약조건
- `bookmarked_problems_user_problem_unique` (user_id, problem_id) UNIQUE

---

### hint_views

힌트 조회 기록

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | INTEGER | PK | 고유 식별자 |
| user_id | UUID | FK | 사용자 ID |
| problem_id | INTEGER | FK | 문제 ID |
| hint_level | INTEGER | NOT NULL | 조회한 힌트 레벨 (1, 2, 3) |
| viewed_at | TIMESTAMP | NOT NULL | 조회 일시 |

---

### feedbacks

피드백 정보

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | UUID | PK | 고유 식별자 |
| submission_id | UUID | FK | 제출 ID |
| user_id | UUID | FK | 사용자 ID (토큰 차감 기록용) |
| feedback_type | VARCHAR(20) | NOT NULL | 피드백 유형 |
| status | VARCHAR(20) | NOT NULL | 상태 |
| content | JSONB | NULL | 피드백 내용 |
| schema_version | INTEGER | NOT NULL | JSON 스키마 버전 (기본: 1) |
| token_cost | INTEGER | NOT NULL | 소비된 토큰 수 (기본: 0) |
| error_message | TEXT | NULL | 실패 시 에러 메시지 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| completed_at | TIMESTAMP | NULL | 완료일시 |

#### Feedback Types
| 값 | 설명 |
|----|------|
| base | 기본 피드백 (제출 시 자동 생성) |
| deep | 심화 분석 (유료) |
| success | 성공 분석 (100점 달성 시) |
| regenerate | 재생성 |

#### Status
| 값 | 설명 |
|----|------|
| pending | 대기 중 |
| generating | 생성 중 |
| completed | 완료 |
| failed | 실패 |

#### 인덱스
- `ix_feedbacks_submission_type` (submission_id, feedback_type)
- `ix_feedbacks_user_status` (user_id, status)

---

### analysis_runs

테스트 품질 분석 실행 이력

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | INTEGER | PK | 고유 식별자 |
| submission_id | UUID | FK | 제출 ID (submission 분석 시) |
| problem_id | INTEGER | FK | 문제 ID (rubric 분석 시) |
| scope | VARCHAR(20) | NOT NULL | 분석 범위 (submission/problem_rubric) |
| parser_version | VARCHAR(10) | NOT NULL | 파서 버전 |
| scoring_version | VARCHAR(10) | NOT NULL | 채점 버전 |
| source_hash | VARCHAR(32) | NOT NULL | 소스 코드 해시 |
| status | VARCHAR(20) | NOT NULL | 상태 (PENDING/RUNNING/SUCCESS/ERROR) |
| confidence_score | FLOAT | NULL | 신뢰도 점수 (0.0 ~ 1.0) |
| result | JSONB | NULL | 분석 결과 |
| error_message | TEXT | NULL | 에러 메시지 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

#### 인덱스
- `ix_analysis_runs_submission_id` (submission_id)
- `ix_analysis_runs_problem_id` (problem_id)
- `ix_analysis_runs_status` (status)

#### 제약조건
- `analysis_runs_scope_check`: scope IN ('submission', 'problem_rubric')
- `analysis_runs_status_check`: status IN ('PENDING', 'RUNNING', 'SUCCESS', 'ERROR')
- `analysis_runs_target_check`: submission_id 또는 problem_id 중 하나만 NOT NULL
- `analysis_runs_confidence_check`: confidence_score는 NULL이거나 0.0 ~ 1.0 범위

---

## 마이그레이션

### 마이그레이션 명령

```bash
# 새 마이그레이션 생성
cd backend
alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

### 주의사항

1. **스키마 변경은 반드시 마이그레이션으로**
2. **프로덕션 적용 전 로컬 테스트 필수**
3. **데이터 손실 가능성 있는 변경은 백업 후 진행**
4. **관련 문서**: `docs/specs/backup_restore.md`

---

*최종 업데이트: 2026-01-10*
