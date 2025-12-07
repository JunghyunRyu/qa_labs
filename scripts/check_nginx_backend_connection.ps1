# Nginx와 백엔드 연결 확인 스크립트

$KEY = 'C:\pem\my_proton_key.pem'
$USER = 'ubuntu'
$HOSTNAME = '15.164.221.173'

Write-Host "Nginx와 백엔드 연결 확인 중..." -ForegroundColor Cyan

# 1. Nginx 컨테이너에서 백엔드 연결 테스트
Write-Host "`n1. Nginx 컨테이너에서 백엔드 연결 테스트..." -ForegroundColor Yellow
$nginxTest = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_nginx_prod wget -qO- http://backend:8000/health || echo 'Connection failed'"
Write-Host $nginxTest

# 2. Nginx 에러 로그 확인
Write-Host "`n2. Nginx 에러 로그 (최근 30줄)..." -ForegroundColor Yellow
$nginxErrorLogs = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_nginx_prod tail -n 30 /var/log/nginx/error.log"
Write-Host $nginxErrorLogs

# 3. Docker 네트워크 확인
Write-Host "`n3. Docker 네트워크 확인..." -ForegroundColor Yellow
$networkInfo = ssh -i $KEY "${USER}@${HOSTNAME}" "docker network inspect qa_labs_qa_arena_network | grep -A 5 'Containers'"
Write-Host $networkInfo

# 4. 백엔드 서비스 이름 확인
Write-Host "`n4. docker-compose.prod.yml에서 백엔드 서비스 이름 확인..." -ForegroundColor Yellow
$serviceName = ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && grep -A 2 'backend:' docker-compose.prod.yml | head -3"
Write-Host $serviceName

