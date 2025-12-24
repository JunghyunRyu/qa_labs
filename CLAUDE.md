# QA Labs 개발 가이드

> ⚠ AI / 코드 어시스턴트와 함께 작업할 때는, 항상 `@docs/specs/AI_SAFETY_PROTOCOLS.md`를 먼저 읽고 그 규칙을 준수한다. 특히 Docker, DB, 인프라 관련 변경은 해당 문서의 **절대 금지 사항**을 위반하지 않도록 한다.

---

## MCP 서버 통합

### Serena MCP
프로젝트에는 **Serena MCP**가 통합되어 있으며, 코드베이스 탐색 및 프로젝트 컨텍스트를 제공합니다.

**주요 Memories** (상세 정보는 Serena memories 참조):
| Memory | 내용 |
|--------|------|
| `project_overview` | 프로젝트 개요 및 핵심 컨셉 |
| `tech_stack` | 기술 스택 (Python, FastAPI, Next.js 등) |
| `project_structure` | 디렉토리 구조 |
| `development_guidelines` | 개발 가이드라인 및 환경별 특성 |
| `code_style_and_conventions` | 코드 스타일 및 컨벤션 |
| `suggested_commands` | 주요 명령어 모음 |
| `task_completion_workflow` | Task 완료 시 워크플로우 |

**Serena 도구 활용**:
- `find_symbol`: 심볼 검색 (클래스, 함수, 변수)
- `get_symbols_overview`: 파일 내 심볼 개요
- `find_referencing_symbols`: 참조 찾기
- `search_for_pattern`: 패턴 검색
- `read_memory` / `write_memory`: 프로젝트 메모리 관리

---

## 개발 워크플로우

### 반복적 개발 사이클
- **Task 완료 시**: 테스트 실행 → 커밋
- **Milestone 완료 시**: 푸시
- **200줄 이상 변경**: 사용자 확인 요청

### 문서 기반 개발
| 상황 | 참조 문서 |
|------|-----------|
| 세션 시작 | `docs/specs/qa-arena-spec.md` |
| 에러 처리 | `docs/specs/ERROR_HANDLING.md` |
| 배포 작업 | `docs/specs/deployment.md` |
| 운영/인시던트 | `docs/specs/operations.md` |
| Git 규칙 | `docs/specs/git-workflow.md` |

---

## Claude Code 슬래시 명령어

EC2 배포 및 운영은 **슬래시 명령어**를 사용합니다 (AWS SSM 기반):

| 명령어 | 설명 |
|--------|------|
| `/deploy` | EC2 자동 배포 (git pull + docker rebuild) |
| `/logs` | 모든 서비스 로그 확인 |
| `/check-sync` | 로컬-EC2 코드 싱크 상태 확인 |
| `/test-submit` | 대화형 제출 테스트 |
| `/docker-debug` | Docker 컨테이너 문제 진단 |

### 설정 파일
- `.claude/config.json`: 로컬 환경 설정 (gitignore)
- `.claude/config.local.json`: EC2 환경 설정 (gitignore)
- `.claude/config.example.json`: 설정 템플릿 (Git 관리)

---

## 환경 정보

### 개발 환경
- **로컬**: Windows
- **프로덕션**: EC2 (Ubuntu Linux)
- **EC2 접속**: AWS SSM (SSH 미사용)
- **인코딩**: UTF-8 (한글 경로/파일명 주의)

### Docker 환경 특성
- **Docker-in-Docker**: `celery_worker`가 judge 컨테이너 생성
- **공유 볼륨**: `/tmp/qa_arena_judge`
- **Docker Compose**: EC2에서 `docker compose` (v2, 공백)

### 배포 후 확인 (EC2 콘솔)
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f celery_worker
```

---

## 빠른 참조

### Serena Memory 읽기
```
Serena의 read_memory 도구 사용:
- project_overview: 프로젝트 전체 개요
- suggested_commands: 명령어 모음
```

### 자주 사용하는 패턴
```bash
# Backend 테스트
cd backend && pytest

# Frontend 개발 서버
cd frontend && npm run dev

# 로컬 Docker 시작
docker-compose up -d --build
```
