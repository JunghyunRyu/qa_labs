# 주요 명령어

## 시스템 명령어 (Windows)

### 기본 유틸리티
```bash
ls        # 디렉토리 목록 (Git Bash)
cd        # 디렉토리 이동
grep      # 텍스트 검색 (Git Bash)
find      # 파일 검색 (Git Bash)
cat       # 파일 내용 보기 (Git Bash)
```

## Backend 명령어

### 환경 설정
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (PowerShell)
.\venv\Scripts\Activate.ps1

# 가상환경 활성화 (Git Bash)
source venv/Scripts/activate

# 의존성 설치
pip install -r requirements.txt
```

### 개발 서버
```bash
# FastAPI 서버 실행 (개발 모드)
cd backend
uvicorn app.main:app --reload

# FastAPI 서버 실행 (포트 지정)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 데이터베이스
```bash
# Alembic 마이그레이션 생성
alembic revision --autogenerate -m "migration message"

# 마이그레이션 적용
alembic upgrade head

# 마이그레이션 롤백
alembic downgrade -1
```

### 테스트
```bash
# 모든 테스트 실행
cd backend
pytest

# 특정 테스트 실행
pytest tests/test_api.py

# 커버리지 확인
pytest --cov=app --cov-report=html
```

### 코드 품질
```bash
# 포맷팅
black backend/

# 린팅
flake8 backend/
```

## Frontend 명령어

### 개발 서버
```bash
cd frontend

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

### 코드 품질
```bash
# 린팅
npm run lint

# 테스트
npm run test

# 테스트 (watch 모드)
npm run test:watch
```

## Docker 명령어

### 로컬 환경 (Windows)
```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 서비스 재빌드 및 시작
docker-compose up -d --build

# 특정 서비스만 재빌드
docker-compose up -d --build backend

# 로그 확인 (실시간)
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f celery_worker

# 컨테이너 상태 확인
docker-compose ps

# 볼륨까지 삭제
docker-compose down -v
```

### EC2 프로덕션 환경
```bash
# 서비스 시작
docker compose -f docker-compose.prod.yml up -d

# 서비스 중지
docker compose -f docker-compose.prod.yml down

# 서비스 재빌드
docker compose -f docker-compose.prod.yml up -d --build celery_worker

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f celery_worker

# 로그 최근 N줄
docker compose -f docker-compose.prod.yml logs celery_worker | tail -100

# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps
```

## Git 명령어

```bash
# 상태 확인
git status

# 변경사항 스테이징
git add .

# 커밋
git commit -m "feat: 기능 추가"

# 푸시
git push origin main

# 브랜치 생성 및 전환
git checkout -b feature/new-feature

# 충돌 해결 (로컬 변경사항 임시 저장)
git stash
git pull origin main
git stash pop
```

## Claude Code Slash Commands

```bash
# EC2 자동 배포
/deploy

# 서비스 로그 확인
/logs

# 대화형 제출 테스트
/test-submit

# 로컬-EC2 코드 싱크 확인
/check-sync
```

## 자주 사용하는 패턴

### 제출 테스트 (수동)
```bash
# JSON 파일 생성
cat > /tmp/submission.json << 'EOF'
{
  "problem_id": 1,
  "code": "def test_example():\n    assert True"
}
EOF

# 제출
curl -X POST http://localhost:8000/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d @/tmp/submission.json
```

### 배포 후 확인
```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 실시간 로그
docker compose -f docker-compose.prod.yml logs -f celery_worker

# 헬스 체크
curl http://localhost:8000/health
```
