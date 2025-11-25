#!/bin/bash

# QA-Arena EC2 초기 설정 스크립트
# 이 스크립트는 EC2 인스턴스에 Docker 및 Docker Compose를 설치합니다.

set -e

echo "=========================================="
echo "QA-Arena EC2 초기 설정 시작"
echo "=========================================="

# 시스템 업데이트
echo "[1/6] 시스템 업데이트 중..."
sudo apt update
sudo apt upgrade -y

# 필수 패키지 설치
echo "[2/6] 필수 패키지 설치 중..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common

# Docker 설치
echo "[3/6] Docker 설치 중..."
if ! command -v docker &> /dev/null; then
    # Docker 공식 GPG 키 추가
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Docker 저장소 추가
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Docker 설치
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    echo "Docker 설치 완료"
else
    echo "Docker가 이미 설치되어 있습니다."
fi

# Docker Compose 설치 확인
echo "[4/6] Docker Compose 확인 중..."
if ! docker compose version &> /dev/null; then
    echo "Docker Compose가 설치되지 않았습니다. Docker Compose 플러그인을 설치합니다."
    sudo apt install -y docker-compose-plugin
else
    echo "Docker Compose가 이미 설치되어 있습니다."
fi

# 현재 사용자를 docker 그룹에 추가
echo "[5/6] 사용자 권한 설정 중..."
sudo usermod -aG docker $USER

# Docker 서비스 시작 및 활성화
echo "[6/6] Docker 서비스 설정 중..."
sudo systemctl start docker
sudo systemctl enable docker

# 설치 확인
echo ""
echo "=========================================="
echo "설치 확인"
echo "=========================================="
docker --version
docker compose version

echo ""
echo "=========================================="
echo "초기 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. 로그아웃 후 다시 로그인하거나 'newgrp docker' 명령을 실행하세요"
echo "2. .env 파일을 설정하세요"
echo "3. './scripts/deploy_ec2.sh' 스크립트를 실행하여 애플리케이션을 배포하세요"
echo ""

