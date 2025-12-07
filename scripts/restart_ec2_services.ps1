# EC2 서비스 재시작 스크립트

$KEY = 'C:\pem\my_proton_key.pem'
$USER = 'ubuntu'
$HOSTNAME = '15.164.221.173'

Write-Host "EC2 서비스 재시작 중..." -ForegroundColor Cyan

# 프론트엔드 재빌드 및 재시작
Write-Host "`n1. 프론트엔드 재빌드 및 재시작..." -ForegroundColor Yellow
ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && docker compose -f docker-compose.prod.yml up -d --build frontend"

# 백엔드 재시작 (필요한 경우)
Write-Host "`n2. 백엔드 재시작..." -ForegroundColor Yellow
ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && docker compose -f docker-compose.prod.yml restart backend"

# 서비스 상태 확인
Write-Host "`n3. 서비스 상태 확인..." -ForegroundColor Yellow
$status = ssh -i $KEY "${USER}@${HOSTNAME}" "cd ~/qa_labs && docker compose -f docker-compose.prod.yml ps"
Write-Host $status

Write-Host "`n완료!" -ForegroundColor Green

