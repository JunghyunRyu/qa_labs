#!/bin/bash

# QA-Arena 데이터베이스 백업 스크립트
# 사용법: ./scripts/backup_db.sh [backup_directory]

set -e

# 기본 설정
BACKUP_DIR="${1:-./backups}"
CONTAINER_NAME="qa_arena_postgres_prod"
DB_USER="${POSTGRES_USER:-qa_arena_user}"
DB_NAME="${POSTGRES_DB:-qa_arena}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/qa_arena_backup_${TIMESTAMP}.sql"

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup..."
echo "Backup file: ${BACKUP_FILE}"

# Docker 컨테이너가 실행 중인지 확인
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "Error: PostgreSQL container '${CONTAINER_NAME}' is not running."
    exit 1
fi

# 데이터베이스 백업 실행
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_FILE}"

# 백업 파일 압축 (선택사항)
if command -v gzip &> /dev/null; then
    echo "Compressing backup file..."
    gzip "${BACKUP_FILE}"
    BACKUP_FILE="${BACKUP_FILE}.gz"
fi

# 오래된 백업 파일 삭제 (30일 이상)
if [ -d "${BACKUP_DIR}" ]; then
    find "${BACKUP_DIR}" -name "qa_arena_backup_*.sql*" -mtime +30 -delete
fi

echo "Backup completed successfully!"
echo "Backup file: ${BACKUP_FILE}"
echo "File size: $(du -h "${BACKUP_FILE}" | cut -f1)"

