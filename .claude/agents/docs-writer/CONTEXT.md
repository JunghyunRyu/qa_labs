# Docs Writer Agent Context

> 문서화 전문 에이전트를 위한 축소 컨텍스트

---

## 프로젝트 개요

**QA Labs (QA Arena)**: 뮤테이션 테스트 기반 코딩 테스트 플랫폼
- **도메인**: https://qa-arena.qalabs.kr
- **기술 스택**: FastAPI + Next.js + PostgreSQL + Docker

---

## 문서 구조

```
qa_labs/
├── CLAUDE.md                           # 프로젝트 메인 가이드
├── README.md                           # 프로젝트 소개
├── docs/
│   ├── claude-context/                 # Claude 컨텍스트 문서
│   │   ├── infrastructure.md           # 인프라 정보
│   │   ├── api-reference.md            # API 명세
│   │   └── db-schema.md                # DB 스키마
│   ├── specs/                          # 기능 명세서
│   │   ├── overview.md
│   │   ├── token-policy.md
│   │   ├── ERROR_HANDLING.md
│   │   └── ...
│   └── issues/                         # 이슈/마일스톤
└── reports/                            # 일일 리포트
```

---

## 핵심 문서별 역할

### CLAUDE.md
- **역할**: Claude가 참조하는 프로젝트 메인 가이드
- **내용**: 규칙, 명령어, 빠른 참조
- **업데이트 시점**: 프로젝트 구조/규칙 변경 시

### docs/claude-context/api-reference.md
- **역할**: REST API 엔드포인트 명세
- **내용**: 경로, 메서드, 파라미터, 응답, 에러 코드
- **업데이트 시점**: API 추가/변경 시

### docs/claude-context/db-schema.md
- **역할**: 데이터베이스 테이블 정의
- **내용**: 테이블, 컬럼, 관계, 인덱스
- **업데이트 시점**: 모델/마이그레이션 변경 시

### docs/claude-context/infrastructure.md
- **역할**: 인프라 및 배포 정보
- **내용**: Docker, EC2, 네트워크, 환경 변수
- **업데이트 시점**: 인프라 설정 변경 시

---

## 코드-문서 매핑

| 코드 위치 | 관련 문서 |
|---------|---------|
| `backend/app/api/*.py` | `api-reference.md` |
| `backend/app/models/*.py` | `db-schema.md` |
| `backend/alembic/versions/*.py` | `db-schema.md` |
| `docker-compose*.yml` | `infrastructure.md` |
| `.env.example` | `infrastructure.md`, `README.md` |
| `backend/app/core/config.py` | `infrastructure.md` |

---

## 문서 스타일 가이드

### 마크다운 규칙

1. **제목 계층**
   ```markdown
   # 최상위 (문서 제목)
   ## 주요 섹션
   ### 하위 섹션
   #### 세부 항목
   ```

2. **테이블 포맷**
   ```markdown
   | 컬럼1 | 컬럼2 | 컬럼3 |
   |------|------|------|
   | 값1 | 값2 | 값3 |
   ```

3. **코드 블록**
   ```markdown
   ```python
   # Python 코드
   ```

   ```bash
   # 쉘 명령어
   ```
   ```

4. **강조**
   - `코드/경로`: 백틱 사용
   - **중요**: 볼드
   - *참고*: 이탤릭

### API 문서 템플릿

```markdown
### [METHOD] /api/v1/[resource]

**설명**: [한 줄 설명]

**인증**: Required / Optional / None

**파라미터**:
| 이름 | 위치 | 타입 | 필수 | 설명 |
|------|------|------|------|------|
| id | path | int | O | 리소스 ID |

**요청 본문**:
```json
{
  "field": "value"
}
```

**응답** (200):
```json
{
  "id": 1,
  "status": "success"
}
```

**에러**:
| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 |
| 404 | 리소스 없음 |
```

### DB 스키마 템플릿

```markdown
## [table_name]

**설명**: [테이블 목적]

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| id | INTEGER | NO | - | PK, 자동 증가 |
| created_at | TIMESTAMP | NO | now() | 생성 시간 |

**인덱스**:
- `ix_[table]_[column]`: [용도]

**관계**:
- `[table].fk_column` → `[other_table].id`
```

---

## 자주 사용하는 패턴

### 변경사항 확인
```bash
# 최근 변경 파일
git diff --name-only HEAD~1

# 특정 파일 변경 내용
git diff HEAD~1 -- backend/app/api/

# 최근 커밋 메시지
git log -5 --oneline
```

### 코드에서 정보 추출
```bash
# API 엔드포인트 찾기
grep -r "@router\." backend/app/api/

# 모델 정의 찾기
grep -r "class.*Base" backend/app/models/

# 환경 변수 사용 찾기
grep -r "os.getenv\|settings\." backend/
```

---

## 제한 사항

- 마크다운 문서만 수정 (`*.md`)
- 소스 코드는 읽기 전용
- 추측 금지 (코드 확인 후 문서화)
- 기존 스타일 유지

---

*Docs Writer Agent 전용 컨텍스트 v1.0*
