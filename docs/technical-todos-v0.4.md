# v0.4 - 외부 베타/지인 테스트

> 작성일: 2025-01-27  
> 목표: 외부 사용자 테스트를 위한 안정성 및 사용성 개선  
> 환경: EC2 (13.125.154.68, Ubuntu, /home/ubuntu/qa_labs)  
> 관련 문서: [qa-arena-spec.md](qa-arena-spec.md), [EC2_DEPLOYMENT.md](../EC2_DEPLOYMENT.md)

---

## 개요

v0.4 마일스톤은 외부 사용자(베타 테스터, 지인)가 사용할 수 있도록 안정성과 사용성을 개선하는 것을 목표로 합니다. 프로덕션 환경 최적화, 성능 튜닝, 사용자 피드백 수집 시스템 등을 포함합니다.

### 완료 조건

- [ ] 프로덕션 환경이 최적화됨 (리소스 제한, Health Check 등)
- [ ] 성능이 개선됨 (데이터베이스 쿼리, Celery Worker 등)
- [ ] 사용자 피드백 수집 시스템이 동작함
- [ ] 베타 안내 및 안전장치가 구현됨

---

## 1. 프로덕션 환경 최적화

### 1.1. Docker Compose 프로덕션 설정

**목적**: EC2 환경에서 안정적으로 운영되도록 리소스 제한 및 Health Check 설정

#### 작업 내용

- [ ] `docker-compose.prod.yml` 최적화
  - [ ] 리소스 제한 설정
    ```yaml
    services:
      backend:
        deploy:
          resources:
            limits:
              cpus: '1.0'
              memory: 1G
            reservations:
              cpus: '0.5'
              memory: 512M
      
      celery_worker:
        deploy:
          resources:
            limits:
              cpus: '1.0'
              memory: 2G
            reservations:
              cpus: '0.5'
              memory: 1G
    ```
  - [ ] Health Check 설정
    ```yaml
    services:
      backend:
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 40s
      
      celery_worker:
        healthcheck:
          test: ["CMD", "celery", "-A", "app.core.celery_app", "inspect", "ping"]
          interval: 30s
          timeout: 10s
          retries: 3
    ```
  - [ ] 재시작 정책 설정
    - [ ] `restart: unless-stopped` 확인
    - [ ] 모든 서비스에 적용

#### EC2에서 적용

```bash
# docker-compose.prod.yml 수정 후 재배포
cd /home/ubuntu/qa_labs
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Health Check 확인
docker-compose -f docker-compose.prod.yml ps
# 모든 서비스가 "healthy" 상태인지 확인
```

- [ ] 환경변수 관리
  - [ ] `.env.production.example` 생성
    ```env
    # .env.production.example
    # Database
    POSTGRES_USER=qa_arena_user
    POSTGRES_PASSWORD=<강력한_비밀번호>
    POSTGRES_DB=qa_arena
    
    # Application
    DEBUG=False
    APP_NAME=QA-Arena API
    APP_VERSION=0.4.0
    
    # CORS
    CORS_ORIGINS=["https://yourdomain.com"]
    
    # OpenAI
    OPENAI_API_KEY=<your_openai_api_key>
    OPENAI_MODEL=gpt-4o-mini
    
    # JWT
    JWT_SECRET_KEY=<랜덤_문자열>
    JWT_EXPIRATION_HOURS=24
    ```
  - [ ] 프로덕션 환경변수 문서화
    - [ ] 각 환경변수의 용도 설명
    - [ ] 보안 주의사항 명시

### 1.2. Nginx 최적화

**목적**: 웹 서버 성능 및 보안 최적화

#### 작업 내용

- [ ] `nginx/conf.d/qa-arena.conf` 최적화
  - [ ] Gzip 압축 활성화
    ```nginx
    http {
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript 
                   application/json application/javascript application/xml+rss;
        gzip_comp_level 6;
    }
    ```
  - [ ] 정적 파일 캐싱 설정
    ```nginx
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    ```
  - [ ] 프록시 버퍼링 설정
    ```nginx
    location /api/ {
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        # ... 기타 설정
    }
    ```

#### EC2에서 적용

```bash
# Nginx 설정 수정
cd /home/ubuntu/qa_labs
nano nginx/conf.d/qa-arena.conf

# Nginx 재시작
docker restart qa_arena_nginx_prod

# 설정 테스트
docker exec qa_arena_nginx_prod nginx -t
```

- [ ] SSL/HTTPS 설정 (옵션)
  - [ ] Let's Encrypt 인증서 설정
    ```bash
    # scripts/setup_ssl.sh 실행
    chmod +x scripts/setup_ssl.sh
    sudo ./scripts/setup_ssl.sh yourdomain.com
    ```
  - [ ] HTTP to HTTPS 리다이렉트
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
    ```

---

## 2. 성능 튜닝

### 2.1. 데이터베이스 최적화

**목적**: 데이터베이스 쿼리 성능 개선

#### 작업 내용

- [ ] 인덱스 최적화
  - [ ] 쿼리 성능 분석
    ```sql
    -- 느린 쿼리 확인
    SELECT query, mean_exec_time, calls 
    FROM pg_stat_statements 
    ORDER BY mean_exec_time DESC 
    LIMIT 10;
    ```
  - [ ] 필요한 인덱스 추가
    - [ ] `submissions.status` 인덱스 확인
      ```sql
      CREATE INDEX IF NOT EXISTS ix_submissions_status 
      ON submissions(status);
      ```
    - [ ] `submissions.created_at` 인덱스 확인
      ```sql
      CREATE INDEX IF NOT EXISTS ix_submissions_created_at 
      ON submissions(created_at DESC);
      ```
    - [ ] `problems.difficulty` 인덱스 확인
      ```sql
      CREATE INDEX IF NOT EXISTS ix_problems_difficulty 
      ON problems(difficulty);
      ```
    - [ ] 복합 인덱스 추가 (필요 시)
      ```sql
      CREATE INDEX IF NOT EXISTS ix_submissions_user_status 
      ON submissions(user_id, status);
      ```

#### EC2에서 실행

```bash
# PostgreSQL에 접속
docker exec -it qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena

# 인덱스 생성
CREATE INDEX IF NOT EXISTS ix_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS ix_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS ix_problems_difficulty ON problems(difficulty);

# 인덱스 확인
\di
```

- [ ] 쿼리 최적화
  - [ ] N+1 쿼리 문제 해결
    - [ ] SQLAlchemy의 `joinedload` 또는 `selectinload` 사용
    ```python
    # 문제: N+1 쿼리
    problems = db.query(Problem).all()
    for problem in problems:
        print(problem.buggy_implementations)  # 각 문제마다 쿼리 실행
    
    # 해결: Eager loading
    problems = db.query(Problem).options(
        joinedload(Problem.buggy_implementations)
    ).all()
    ```
  - [ ] Eager loading 적용 (SQLAlchemy)
    - [ ] Repository 레이어에서 적용
    - [ ] 자주 사용되는 관계에만 적용

### 2.2. Celery Worker 최적화

**목적**: Celery Worker의 처리 성능 개선

#### 작업 내용

- [ ] Worker 프로세스 수 조정
  - [ ] `celery_worker` 서비스에 `--concurrency` 옵션 추가
    ```yaml
    celery_worker:
      command: celery -A app.core.celery_app worker --loglevel=info --concurrency=2
    ```
  - [ ] 서버 리소스에 맞게 조정
    - [ ] EC2 인스턴스 타입에 따라 조정
    - [ ] t3.medium (2 vCPU): `--concurrency=2`
    - [ ] t3.large (2 vCPU): `--concurrency=2-4`
    - [ ] t3.xlarge (4 vCPU): `--concurrency=4-8`

#### EC2에서 적용

```bash
# docker-compose.prod.yml 수정 후 재시작
docker-compose -f docker-compose.prod.yml restart celery_worker

# Worker 상태 확인
docker exec qa_arena_celery_worker_prod celery -A app.core.celery_app inspect active
```

- [ ] Task 큐 최적화
  - [ ] 우선순위 큐 설정 (옵션)
    ```python
    # app/core/celery_app.py
    celery_app.conf.task_routes = {
        'app.workers.tasks.process_submission_task': {'queue': 'high_priority'},
    }
    ```
  - [ ] Task 타임아웃 설정
    ```python
    @celery_app.task(time_limit=300, soft_time_limit=240)
    def process_submission_task(submission_id: str):
        # 타임아웃: 5분 (hard), 4분 (soft)
    ```

### 2.3. Docker 컨테이너 최적화

**목적**: Judge 컨테이너 실행 시간 및 리소스 사용량 최적화

#### 작업 내용

- [ ] Judge 컨테이너 실행 시간 최적화
  - [ ] 컨테이너 재사용 전략 검토
    - [ ] 현재: 매번 새 컨테이너 생성
    - [ ] 옵션: 컨테이너 풀 사용 (복잡도 증가)
  - [ ] 이미지 크기 최적화
    - [ ] `judge/Dockerfile` 최적화
      ```dockerfile
      FROM python:3.11-slim
      # 불필요한 패키지 제거
      RUN apt-get update && apt-get install -y --no-install-recommends \
          pytest && \
          rm -rf /var/lib/apt/lists/*
      ```

- [ ] 리소스 사용량 모니터링
  - [ ] 메모리 사용량 추적
    ```bash
    # 컨테이너별 메모리 사용량 확인
    docker stats --no-stream
    ```
  - [ ] CPU 사용량 추적
    - [ ] `htop` 또는 `docker stats` 사용

#### EC2에서 모니터링

```bash
# 실시간 리소스 모니터링
docker stats

# 특정 컨테이너만 모니터링
docker stats qa_arena_backend_prod qa_arena_celery_worker_prod

# 시스템 리소스 확인
htop
# 또는
top
```

---

## 3. 사용자 피드백 수집 시스템

### 3.1. 피드백 수집 UI

**목적**: 사용자가 피드백을 쉽게 제출할 수 있는 UI 제공

#### 작업 내용

- [ ] 피드백 폼 구현
  - [ ] `frontend/components/FeedbackForm.tsx` 생성
    ```typescript
    export function FeedbackForm({ submissionId }: { submissionId: string }) {
      const [feedback, setFeedback] = useState("");
      const [rating, setRating] = useState(0);
      
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitFeedback(submissionId, feedback, rating);
      };
      
      return (
        <form onSubmit={handleSubmit}>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="피드백을 입력해주세요..."
          />
          <button type="submit">제출</button>
        </form>
      );
    }
    ```
  - [ ] 제출 결과 페이지에 피드백 버튼 추가
    - [ ] `frontend/components/SubmissionResult.tsx`에 통합

- [ ] `POST /api/v1/feedback` 엔드포인트 구현
  - [ ] 피드백 데이터 저장 (DB 또는 파일)
    ```python
    @router.post("/feedback")
    async def create_feedback(
        feedback_data: FeedbackCreate,
        db: Session = Depends(get_db),
    ):
        feedback = Feedback(
            submission_id=feedback_data.submission_id,
            content=feedback_data.content,
            rating=feedback_data.rating,
        )
        db.add(feedback)
        db.commit()
        return feedback
    ```

#### 피드백 데이터 모델 (옵션)

- [ ] `feedbacks` 테이블 생성
  ```python
  class Feedback(Base):
      __tablename__ = "feedbacks"
      
      id = Column(Integer, primary_key=True)
      submission_id = Column(UUID, ForeignKey("submissions.id"))
      content = Column(Text)
      rating = Column(Integer)  # 1-5
      created_at = Column(DateTime, default=datetime.utcnow)
  ```
- [ ] 피드백 조회 API (Admin 전용)
  - [ ] `GET /api/admin/feedback` - 피드백 목록
  - [ ] `GET /api/admin/feedback/{id}` - 피드백 상세

### 3.2. 로그 기반 사용자 행동 분석

**목적**: 사용자 행동을 분석하여 개선점 도출

#### 작업 내용

- [ ] 주요 이벤트 로깅
  - [ ] 문제 조회 로그
    ```python
    logger.info("Problem viewed", extra={
        "problem_id": problem_id,
        "user_id": user_id,
        "ip_address": request.client.host,
    })
    ```
  - [ ] 제출 생성 로그
    ```python
    logger.info("Submission created", extra={
        "submission_id": str(submission_id),
        "problem_id": problem_id,
        "user_id": user_id,
    })
    ```
  - [ ] 에러 발생 로그
    - [ ] 이미 구현됨 (v0.2)

- [ ] 분석 대시보드 (옵션)
  - [ ] Admin 대시보드에 통계 표시
    - [ ] 문제별 제출 수
    - [ ] 평균 점수
    - [ ] 에러 발생률
  - [ ] 간단한 통계 API 구현
    ```python
    @router.get("/admin/stats")
    async def get_stats(db: Session = Depends(get_db)):
        return {
            "total_submissions": db.query(Submission).count(),
            "average_score": db.query(func.avg(Submission.score)).scalar(),
            "error_rate": db.query(Submission).filter(
                Submission.status == "ERROR"
            ).count() / db.query(Submission).count(),
        }
    ```

---

## 4. 베타 안내 및 안전장치

### 4.1. UI 안내 문구

**목적**: 사용자에게 베타 버전임을 명확히 안내

#### 작업 내용

- [ ] 베타 버전 안내
  - [ ] 메인 페이지/푸터에 베타 안내 추가
    ```typescript
    // frontend/app/layout.tsx 또는 page.tsx
    <footer className="bg-yellow-50 border-t border-yellow-200 p-4">
      <div className="max-w-7xl mx-auto text-sm text-yellow-800">
        <p className="font-semibold">⚠️ 베타 버전 안내</p>
        <p>현재 베타 버전입니다. 테스트용으로만 사용해 주세요.</p>
        <p>민감 정보/실제 고객 데이터는 절대 입력하지 마세요.</p>
      </div>
    </footer>
    ```
  - [ ] 사용자 가이드 링크
    - [ ] `USER_GUIDE.md` 링크 추가
    - [ ] FAQ 섹션 추가 (옵션)

### 4.2. 안전장치

**목적**: 시스템 남용 방지 및 안정성 확보

#### 작업 내용

- [ ] Rate Limiting 강화
  - [ ] 사용자별 제한 (IP 기반 또는 인증 기반)
    - [ ] Nginx 설정에서 IP별 제한
    - [ ] Redis 기반 분산 Rate Limiting (옵션)
  - [ ] 일일 제출 제한 (옵션)
    ```python
    # app/api/submissions.py
    async def create_submission(...):
        # IP별 일일 제출 수 확인
        daily_count = get_daily_submission_count(ip_address)
        if daily_count >= 50:  # 일일 50회 제한
            raise HTTPException(429, "Daily submission limit exceeded")
    ```

- [ ] 모니터링 알림 설정
  - [ ] 에러 발생 시 알림 (옵션)
    - [ ] 이메일 알림
    - [ ] Slack 웹훅
  - [ ] 리소스 사용량 임계값 알림 (옵션)
    - [ ] CPU 사용률 > 80%
    - [ ] 메모리 사용률 > 80%
    - [ ] 디스크 사용률 > 80%

---

## 완료 체크리스트

### 필수 항목

- [ ] 프로덕션 환경이 최적화됨 (리소스 제한, Health Check)
- [ ] 데이터베이스 인덱스가 추가되어 쿼리 성능이 개선됨
- [ ] Celery Worker가 최적화됨
- [ ] 사용자 피드백 수집 시스템이 동작함
- [ ] 베타 안내 문구가 표시됨

### 검증 방법

1. **성능 테스트**: 부하 테스트로 응답 시간 확인
2. **리소스 모니터링**: `docker stats`로 리소스 사용량 확인
3. **피드백 테스트**: 실제로 피드백 제출 테스트
4. **UI 확인**: 베타 안내 문구 표시 확인

---

## 다음 단계

v0.4 완료 후 다음 마일스톤으로 진행:
- [v1.0 - 회사/교육용으로 보여줄 수 있는 수준](technical-todos-v1.0.md)

---

## 참고 문서

- [EC2 배포 가이드](../EC2_DEPLOYMENT.md)
- [프로젝트 사양서](qa-arena-spec.md)
- [Nginx 최적화 가이드](https://nginx.org/en/docs/)

