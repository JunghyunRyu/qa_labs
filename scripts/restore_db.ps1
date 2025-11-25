# QA-Arena 데이터베이스 복구 스크립트 (Windows PowerShell)
# 사용법: .\scripts\restore_db.ps1 <backup_file>

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# 기본 설정
$ContainerName = "qa_arena_postgres_prod"
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "qa_arena_user" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "qa_arena" }

# 백업 파일 존재 확인
if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file '$BackupFile' not found." -ForegroundColor Red
    exit 1
}

# Docker 컨테이너가 실행 중인지 확인
$containerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "Error: PostgreSQL container '$ContainerName' is not running." -ForegroundColor Red
    exit 1
}

# 확인 메시지
Write-Host "Warning: This will restore the database from backup file: $BackupFile" -ForegroundColor Yellow
Write-Host "This will overwrite the current database!" -ForegroundColor Yellow
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Restore cancelled."
    exit 0
}

Write-Host "Starting database restore..."

# 데이터베이스 복구 실행
Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser $DbName

Write-Host "Database restore completed successfully!" -ForegroundColor Green

