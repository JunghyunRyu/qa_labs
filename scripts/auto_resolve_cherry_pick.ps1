# Cherry-pick 충돌 자동 해결 스크립트 (PowerShell)
# EC2 서버에서 실행: pwsh scripts/auto_resolve_cherry_pick.ps1

Write-Host "Cherry-pick 충돌 자동 해결 시작..." -ForegroundColor Green

# 충돌 파일 목록
$conflictFiles = @(
    "frontend/lib/api/__tests__/problems.test.ts",
    "frontend/lib/api/admin.ts",
    "frontend/lib/api/problems.ts",
    "frontend/lib/api/submissions.ts",
    "frontend/next.config.ts"
)

$resolved = $false

foreach ($file in $conflictFiles) {
    if (Test-Path $file) {
        Write-Host "`n처리 중: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # 충돌 마커 확인
        if ($content -match '<<<<<<< HEAD') {
            Write-Host "  충돌 발견!" -ForegroundColor Red
            
            # Import 경로를 @/lib/api로 통일
            if ($file -match 'problems\.test\.ts') {
                # problems.test.ts의 경우 상대 경로를 절대 경로로 변경
                $content = $content -replace "from '../../api'", "from '@/lib/api'"
                $content = $content -replace "from '\.\./\.\./api'", "from '@/lib/api'"
            }
            
            # 충돌 마커 제거 (incoming 변경사항 채택)
            # HEAD 섹션 제거
            $content = $content -replace '(?s)<<<<<<< HEAD.*?=======\r?\n', ''
            # 마커 제거
            $content = $content -replace '>>>>>>> .*?\r?\n', ''
            
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  충돌 해결 완료" -ForegroundColor Green
            $resolved = $true
        } else {
            Write-Host "  충돌 없음" -ForegroundColor Gray
        }
    } else {
        Write-Host "  파일 없음: $file" -ForegroundColor Red
    }
}

if ($resolved) {
    Write-Host "`n충돌 해결 완료! 다음 명령어를 실행하세요:" -ForegroundColor Green
    Write-Host "  git add frontend/lib/api/__tests__/problems.test.ts" -ForegroundColor Cyan
    Write-Host "  git add frontend/lib/api/admin.ts" -ForegroundColor Cyan
    Write-Host "  git add frontend/lib/api/problems.ts" -ForegroundColor Cyan
    Write-Host "  git add frontend/lib/api/submissions.ts" -ForegroundColor Cyan
    Write-Host "  git add frontend/next.config.ts" -ForegroundColor Cyan
    Write-Host "  git cherry-pick --continue" -ForegroundColor Cyan
} else {
    Write-Host "`n충돌이 발견되지 않았습니다." -ForegroundColor Yellow
    Write-Host "수동으로 확인이 필요할 수 있습니다." -ForegroundColor Yellow
}
