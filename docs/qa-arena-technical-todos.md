# QA-Arena 기술적 구현 TODO 리스트

> 작성일: 2025-01-27  
> 기반 문서: `qa-arena-spec.md`, `qa-arena-milestones.md`  
> 목적: 마일스톤 기준 기술적 구현 항목 정리  
> 참고: 비즈니스/전략적 TODO는 `ToDoList.md` 참고

---

## 현재 구현 상태 요약

### 완료된 기능 (Milestone 1-10)
- ✅ 기본 프로젝트 구조 및 개발 환경
- ✅ 데이터베이스 스키마 및 모델 (users, problems, buggy_implementations, submissions)
- ✅ Backend API (문제 조회, 제출, Admin 문제 생성)
- ✅ Celery 기반 비동기 채점 파이프라인
- ✅ Docker 기반 Judge/Runner 서비스
- ✅ AI Problem Designer (OpenAI GPT-4)
- ✅ AI Feedback Engine (OpenAI GPT-4)
- ✅ Frontend UI (문제 목록/상세, 코드 에디터, 결과 표시, Admin UI)

### 미구현/미완성 기능
- ❌ Docker 소켓 마운트 (프로덕션 환경)
- ❌ Admin API 인증/권한 시스템
- ❌ AI-Assist 모드 (DB 스키마 확장 필요)
- ❌ 프로덕션 보안 강화 (에러 노출 방지, Rate Limiting 등)
- ❌ 사용자 인증/권한 시스템
- ❌ 통계/리포팅 기능

---

## v0.1 - 내부용 MVP (기본 채점 파이프라인 완성)

**목표**: 내부 테스트 가능한 최소 기능 완성

### 1.1. Docker 인프라 설정

#### Docker 소켓 마운트 (프로덕션 환경)
- [x] `docker-compose.yml` 수정 (로컬 개발용)
  - [x] `celery_worker` 서비스에 Docker 소켓 마운트 추가
    - [x] `volumes: - /var/run/docker.sock:/var/run/docker.sock` (Linux용)
    - [x] Windows 환경 고려: 컨테이너 내부 환경 감지 로직 추가
  - [ ] `backend` 서비스에도 동일 설정 (필요 시, 현재는 Celery Worker만)
  - [x] 환경변수 설정: `DOCKER_CONTAINER=true` 추가 (코드에서 자동 감지)
- [x] `backend/app/services/docker_service.py` 검증 및 개선
  - [x] `docker.from_env()` 사용 확인 (컨테이너 내부에서는 Unix socket 우선)
  - [x] Windows/Linux 환경 분기 로직 검증 및 개선 (컨테이너 내부 환경 감지 추가)
  - [ ] 프로덕션 환경에서 Docker 클라이언트 연결 테스트 (EC2에서 검증 필요)
- [ ] 컨테이너 재배포 및 검증
  - [ ] `docker-compose -f docker-compose.prod.yml down`
  - [ ] `docker-compose -f docker-compose.prod.yml up -d --build`
  - [ ] Celery Worker 로그 확인: `docker-compose logs celery_worker | tail -n 100`
  - [ ] Judge 컨테이너 생성/종료 동작 확인

#### Judge Docker 이미지 빌드 및 배포
- [x] Judge 이미지 빌드 스크립트 작성/검증
  - [x] `judge/Dockerfile` 최적화 확인 (`python:3.11-slim` 기반)
  - [x] 이미지 빌드: `docker build -t qa-arena-judge:latest ./judge` (로컬에서 확인)
  - [ ] 이미지 태그 및 버전 관리 전략 수립 (EC2 배포 시 적용)

### 1.2. 채점 파이프라인 검증

#### End-to-End 채점 플로우 테스트
- [x] 문제 등록 검증
  - [x] 최소 1개 이상 문제 등록 확인 (15개 문제 확인 완료)
  - [x] 문제 메타데이터 정확성 확인 (API 응답 확인)
- [x] 제출 생성 및 처리 검증 (부분 완료)
  - [x] `POST /api/v1/submissions` 엔드포인트 테스트 (성공)
  - [x] Submission 상태 흐름 확인: `PENDING` 상태 확인 완료 (Windows 환경 제한으로 `RUNNING → SUCCESS/FAILURE` 미검증)
  - [x] Celery Task 발행 및 처리 확인 (Task 수신 확인, Docker 연결 실패로 실제 처리 미완료)
- [ ] Judge 컨테이너 실행 검증 (Windows 환경 제한으로 미검증, EC2에서 검증 필요)
  - [ ] Golden Code 테스트 실행 확인
  - [ ] Mutant 테스트 실행 확인
  - [ ] 컨테이너 리소스 정리 확인 (메모리 누수 방지)
- [x] 결과 저장 및 조회 검증 (부분 완료)
  - [x] `GET /api/v1/submissions/{id}` 응답 정확성 (API 정상 동작 확인)
  - [ ] 점수 계산 로직 검증 (실제 채점 미완료로 미검증)
  - [ ] Kill ratio 계산 정확성 (실제 채점 미완료로 미검증)

### 1.3. 기본 에러 핸들링

#### 에러 처리 강화
- [ ] Docker 컨테이너 실행 실패 처리
  - [ ] 타임아웃 처리 검증 (기본 5초)
  - [ ] 컨테이너 강제 종료 로직 검증
  - [ ] 리소스 정리 보장 (finally 블록)
- [ ] Celery Task 실패 처리
  - [ ] 재시도 로직 설정 (max_retries, retry_backoff)
  - [ ] 실패 시 Submission 상태 업데이트 (`ERROR`)
  - [ ] 에러 로그 저장 (`execution_log` 필드)
- [ ] API 에러 응답 표준화
  - [ ] HTTP 상태 코드 일관성
  - [ ] 에러 메시지 형식 통일
  - [ ] 스택 트레이스 노출 방지 (프로덕션)

### 1.4. 데이터베이스 스키마 정리

#### Enum 값 및 제약조건 정리
- [ ] `difficulty` enum 값 최종 확정
  - [ ] 현재: `Very Easy`, `Easy`, `Medium`, `Hard`
  - [ ] 마이그레이션 스크립트 검증
- [ ] `status` enum 값 검증 (submissions 테이블)
  - [ ] 현재: `PENDING`, `RUNNING`, `SUCCESS`, `FAILURE`, `ERROR`
  - [ ] 상태 전이 규칙 문서화
- [ ] Alembic 마이그레이션 스크립트 재점검
  - [ ] 모든 마이그레이션 파일 검토
  - [ ] 롤백 스크립트 검증
- [ ] 테스트 데이터 세트 추가
  - [ ] 샘플 문제 데이터 (다양한 난이도)
  - [ ] 샘플 제출 데이터 (성공/실패 케이스)

---

## v0.2 - 보안/로그/기본 운영 안정화

**목표**: 프로덕션 환경 배포를 위한 보안 및 운영 안정성 확보

### 2.1. Admin API 인증/권한 시스템

#### 인증 시스템 구현
- [ ] JWT 기반 인증 구현
  - [ ] `app/core/auth.py` 생성
    - [ ] JWT 토큰 생성/검증 함수
    - [ ] 비밀키 환경변수 관리 (`JWT_SECRET_KEY`)
    - [ ] 토큰 만료 시간 설정 (예: 24시간)
  - [ ] `app/core/dependencies.py` 생성
    - [ ] `get_current_user()` 의존성 함수
    - [ ] `get_current_admin()` 의존성 함수 (Admin 권한 검증)
- [ ] Admin API 엔드포인트 보호
  - [ ] `app/api/admin.py` 수정
    - [ ] `@router.post("/problems/ai-generate")`에 인증 추가
    - [ ] `@router.post("/problems")`에 인증 추가
  - [ ] 인증 실패 시 `401 Unauthorized` 응답
  - [ ] 권한 부족 시 `403 Forbidden` 응답
- [ ] 사용자 인증 API 구현 (옵션)
  - [ ] `POST /api/v1/auth/login` - 로그인 엔드포인트
  - [ ] `POST /api/v1/auth/refresh` - 토큰 갱신 엔드포인트
  - [ ] `GET /api/v1/auth/me` - 현재 사용자 정보 조회

#### 임시 보안 조치 (v0.2 전용)
- [ ] IP 화이트리스트 기반 Admin API 보호
  - [ ] Nginx 설정에서 Admin API IP 제한
  - [ ] `nginx/conf.d/qa-arena.conf` 수정
    - [ ] `location /api/admin/` 블록에 `allow/deny` 지시어 추가
  - [ ] 환경변수로 허용 IP 목록 관리

### 2.2. 에러 노출 방지

#### 프로덕션 에러 처리
- [ ] 스택 트레이스 노출 방지
  - [ ] `app/main.py` 전역 예외 핸들러 수정
    - [ ] `DEBUG=False`일 때 스택 트레이스 숨김
    - [ ] 일반적인 에러 메시지만 반환
  - [ ] 500 에러 공통 처리
    - [ ] JSON 응답: `{"detail": "Internal server error"}`
    - [ ] 실제 에러는 로그에만 기록
- [ ] 데이터베이스 에러 처리
  - [ ] SQLAlchemy 예외 핸들링
  - [ ] 연결 실패 시 재시도 로직
  - [ ] 사용자에게는 일반적인 에러 메시지 반환
- [ ] LLM API 에러 처리
  - [ ] OpenAI API 실패 시 적절한 에러 메시지
  - [ ] API 키 누락/유효하지 않음 처리
  - [ ] Rate limit 초과 처리

### 2.3. 로깅/모니터링 강화

#### 로깅 시스템 개선
- [ ] 구조화된 로깅 구현
  - [ ] `app/core/logging.py` 확장
    - [ ] JSON 형식 로그 출력 (프로덕션)
    - [ ] 로그 레벨별 파일 분리 (info.log, error.log)
  - [ ] 주요 이벤트 로깅
    - [ ] 제출 생성/처리 완료
    - [ ] 채점 실패
    - [ ] Admin API 호출
    - [ ] LLM API 호출 (비용 추적)
- [ ] 로그 수집 및 분석
  - [ ] 로그 파일 로테이션 설정
  - [ ] 로그 백업 전략 수립
  - [ ] (옵션) ELK Stack 또는 CloudWatch 연동

#### 모니터링 지표 수집
- [ ] 기본 메트릭 수집
  - [ ] API 응답 시간
  - [ ] 채점 처리 시간
  - [ ] Celery Task 큐 길이
  - [ ] Docker 컨테이너 실행 횟수/실패율
- [ ] Health Check 엔드포인트 확장
  - [ ] `GET /health` 확장
    - [ ] 데이터베이스 연결 상태
    - [ ] Redis 연결 상태
    - [ ] Docker 데몬 연결 상태

### 2.4. Rate Limiting 구현

#### Nginx 기반 Rate Limiting
- [ ] `nginx/nginx.conf` 수정
  - [ ] `limit_req_zone` 지시어 추가
    - [ ] API 엔드포인트용 zone
    - [ ] Admin API용 zone (더 엄격한 제한)
  - [ ] `limit_req` 적용
    - [ ] `/api/v1/` 엔드포인트: 예) 100 req/min
    - [ ] `/api/admin/` 엔드포인트: 예) 20 req/min
- [ ] Rate Limit 초과 시 응답
  - [ ] `429 Too Many Requests` 상태 코드
  - [ ] `Retry-After` 헤더 포함

#### 애플리케이션 레벨 Rate Limiting (옵션)
- [ ] FastAPI 미들웨어 구현
  - [ ] IP 기반 요청 제한
  - [ ] Redis를 이용한 분산 Rate Limiting
  - [ ] 사용자별 제한 (인증 시스템 연동)

### 2.5. 데이터베이스/인프라 보안

#### 네트워크 보안
- [ ] 데이터베이스 포트 외부 노출 방지
  - [ ] `docker-compose.prod.yml` 확인
    - [ ] PostgreSQL 포트 매핑 제거 (내부 네트워크만)
    - [ ] Redis 포트 매핑 제거 (내부 네트워크만)
  - [ ] Docker 네트워크 격리 확인
- [ ] 방화벽 규칙 설정 (서버 레벨)
  - [ ] 필요한 포트만 개방 (HTTP: 80, HTTPS: 443)
  - [ ] SSH 접근 제한 (특정 IP만)

#### 환경변수 보안
- [ ] 민감 정보 환경변수 관리
  - [ ] `.env.example` 업데이트 (실제 값 제외)
  - [ ] 프로덕션 환경변수 암호화 (옵션)
  - [ ] Secrets Manager 연동 (AWS Secrets Manager 등, 옵션)

---

## v0.3 - AI-Assist 모드 1차 도입

**목표**: AI 사용을 전제로 한 평가 모드 구현

### 3.1. 데이터베이스 스키마 확장

#### Problems 테이블 확장
- [ ] `ai_assist` 플래그 추가
  - [ ] Alembic 마이그레이션 생성
    - [ ] `problems` 테이블에 `ai_assist BOOLEAN DEFAULT FALSE` 컬럼 추가
    - [ ] 인덱스 추가 (필요 시)
  - [ ] `app/models/problem.py` 수정
    - [ ] `ai_assist` 필드 추가
  - [ ] `app/schemas/problem.py` 수정
    - [ ] Request/Response 스키마에 `ai_assist` 필드 추가

#### Submissions 테이블 확장
- [ ] `ai_usage_notes` 필드 추가
  - [ ] Alembic 마이그레이션 생성
    - [ ] `submissions` 테이블에 `ai_usage_notes TEXT` 컬럼 추가
    - [ ] NULL 허용 (AI-Free 모드에서는 NULL)
  - [ ] `app/models/submission.py` 수정
    - [ ] `ai_usage_notes` 필드 추가
  - [ ] `app/schemas/submission.py` 수정
    - [ ] Request/Response 스키마에 `ai_usage_notes` 필드 추가

#### 마이그레이션 실행 및 검증
- [ ] 마이그레이션 스크립트 검증
  - [ ] 롤백 테스트
  - [ ] 기존 데이터 호환성 확인
- [ ] 테스트 데이터 업데이트
  - [ ] AI-Assist 모드 문제 샘플 추가
  - [ ] AI-Assist 모드 제출 샘플 추가

### 3.2. Backend API 확장

#### 문제 생성/조회 API 확장
- [ ] `POST /api/admin/problems` 수정
  - [ ] `ProblemCreateWithBuggy` 스키마에 `ai_assist` 필드 추가
  - [ ] 문제 생성 시 `ai_assist` 값 저장
- [ ] `GET /api/v1/problems/{id}` 수정
  - [ ] 응답에 `ai_assist` 필드 포함
  - [ ] AI-Assist 모드일 때 추가 안내 메시지 (옵션)

#### 제출 API 확장
- [ ] `POST /api/v1/submissions` 수정
  - [ ] `SubmissionCreate` 스키마에 `ai_usage_notes` 필드 추가
  - [ ] AI-Assist 모드 문제일 때 `ai_usage_notes` 필수 검증
  - [ ] AI-Free 모드 문제일 때 `ai_usage_notes` NULL 허용
- [ ] `GET /api/v1/submissions/{id}` 수정
  - [ ] 응답에 `ai_usage_notes` 필드 포함
  - [ ] Admin API에서만 노출 (옵션)

#### AI-Assist 모드 검증 로직
- [ ] `app/services/submission_service.py` 수정
  - [ ] 문제의 `ai_assist` 플래그 확인
  - [ ] AI-Assist 모드일 때 `ai_usage_notes` 필수 검증
  - [ ] AI-Free 모드일 때 `ai_usage_notes` NULL 허용

### 3.3. Frontend UI 확장

#### 문제 상세 페이지 수정
- [ ] AI-Assist 모드 표시
  - [ ] `frontend/app/problems/[id]/page.tsx` 수정
    - [ ] `ai_assist` 플래그에 따라 UI 표시
    - [ ] AI-Assist 모드 안내 메시지 추가
- [ ] 제출 폼 수정
  - [ ] `frontend/components/CodeEditor.tsx` 또는 제출 컴포넌트 수정
    - [ ] AI-Assist 모드일 때 `ai_usage_notes` 입력 필드 표시
    - [ ] 필수 입력 표시 및 검증
    - [ ] AI-Free 모드일 때 필드 숨김

#### 제출 결과 페이지 수정
- [ ] AI 사용 내역 표시
  - [ ] `frontend/components/SubmissionResult.tsx` 수정
    - [ ] `ai_usage_notes` 필드 표시 (있는 경우)
    - [ ] AI-Assist 모드 제출임을 명시

#### Admin UI 확장
- [ ] 문제 생성 폼 수정
  - [ ] `frontend/app/admin/problems/new/page.tsx` 수정
    - [ ] `ai_assist` 체크박스 추가
    - [ ] AI-Assist 모드 설명 추가

### 3.4. 평가 로직 확장 (옵션)

#### AI 사용 내역 기반 평가
- [ ] 평가 항목 설계 문서화
  - [ ] 프롬프트 품질 평가 기준
  - [ ] AI 답변 검증 태도 평가 기준
  - [ ] 테스트 설계 능력 평가 기준
- [ ] AI 피드백 확장 (향후)
  - [ ] `ai_usage_notes`를 고려한 피드백 생성
  - [ ] 프롬프트 품질 피드백 추가

---

## v0.4 - 외부 베타/지인 테스트

**목표**: 외부 사용자 테스트를 위한 안정성 및 사용성 개선

### 4.1. 프로덕션 환경 최적화

#### Docker Compose 프로덕션 설정
- [ ] `docker-compose.prod.yml` 최적화
  - [ ] 리소스 제한 설정
    - [ ] 메모리 제한 (각 서비스)
    - [ ] CPU 제한 (각 서비스)
  - [ ] Health Check 설정
    - [ ] 모든 서비스에 healthcheck 추가
  - [ ] 재시작 정책 설정
    - [ ] `restart: unless-stopped` 확인
- [ ] 환경변수 관리
  - [ ] `.env.production.example` 생성
  - [ ] 프로덕션 환경변수 문서화

#### Nginx 최적화
- [ ] `nginx/conf.d/qa-arena.conf` 최적화
  - [ ] Gzip 압축 활성화
  - [ ] 정적 파일 캐싱 설정
  - [ ] 프록시 버퍼링 설정
- [ ] SSL/HTTPS 설정 (옵션)
  - [ ] Let's Encrypt 인증서 설정
  - [ ] HTTP to HTTPS 리다이렉트

### 4.2. 성능 튜닝

#### 데이터베이스 최적화
- [ ] 인덱스 최적화
  - [ ] 쿼리 성능 분석
  - [ ] 필요한 인덱스 추가
    - [ ] `submissions.status` 인덱스 확인
    - [ ] `submissions.created_at` 인덱스 확인
    - [ ] `problems.difficulty` 인덱스 확인
- [ ] 쿼리 최적화
  - [ ] N+1 쿼리 문제 해결
  - [ ] Eager loading 적용 (SQLAlchemy)

#### Celery Worker 최적화
- [ ] Worker 프로세스 수 조정
  - [ ] `celery_worker` 서비스에 `--concurrency` 옵션 추가
  - [ ] 서버 리소스에 맞게 조정
- [ ] Task 큐 최적화
  - [ ] 우선순위 큐 설정 (옵션)
  - [ ] Task 타임아웃 설정

#### Docker 컨테이너 최적화
- [ ] Judge 컨테이너 실행 시간 최적화
  - [ ] 컨테이너 재사용 전략 검토
  - [ ] 이미지 크기 최적화
- [ ] 리소스 사용량 모니터링
  - [ ] 메모리 사용량 추적
  - [ ] CPU 사용량 추적

### 4.3. 사용자 피드백 수집 시스템

#### 피드백 수집 UI
- [ ] 피드백 폼 구현
  - [ ] `frontend/components/FeedbackForm.tsx` 생성
    - [ ] 제출 결과 페이지에 피드백 버튼 추가
    - [ ] 피드백 내용 입력 폼
  - [ ] `POST /api/v1/feedback` 엔드포인트 구현
    - [ ] 피드백 데이터 저장 (DB 또는 파일)
- [ ] 피드백 데이터 모델 (옵션)
  - [ ] `feedbacks` 테이블 생성
  - [ ] 피드백 조회 API (Admin 전용)

#### 로그 기반 사용자 행동 분석
- [ ] 주요 이벤트 로깅
  - [ ] 문제 조회 로그
  - [ ] 제출 생성 로그
  - [ ] 에러 발생 로그
- [ ] 분석 대시보드 (옵션)
  - [ ] Admin 대시보드에 통계 표시
  - [ ] 문제별 제출 수
  - [ ] 평균 점수
  - [ ] 에러 발생률

### 4.4. 베타 안내 및 안전장치

#### UI 안내 문구
- [ ] 베타 버전 안내
  - [ ] 메인 페이지/푸터에 베타 안내 추가
    - [ ] "현재 베타 버전입니다. 테스트용으로만 사용해 주세요."
    - [ ] "민감 정보/실제 고객 데이터는 절대 입력하지 마세요."
- [ ] 사용자 가이드 링크
  - [ ] `USER_GUIDE.md` 링크 추가
  - [ ] FAQ 섹션 추가 (옵션)

#### 안전장치
- [ ] Rate Limiting 강화
  - [ ] 사용자별 제한 (IP 기반 또는 인증 기반)
  - [ ] 일일 제출 제한 (옵션)
- [ ] 모니터링 알림 설정
  - [ ] 에러 발생 시 알림 (옵션)
  - [ ] 리소스 사용량 임계값 알림 (옵션)

---

## v1.0 - 회사/교육용으로 보여줄 수 있는 수준

**목표**: 실제 서비스로 사용 가능한 수준의 기능 완성

### 5.1. 인증/권한 시스템 완성

#### 사용자 인증 시스템
- [ ] 회원가입/로그인 구현
  - [ ] `POST /api/v1/auth/register` - 회원가입
  - [ ] `POST /api/v1/auth/login` - 로그인
  - [ ] `POST /api/v1/auth/logout` - 로그아웃
  - [ ] `POST /api/v1/auth/refresh` - 토큰 갱신
- [ ] 비밀번호 관리
  - [ ] 비밀번호 해싱 (bcrypt)
  - [ ] 비밀번호 재설정 기능 (옵션)
- [ ] 세션 관리
  - [ ] JWT 토큰 관리
  - [ ] 리프레시 토큰 구현

#### 권한 시스템
- [ ] 역할 기반 접근 제어 (RBAC)
  - [ ] 사용자 역할: `user`, `admin`
  - [ ] `users` 테이블에 `role` 컬럼 추가
  - [ ] 권한 검증 미들웨어 구현
- [ ] 리소스별 권한
  - [ ] 사용자는 자신의 제출만 조회
  - [ ] Admin은 모든 제출 조회 가능
  - [ ] Admin만 문제 생성/수정 가능

### 5.2. 사용자 관리 시스템

#### 사용자 프로필
- [ ] 사용자 정보 관리
  - [ ] `GET /api/v1/users/me` - 현재 사용자 정보
  - [ ] `PATCH /api/v1/users/me` - 사용자 정보 수정
- [ ] 사용자 대시보드
  - [ ] `frontend/app/dashboard/page.tsx` 생성
    - [ ] 내 제출 목록
    - [ ] 통계 (해결한 문제 수, 평균 점수 등)

#### Admin 사용자 관리
- [ ] 사용자 목록 조회
  - [ ] `GET /api/admin/users` - 사용자 목록 (Admin 전용)
  - [ ] 페이징 및 필터링
- [ ] 사용자 상세 조회
  - [ ] `GET /api/admin/users/{id}` - 사용자 상세 (Admin 전용)
  - [ ] 사용자 제출 내역 포함

### 5.3. 통계/리포팅 기능

#### 문제 통계
- [ ] 문제별 통계 API
  - [ ] `GET /api/v1/problems/{id}/stats` - 문제 통계
    - [ ] 총 제출 수
    - [ ] 평균 점수
    - [ ] 성공률
    - [ ] 난이도별 분포
- [ ] 통계 시각화
  - [ ] `frontend/components/ProblemStats.tsx` 생성
    - [ ] 차트 라이브러리 사용 (Chart.js, Recharts 등)

#### 사용자 통계
- [ ] 사용자별 통계 API
  - [ ] `GET /api/v1/users/me/stats` - 내 통계
    - [ ] 해결한 문제 수
    - [ ] 평균 점수
    - [ ] 제출 내역
- [ ] 리더보드 (옵션)
  - [ ] `GET /api/v1/leaderboard` - 리더보드
  - [ ] 상위 사용자 목록

#### Admin 대시보드
- [ ] 전체 통계
  - [ ] `GET /api/admin/stats` - 전체 통계
    - [ ] 총 사용자 수
    - [ ] 총 제출 수
    - [ ] 일일 활성 사용자
    - [ ] 문제별 통계
- [ ] Admin 대시보드 UI
  - [ ] `frontend/app/admin/dashboard/page.tsx` 생성
    - [ ] 통계 차트
    - [ ] 최근 제출 목록
    - [ ] 시스템 상태

### 5.4. 문제 관리 시스템 확장

#### 문제 수정/삭제
- [ ] 문제 수정 API
  - [ ] `PATCH /api/admin/problems/{id}` - 문제 수정
  - [ ] `PUT /api/admin/problems/{id}` - 문제 전체 업데이트
- [ ] 문제 삭제 API
  - [ ] `DELETE /api/admin/problems/{id}` - 문제 삭제
  - [ ] 관련 데이터 처리 (buggy_implementations, submissions)
- [ ] 문제 관리 UI
  - [ ] `frontend/app/admin/problems/[id]/edit/page.tsx` 생성
  - [ ] 문제 수정 폼
  - [ ] 문제 삭제 확인 다이얼로그

#### 문제 버전 관리 (옵션)
- [ ] 문제 히스토리
  - [ ] 문제 수정 이력 저장
  - [ ] 롤백 기능

### 5.5. 고급 기능 (옵션)

#### 실시간 알림
- [ ] WebSocket 또는 Server-Sent Events (SSE)
  - [ ] 채점 완료 시 실시간 알림
  - [ ] 제출 상태 변경 알림

#### 문제 태그 시스템
- [ ] 태그 관리
  - [ ] `tags` 테이블 생성 (또는 JSONB 필드 활용)
  - [ ] 태그별 문제 필터링
- [ ] 태그 UI
  - [ ] 문제 목록에 태그 표시
  - [ ] 태그별 필터링

#### 문제 검색 기능
- [ ] 검색 API
  - [ ] `GET /api/v1/problems?search=...` - 문제 검색
  - [ ] 제목, 설명, 태그 기반 검색
- [ ] 검색 UI
  - [ ] 검색 바 컴포넌트
  - [ ] 검색 결과 하이라이트

---

## 부록: 구현 우선순위 및 의존성

### 우선순위 1 (필수 - v0.1)
1. Docker 소켓 마운트 설정
2. 채점 파이프라인 검증
3. 기본 에러 핸들링

### 우선순위 2 (중요 - v0.2)
1. Admin API 인증/권한 시스템
2. 에러 노출 방지
3. Rate Limiting 구현

### 우선순위 3 (기능 확장 - v0.3)
1. AI-Assist 모드 DB 스키마 확장
2. API 및 UI 확장

### 우선순위 4 (안정화 - v0.4)
1. 프로덕션 환경 최적화
2. 성능 튜닝
3. 사용자 피드백 수집

### 우선순위 5 (완성 - v1.0)
1. 인증/권한 시스템 완성
2. 통계/리포팅 기능
3. 문제 관리 시스템 확장

---

## 참고 사항

1. **개발 순서**: 각 마일스톤은 순차적으로 진행하되, 병렬 작업이 가능한 부분은 동시에 진행 가능합니다.

2. **테스트 우선**: 각 기능 개발 후 즉시 테스트를 작성하고 실행하세요.

3. **점진적 개발**: 완벽한 구현보다 동작하는 최소 기능부터 시작하여 점진적으로 개선하세요.

4. **문서화**: 각 마일스톤 완료 시 관련 문서를 업데이트하세요.

5. **코드 리뷰**: 가능한 경우 코드 리뷰를 진행하세요.

6. **버전 관리**: 각 마일스톤은 별도 브랜치에서 개발하고, 완료 후 메인 브랜치에 머지하세요.

---

## 관련 문서

- [프로젝트 사양서](qa-arena-spec.md) - 상세 기술 사양
- [마일스톤 진행 상황](qa-arena-milestones.md) - 개발 진행 상황
- [비즈니스 TODO](ToDoList.md) - 비즈니스/전략적 TODO
- [프로젝트 상태](PROJECT_STATUS.md) - 현재 구현 상태



