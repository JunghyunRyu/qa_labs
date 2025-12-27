# QA Labs 개발 가이드

> ⚠ AI / 코드 어시스턴트와 함께 작업할 때는, 항상 `@docs/specs/AI_SAFETY_PROTOCOLS.md`를 먼저 읽고 그 규칙을 준수한다. 특히 Docker, DB, 인프라 관련 변경은 해당 문서의 **절대 금지 사항**을 위반하지 않도록 한다.

---

## MCP 서버 통합

### Serena MCP
프로젝트에는 **Serena MCP**가 통합되어 있으며, 코드베이스 탐색 및 프로젝트 컨텍스트를 제공합니다.

---

## 개발 워크플로우

### 반복적 개발 사이클
- **Task 시작 시**: 사양 문서(docs/specs/을 필수로 확인한다.)
- **Task 완료 시**: 테스트 실행 → 커밋
- **Milestone 완료 시**: 푸시
- **200줄 이상 변경**: 사용자 확인 요청

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
