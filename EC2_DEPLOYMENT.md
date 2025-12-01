# QA-Arena EC2 배포 가이드

이 문서는 QA-Arena 플랫폼을 AWS EC2 인스턴스에 배포하는 방법을 단계별로 설명합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [EC2 인스턴스 생성](#ec2-인스턴스-생성)
3. [보안 그룹 설정](#보안-그룹-설정)
4. [EC2 초기 설정](#ec2-초기-설정)
5. [애플리케이션 배포](#애플리케이션-배포)
6. [SSL/TLS 설정](#ssltls-설정)
7. [자동 시작 설정](#자동-시작-설정)
8. [모니터링 및 로깅](#모니터링-및-로깅)
9. [백업 자동화](#백업-자동화)
10. [문제 해결](#문제-해결)

## 사전 요구사항

- AWS 계정
- 도메인 이름 (SSL 인증서 발급용)
- 도메인 DNS 설정 권한
- SSH 클라이언트 (Windows: PuTTY 또는 WSL, Mac/Linux: 기본 제공)

## EC2 인스턴스 생성

### 1. 인스턴스 타입 선택

권장 사양:
- **최소**: t3.medium (2 vCPU, 4GB RAM)
- **권장**: t3.large (2 vCPU, 8GB RAM)
- **고성능**: t3.xlarge (4 vCPU, 16GB RAM)

### 2. AMI 선택

Ubuntu 22.04 LTS 또는 Amazon Linux 2023 권장

### 3. 키 페어 생성

1. EC2 콘솔에서 "키 페어" 메뉴 선택
2. "키 페어 생성" 클릭
3. 이름 입력 (예: `qa-arena-key`)
4. 키 페어 다운로드 및 안전한 곳에 보관

### 4. 인스턴스 생성

1. EC2 콘솔에서 "인스턴스 시작" 클릭
2. AMI 선택 (Ubuntu 22.04 LTS)
3. 인스턴스 타입 선택 (t3.medium 이상)
4. 키 페어 선택 (위에서 생성한 키)
5. 네트워크 설정:
   - 자동 할당 퍼블릭 IP: 활성화
   - 보안 그룹: 새 보안 그룹 생성 (다음 섹션 참고)
6. 스토리지: 최소 20GB (권장: 30GB)
7. "인스턴스 시작" 클릭

## 보안 그룹 설정

### 인바운드 규칙

| 타입 | 프로토콜 | 포트 범위 | 소스 | 설명 |
|------|---------|----------|------|------|
| SSH | TCP | 22 | 내 IP | SSH 접속 |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP 트래픽 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS 트래픽 |

### 아웃바운드 규칙

기본 설정 유지 (모든 트래픽 허용)

## EC2 초기 설정

### 1. SSH 접속

```bash
# Windows (WSL 또는 Git Bash)
ssh -i /path/to/qa-arena-key.pem ubuntu@<EC2_PUBLIC_IP>

# Mac/Linux
chmod 400 /path/to/qa-arena-key.pem
ssh -i /path/to/qa-arena-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 2. 시스템 업데이트

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. 초기 설정 스크립트 실행

```bash
# 저장소 클론
git clone <repository-url>
cd qa_labs

# 초기 설정 스크립트 실행
chmod +x scripts/ec2_setup.sh
sudo ./scripts/ec2_setup.sh
```

이 스크립트는 다음을 수행합니다:
- Docker 설치
- Docker Compose 설치
- 필요한 패키지 설치
- 사용자 권한 설정

## 애플리케이션 배포

### 1. 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env
nano .env
```

`.env` 파일에 다음 값들을 설정하세요:

```env
# Database Configuration
POSTGRES_USER=qa_arena_user
POSTGRES_PASSWORD=<강력한_비밀번호>
POSTGRES_DB=qa_arena

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Application Configuration
DEBUG=False
APP_NAME=QA-Arena API
APP_VERSION=0.1.0

# CORS Configuration
CORS_ORIGINS=["https://yourdomain.com"]

# OpenAI API Configuration
OPENAI_API_KEY=<your_openai_api_key>
OPENAI_MODEL=gpt-5-mini-2025-08-07

# Nginx Configuration
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

### 2. 배포 스크립트 실행

```bash
# 배포 스크립트 실행
chmod +x scripts/deploy_ec2.sh
./scripts/deploy_ec2.sh
```

이 스크립트는 다음을 수행합니다:
- Docker 이미지 빌드
- 컨테이너 시작
- 데이터베이스 마이그레이션 실행
- 서비스 상태 확인

### 3. 수동 배포 (선택사항)

```bash
# 프로덕션 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build

# 데이터베이스 마이그레이션
docker exec qa_arena_backend_prod alembic upgrade head

# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

## SSL/TLS 설정

### 1. 도메인 DNS 설정

EC2 인스턴스의 퍼블릭 IP를 도메인의 A 레코드에 추가:

```
Type: A
Name: @ (또는 www)
Value: <EC2_PUBLIC_IP>
TTL: 300
```

DNS 전파 확인:

```bash
dig yourdomain.com
# 또는
nslookup yourdomain.com
```

### 2. SSL 인증서 설정

```bash
# SSL 설정 스크립트 실행
chmod +x scripts/setup_ssl.sh
sudo ./scripts/setup_ssl.sh yourdomain.com
```

이 스크립트는 다음을 수행합니다:
- Certbot 설치
- Let's Encrypt 인증서 발급
- Nginx SSL 설정 업데이트
- 인증서 자동 갱신 설정

### 3. Nginx SSL 설정 활성화

`nginx/conf.d/qa-arena.conf` 파일에서 HTTPS 서버 블록의 주석을 해제하고 도메인을 설정하세요.

```bash
# Nginx 설정 파일 편집
nano nginx/conf.d/qa-arena.conf

# 도메인 이름 변경
server_name yourdomain.com;

# HTTPS 서버 블록 주석 해제
```

Nginx 재시작:

```bash
docker restart qa_arena_nginx_prod
```

## 자동 시작 설정

### systemd 서비스 설정

```bash
# 서비스 파일 복사
sudo cp scripts/qa-arena.service /etc/systemd/system/

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable qa-arena.service
sudo systemctl start qa-arena.service

# 서비스 상태 확인
sudo systemctl status qa-arena.service
```

서비스가 활성화되면 EC2 인스턴스 재시작 시 자동으로 애플리케이션이 시작됩니다.

## 모니터링 및 로깅

### 1. 서비스 로그 확인

```bash
# 모든 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery_worker
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 2. 애플리케이션 로그

```bash
# Backend 로그
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# 또는 컨테이너 내부에서
docker exec qa_arena_backend_prod tail -f /app/logs/app.log
```

### 3. 시스템 리소스 모니터링

```bash
# CPU 및 메모리 사용량
htop
# 또는
top

# 디스크 사용량
df -h

# Docker 컨테이너 리소스 사용량
docker stats
```

## 백업 자동화

### 1. 백업 스크립트 설정

```bash
# 백업 디렉토리 생성
mkdir -p /home/ubuntu/backups

# Cron 작업 추가 (매일 새벽 2시 백업)
crontab -e

# 다음 줄 추가
0 2 * * * /home/ubuntu/qa_labs/scripts/backup_db.sh /home/ubuntu/backups
```

### 2. S3 백업 (선택사항)

```bash
# AWS CLI 설치
sudo apt install awscli -y

# AWS 자격 증명 설정
aws configure

# 백업 후 S3에 업로드하는 스크립트 작성
# scripts/backup_to_s3.sh 참고
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

### Nginx 오류

```bash
# Nginx 로그 확인
docker logs qa_arena_nginx_prod

# Nginx 설정 테스트
docker exec qa_arena_nginx_prod nginx -t
```

### SSL 인증서 갱신 오류

```bash
# Certbot 로그 확인
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# 수동 갱신 테스트
sudo certbot renew --dry-run
```

### 서비스가 시작되지 않음

```bash
# systemd 서비스 로그 확인
sudo journalctl -u qa-arena.service -f

# Docker Compose 로그 확인
docker-compose -f docker-compose.prod.yml logs
```

## 보안 체크리스트

배포 전 다음 사항을 확인하세요:

- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] SSH 키가 안전하게 보관되었는지 확인
- [ ] 보안 그룹이 최소 권한으로 설정되었는지 확인
- [ ] CORS 설정이 올바른 도메인으로 제한되었는지 확인
- [ ] HTTPS가 활성화되었는지 확인
- [ ] 정기적인 백업이 설정되었는지 확인
- [ ] 시스템 업데이트가 정기적으로 실행되는지 확인

## 비용 최적화

### EC2 인스턴스 최적화

- **Reserved Instances**: 장기 사용 시 예약 인스턴스 사용
- **Spot Instances**: 개발/테스트 환경에 사용 (주의: 중단 가능)
- **Auto Scaling**: 트래픽에 따라 인스턴스 자동 조정

### 스토리지 최적화

- **EBS 볼륨 타입**: gp3 (일반 용도) 사용
- **스냅샷**: 정기적으로 EBS 스냅샷 생성

### 모니터링 비용

- **CloudWatch**: 기본 모니터링 무료 (5분 간격)
- **상세 모니터링**: 필요시 활성화 (유료)

## 추가 리소스

- [AWS EC2 문서](https://docs.aws.amazon.com/ec2/)
- [Docker 문서](https://docs.docker.com/)
- [Let's Encrypt 문서](https://letsencrypt.org/docs/)
- [Nginx 문서](https://nginx.org/en/docs/)

## 지원

문제가 발생하거나 도움이 필요한 경우:

1. 로그 파일을 확인하여 오류 정보를 수집하세요
2. 이슈를 등록하거나 관리자에게 문의하세요

