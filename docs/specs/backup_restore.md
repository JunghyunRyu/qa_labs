# QA Arena Backup & Restore Guide

## Purpose
PostgreSQL 데이터베이스의 백업 및 복구 절차를 정의합니다.

> Last Updated: 2026-01-14

---

## 1. 환경별 컨테이너 정보

| 환경 | 컨테이너 이름 | DB 이름 | DB 유저 |
|------|--------------|---------|---------|
| **로컬 개발** | `qa_arena_postgres` | `qa_arena` | `qa_arena` |
| **프로덕션 (EC2)** | `qa_arena_postgres_prod` | `qa_arena` | `qa_arena` |

---

## 2. 프로덕션 환경 백업/복구 (권장)

> 프로덕션 환경에서는 제공된 스크립트를 사용하세요.

### 2.1 백업 스크립트 사용

```bash
cd ~/qa_labs

# 기본 경로(./backups)에 백업
./scripts/backup_db.sh

# 또는 지정 경로에 백업
./scripts/backup_db.sh /backup/postgres
```

**스크립트 동작:**
- 컨테이너: `qa_arena_postgres_prod`
- 포맷: SQL 텍스트 (gzip 압축)
- 파일명: `qa_arena_backup_YYYYMMDD_HHMMSS.sql.gz`
- 30일 이상 오래된 백업 자동 삭제

**백업 확인:**
```bash
ls -lh ./backups/
# 또는
ls -lh /backup/postgres/
```

### 2.2 복구 스크립트 사용

```bash
cd ~/qa_labs

# 복구 실행 (확인 프롬프트 있음)
./scripts/restore_db.sh ./backups/qa_arena_backup_20251218_120000.sql.gz
```

**스크립트 동작:**
- 압축 파일(.gz) 자동 해제
- 복구 전 사용자 확인 필수 (`yes` 입력)
- `psql`로 SQL 실행하여 복구

---

## 3. 수동 백업/복구 (로컬 개발 환경)

로컬 개발 환경에서 직접 명령어를 사용하는 경우:

### 3.1 백업 생성

```bash
# 로컬 환경
docker exec -t qa_arena_postgres \
  pg_dump -U qa_arena qa_arena > backup_$(date +%Y%m%d_%H%M%S).sql

# 압축 (선택)
gzip backup_*.sql
```

### 3.2 백업 파일 복사 (Docker → Host)

```bash
# 컨테이너 내부에서 백업한 경우
docker cp qa_arena_postgres:/path/to/backup.sql ./backup.sql
```

### 3.3 복구

```bash
# 로컬 환경
cat backup_20251218_120000.sql | docker exec -i qa_arena_postgres \
  psql -U qa_arena qa_arena

# 압축 파일인 경우
gunzip -c backup_20251218_120000.sql.gz | docker exec -i qa_arena_postgres \
  psql -U qa_arena qa_arena
```

---

## 4. 프로덕션 수동 백업/복구

스크립트 없이 직접 명령어를 사용해야 하는 경우:

### 4.1 백업

```bash
# 프로덕션 환경 (EC2)
docker exec -t qa_arena_postgres_prod \
  pg_dump -U qa_arena qa_arena > /backup/postgres/qa_arena_$(date +%Y%m%d_%H%M%S).sql
```

### 4.2 복구

```bash
# 프로덕션 환경 (EC2)
cat /backup/postgres/qa_arena_20251218_120000.sql | \
  docker exec -i qa_arena_postgres_prod psql -U qa_arena qa_arena
```

---

## 5. 백업 검증

### 5.1 백업 파일 내용 확인

```bash
# SQL 파일 앞부분 확인
head -50 backup_20251218_120000.sql

# 압축 파일인 경우
zcat backup_20251218_120000.sql.gz | head -50
```

### 5.2 테이블 목록 확인

```bash
grep "CREATE TABLE" backup_20251218_120000.sql
```

---

## 6. 주의사항

### 6.1 백업 전 확인사항
- 컨테이너가 실행 중인지 확인: `docker ps | grep postgres`
- 충분한 디스크 공간 확인: `df -h`

### 6.2 복구 전 확인사항
- **복구는 기존 데이터를 덮어씁니다** - 신중하게 실행
- 프로덕션 복구 전 반드시 현재 상태 백업
- 서비스 중단 고려 (복구 중 데이터 정합성 문제 가능)

### 6.3 백업 시점 (수동)
- **중요 배포 전**: 수동 백업 필수
- **DB 스키마 변경 전**: 수동 백업 필수

```bash
# 배포/스키마 변경 전 백업
cd ~/qa_labs
./scripts/backup_db.sh
```

---

## 7. 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-12 | 초기 문서 생성 | AI Copilot |
| 2025-12-18 | 환경별 구분 추가, 실제 스크립트와 동기화 | AI Copilot |
| 2025-12-28 | 자동 백업(cron) 제거, 수동 백업으로 단순화 | AI Copilot |
