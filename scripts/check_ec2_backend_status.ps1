# EC2 백엔드 상태 확인 스크립트

$KEY = 'C:\pem\my_proton_key.pem'
$USER = 'ubuntu'
$HOSTNAME = '3.38.179.33 '

Write-Host "EC2 백엔드 상태 확인 중..." -ForegroundColor Cyan

# 1. 백엔드 컨테이너 상태 확인
Write-Host "`n1. 백엔드 컨테이너 상태..." -ForegroundColor Yellow
$containerStatus = ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && docker compose -f docker-compose.prod.yml ps backend"
Write-Host $containerStatus

# 2. 백엔드 로그 확인 (최근 50줄)
Write-Host "`n2. 백엔드 로그 (최근 50줄)..." -ForegroundColor Yellow
$backendLogs = ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && docker compose -f docker-compose.prod.yml logs --tail 50 backend"
Write-Host $backendLogs

# 3. 백엔드 헬스체크
Write-Host "`n3. 백엔드 헬스체크..." -ForegroundColor Yellow
$healthCheck = ssh -i $KEY "${USER}@${HOSTNAME}" "curl -s http://localhost:8001/health || echo 'Health check failed'"
Write-Host $healthCheck

# 4. Nginx 로그 확인 (최근 20줄)
Write-Host "`n4. Nginx 에러 로그 (최근 20줄)..." -ForegroundColor Yellow
$nginxLogs = ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && docker compose -f docker-compose.prod.yml logs --tail 20 nginx | Select-String -Pattern 'error|502|upstream' -Context 2"
Write-Host $nginxLogs

