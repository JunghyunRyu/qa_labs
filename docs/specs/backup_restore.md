# QA-Arena Backup & Restore Guide

## 📌 Purpose
Backup and restore procedures for PostgreSQL.

---

# 1. Backup

```bash
docker exec -t qa_arena_postgres   pg_dump -U postgres -F c qa_arena   -f /backup/backup_$(date +%Y%m%d).dump
```

---

# 2. Copy Backup File

```bash
docker cp qa_arena_postgres:/backup/backup_20250101.dump .
```

---

# 3. Restore

```bash
docker exec -i qa_arena_postgres   pg_restore -U postgres -d qa_arena --clean --no-owner < backup_20250101.dump
```

---

# 4. Notes
- Ensure /backup directory exists
- Recommended weekly backup
- Consider automating via cron + S3
