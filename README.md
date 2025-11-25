# QA-Arena

AI-Assisted QA Coding Test Platform

QA 엔지니어의 테스트 설계/테스트 코드 작성 역량을 정량화하는, AI-보조 온라인 코딩 테스트 플랫폼 (Python + pytest 중심)

## 프로젝트 개요

QA-Arena는 사용자가 테스트 대상 함수/모듈에 대한 pytest 기반 테스트 코드를 작성하고, 시스템이 Golden Code와 여러 Buggy Implementations(mutants)에 대해 테스트를 실행하여 QA 역량을 점수화하는 플랫폼입니다.

### 주요 기능

- **테스트 코드 작성 및 채점**: 사용자가 pytest 기반 테스트 코드를 작성하고 제출
- **Mutation Testing**: Golden Code와 Buggy Implementations에 대한 테스트 실행
- **AI 피드백**: 채점 결과를 기반으로 AI가 자연어 피드백 생성
- **AI 문제 생성**: Admin이 AI를 활용하여 문제를 빠르게 생성

## 기술 스택

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL
- Celery + Redis
- Docker

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Monaco Editor

## 사전 요구 사항

- Python 3.11 이상
- Node.js 18 이상
- Docker Desktop (필수, PostgreSQL 및 Redis 실행용)
  - Windows: [Windows 설치 가이드](docs/DOCKER_SETUP_WINDOWS.md) 참고
  - WSL 2 필요 (Windows 10/11)
- Git

## 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd qa_labs
```

### 2. Backend 설정

```bash
# Backend 디렉토리로 이동
cd backend

# 가상환경 생성 및 활성화 (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
copy .env.example .env
# .env 파일을 편집하여 필요한 설정 입력
```

### 3. Frontend 설정

```bash
# Frontend 디렉토리로 이동
cd frontend

# 의존성 설치
npm install
```

### 4. Docker 설정

> **중요**: Windows 환경에서 Docker를 처음 설치하는 경우, [Windows Docker 설치 가이드](docs/DOCKER_SETUP_WINDOWS.md)를 먼저 참고하세요.

```powershell
# 루트 디렉토리에서 실행
docker-compose up -d
```

이 명령어는 PostgreSQL과 Redis 컨테이너를 시작합니다.

## 실행 방법

### Backend 서버 실행

```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend 서버는 `http://localhost:8000`에서 실행됩니다.
API 문서는 `http://localhost:8000/docs`에서 확인할 수 있습니다.

### Frontend 서버 실행

```bash
cd frontend
npm run dev
```

Frontend 서버는 `http://localhost:3000`에서 실행됩니다.

### Docker 서비스 실행

```powershell
# PostgreSQL과 Redis 시작
docker-compose up -d

# 서비스 상태 확인
docker-compose ps

# 서비스 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down

# 데이터 볼륨까지 삭제 (주의: 데이터가 삭제됩니다)
docker-compose down -v
```

**Windows 환경에서 Docker 설치가 필요한 경우**: [Windows Docker 설치 가이드](docs/DOCKER_SETUP_WINDOWS.md)를 참고하세요.

## 개발 환경 설정

### 환경변수 설정

Backend의 `.env` 파일에 다음 변수들을 설정하세요:

```env
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost:5432/qa_arena
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=["http://localhost:3000"]
```

### 데이터베이스 마이그레이션

```bash
cd backend
.\venv\Scripts\Activate.ps1

# Alembic 초기화 (최초 1회)
alembic init alembic

# 마이그레이션 생성
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 적용
alembic upgrade head
```

## 프로젝트 구조

```
qa_labs/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/         # API 라우터
│   │   ├── core/        # 설정 및 공통 기능
│   │   ├── models/      # 데이터베이스 모델
│   │   ├── services/    # 비즈니스 로직
│   │   ├── services/    # 비즈니스 로직
│   │   ├── workers/     # Celery 작업
│   │   └── main.py      # FastAPI 앱 진입점
│   ├── tests/           # 테스트 코드
│   ├── alembic/        # 데이터베이스 마이그레이션
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/            # Next.js Frontend
│   ├── app/            # Next.js App Router
│   ├── components/     # React 컴포넌트
│   ├── lib/            # 유틸리티 함수
│   └── types/          # TypeScript 타입 정의
├── judge/              # Judge/Runner Docker 이미지
│   ├── Dockerfile
│   └── conftest.py     # 보안 제한 설정
├── nginx/              # Nginx 설정 파일
│   ├── nginx.conf
│   └── conf.d/
├── scripts/            # 유틸리티 스크립트
│   ├── backup_db.sh    # 데이터베이스 백업 (Linux/Mac)
│   ├── restore_db.sh   # 데이터베이스 복구 (Linux/Mac)
│   ├── backup_db.ps1   # 데이터베이스 백업 (Windows)
│   └── restore_db.ps1  # 데이터베이스 복구 (Windows)
├── docker-compose.yml      # 개발용 Docker Compose
├── docker-compose.prod.yml # 프로덕션용 Docker Compose
├── DEPLOYMENT.md        # 배포 가이드
├── USER_GUIDE.md       # 사용자 가이드
└── README.md
```

## 문서

- [배포 가이드](DEPLOYMENT.md) - 프로덕션 환경 배포 방법
- [사용자 가이드](USER_GUIDE.md) - 플랫폼 사용 방법
- [개발 가이드](CONTRIBUTING.md) - 개발 및 기여 가이드
- [프로젝트 사양서](docs/qa-arena-spec.md) - 상세 기술 사양
- [마일스톤](docs/qa-arena-milestones.md) - 개발 진행 상황

## 배포

### 로컬/일반 서버 배포

프로덕션 환경에 배포하려면 [배포 가이드](DEPLOYMENT.md)를 참고하세요.

### 빠른 시작 (프로덕션)

```bash
# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 프로덕션 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build

# 데이터베이스 마이그레이션
docker exec qa_arena_backend_prod alembic upgrade head
```

### AWS EC2 배포

AWS EC2 인스턴스에 배포하려면 [EC2 배포 가이드](EC2_DEPLOYMENT.md)를 참고하세요.

#### EC2 빠른 시작

1. **EC2 인스턴스 생성**
   - Ubuntu 22.04 LTS AMI 선택
   - t3.medium 이상 인스턴스 타입
   - 보안 그룹: SSH (22), HTTP (80), HTTPS (443)

2. **초기 설정**
   ```bash
   # SSH 접속
   ssh -i your-key.pem ubuntu@<EC2_IP>
   
   # 저장소 클론
   git clone <repository-url>
   cd qa_labs
   
   # 초기 설정 실행
   chmod +x scripts/ec2_setup.sh
   sudo ./scripts/ec2_setup.sh
   ```

3. **애플리케이션 배포**
   ```bash
   # 환경변수 설정
   cp .env.example .env
   nano .env  # 필요한 값 설정
   
   # 배포 실행
   chmod +x scripts/deploy_ec2.sh
   ./scripts/deploy_ec2.sh
   ```

4. **SSL 설정** (도메인이 있는 경우)
   ```bash
   # DNS 설정 완료 후
   chmod +x scripts/setup_ssl.sh
   sudo ./scripts/setup_ssl.sh yourdomain.com
   ```

자세한 내용은 [EC2 배포 가이드](EC2_DEPLOYMENT.md)를 참고하세요.

## 개발 가이드

자세한 개발 가이드는 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 라이선스

[라이선스 정보를 여기에 추가하세요]

## 기여하기

프로젝트에 기여하고 싶으시다면 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 지원

문제가 발생하거나 질문이 있으시면:
- [사용자 가이드](USER_GUIDE.md)를 확인하세요
- 이슈를 등록하세요
- 관리자에게 문의하세요
