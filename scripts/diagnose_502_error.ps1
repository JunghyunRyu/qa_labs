# 502 에러 진단 스크립트

$KEY = 'C:\pem\my_proton_key.pem'
$USER = 'ubuntu'
$HOSTNAME = '3.38.179.33 '

Write-Host "502 에러 진단 중..." -ForegroundColor Cyan

# 1. Nginx 에러 로그 전체 확인
Write-Host "`n1. Nginx 에러 로그 전체..." -ForegroundColor Yellow
$nginxErrors = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_nginx_prod cat /var/log/nginx/error.log | tail -n 50"
Write-Host $nginxErrors

# 2. Nginx 액세스 로그에서 502 확인
Write-Host "`n2. Nginx 액세스 로그에서 502 에러..." -ForegroundColor Yellow
$nginxAccess = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_nginx_prod grep '502' /var/log/nginx/access.log | tail -n 10"
Write-Host $nginxAccess

# 3. 백엔드에서 직접 API 테스트
Write-Host "`n3. 백엔드에서 직접 API 테스트..." -ForegroundColor Yellow
$apiTest = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_backend_prod curl -s http://localhost:8000/api/v1/problems?page=1&page_size=10 | head -c 200"
Write-Host $apiTest

# 4. Nginx 설정 테스트
Write-Host "`n4. Nginx 설정 테스트..." -ForegroundColor Yellow
$nginxTest = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_nginx_prod nginx -t"
Write-Host $nginxTest

# 5. Nginx 재시작 (설정 재로드)
Write-Host "`n5. Nginx 설정 재로드..." -ForegroundColor Yellow
$nginxReload = ssh -i $KEY "${USER}@${HOSTNAME}" "docker exec qa_arena_nginx_prod nginx -s reload"
Write-Host "Nginx 재로드 완료"

# 6. 실제 요청 테스트
Write-Host "`n6. 실제 API 요청 테스트..." -ForegroundColor Yellow
$curlTest = ssh -i $KEY "${USER}@${HOSTNAME}" "curl -v http://localhost/api/v1/problems?page=1&page_size=10 2>&1 | head -n 30"
Write-Host $curlTest

