#!/bin/bash

# QA-Arena 데이터베이스 복구 스크립트
# 사용법: ./scripts/restore_db.sh <backup_file>

set -e

# 백업 파일 확인
if [ -z "$1" ]; then
    echo "Error: Backup file not specified."
    echo "Usage: ./scripts/restore_db.sh <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="qa_arena_postgres_prod"
DB_USER="${POSTGRES_USER:-qa_arena_user}"
DB_NAME="${POSTGRES_DB:-qa_arena}"

# 백업 파일 존재 확인
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found."
    exit 1
fi

# Docker 컨테이너가 실행 중인지 확인
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "Error: PostgreSQL container '${CONTAINER_NAME}' is not running."
    exit 1
fi

# 확인 메시지
echo "Warning: This will restore the database from backup file: ${BACKUP_FILE}"
echo "This will overwrite the current database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "${confirm}" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Starting database restore..."

# 압축 해제 (필요한 경우)
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo "Decompressing backup file..."
    TEMP_FILE=$(mktemp)
    gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
    BACKUP_FILE="${TEMP_FILE}"
fi

# 데이터베이스 복구 실행
cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" "${DB_NAME}"

# 임시 파일 삭제
if [ -n "${TEMP_FILE}" ]; then
    rm -f "${TEMP_FILE}"
fi

echo "Database restore completed successfully!"

