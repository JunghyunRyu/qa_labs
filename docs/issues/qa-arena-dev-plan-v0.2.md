# QA-Arena 개발 기획서 v0.2

> 범위: **개발 영역(Frontend/Backend/DB/운영)** 한정  
> 제외: 가격/마케팅/세일즈/사업 전략, 결제/구독 시스템(추후), B2B 테넌시/SSO(추후)

---

## 1. 범위 정의

### 포함
- 문제 풀이 페이지 UX 개선(CTA, breadcrumb, 상태 표시)
- 비회원/회원 차등(저장/히스토리/성장 대시보드)
- AI 코치 패널(ON/OFF, 대화 저장, 레이트리밋)
- 성장(Progress) 대시보드(점수/kill ratio/태그 기반 집계)
- API/DB 스키마 확장 및 운영/로그/에러 처리 정비

### 제외
- 결제/구독 시스템
- B2B 전용 테넌시/SSO/기업 계정 관리
- IDE 수준의 고도화된 AI 자동 코드 반영(에디터 직접 패치)

---

## 2. 현행 아키텍처 전제
- Frontend: Next.js  
- Backend: FastAPI  
- Async Grading: Celery + Redis  
- DB: PostgreSQL  
- Reverse Proxy: Nginx  
- Docker Compose 기반 프로덕션 운영

Submission 상태는 `PENDING/RUNNING/SUCCESS/FAILURE/ERROR` 전이를 따름.

---

## 3. 핵심 기능 스펙

## 3.1 문제 풀이 페이지 UX 개선 (Frontend)

### UI 요구사항
1) **상단 고정 CTA**
- Primary: “코드 작성 시작”
- Secondary: “채점 방식 보기”(모달/드로어)

2) **Breadcrumb**
- `문제 목록 > 문제명`

3) **제출 상태 표시**
- 상태 배지: `PENDING/RUNNING/SUCCESS/FAILURE/ERROR` (색/아이콘 통일)
- RUNNING 시 로딩 + 텍스트
- **submission_id 노출**(복사 버튼 포함)

4) **Sticky 요약 패널(데스크탑) / Drawer(모바일)**
- 난이도/태그
- 함수 시그니처 복사
- 최신 제출 상태 배지
- AI 모드 토글(OFF/COACH)

### FE 구현 포인트
- Polling: `GET /api/v1/submissions/{id}`
  - interval: 1.5~2.5초
  - 중단 조건: `SUCCESS/FAILURE/ERROR` 도달 또는 타임아웃
  - 네트워크 에러 시: 지수 백오프 + 일정 횟수 실패 시 사용자 안내

---

## 3.2 회원/비회원 차등 (Auth 최소 MVP)

### 목표
- “학습/채점” 자체는 게스트도 가능
- “저장/성장/AI 대화 기록”은 회원 가치로 제공

### 게스트(비회원)
- 문제 조회/제출/결과 조회: 가능
- 히스토리: 제한(예: 최근 1~3개만 브라우저 로컬 저장)
- AI 사용: 강한 제한(레이트리밋)

### 회원
- Submission 히스토리 영구 저장(기존 submissions 테이블과 user_id 연동)
- 성장 대시보드 제공
- AI 대화 로그 저장/열람

### 구현 제안(개발 관점)
- 인증: OAuth/GitHub 등 기존 흐름을 전제
- **게스트는 anonymous_id를 쿠키로 발급**
  - 목적: 레이트리밋/임시 저장/게스트 세션 식별(개인정보 최소화)
- 회원 전환 시:
  - (선택) anonymous_id의 데이터(대화/최근 제출) → user_id로 마이그레이션

---

## 3.3 AI 코치 패널 (AI-Assist)

### UX
- 문제 풀이 화면 우측 패널
- 모드 토글: **OFF / COACH**
- 입력창 + 대화 리스트 + “저장 정책” 안내(회원/비회원)

### 동작
- `COACH` 모드에서만 `/ai/chat` 호출
- AI는 “정답/완성본 제공”이 아니라 **QA 관점(누락 케이스/경계값/반례/검증 전략)** 중심으로 답변

### 가드레일(서버 단)
- System prompt에 “완성 코드/정답 제공 금지, 힌트/질문 유도” 명시
- 응답 후처리(필터):
  - “정답 코드 블록” 형태가 과도하면 요약/부분 힌트로 축약
- 사용자 입력/응답 저장(회원)

---

## 4. AI API Key 전략 (개발 스펙)

## 4.1 권장: Hybrid 구조
- 기본: **플랫폼 키로 제공(제한적)**
- 옵션: **BYOK(사용자 키) 지원은 v0.3+**로 분리

이유(개발 관점): 초기 UX 마찰을 줄이되, 비용 폭발은 레이트리밋과 플랜 분리로 방어.

## 4.2 플랫폼 키 사용(기본)
- 서버에서만 모델 호출(키는 `.env`에 보관, 프론트로 절대 전달 금지)
- 사용자별/게스트별 레이트리밋 필수(아래 7장)

## 4.3 BYOK(추후) 구현 방식(보안 우선)
- 사용자 키를 DB에 영구 저장하지 않음(초기엔 특히 비추)
- Redis에 TTL(예: 6~24시간)로 임시 저장
- 키는 서버에서만 사용하고, 프론트에서는 “입력/갱신”만 수행
- 감사 로그(키 원문 저장 금지, provider=BYOK 여부만 기록)

---

## 5. Backend API 스펙

### 5.1 AI
- `POST /api/v1/ai/chat`
  - req: `{ problem_id, submission_id?, mode: "COACH", message, code_context? }`
  - res: `{ reply, conversation_id, message_id }`
- `GET /api/v1/ai/conversations?problem_id=...`
- `GET /api/v1/ai/conversations/{conversation_id}`

### 5.2 Progress
- `GET /api/v1/progress/summary`
  - 최근 N회 평균 점수, 평균 kill ratio, 난이도별 성과
- `GET /api/v1/progress/timeline?range=90d`
  - 일/주 단위 시계열

### 5.3 Submission(기존 유지)
- `POST /api/v1/submissions`
- `GET /api/v1/submissions/{id}` (Polling 대상)

---

## 6. DB 스키마(추가)

### 6.1 ai_conversations
- `id (uuid)`
- `user_id (uuid, nullable for guest)`
- `anonymous_id (text, nullable)`
- `problem_id (int)`
- `mode (text: OFF/COACH)`
- `created_at`

### 6.2 ai_messages
- `id (uuid)`
- `conversation_id (uuid fk)`
- `role (user/assistant)`
- `content (text)`
- `token_estimate (int, optional)`
- `created_at`

### 6.3 Progress 집계 방식
- v0.2: 요청 시 집계(간단, 초기 추천)
- v0.3+: 필요 시 스냅샷 테이블(`user_progress_snapshot`)로 캐시

---

## 7. 레이트리밋/비용 방어(필수)
Redis 기반으로:
- 게스트: `ip + anonymous_id` 기준 (예: 분당 5회, 일 30회)
- 회원: `user_id` 기준 (예: 분당 10회, 일 200회)
- 초과 시 `429` 반환 + 재시도 안내

---

## 8. 에러 처리/로그/관측성
- API 에러 응답 포맷 통일(기존 가이드 준수)
- AI 호출 실패:
  - 사용자에게는 일반화된 메시지
  - 서버에는 구조화 로그 기록 예: `[AI_CHAT_ERROR] user_id=... provider=...`
- Submission 장애 대응은 로그 우선 원칙(컨테이너 재시작 전에 원인 파악)

---

## 9. 테스트 계획(개발 스펙)

### Backend
- `/ai/chat`
  - 모드 OFF 시 호출 차단
  - 레이트리밋 동작
  - conversation/message 저장
- `/progress/*`
  - 데이터 없는 신규 유저 응답
  - 난이도/태그 집계 정확성
- 에러 핸들링
  - 모델 호출 실패 시 5xx/4xx 시나리오별 응답 및 로그 확인

### Frontend
- Polling 중단 조건(성공/실패/에러/타임아웃)
- 상태 배지 매핑
- 모바일에서 패널이 Drawer로 전환되는지
- 게스트/회원 차등 UI 노출(저장 안내, 제한 안내)

---

## 10. 배포/운영 반영
- 배포는 표준 절차(필요 시 DB 백업 포함) 준수
- Git 운영은 feature 브랜치 → main 머지 원칙 준수
- 비밀값/키는 절대 코드/로그/프론트에 노출 금지

---

## 11. 개발 백로그(티켓 단위, 우선순위)

### P0
1) FE: CTA 고정 + Breadcrumb + submission_id 노출(복사 포함)  
2) FE: 상태 배지/폴링 UX 정리(중단/타임아웃/재시도)  
3) BE: AI Chat API 스켈레톤 + 레이트리밋 + 구조화 로깅

### P1
4) DB: `ai_conversations` / `ai_messages` 마이그레이션  
5) FE: AI 패널 UI(OFF/COACH) + 대화 히스토리(회원)  
6) BE: Progress summary/timeline API(요청 시 집계)

### P2
7) FE: 성장 대시보드 페이지(요약 + 타임라인 + 태그/난이도 분해)  
8) BE: progress snapshot 캐시(필요 시)  
9) BYOK(옵션): Redis TTL 기반 키 임시 저장 + UI 입력 폼

---

## 부록 A. 구현 체크리스트(빠른 점검)
- [ ] 게스트 anonymous_id 쿠키 발급 및 서버 수용
- [ ] AI 요청 레이트리밋(게스트/회원 분리)
- [ ] AI 응답 가드레일(정답/완성본 억제)
- [ ] 대화 저장(회원) + 조회 API
- [ ] Progress 집계(점수/kill ratio/난이도/태그)
- [ ] FE Polling 안정화(타임아웃/재시도/중단)
