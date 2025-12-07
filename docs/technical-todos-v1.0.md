# v1.0 - 회사/교육용으로 보여줄 수 있는 수준

> 작성일: 2025-01-27  
> 목표: 실제 서비스로 사용 가능한 수준의 기능 완성  
> 환경: EC2 (13.125.154.68, Ubuntu, /home/ubuntu/qa_labs)  
> 관련 문서: [qa-arena-spec.md](qa-arena-spec.md), [EC2_DEPLOYMENT.md](../EC2_DEPLOYMENT.md)

---

## 개요

v1.0 마일스톤은 실제 서비스로 사용할 수 있는 수준의 기능을 완성하는 것을 목표로 합니다. 인증/권한 시스템 완성, 사용자 관리 시스템, 통계/리포팅 기능, 문제 관리 시스템 확장 등을 포함합니다.

### 완료 조건

- [ ] 완전한 인증/권한 시스템이 동작함
- [ ] 사용자 관리 시스템이 구현됨
- [ ] 통계/리포팅 기능이 동작함
- [ ] 문제 관리 시스템이 확장됨

---

## 1. 인증/권한 시스템 완성

### 1.1. 사용자 인증 시스템

**목적**: 완전한 회원가입/로그인 시스템 구현

#### 작업 내용

- [ ] 회원가입/로그인 구현
  - [ ] `POST /api/v1/auth/register` - 회원가입
    ```python
    @router.post("/auth/register")
    async def register(
        user_data: UserRegister,
        db: Session = Depends(get_db),
    ):
        # 이메일 중복 확인
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(400, "Email already registered")
        
        # 비밀번호 해싱
        hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())
        
        # 사용자 생성
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=hashed_password.decode(),
        )
        db.add(user)
        db.commit()
        
        # JWT 토큰 발급
        access_token = create_access_token({"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
    ```
  - [ ] `POST /api/v1/auth/login` - 로그인
    ```python
    @router.post("/auth/login")
    async def login(
        credentials: UserLogin,
        db: Session = Depends(get_db),
    ):
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user or not bcrypt.checkpw(
            credentials.password.encode(), 
            user.password_hash.encode()
        ):
            raise HTTPException(401, "Invalid credentials")
        
        access_token = create_access_token({"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
    ```
  - [ ] `POST /api/v1/auth/logout` - 로그아웃
    - [ ] 토큰 블랙리스트 관리 (Redis 사용)
  - [ ] `POST /api/v1/auth/refresh` - 토큰 갱신
    - [ ] 리프레시 토큰으로 새 액세스 토큰 발급

#### 데이터베이스 스키마 확장

- [ ] `users` 테이블에 `password_hash` 필드 추가
  ```python
  # Alembic 마이그레이션
  def upgrade():
      op.add_column('users', 
          sa.Column('password_hash', sa.String(255), nullable=True))
      op.add_column('users', 
          sa.Column('role', sa.String(20), nullable=False, server_default='user'))
  ```

- [ ] 비밀번호 관리
  - [ ] 비밀번호 해싱 (bcrypt)
    ```python
    import bcrypt
    
    # 비밀번호 해싱
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    # 비밀번호 검증
    is_valid = bcrypt.checkpw(password.encode(), password_hash.encode())
    ```
  - [ ] 비밀번호 재설정 기능 (옵션)
    - [ ] `POST /api/v1/auth/forgot-password` - 비밀번호 재설정 요청
    - [ ] `POST /api/v1/auth/reset-password` - 비밀번호 재설정

- [ ] 세션 관리
  - [ ] JWT 토큰 관리
    - [ ] 액세스 토큰: 짧은 만료 시간 (1시간)
    - [ ] 리프레시 토큰: 긴 만료 시간 (7일)
  - [ ] 리프레시 토큰 구현
    - [ ] Redis에 리프레시 토큰 저장
    - [ ] 토큰 갱신 시 기존 토큰 무효화

### 1.2. 권한 시스템

**목적**: 역할 기반 접근 제어 (RBAC) 구현

#### 작업 내용

- [ ] 역할 기반 접근 제어 (RBAC)
  - [ ] 사용자 역할: `user`, `admin`
    ```python
    class UserRole(str, Enum):
        USER = "user"
        ADMIN = "admin"
    ```
  - [ ] `users` 테이블에 `role` 컬럼 추가
    - [ ] 기본값: `user`
    - [ ] Admin은 수동으로 설정
  - [ ] 권한 검증 미들웨어 구현
    ```python
    async def get_current_admin(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role != "admin":
            raise HTTPException(403, "Not enough permissions")
        return current_user
    ```

- [ ] 리소스별 권한
  - [ ] 사용자는 자신의 제출만 조회
    ```python
    @router.get("/submissions/{id}")
    async def get_submission(
        submission_id: UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        submission = db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
        
        if not submission:
            raise HTTPException(404, "Submission not found")
        
        # 권한 확인
        if current_user.role != "admin" and submission.user_id != current_user.id:
            raise HTTPException(403, "Not enough permissions")
        
        return submission
    ```
  - [ ] Admin은 모든 제출 조회 가능
  - [ ] Admin만 문제 생성/수정 가능

---

## 2. 사용자 관리 시스템

### 2.1. 사용자 프로필

**목적**: 사용자가 자신의 정보를 관리할 수 있는 기능 제공

#### 작업 내용

- [ ] 사용자 정보 관리
  - [ ] `GET /api/v1/users/me` - 현재 사용자 정보
    ```python
    @router.get("/users/me")
    async def get_current_user_info(
        current_user: User = Depends(get_current_user),
    ):
        return current_user
    ```
  - [ ] `PATCH /api/v1/users/me` - 사용자 정보 수정
    ```python
    @router.patch("/users/me")
    async def update_current_user(
        user_data: UserUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if user_data.username:
            current_user.username = user_data.username
        db.commit()
        return current_user
    ```

- [ ] 사용자 대시보드
  - [ ] `frontend/app/dashboard/page.tsx` 생성
    ```typescript
    export default function DashboardPage() {
      const { data: user } = useUser();
      const { data: submissions } = useSubmissions();
      const { data: stats } = useUserStats();
      
      return (
        <div>
          <h1>대시보드</h1>
          <UserStats stats={stats} />
          <SubmissionList submissions={submissions} />
        </div>
      );
    }
    ```
    - [ ] 내 제출 목록
    - [ ] 통계 (해결한 문제 수, 평균 점수 등)

### 2.2. Admin 사용자 관리

**목적**: Admin이 사용자를 관리할 수 있는 기능 제공

#### 작업 내용

- [ ] 사용자 목록 조회
  - [ ] `GET /api/admin/users` - 사용자 목록 (Admin 전용)
    ```python
    @router.get("/admin/users")
    async def list_users(
        page: int = 1,
        page_size: int = 20,
        current_admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db),
    ):
        offset = (page - 1) * page_size
        users = db.query(User).offset(offset).limit(page_size).all()
        total = db.query(User).count()
        return {
            "items": users,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    ```
  - [ ] 페이징 및 필터링
    - [ ] 검색 기능 (이메일, 사용자명)
    - [ ] 역할별 필터링

- [ ] 사용자 상세 조회
  - [ ] `GET /api/admin/users/{id}` - 사용자 상세 (Admin 전용)
    - [ ] 사용자 제출 내역 포함
    - [ ] 통계 정보 포함

---

## 3. 통계/리포팅 기능

### 3.1. 문제 통계

**목적**: 문제별 통계 정보 제공

#### 작업 내용

- [ ] 문제별 통계 API
  - [ ] `GET /api/v1/problems/{id}/stats` - 문제 통계
    ```python
    @router.get("/problems/{id}/stats")
    async def get_problem_stats(
        problem_id: int,
        db: Session = Depends(get_db),
    ):
        total_submissions = db.query(Submission).filter(
            Submission.problem_id == problem_id
        ).count()
        
        avg_score = db.query(func.avg(Submission.score)).filter(
            Submission.problem_id == problem_id,
            Submission.status == "SUCCESS"
        ).scalar()
        
        success_count = db.query(Submission).filter(
            Submission.problem_id == problem_id,
            Submission.status == "SUCCESS"
        ).count()
        
        success_rate = success_count / total_submissions if total_submissions > 0 else 0
        
        return {
            "total_submissions": total_submissions,
            "average_score": float(avg_score) if avg_score else 0,
            "success_rate": success_rate,
            "success_count": success_count,
        }
    ```
    - [ ] 총 제출 수
    - [ ] 평균 점수
    - [ ] 성공률
    - [ ] 난이도별 분포

- [ ] 통계 시각화
  - [ ] `frontend/components/ProblemStats.tsx` 생성
    - [ ] 차트 라이브러리 사용 (Chart.js, Recharts 등)
    ```typescript
    import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
    
    export function ProblemStats({ problemId }: { problemId: number }) {
      const { data: stats } = useProblemStats(problemId);
      
      return (
        <div>
          <LineChart data={stats.daily_submissions}>
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </div>
      );
    }
    ```

### 3.2. 사용자 통계

**목적**: 사용자별 통계 정보 제공

#### 작업 내용

- [ ] 사용자별 통계 API
  - [ ] `GET /api/v1/users/me/stats` - 내 통계
    ```python
    @router.get("/users/me/stats")
    async def get_user_stats(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        solved_count = db.query(Submission).filter(
            Submission.user_id == current_user.id,
            Submission.status == "SUCCESS"
        ).distinct(Submission.problem_id).count()
        
        avg_score = db.query(func.avg(Submission.score)).filter(
            Submission.user_id == current_user.id,
            Submission.status == "SUCCESS"
        ).scalar()
        
        return {
            "solved_count": solved_count,
            "average_score": float(avg_score) if avg_score else 0,
            "total_submissions": db.query(Submission).filter(
                Submission.user_id == current_user.id
            ).count(),
        }
    ```
    - [ ] 해결한 문제 수
    - [ ] 평균 점수
    - [ ] 제출 내역

- [ ] 리더보드 (옵션)
  - [ ] `GET /api/v1/leaderboard` - 리더보드
    ```python
    @router.get("/leaderboard")
    async def get_leaderboard(
        limit: int = 10,
        db: Session = Depends(get_db),
    ):
        # 해결한 문제 수 기준 상위 사용자
        leaderboard = db.query(
            User.id,
            User.username,
            func.count(distinct(Submission.problem_id)).label('solved_count'),
            func.avg(Submission.score).label('avg_score')
        ).join(Submission).filter(
            Submission.status == "SUCCESS"
        ).group_by(User.id).order_by(
            desc('solved_count'),
            desc('avg_score')
        ).limit(limit).all()
        
        return leaderboard
    ```
  - [ ] 상위 사용자 목록

### 3.3. Admin 대시보드

**목적**: Admin이 전체 시스템 상태를 파악할 수 있는 대시보드

#### 작업 내용

- [ ] 전체 통계
  - [ ] `GET /api/admin/stats` - 전체 통계
    ```python
    @router.get("/admin/stats")
    async def get_admin_stats(
        current_admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db),
    ):
        return {
            "total_users": db.query(User).count(),
            "total_submissions": db.query(Submission).count(),
            "total_problems": db.query(Problem).count(),
            "daily_active_users": db.query(User).filter(
                User.last_login >= datetime.utcnow() - timedelta(days=1)
            ).count(),
            "problem_stats": [
                {
                    "problem_id": p.id,
                    "title": p.title,
                    "submission_count": db.query(Submission).filter(
                        Submission.problem_id == p.id
                    ).count(),
                }
                for p in db.query(Problem).all()
            ],
        }
    ```
    - [ ] 총 사용자 수
    - [ ] 총 제출 수
    - [ ] 일일 활성 사용자
    - [ ] 문제별 통계

- [ ] Admin 대시보드 UI
  - [ ] `frontend/app/admin/dashboard/page.tsx` 생성
    - [ ] 통계 차트
    - [ ] 최근 제출 목록
    - [ ] 시스템 상태

---

## 4. 문제 관리 시스템 확장

### 4.1. 문제 수정/삭제

**목적**: Admin이 문제를 수정/삭제할 수 있는 기능 제공

#### 작업 내용

- [ ] 문제 수정 API
  - [ ] `PATCH /api/admin/problems/{id}` - 문제 수정
    ```python
    @router.patch("/admin/problems/{id}")
    async def update_problem(
        problem_id: int,
        problem_data: ProblemUpdate,
        current_admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db),
    ):
        problem = db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            raise HTTPException(404, "Problem not found")
        
        if problem_data.title:
            problem.title = problem_data.title
        if problem_data.description_md:
            problem.description_md = problem_data.description_md
        # ... 기타 필드 업데이트
        
        db.commit()
        return problem
    ```
  - [ ] `PUT /api/admin/problems/{id}` - 문제 전체 업데이트
    - [ ] 모든 필드를 한 번에 업데이트

- [ ] 문제 삭제 API
  - [ ] `DELETE /api/admin/problems/{id}` - 문제 삭제
    ```python
    @router.delete("/admin/problems/{id}")
    async def delete_problem(
        problem_id: int,
        current_admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db),
    ):
        problem = db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            raise HTTPException(404, "Problem not found")
        
        # 관련 데이터 처리
        # 옵션 1: CASCADE 삭제 (스키마에 설정)
        # 옵션 2: Soft delete (deleted_at 필드 추가)
        
        db.delete(problem)
        db.commit()
        return {"message": "Problem deleted"}
    ```
  - [ ] 관련 데이터 처리
    - [ ] `buggy_implementations`: CASCADE 삭제
    - [ ] `submissions`: 유지 (히스토리 보존)

- [ ] 문제 관리 UI
  - [ ] `frontend/app/admin/problems/[id]/edit/page.tsx` 생성
    - [ ] 문제 수정 폼
    - [ ] 문제 삭제 확인 다이얼로그

### 4.2. 문제 버전 관리 (옵션)

**목적**: 문제 수정 이력을 관리

#### 작업 내용

- [ ] 문제 히스토리
  - [ ] 문제 수정 이력 저장
    - [ ] `problem_versions` 테이블 생성
    - [ ] 수정 시 이전 버전 저장
  - [ ] 롤백 기능
    - [ ] 특정 버전으로 롤백

---

## 5. 고급 기능 (옵션)

### 5.1. 실시간 알림

**목적**: 채점 완료 시 실시간 알림 제공

#### 작업 내용

- [ ] WebSocket 또는 Server-Sent Events (SSE)
  - [ ] 채점 완료 시 실시간 알림
    ```python
    # FastAPI WebSocket 예시
    @app.websocket("/ws/submissions/{submission_id}")
    async def websocket_submission(
        websocket: WebSocket,
        submission_id: UUID,
    ):
        await websocket.accept()
        # Submission 상태 변경 시 알림 전송
    ```
  - [ ] 제출 상태 변경 알림

### 5.2. 문제 태그 시스템

**목적**: 문제를 태그로 분류 및 필터링

#### 작업 내용

- [ ] 태그 관리
  - [ ] `tags` 테이블 생성 (또는 JSONB 필드 활용)
    ```python
    class Tag(Base):
        __tablename__ = "tags"
        id = Column(Integer, primary_key=True)
        name = Column(String(50), unique=True)
    
    # 문제와 태그의 다대다 관계
    problem_tags = Table(
        'problem_tags',
        Base.metadata,
        Column('problem_id', Integer, ForeignKey('problems.id')),
        Column('tag_id', Integer, ForeignKey('tags.id')),
    )
    ```
  - [ ] 태그별 문제 필터링
    - [ ] `GET /api/v1/problems?tags=api,db`

- [ ] 태그 UI
  - [ ] 문제 목록에 태그 표시
  - [ ] 태그별 필터링

### 5.3. 문제 검색 기능

**목적**: 문제를 검색할 수 있는 기능 제공

#### 작업 내용

- [ ] 검색 API
  - [ ] `GET /api/v1/problems?search=...` - 문제 검색
    ```python
    @router.get("/problems")
    async def list_problems(
        search: Optional[str] = None,
        db: Session = Depends(get_db),
    ):
        query = db.query(Problem)
        if search:
            query = query.filter(
                or_(
                    Problem.title.ilike(f"%{search}%"),
                    Problem.description_md.ilike(f"%{search}%"),
                )
            )
        return query.all()
    ```
  - [ ] 제목, 설명, 태그 기반 검색

- [ ] 검색 UI
  - [ ] 검색 바 컴포넌트
  - [ ] 검색 결과 하이라이트

---

## 완료 체크리스트

### 필수 항목

- [ ] 완전한 인증/권한 시스템이 동작함
- [ ] 사용자 관리 시스템이 구현됨
- [ ] 통계/리포팅 기능이 동작함
- [ ] 문제 관리 시스템이 확장됨

### 검증 방법

1. **인증 테스트**: 회원가입/로그인/로그아웃 플로우 테스트
2. **권한 테스트**: 일반 사용자와 Admin의 권한 차이 확인
3. **통계 테스트**: 통계 API 응답 확인 및 차트 표시 확인
4. **문제 관리 테스트**: 문제 수정/삭제 기능 테스트

---

## 참고 문서

- [EC2 배포 가이드](../EC2_DEPLOYMENT.md)
- [프로젝트 사양서](qa-arena-spec.md)
- [FastAPI 인증 가이드](https://fastapi.tiangolo.com/tutorial/security/)

