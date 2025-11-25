#!/bin/bash

# QA-Arena EC2 배포 스크립트
# 이 스크립트는 애플리케이션을 빌드하고 배포합니다.

set -e

echo "=========================================="
echo "QA-Arena 배포 시작"
echo "=========================================="

# 현재 디렉토리 확인
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "오류: docker-compose.prod.yml 파일을 찾을 수 없습니다."
    echo "qa_labs 디렉토리에서 실행하세요."
    exit 1
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "경고: .env 파일이 없습니다."
    echo ".env.example을 복사하여 .env 파일을 생성하고 설정하세요."
    exit 1
fi

# Docker 그룹 확인
if ! groups | grep -q docker; then
    echo "경고: 현재 사용자가 docker 그룹에 속해 있지 않습니다."
    echo "'newgrp docker' 명령을 실행하거나 로그아웃 후 다시 로그인하세요."
    exit 1
fi

# 기존 컨테이너 중지 및 제거
echo "[1/5] 기존 컨테이너 정리 중..."
docker-compose -f docker-compose.prod.yml down || true

# Docker 이미지 빌드
echo "[2/5] Docker 이미지 빌드 중..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 컨테이너 시작
echo "[3/5] 컨테이너 시작 중..."
docker-compose -f docker-compose.prod.yml up -d

# 서비스 상태 확인
echo "[4/5] 서비스 상태 확인 중..."
sleep 10
docker-compose -f docker-compose.prod.yml ps

# 데이터베이스 마이그레이션
echo "[5/5] 데이터베이스 마이그레이션 실행 중..."
sleep 5
docker exec qa_arena_backend_prod alembic upgrade head || {
    echo "경고: 마이그레이션 실행 중 오류가 발생했습니다."
    echo "컨테이너 로그를 확인하세요: docker logs qa_arena_backend_prod"
}

echo ""
echo "=========================================="
echo "배포 완료!"
echo "=========================================="
echo ""
echo "서비스 상태 확인:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "로그 확인:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "다음 단계:"
echo "1. 도메인 DNS 설정을 완료하세요"
echo "2. './scripts/setup_ssl.sh yourdomain.com' 스크립트를 실행하여 SSL을 설정하세요"
echo ""

