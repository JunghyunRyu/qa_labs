#!/bin/bash

# QA-Arena SSL/TLS 설정 스크립트
# Let's Encrypt를 사용하여 SSL 인증서를 발급하고 설정합니다.

set -e

# 도메인 확인
if [ -z "$1" ]; then
    echo "사용법: $0 <domain>"
    echo "예: $0 example.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"  # 기본 이메일 주소

echo "=========================================="
echo "SSL 인증서 설정 시작"
echo "도메인: $DOMAIN"
echo "=========================================="

# Certbot 설치 확인
echo "[1/5] Certbot 설치 확인 중..."
if ! command -v certbot &> /dev/null; then
    echo "Certbot 설치 중..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "Certbot가 이미 설치되어 있습니다."
fi

# Nginx 컨테이너 확인
echo "[2/5] Nginx 컨테이너 확인 중..."
if ! docker ps | grep -q qa_arena_nginx_prod; then
    echo "오류: Nginx 컨테이너가 실행 중이지 않습니다."
    echo "먼저 애플리케이션을 배포하세요: ./scripts/deploy_ec2.sh"
    exit 1
fi

# Nginx 설정 파일에 도메인 설정
echo "[3/5] Nginx 설정 업데이트 중..."
NGINX_CONF="nginx/conf.d/qa-arena.conf"

if [ -f "$NGINX_CONF" ]; then
    # 도메인 이름 업데이트
    sed -i "s/server_name _;/server_name ${DOMAIN};/g" "$NGINX_CONF"
    echo "Nginx 설정 파일이 업데이트되었습니다."
else
    echo "경고: Nginx 설정 파일을 찾을 수 없습니다: $NGINX_CONF"
fi

# Nginx 재시작
echo "Nginx 재시작 중..."
docker restart qa_arena_nginx_prod
sleep 5

# SSL 인증서 발급
echo "[4/5] SSL 인증서 발급 중..."
echo "이메일 주소를 입력하세요 (기본값: ${EMAIL}):"
read -r EMAIL_INPUT
EMAIL=${EMAIL_INPUT:-$EMAIL}

# Certbot을 사용하여 인증서 발급
# Nginx 플러그인을 사용하지 않고 standalone 모드 사용
sudo certbot certonly --standalone \
    --preferred-challenges http \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive || {
    echo "오류: SSL 인증서 발급에 실패했습니다."
    echo "다음을 확인하세요:"
    echo "1. 도메인 DNS가 EC2 인스턴스 IP로 설정되었는지"
    echo "2. 포트 80이 열려 있는지"
    echo "3. 방화벽이 포트 80을 차단하지 않는지"
    exit 1
}

# 인증서 파일을 Docker 볼륨에 복사할 디렉토리 생성
echo "[5/5] SSL 인증서 설정 중..."
SSL_DIR="/etc/letsencrypt/live/${DOMAIN}"
CERT_FILE="${SSL_DIR}/fullchain.pem"
KEY_FILE="${SSL_DIR}/privkey.pem"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "오류: 인증서 파일을 찾을 수 없습니다."
    exit 1
fi

# Nginx 컨테이너에 SSL 디렉토리 생성
docker exec qa_arena_nginx_prod mkdir -p /etc/nginx/ssl

# 인증서 파일을 컨테이너에 복사
docker cp "$CERT_FILE" qa_arena_nginx_prod:/etc/nginx/ssl/cert.pem
docker cp "$KEY_FILE" qa_arena_nginx_prod:/etc/nginx/ssl/key.pem

# Nginx 설정 파일에서 HTTPS 서버 블록 활성화
if [ -f "$NGINX_CONF" ]; then
    # HTTPS 서버 블록의 주석 해제 (간단한 sed 명령으로는 복잡하므로 수동 안내)
    echo ""
    echo "=========================================="
    echo "Nginx HTTPS 설정 활성화 필요"
    echo "=========================================="
    echo ""
    echo "다음 단계를 수행하세요:"
    echo "1. $NGINX_CONF 파일을 편집하세요"
    echo "2. HTTPS 서버 블록 (443 포트)의 주석을 해제하세요"
    echo "3. 도메인 이름을 확인하세요"
    echo "4. 다음 명령으로 Nginx를 재시작하세요:"
    echo "   docker restart qa_arena_nginx_prod"
    echo ""
fi

# 인증서 자동 갱신 설정
echo "인증서 자동 갱신 설정 중..."
(crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet && docker restart qa_arena_nginx_prod") | crontab -

echo ""
echo "=========================================="
echo "SSL 설정 완료!"
echo "=========================================="
echo ""
echo "인증서 정보:"
echo "  도메인: $DOMAIN"
echo "  인증서: $CERT_FILE"
echo "  키: $KEY_FILE"
echo ""
echo "다음 단계:"
echo "1. Nginx 설정 파일에서 HTTPS 서버 블록을 활성화하세요"
echo "2. Nginx를 재시작하세요: docker restart qa_arena_nginx_prod"
echo "3. https://${DOMAIN} 으로 접속하여 확인하세요"
echo ""

