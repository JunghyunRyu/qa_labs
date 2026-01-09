# Database Admin Agent Context

> 데이터베이스 전문 에이전트를 위한 축소 컨텍스트

---

## 데이터베이스 개요

**PostgreSQL 15** (Alpine 기반 Docker)

| 항목 | 값 |
|------|---|
| 호스트 | postgres (Docker 내부) |
| 포트 | 5432 |
| 데이터베이스 | qa_labs |
| ORM | SQLAlchemy 2.0 (async) |
| 마이그레이션 | Alembic |

---

## 테이블 구조 요약

### 핵심 테이블

```
users                 # 사용자 정보
├── problems          # 문제 정의
│   └── buggy_implementations  # 버기 코드
├── submissions       # 제출 내역
│   └── feedbacks     # AI 피드백
├── token_transactions  # 토큰 사용 내역
├── ai_conversations  # AI 대화 세션
│   └── ai_messages   # 대화 메시지
├── bookmarked_problems  # 북마크
└── hint_views        # 힌트 조회 기록
```

### 테이블별 컬럼 요약

**users**
- id, email, username, provider, avatar_url
- tokens, created_at, updated_at, is_admin

**problems**
- id, title, description, difficulty, category
- signature, golden_code, test_template
- time_limit_seconds, created_at, is_active

**submissions**
- id, user_id (FK), problem_id (FK)
- code, status, score, killed_mutants, total_mutants
- execution_time_ms, error_message
- created_at, is_guest

**feedbacks**
- id, submission_id (FK), content, feedback_type
- created_at

---

## 인덱스 현황

### 기본 인덱스
- `users_pkey`: id
- `ix_users_email`: email (UNIQUE)
- `problems_pkey`: id
- `submissions_pkey`: id
- `ix_submissions_user_id`: user_id
- `ix_submissions_problem_id`: problem_id
- `ix_submissions_created_at`: created_at

### 복합 인덱스
- `ix_submissions_user_problem`: (user_id, problem_id)

---

## Alembic 마이그레이션

### 디렉토리 구조
```
backend/
├── alembic.ini           # Alembic 설정
└── alembic/
    ├── env.py            # 환경 설정
    ├── script.py.mako    # 템플릿
    └── versions/         # 마이그레이션 파일
        ├── 001_initial.py
        ├── 002_add_tokens.py
        └── ...
```

### 자주 사용하는 명령

```bash
# 현재 버전 확인
alembic current

# 히스토리 보기
alembic history

# 자동 마이그레이션 생성
alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
alembic upgrade head

# 한 단계 롤백
alembic downgrade -1

# 특정 버전으로
alembic upgrade [revision_id]
```

### 마이그레이션 파일 템플릿

```python
"""[설명]

Revision ID: xxxx
Revises: yyyy
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa

revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None

def upgrade():
    # 업그레이드 로직
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(), nullable=True))

def downgrade():
    # 다운그레이드 로직 (롤백용)
    op.drop_column('users', 'last_login_at')
```

---

## SQLAlchemy 모델 패턴

### 기본 모델 구조
```python
# backend/app/models/base.py
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, DateTime
from datetime import datetime

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

### 관계 정의
```python
# One-to-Many
class User(Base):
    submissions = relationship("Submission", back_populates="user")

class Submission(Base):
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="submissions")
```

---

## 주요 쿼리 패턴

### 제출 통계 조회
```sql
SELECT
    p.title,
    COUNT(s.id) as submission_count,
    AVG(s.score) as avg_score,
    COUNT(CASE WHEN s.score = 100 THEN 1 END) as perfect_count
FROM problems p
LEFT JOIN submissions s ON p.id = s.problem_id
GROUP BY p.id, p.title
ORDER BY submission_count DESC;
```

### 사용자별 진행률
```sql
SELECT
    u.username,
    COUNT(DISTINCT s.problem_id) as solved_problems,
    SUM(CASE WHEN s.score = 100 THEN 1 ELSE 0 END) as perfect_scores
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
GROUP BY u.id, u.username;
```

### 느린 쿼리 후보
```sql
-- N+1 문제 가능성
SELECT * FROM submissions WHERE user_id IN (
    SELECT id FROM users WHERE created_at > '2026-01-01'
);

-- 개선안
SELECT s.*
FROM submissions s
JOIN users u ON s.user_id = u.id
WHERE u.created_at > '2026-01-01';
```

---

## 성능 모니터링 쿼리

### 테이블 크기
```sql
SELECT
    relname as table,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as table_size,
    pg_size_pretty(pg_indexes_size(relid)) as index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 인덱스 사용률
```sql
SELECT
    schemaname,
    relname as table,
    indexrelname as index,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Dead Tuples (VACUUM 필요 여부)
```sql
SELECT
    relname,
    n_live_tup,
    n_dead_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC;
```

---

## 제한 사항

- SELECT 쿼리만 직접 실행
- DDL/DML은 마이그레이션 또는 제안만
- 프로덕션 직접 수정 금지
- 백업 없이 스키마 변경 금지

---

*Database Admin Agent 전용 컨텍스트 v1.0*
