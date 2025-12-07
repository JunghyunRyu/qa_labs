# v0.2 - 보안/로그/기본 운영 안정화

> 작성일: 2025-01-27  
> 목표: 프로덕션 환경 배포를 위한 보안 및 운영 안정성 확보  
> 환경: EC2 (13.125.154.68, Ubuntu, /home/ubuntu/qa_labs)  
> 관련 문서: [qa-arena-spec.md](qa-arena-spec.md), [EC2_DEPLOYMENT.md](../EC2_DEPLOYMENT.md)

---

## 개요

v0.2 마일스톤은 프로덕션 환경에서 안전하게 운영할 수 있도록 보안 및 운영 안정성을 확보하는 것을 목표로 합니다. Admin API 보호, 에러 노출 방지, 로깅/모니터링 강화, Rate Limiting 구현 등을 포함합니다.

### 완료 조건

- [ ] Admin API가 인증/권한으로 보호됨
- [ ] 프로덕션 환경에서 스택 트레이스가 노출되지 않음
- [ ] 구조화된 로깅 시스템이 동작함
- [ ] Rate Limiting이 구현되어 동작함
- [ ] 데이터베이스 및 인프라 보안이 강화됨

---

## 1. Admin API 인증/권한 시스템

### 1.1. JWT 기반 인증 구현

**목적**: Admin API를 보호하기 위한 인증 시스템 구현

#### 1.1.1. 인증 모듈 생성

- [ ] `app/core/auth.py` 생성
  - [ ] JWT 토큰 생성 함수
    ```python
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """JWT 액세스 토큰 생성"""
    ```
  - [ ] JWT 토큰 검증 함수
    ```python
    def verify_token(token: str) -> Optional[dict]:
        """JWT 토큰 검증 및 페이로드 반환"""
    ```
  - [ ] 비밀키 환경변수 관리
    - [ ] `JWT_SECRET_KEY` 환경변수 사용
    - [ ] `.env.example`에 예시 추가
  - [ ] 토큰 만료 시간 설정
    - [ ] 기본: 24시간
    - [ ] 환경변수로 조정 가능: `JWT_EXPIRATION_HOURS`

#### 1.1.2. 의존성 함수 생성

- [ ] `app/core/dependencies.py` 생성
  - [ ] `get_current_user()` 의존성 함수
    ```python
    async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
        """현재 인증된 사용자 반환"""
    ```
  - [ ] `get_current_admin()` 의존성 함수
    ```python
    async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
        """Admin 권한이 있는 사용자만 허용"""
        # role == "admin" 확인
    ```

#### EC2 환경변수 설정

```bash
# .env 파일에 추가
JWT_SECRET_KEY=<강력한_랜덤_문자열>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### 1.2. Admin API 엔드포인트 보호

**목적**: Admin API에 인증/권한 검증 추가

#### 작업 내용

- [ ] `app/api/admin.py` 수정
  - [ ] `@router.post("/problems/ai-generate")`에 인증 추가
    ```python
    @router.post("/problems/ai-generate")
    async def ai_generate_problem(
        request: ProblemGenerateRequest,
        current_admin: User = Depends(get_current_admin),
    ):
    ```
  - [ ] `@router.post("/problems")`에 인증 추가
    ```python
    @router.post("/problems")
    async def create_problem(
        problem_data: ProblemCreateWithBuggy,
        db: Session = Depends(get_db),
        current_admin: User = Depends(get_current_admin),
    ):
    ```
- [ ] 인증 실패 시 응답
  - [ ] `401 Unauthorized` 응답
  - [ ] 에러 메시지: `{"detail": "Not authenticated"}`
- [ ] 권한 부족 시 응답
  - [ ] `403 Forbidden` 응답
  - [ ] 에러 메시지: `{"detail": "Not enough permissions"}`

#### 테스트

```bash
# 인증 없이 Admin API 호출 (실패해야 함)
curl -X POST http://localhost/api/admin/problems/ai-generate \
  -H "Content-Type: application/json" \
  -d '{"goal": "test"}'
# 401 Unauthorized 응답 확인

# JWT 토큰으로 호출 (성공해야 함)
curl -X POST http://localhost/api/admin/problems/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"goal": "test"}'
```

### 1.3. 사용자 인증 API 구현 (옵션)

**목적**: Admin 사용자가 로그인할 수 있는 API 제공

#### 작업 내용

- [ ] `POST /api/v1/auth/login` - 로그인 엔드포인트
  - [ ] 사용자명/비밀번호 또는 API 키로 인증
  - [ ] JWT 토큰 반환
- [ ] `POST /api/v1/auth/refresh` - 토큰 갱신 엔드포인트
  - [ ] 리프레시 토큰으로 새 액세스 토큰 발급
- [ ] `GET /api/v1/auth/me` - 현재 사용자 정보 조회
  - [ ] 인증된 사용자 정보 반환

#### 임시 구현 (v0.2 전용)

v0.2에서는 간단한 API 키 기반 인증을 사용할 수 있습니다:

```python
# 환경변수로 Admin API 키 관리
ADMIN_API_KEY=<강력한_랜덤_문자열>

# 헤더로 API 키 전달
Authorization: Bearer <ADMIN_API_KEY>
```

### 1.4. 임시 보안 조치 (v0.2 전용)

**목적**: JWT 인증 구현 전까지 IP 화이트리스트로 Admin API 보호

#### 작업 내용

- [ ] Nginx 설정에서 Admin API IP 제한
  - [ ] `nginx/conf.d/qa-arena.conf` 수정
    ```nginx
    location /api/admin/ {
        # 허용할 IP 주소만 추가
        allow 13.125.154.68;  # EC2 서버 자체
        allow <관리자_IP>;     # 관리자 IP
        deny all;
        
        limit_req zone=api_limit burst=10 nodelay;
        proxy_pass http://backend;
        # ... 기타 설정
    }
    ```
  - [ ] 환경변수로 허용 IP 목록 관리 (옵션)
    - [ ] `ALLOWED_ADMIN_IPS` 환경변수

#### EC2에서 적용

```bash
# Nginx 설정 파일 수정
cd /home/ubuntu/qa_labs
nano nginx/conf.d/qa-arena.conf

# Nginx 재시작
docker restart qa_arena_nginx_prod

# 설정 테스트
docker exec qa_arena_nginx_prod nginx -t
```

---

## 2. 에러 노출 방지

### 2.1. 프로덕션 에러 처리

**목적**: 프로덕션 환경에서 민감한 정보가 노출되지 않도록 처리

#### 2.1.1. 스택 트레이스 노출 방지

- [ ] `app/main.py` 전역 예외 핸들러 수정
  - [ ] `DEBUG=False`일 때 스택 트레이스 숨김
    ```python
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        if settings.DEBUG:
            # 개발 환경: 상세 에러 정보 반환
            return JSONResponse(
                status_code=500,
                content={"detail": str(exc), "traceback": traceback.format_exc()}
            )
        else:
            # 프로덕션: 일반적인 에러 메시지만 반환
            logger.error(f"Unhandled exception: {exc}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
    ```
  - [ ] 일반적인 에러 메시지만 반환
  - [ ] 실제 에러는 로그에만 기록

#### EC2 환경변수 설정

```bash
# .env 파일에 추가
DEBUG=False
```

#### 2.1.2. 데이터베이스 에러 처리

- [ ] SQLAlchemy 예외 핸들링
  - [ ] `IntegrityError` 처리 (중복 키 등)
  - [ ] `OperationalError` 처리 (연결 실패 등)
- [ ] 연결 실패 시 재시도 로직
  - [ ] 데이터베이스 연결 풀 설정 확인
  - [ ] 자동 재연결 설정
- [ ] 사용자에게는 일반적인 에러 메시지 반환
  - [ ] "Database error occurred" 등

#### 2.1.3. LLM API 에러 처리

- [ ] OpenAI API 실패 시 적절한 에러 메시지
  - [ ] API 키 누락: "AI service configuration error"
  - [ ] Rate limit 초과: "AI service temporarily unavailable"
  - [ ] 네트워크 오류: "AI service connection error"
- [ ] 에러 로그에 상세 정보 기록
  - [ ] 실제 에러 메시지
  - [ ] API 응답 내용 (있는 경우)

---

## 3. 로깅/모니터링 강화

### 3.1. 로깅 시스템 개선

**목적**: 구조화된 로깅으로 운영 효율성 향상

#### 3.1.1. 구조화된 로깅 구현

- [ ] `app/core/logging.py` 확장
  - [ ] JSON 형식 로그 출력 (프로덕션)
    ```python
    import json
    import logging
    
    class JSONFormatter(logging.Formatter):
        def format(self, record):
            log_entry = {
                "timestamp": self.formatTime(record),
                "level": record.levelname,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
            }
            if record.exc_info:
                log_entry["exception"] = self.formatException(record.exc_info)
            return json.dumps(log_entry)
    ```
  - [ ] 로그 레벨별 파일 분리
    - [ ] `info.log`: INFO 레벨 이상
    - [ ] `error.log`: ERROR 레벨 이상
    - [ ] `app.log`: 모든 레벨 (개발 환경)

#### 3.1.2. 주요 이벤트 로깅

- [ ] 제출 생성/처리 완료
  ```python
  logger.info("Submission created", extra={
      "submission_id": str(submission_id),
      "problem_id": problem_id,
      "user_id": str(user_id)
  })
  ```
- [ ] 채점 실패
  ```python
  logger.error("Submission processing failed", extra={
      "submission_id": str(submission_id),
      "error": str(error)
  })
  ```
- [ ] Admin API 호출
  ```python
  logger.info("Admin API accessed", extra={
      "endpoint": endpoint,
      "user_id": str(user_id),
      "ip_address": request.client.host
  })
  ```
- [ ] LLM API 호출 (비용 추적)
  ```python
  logger.info("LLM API called", extra={
      "service": "problem_designer" | "feedback_engine",
      "model": model_name,
      "tokens_used": tokens_used,
      "cost_estimate": cost
  })
  ```

#### EC2에서 로그 확인

```bash
# JSON 로그 확인
tail -f /home/ubuntu/qa_labs/backend/logs/app.log | jq

# 에러 로그만 확인
tail -f /home/ubuntu/qa_labs/backend/logs/error.log | jq

# 특정 이벤트 검색
grep "Submission created" /home/ubuntu/qa_labs/backend/logs/app.log | jq
```

### 3.2. 로그 수집 및 분석

- [ ] 로그 파일 로테이션 설정
  - [ ] `logrotate` 설정 파일 생성
    ```bash
    /home/ubuntu/qa_labs/backend/logs/*.log {
        daily
        rotate 7
        compress
        delaycompress
        missingok
        notifempty
    }
    ```
- [ ] 로그 백업 전략 수립
  - [ ] 일일 백업 (옵션)
  - [ ] S3에 백업 (옵션)
- [ ] (옵션) ELK Stack 또는 CloudWatch 연동
  - [ ] CloudWatch Logs 에이전트 설치
  - [ ] 로그 스트림 설정

### 3.3. 모니터링 지표 수집

**목적**: 시스템 상태를 모니터링할 수 있는 메트릭 수집

#### 3.3.1. 기본 메트릭 수집

- [ ] API 응답 시간
  - [ ] FastAPI 미들웨어로 응답 시간 측정
  - [ ] 로그에 기록
- [ ] 채점 처리 시간
  - [ ] Submission 처리 시작/종료 시간 기록
  - [ ] 평균 처리 시간 계산
- [ ] Celery Task 큐 길이
  - [ ] Redis에서 큐 길이 확인
  - [ ] 큐가 너무 길면 알림 (옵션)
- [ ] Docker 컨테이너 실행 횟수/실패율
  - [ ] Judge 컨테이너 생성/실패 횟수 기록

#### 3.3.2. Health Check 엔드포인트 확장

- [ ] `GET /health` 확장
  ```python
  @app.get("/health")
  async def health():
      """Health check with detailed status"""
      status = {
          "status": "healthy",
          "database": check_database(),
          "redis": check_redis(),
          "docker": check_docker(),
          "timestamp": datetime.utcnow().isoformat()
      }
      if all([status["database"], status["redis"], status["docker"]]):
          return status
      else:
          return JSONResponse(status_code=503, content=status)
  ```
  - [ ] 데이터베이스 연결 상태
  - [ ] Redis 연결 상태
  - [ ] Docker 데몬 연결 상태

#### EC2에서 확인

```bash
# Health check
curl http://localhost/health | jq

# 메트릭 수집 스크립트 (옵션)
# scripts/collect_metrics.sh 생성
```

---

## 4. Rate Limiting 구현

### 4.1. Nginx 기반 Rate Limiting

**목적**: Nginx 레벨에서 요청 제한 구현

#### 작업 내용

- [ ] `nginx/nginx.conf` 수정
  - [ ] `limit_req_zone` 지시어 추가
    ```nginx
    http {
        # API 엔드포인트용 zone
        limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
        
        # Admin API용 zone (더 엄격한 제한)
        limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=20r/m;
        
        # 일반 트래픽용 zone
        limit_req_zone $binary_remote_addr zone=general_limit:10m rate=50r/m;
    }
    ```
  - [ ] `limit_req` 적용
    - [ ] `/api/v1/` 엔드포인트: 100 req/min
    - [ ] `/api/admin/` 엔드포인트: 20 req/min
    - [ ] 일반 트래픽: 50 req/min

#### EC2에서 적용

```bash
# Nginx 설정 파일 수정
cd /home/ubuntu/qa_labs
nano nginx/nginx.conf

# Nginx 재시작
docker restart qa_arena_nginx_prod

# 설정 테스트
docker exec qa_arena_nginx_prod nginx -t
```

#### Rate Limit 초과 시 응답

- [ ] `429 Too Many Requests` 상태 코드
- [ ] `Retry-After` 헤더 포함
  ```nginx
  limit_req_status 429;
  ```

### 4.2. 애플리케이션 레벨 Rate Limiting (옵션)

**목적**: 더 세밀한 제어를 위한 애플리케이션 레벨 제한

#### 작업 내용

- [ ] FastAPI 미들웨어 구현
  - [ ] IP 기반 요청 제한
  - [ ] Redis를 이용한 분산 Rate Limiting
  - [ ] 사용자별 제한 (인증 시스템 연동)

#### 구현 예시

```python
from fastapi import Request, HTTPException
from redis import Redis
import time

redis_client = Redis.from_url(settings.REDIS_URL)

async def rate_limit_middleware(request: Request, call_next):
    # IP 기반 제한
    ip = request.client.host
    key = f"rate_limit:{ip}"
    
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, 60)  # 1분
    
    if current > 100:  # 1분에 100회 제한
        raise HTTPException(status_code=429, detail="Too many requests")
    
    response = await call_next(request)
    return response
```

---

## 5. 데이터베이스/인프라 보안

### 5.1. 네트워크 보안

**목적**: 데이터베이스 및 내부 서비스 포트를 외부에 노출하지 않음

#### 작업 내용

- [ ] 데이터베이스 포트 외부 노출 방지
  - [ ] `docker-compose.prod.yml` 확인
    - [ ] PostgreSQL 포트 매핑 제거 (내부 네트워크만)
    - [ ] Redis 포트 매핑 제거 (내부 네트워크만)
  - [ ] Docker 네트워크 격리 확인
    - [ ] `qa_arena_network` 브리지 네트워크 사용
- [ ] 방화벽 규칙 설정 (서버 레벨)
  - [ ] 필요한 포트만 개방
    - [ ] HTTP: 80
    - [ ] HTTPS: 443
    - [ ] SSH: 22 (특정 IP만)
  - [ ] AWS 보안 그룹 설정 확인

#### EC2 보안 그룹 확인

```bash
# AWS 콘솔에서 확인하거나 AWS CLI 사용
aws ec2 describe-security-groups --group-ids <security-group-id>

# 로컬에서 포트 스캔 (외부에서 접근 불가 확인)
nmap -p 5432,6379 13.125.154.68
# 연결 실패해야 함
```

### 5.2. 환경변수 보안

**목적**: 민감한 정보를 안전하게 관리

#### 작업 내용

- [ ] 민감 정보 환경변수 관리
  - [ ] `.env.example` 업데이트 (실제 값 제외)
    ```env
    # .env.example
    POSTGRES_PASSWORD=<강력한_비밀번호_설정>
    JWT_SECRET_KEY=<랜덤_문자열_생성>
    OPENAI_API_KEY=<your_openai_api_key>
    ```
  - [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
    - [ ] `.gitignore`에 `.env` 포함 확인
  - [ ] 프로덕션 환경변수 암호화 (옵션)
    - [ ] AWS Secrets Manager 연동
    - [ ] 환경변수 파일 암호화
  - [ ] Secrets Manager 연동 (옵션)
    - [ ] AWS Secrets Manager 사용
    - [ ] 환경변수 대신 Secrets Manager에서 읽기

#### EC2에서 확인

```bash
# .env 파일 권한 확인
ls -la /home/ubuntu/qa_labs/.env
# 600 권한 (소유자만 읽기/쓰기) 권장

# .env 파일이 Git에 포함되지 않았는지 확인
cd /home/ubuntu/qa_labs
git check-ignore .env
# .env가 출력되면 정상 (무시됨)
```

---

## 완료 체크리스트

### 필수 항목

- [ ] Admin API가 인증/권한으로 보호됨
- [ ] 프로덕션 환경에서 스택 트레이스가 노출되지 않음
- [ ] 구조화된 로깅 시스템이 동작함
- [ ] Rate Limiting이 구현되어 동작함
- [ ] 데이터베이스 포트가 외부에 노출되지 않음
- [ ] 환경변수가 안전하게 관리됨

### 검증 방법

1. **인증 테스트**: 인증 없이 Admin API 호출 시 401 응답 확인
2. **에러 테스트**: 의도적으로 에러 발생 시켜 스택 트레이스가 숨겨지는지 확인
3. **Rate Limit 테스트**: 빠르게 여러 요청을 보내 429 응답 확인
4. **포트 스캔**: 외부에서 데이터베이스 포트 접근 불가 확인

---

## 다음 단계

v0.2 완료 후 다음 마일스톤으로 진행:
- [v0.3 - AI-Assist 모드 1차 도입](technical-todos-v0.3.md)

---

## 참고 문서

- [EC2 배포 가이드](../EC2_DEPLOYMENT.md)
- [프로젝트 사양서](qa-arena-spec.md)
- [Nginx Rate Limiting 문서](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)

