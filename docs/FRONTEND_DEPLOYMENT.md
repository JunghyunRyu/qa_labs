# 프론트엔드 배포 가이드

이 문서는 QA-Arena 프론트엔드를 실서버 환경에 배포하는 방법을 설명합니다.

## 문제 상황

실서버 환경에서 `/docs` 엔드포인트는 정상 동작하지만 UI가 표시되지 않는 경우, 프론트엔드가 배포되지 않았거나 올바르게 설정되지 않은 것입니다.

## 해결 방법

### 방법 1: Docker Compose를 사용한 자동 배포 (권장)

프론트엔드가 `docker-compose.prod.yml`에 포함되어 있으므로, 다음 명령어로 모든 서비스를 함께 배포할 수 있습니다:

```powershell
# 프로덕션 환경에서 모든 서비스 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build
```

이 명령어는 다음을 수행합니다:
- 프론트엔드 빌드 (Next.js standalone 모드)
- 백엔드 빌드
- 모든 서비스 시작
- 프론트엔드는 포트 3000으로 노출됨

**중요**: 실서버에 별도의 Nginx가 설치되어 있다면, 아래 "실서버 Nginx 설정" 섹션을 참고하여 Nginx를 설정해야 합니다.

### 방법 2: 수동 배포

#### 1. 프론트엔드 빌드

로컬 환경에서 프론트엔드를 빌드합니다:

```powershell
cd frontend
npm install
npm run build
```

#### 2. 환경변수 설정

프론트엔드가 API를 올바르게 호출하도록 환경변수를 설정합니다:

`.env` 파일에 다음을 추가하거나 수정:

```env
NEXT_PUBLIC_API_URL=/api
```

또는 실서버 도메인을 사용:

```env
NEXT_PUBLIC_API_URL=https://qa-arena.qalabs.kr/api
```

#### 3. Docker Compose로 배포

```powershell
# 프론트엔드만 재빌드
docker-compose -f docker-compose.prod.yml build frontend

# 프론트엔드만 재시작
docker-compose -f docker-compose.prod.yml up -d frontend

# 또는 모든 서비스 재시작
docker-compose -f docker-compose.prod.yml up -d --build
```

#### 4. 실서버 Nginx 설정

실서버에 별도의 Nginx가 설치되어 있는 경우, 다음 설정을 추가해야 합니다:

**실서버 Nginx 설정 파일 위치 확인** (일반적으로 `/etc/nginx/sites-available/` 또는 `/etc/nginx/conf.d/`):

```nginx
upstream frontend {
    server localhost:3000;
}

upstream backend {
    server localhost:8001;  # docker-compose.prod.yml에서 8001로 노출됨
}

server {
    listen 80;
    server_name qa-arena.qalabs.kr;

    # API endpoints
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://frontend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
}
```

**Nginx 설정 적용**:

```bash
# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
# 또는
sudo service nginx restart
```

## 배포 확인

### 1. 서비스 상태 확인

```powershell
# 모든 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 프론트엔드 로그 확인
docker logs qa_arena_frontend_prod

# Nginx 로그 확인
docker logs qa_arena_nginx_prod
```

### 2. 브라우저에서 확인

1. `https://qa-arena.qalabs.kr` 접속
2. UI가 정상적으로 표시되는지 확인
3. 문제 목록 페이지가 로드되는지 확인
4. API 호출이 정상적으로 동작하는지 확인 (브라우저 개발자 도구 Network 탭)

### 3. API 연결 확인

프론트엔드가 백엔드 API를 올바르게 호출하는지 확인:

```powershell
# 프론트엔드 컨테이너 내부에서 확인
docker exec qa_arena_frontend_prod env | grep NEXT_PUBLIC_API_URL
```

## 문제 해결

### 프론트엔드가 시작되지 않음

```powershell
# 프론트엔드 로그 확인
docker logs qa_arena_frontend_prod

# 프론트엔드 재빌드
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Nginx가 프론트엔드를 찾지 못함

```powershell
# Nginx 설정 테스트
docker exec qa_arena_nginx_prod nginx -t

# 프론트엔드 서비스가 실행 중인지 확인
docker ps | grep frontend

# 네트워크 연결 확인
docker exec qa_arena_nginx_prod ping frontend
```

### API 호출 실패

1. 브라우저 개발자 도구에서 Network 탭 확인
2. API 요청 URL이 올바른지 확인 (`/api/v1/...`)
3. CORS 설정 확인 (백엔드 `.env` 파일의 `CORS_ORIGINS`)

```powershell
# 백엔드 CORS 설정 확인
docker exec qa_arena_backend_prod env | grep CORS_ORIGINS
```

### 빌드 오류

```powershell
# 프론트엔드 의존성 재설치
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

## 환경변수 설정

### 로컬 개발 환경

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 프로덕션 환경

`docker-compose.prod.yml` 또는 `.env` 파일:

```env
NEXT_PUBLIC_API_URL=/api
```

또는 절대 URL:

```env
NEXT_PUBLIC_API_URL=https://qa-arena.qalabs.kr/api
```

## 아키텍처 개요

```
사용자 브라우저
    ↓
실서버 Nginx (포트 80/443)
    ├─→ /api/* → Backend (localhost:8001)
    └─→ /* → Frontend (localhost:3000)
```

- 실서버의 Nginx가 리버스 프록시 역할
- `/api/*` 경로는 백엔드로 프록시 (포트 8001)
- 그 외 모든 경로는 프론트엔드로 프록시 (포트 3000)
- 프론트엔드는 Next.js standalone 모드로 실행
- Backend는 포트 8001로 노출 (실서버 설정에 맞춤)

## 추가 리소스

- [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Nginx 리버스 프록시](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

