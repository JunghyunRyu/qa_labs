# QA-Arena 데이터베이스 백업 스크립트 (Windows PowerShell)
# 사용법: .\scripts\backup_db.ps1 [backup_directory]

param(
    [string]$BackupDir = ".\backups"
)

# 기본 설정
$ContainerName = "qa_arena_postgres_prod"
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "qa_arena_user" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "qa_arena" }
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "qa_arena_backup_$Timestamp.sql"

# 백업 디렉토리 생성
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "Starting database backup..."
Write-Host "Backup file: $BackupFile"

# Docker 컨테이너가 실행 중인지 확인
$containerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "Error: PostgreSQL container '$ContainerName' is not running." -ForegroundColor Red
    exit 1
}

# 데이터베이스 백업 실행
docker exec $ContainerName pg_dump -U $DbUser $DbName | Out-File -FilePath $BackupFile -Encoding UTF8

# 오래된 백업 파일 삭제 (30일 이상)
Get-ChildItem -Path $BackupDir -Filter "qa_arena_backup_*.sql" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item

Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup file: $BackupFile"
$fileSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "File size: $([math]::Round($fileSize, 2)) MB"

