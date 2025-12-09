# 개발 가이드라인 및 특별 규칙

## 환경별 특성

### 로컬 개발 환경 (Windows)
- **OS**: Windows 10/11
- **Docker Compose**: `docker-compose` 또는 `docker compose`
- **Python**: 가상환경 사용 (venv)
- **Shell**: PowerShell 또는 Git Bash
- **인코딩**: UTF-8 필수, 한글 경로/파일명 주의

### 프로덕션 환경 (EC2)
- **OS**: Ubuntu 22.04 LTS
- **Docker Compose**: `docker compose` (v2, 공백 사용)
- **Instance**: t3.medium 이상 권장
- **보안 그룹**: SSH(22), HTTP(80), HTTPS(443)

## Docker 환경 특성

### Docker-in-Docker 설정
- `celery_worker` 컨테이너 내부에서 judge 컨테이너 생성
- `/var/run/docker.sock` 마운트 (Linux)
- `group_add` 설정으로 Docker 소켓 권한 부여

### 볼륨 마운트 원칙
컨테이너에서 생성한 파일을 다른 컨테이너가 접근해야 하는 경우:
- **반드시 호스트 공유 볼륨 사용**: `/tmp/qa_arena_judge`
- 경로는 호스트, celery_worker, judge 컨테이너 **모두 동일**해야 함
- 예: celery_worker가 생성 → judge가 마운트하여 읽기

### 트러블슈팅: 볼륨 마운트 문제
**증상**: `ERROR: file or directory not found: test_user.py`

**원인**: Docker-in-Docker 환경에서 볼륨 경로 불일치

**해결**:
1. 호스트에 공유 디렉토리 생성: `/tmp/qa_arena_judge`
2. `docker-compose.yml`에 볼륨 추가
3. 코드에서 임시 파일 생성 시 공유 경로 사용

## 인코딩 규칙

### UTF-8 인코딩 필수
- 모든 파일 저장 시 UTF-8 인코딩 사용
- Python 3.11+는 기본 UTF-8이므로 명시적 선언 불필요
- Windows 환경에서 한글 경로/파일명 사용 시 주의

### Windows 한글 이슈 방지
- 파일 경로에 한글 사용 지양
- Git Bash 사용 시 경로 인코딩 확인
- PowerShell에서 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` 설정

## 대규모 변경사항 처리

### 200줄 이상 변경 시
- 'Use Allowlist' 설정 활성화 상태여도 **사용자의 명시적 확인 요청**
- 변경 범위와 영향도를 먼저 설명
- 단계별 진행 제안

## 문서 기반 개발

### 필수 참조 문서
- **세션 시작**: `docs/specs/qa-arena-spec.md` - 전체 흐름 파악
- **개발 시작 전**: `docs/todo_actions/qa-arena-technical-todos.md`
- **작업 순서**: `technical-todos-v*.md`에서 `[x]` 미체크 항목부터
- **에러 처리**: `docs/specs/ERROR_HANDLING.md` - 일관된 에러 처리
- **배포 작업**: `docs/specs/deployment.md`
- **운영/인시던트**: `docs/specs/operations.md`
- **Git 규칙**: `docs/specs/git-workflow.md`

### EC2 없이 작업 가능한 항목
- `docs/todo_actions/WORK_WITHOUT_EC2.md` 참조
- EC2 환경 미준비 시에도 진행 가능한 작업 우선 처리

## Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션 배포용
- `develop`: 개발 통합
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정
- `milestone/*`: Milestone별 개발

### 트러블슈팅: Git 싱크 충돌
**증상**: `error: Your local changes would be overwritten by merge`

**원인**: 서버에서 파일 직접 수정

**해결**:
```bash
git stash           # 변경사항 임시 저장
git pull origin main # 최신 코드 가져오기
git stash pop       # 변경사항 복원 (필요 시)
```

## 테스트 작성 규칙

### Backend (pytest)
- 모든 API 엔드포인트에 대한 테스트 작성
- 서비스 레이어 단위 테스트 작성
- **테스트 커버리지 80% 이상 유지**
- `pytest-asyncio` 사용 (비동기 테스트)

### Frontend (Jest)
- 컴포넌트 테스트 작성
- React Testing Library 사용
- E2E 테스트 (추후 추가 예정)

## 코드 리뷰

- 모든 PR은 **최소 1명 이상의 리뷰어 승인 필요**
- 리뷰 항목: 코드 스타일, 로직, 테스트 커버리지
- 리뷰 코멘트에 적극적으로 소통

## Milestone 기반 개발

1. **개발**: 기능 구현
2. **테스트**: 테스트 작성 및 실행
3. **검증**: 모든 테스트 통과 확인
4. **머지**: 브랜치 머지

상세 내용은 `docs/qa-arena-milestones.md` 참고

## 보안 고려사항

### Judge 컨테이너
- 샌드박스 환경에서 사용자 코드 실행
- `conftest.py`로 보안 제한 설정
- 네트워크 격리, 리소스 제한

### 환경 변수
- `.env` 파일은 **절대 Git에 커밋 금지**
- `.env.example`만 Git 관리
- 민감 정보 (API 키, DB 비밀번호) 보호

## 성능 최적화

### Backend
- 비동기 처리 활용 (FastAPI, Celery)
- 데이터베이스 쿼리 최적화
- Redis 캐싱 활용

### Frontend
- Next.js Server Components 활용
- 이미지 최적화
- Code Splitting

## API 설계 원칙

### RESTful API
- 일관된 엔드포인트 네이밍
- 적절한 HTTP 메서드 사용 (GET, POST, PUT, DELETE)
- 상태 코드 명확히 반환

### 에러 핸들링
- `docs/specs/ERROR_HANDLING.md` 참조
- 일관된 에러 응답 형식
- 로깅 및 모니터링
