# QA-Arena 배포 가이드

이 문서는 QA-Arena 플랫폼을 프로덕션 환경에 배포하는 방법을 설명합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [Docker를 사용한 배포](#docker를-사용한-배포)
4. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
5. [Nginx 설정](#nginx-설정)
6. [SSL/TLS 설정](#ssltls-설정)
7. [모니터링 및 로깅](#모니터링-및-로깅)
8. [백업 및 복구](#백업-및-복구)
9. [업데이트 및 유지보수](#업데이트-및-유지보수)

## 사전 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상
- 최소 4GB RAM
- 최소 20GB 디스크 공간
- 도메인 이름 (선택사항, HTTPS 사용 시 필요)

## 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd qa_labs
```

### 2. 환경변수 파일 생성

`.env.example`을 복사하여 `.env` 파일을 생성하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일에서 다음 값들을 반드시 변경하세요:

- `POSTGRES_PASSWORD`: 강력한 비밀번호로 변경
- `OPENAI_API_KEY`: OpenAI API 키 입력
- `CORS_ORIGINS`: 프론트엔드 도메인으로 변경 (예: `["https://yourdomain.com"]`)
- `DEBUG`: 프로덕션에서는 `False`로 설정

### 3. 보안 확인

프로덕션 배포 전 다음 사항을 확인하세요:

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] OpenAI API 키가 올바르게 설정되었는지 확인
- [ ] CORS 설정이 올바른 도메인으로 설정되었는지 확인

## Docker를 사용한 배포

### 1. 프로덕션 빌드 및 실행

```bash
# 프로덕션용 Docker Compose로 서비스 시작
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. 서비스 상태 확인

```bash
# 모든 서비스가 정상 실행 중인지 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. 서비스 중지

```bash
docker-compose -f docker-compose.prod.yml down
```

## 데이터베이스 마이그레이션

### 1. 마이그레이션 실행

Backend 컨테이너에서 Alembic 마이그레이션을 실행합니다:

```bash
# Backend 컨테이너에 접속
docker exec -it qa_arena_backend_prod bash

# 마이그레이션 실행
alembic upgrade head

# 컨테이너에서 나가기
exit
```

또는 한 줄로 실행:

```bash
docker exec qa_arena_backend_prod alembic upgrade head
```

### 2. 초기 데이터 시드 (선택사항)

```bash
docker exec qa_arena_backend_prod python scripts/seed_problems.py
```

## Nginx 설정

### 1. 기본 설정

`nginx/conf.d/qa-arena.conf` 파일을 열어 도메인 이름을 설정하세요:

```nginx
server_name yourdomain.com;
```

### 2. 프론트엔드 빌드 및 배포

```bash
cd frontend
npm install
npm run build

# 빌드된 파일을 Nginx 컨테이너에 복사
docker cp .next/standalone qa_arena_nginx_prod:/usr/share/nginx/html
```

또는 Nginx 볼륨을 사용하여 마운트할 수 있습니다.

### 3. Nginx 재시작

```bash
docker restart qa_arena_nginx_prod
```

## SSL/TLS 설정

### 1. Let's Encrypt 인증서 발급 (권장)

```bash
# Certbot 설치 및 인증서 발급
certbot certonly --standalone -d yourdomain.com

# 인증서 파일을 Nginx 컨테이너에 복사
docker cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem qa_arena_nginx_prod:/etc/nginx/ssl/cert.pem
docker cp /etc/letsencrypt/live/yourdomain.com/privkey.pem qa_arena_nginx_prod:/etc/nginx/ssl/key.pem
```

### 2. Nginx HTTPS 설정 활성화

`nginx/conf.d/qa-arena.conf` 파일에서 HTTPS 서버 블록의 주석을 해제하고 설정을 조정하세요.

### 3. 인증서 자동 갱신

Cron 작업을 설정하여 인증서를 자동으로 갱신하세요:

```bash
0 0 * * * certbot renew --quiet && docker restart qa_arena_nginx_prod
```

## 모니터링 및 로깅

### 1. 로그 확인

```bash
# 모든 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery_worker
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 2. 애플리케이션 로그

애플리케이션 로그는 `backend/logs/` 디렉토리에 저장됩니다:

- `app.log`: 일반 로그
- `error.log`: 에러 로그

### 3. 데이터베이스 백업 확인

정기적으로 데이터베이스 백업이 실행되는지 확인하세요. (백업 스크립트 참고)

## 백업 및 복구

### 1. 데이터베이스 백업

```bash
# 백업 스크립트 실행
./scripts/backup_db.sh

# 또는 수동 백업
docker exec qa_arena_postgres_prod pg_dump -U qa_arena_user qa_arena > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 데이터베이스 복구

```bash
# 복구 스크립트 실행
./scripts/restore_db.sh backup_file.sql

# 또는 수동 복구
cat backup_file.sql | docker exec -i qa_arena_postgres_prod psql -U qa_arena_user qa_arena
```

자세한 내용은 `scripts/backup_db.sh`와 `scripts/restore_db.sh`를 참고하세요.

## 업데이트 및 유지보수

### 1. 코드 업데이트

```bash
# 최신 코드 가져오기
git pull origin main

# 프로덕션 빌드 및 재시작
docker-compose -f docker-compose.prod.yml up -d --build

# 마이그레이션 실행 (필요시)
docker exec qa_arena_backend_prod alembic upgrade head
```

### 2. 의존성 업데이트

```bash
# Backend 의존성 업데이트
cd backend
pip install -r requirements.txt --upgrade

# Frontend 의존성 업데이트
cd frontend
npm update
```

### 3. 컨테이너 재시작

```bash
# 특정 서비스 재시작
docker restart qa_arena_backend_prod
docker restart qa_arena_celery_worker_prod

# 모든 서비스 재시작
docker-compose -f docker-compose.prod.yml restart
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# PostgreSQL 로그 확인
docker logs qa_arena_postgres_prod

# 연결 테스트
docker exec qa_arena_postgres_prod psql -U qa_arena_user -d qa_arena -c "SELECT 1;"
```

### Redis 연결 오류

```bash
# Redis 컨테이너 상태 확인
docker ps | grep redis

# Redis 연결 테스트
docker exec qa_arena_redis_prod redis-cli ping
```

### Celery Worker 오류

```bash
# Celery Worker 로그 확인
docker logs qa_arena_celery_worker_prod

# Worker 재시작
docker restart qa_arena_celery_worker_prod
```

## 보안 체크리스트

배포 전 다음 사항을 확인하세요:

- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] CORS 설정이 올바른 도메인으로 제한되었는지 확인
- [ ] HTTPS가 활성화되었는지 확인 (프로덕션 환경)
- [ ] Nginx Rate Limiting이 활성화되었는지 확인
- [ ] 보안 헤더가 설정되었는지 확인
- [ ] 정기적인 백업이 설정되었는지 확인

## 추가 리소스

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Docker 문서](https://nextjs.org/docs)
- [Docker 문서](https://docs.docker.com/)
- [Nginx 문서](https://nginx.org/en/docs/)

