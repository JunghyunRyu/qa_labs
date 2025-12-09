---
description: QA Labs 프로젝트의 개발 워크플로우, 브랜치 전략, 환경 설정에 대한 핵심 규칙
alwaysApply: true
---

# 개발 워크플로우

## 1. 반복적 개발 및 테스트 사이클
짧은 개발과 테스트를 반복하여 목표를 달성하는 방식으로 개발을 진행한다.

- **Task 완료 시**: 의미 있는 결과를 도출하는 테스트를 반드시 진행한다.
- **Task 완료 시**: 변경사항을 커밋한다.
- **Milestone 완료 시**: 변경사항을 푸시한다.

## 2. 문서 기반 개발
개발 전반에 걸쳐 프로젝트 문서를 참조하여 일관성을 유지한다.

- **세션 시작 시**: `@docs/specs/qa-arena-spec.md` 문서를 확인하여 개발 사양의 전체 흐름을 파악한다.
- **개발 시작 전**: `@docs/todo_actions/qa-arena-technical-todos.md` 파일을 반드시 먼저 확인한다.
- **작업 순서**: `@docs/todo_actions/technical-todos-v*.md` 파일에서 `[x]`로 체크되지 않은 항목부터 시작한다.
- **에러 처리 시**: `@docs/specs/ERROR_HANDLING.md` 문서를 참조하여 일관된 에러 처리 방식을 적용한다.
- **배포 작업 시**: `@docs/specs/deployment.md` 문서의 절차를 따른다.
- **운영/인시던트 대응 시**: `@docs/specs/operations.md` 문서를 참조한다.

## 3. 대규모 변경사항 처리
- 200줄 이상의 코드 변경이 필요한 경우, 'Use Allowlist' 설정이 활성화되어 있어도 사용자의 명시적 확인을 요청한다.

# 브랜치 및 Git 규칙

## 브랜치 전략
`@docs/specs/git-workflow.md` 파일의 규칙을 준수한다.

- 브랜치 생성, 병합, 배포 전략은 해당 문서의 지침을 따른다.
- 커밋 메시지 작성 규칙을 준수한다.

# 환경 및 인코딩

## 개발 환경
- **로컬 개발 환경**: Windows
- **프로덕션 배포 환경**: EC2 (Linux)
- **EC2 없이 작업 가능한 항목**: `@docs/todo_actions/WORK_WITHOUT_EC2.md` 문서를 참조하여 EC2 환경이 준비되지 않은 경우에도 진행 가능한 작업을 우선 처리한다.

## 인코딩 처리
- 한글 인코딩 이슈를 방지하기 위해 항상 주의한다.
- 파일 저장 시 UTF-8 인코딩을 사용한다.
- Windows 환경에서 한글 경로나 파일명 사용 시 인코딩 문제가 발생하지 않도록 주의한다.

## 배포 및 운영
- 배포는 `@docs/specs/deployment.md` 문서의 절차를 따른다.
- 운영 중 인시던트 발생 시 `@docs/specs/operations.md` 문서의 워크플로우를 따른다.

# Docker 환경 특성

## Docker-in-Docker 설정
- `celery_worker`는 Docker 컨테이너 내부에서 실행되며, judge 컨테이너를 생성합니다.
- 임시 파일은 호스트와 공유되는 경로 사용: `/tmp/qa_arena_judge`
- `group_add` 설정으로 Docker 소켓 권한을 부여합니다.

## 볼륨 마운트 원칙
컨테이너에서 생성한 파일을 다른 컨테이너가 접근해야 하는 경우:
- 반드시 **호스트 공유 볼륨** 사용
- 경로는 호스트, celery_worker, judge 컨테이너 **모두 동일**해야 함
- 예: `/tmp/qa_arena_judge` → celery_worker가 생성 → judge가 마운트하여 읽기

# 명령어 규칙

## EC2 환경
- Docker Compose 명령어: `docker compose` (공백 사용, v2)
- 예: `docker compose -f docker-compose.prod.yml up -d --build celery_worker`

## 로컬 Windows 환경
- Docker Compose 명령어: `docker-compose` 또는 `docker compose`
- 환경에 따라 다를 수 있음

# 자주 사용하는 명령어 패턴

## 제출 테스트
```bash
# 1. 테스트 코드 파일로 저장
cat > /tmp/test_code.py << 'EOF'
[테스트 코드]
EOF

# 2. JSON 파일 생성
cat > /tmp/submission.json << 'EOF'
{
  "problem_id": 1,
  "code": "[이스케이프된 코드]"
}
EOF

# 3. 제출
curl -X POST http://localhost:8001/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d @/tmp/submission.json
```

## 배포 후 확인
```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 로그 확인 (실시간)
docker compose -f docker-compose.prod.yml logs -f celery_worker

# 로그 확인 (최근 N줄)
docker compose -f docker-compose.prod.yml logs celery_worker | tail -100
```

# 트러블슈팅 가이드

## Docker 볼륨 마운트 문제
**증상**: `ERROR: file or directory not found: test_user.py`

**원인**: Docker-in-Docker 환경에서 볼륨 경로 불일치

**해결**:
1. 호스트에 공유 디렉토리 생성: `/tmp/qa_arena_judge`
2. `docker-compose.yml`에 볼륨 추가
3. 코드에서 임시 파일 생성 시 공유 경로 사용

## Git 싱크 충돌
**증상**: `error: Your local changes would be overwritten by merge`

**원인**: 서버에서 파일 직접 수정

**해결**:
```bash
git stash  # 변경사항 임시 저장
git pull origin main  # 최신 코드 가져오기
```

# Claude Code 통합

## Slash Commands
프로젝트에는 다음과 같은 slash commands가 정의되어 있습니다:

- `/deploy`: EC2에 자동 배포 (git pull + docker rebuild)
- `/logs`: 모든 서비스 로그를 한 번에 확인
- `/test-submit`: 대화형 제출 테스트
- `/check-sync`: 로컬과 EC2 코드 싱크 상태 확인

## 설정 파일
- `.claude/config.json`: 로컬 환경 설정 (gitignore)
- `.claude/config.local.json`: EC2 환경 설정 (gitignore)
- `.claude/config.example.json`: 설정 템플릿 (Git으로 관리)
