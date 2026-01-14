# 로컬 개발 환경 트러블슈팅 가이드

> **최종 업데이트**: 2026-01-14
> **작성 배경**: 로컬 개발 환경 설정 중 발생한 문제들과 해결 방법 정리

---

## 요약: 체크리스트

로컬 환경 시작 전 확인 사항:

```bash
# 1. Docker Desktop 실행 확인
docker ps

# 2. PostgreSQL/Redis 컨테이너 시작
docker-compose up -d postgres redis

# 3. DB 마이그레이션 (최초 또는 스키마 변경 시)
cd backend && alembic upgrade head

# 4. 문제 데이터 로드 (DB가 비어있을 경우)
PYTHONIOENCODING=utf-8 python scripts/load_generated_problems.py

# 5. 백엔드 시작
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 6. 프론트엔드 시작 (별도 터미널)
cd frontend && npm run dev
```

---

## 문제 1: Docker Desktop 연결 실패

### 증상
```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/...":
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

### 원인
- Docker Desktop 앱이 실행되지 않음
- Docker Desktop이 완전히 초기화되지 않음

### 해결 방법
1. Docker Desktop 앱 실행 (Windows 시작 메뉴에서 검색)
2. 트레이 아이콘이 녹색으로 바뀔 때까지 대기 (약 30초~1분)
3. "Engine running" 상태 확인 후 명령 실행

### 예방 조치
- 개발 시작 전 Docker Desktop 먼저 실행
- `docker ps` 명령으로 연결 상태 확인

---

## 문제 2: Docker Desktop 파이프 오류

### 증상
```
connect ENOENT \\.\pipe\dockerDesktopEngine
```

### 원인
- Docker Desktop 엔진이 제대로 초기화되지 않음
- Docker Desktop 재시작 후 파이프가 생성되지 않음

### 해결 방법
1. Docker Desktop 완전 종료 (트레이 아이콘 우클릭 → Quit Docker Desktop)
2. 10초 대기
3. Docker Desktop 재실행
4. "Engine running" 표시될 때까지 대기

---

## 문제 3: PostgreSQL 인증 실패

### 증상
```
psycopg2.OperationalError: connection to server at "localhost", port 5432 failed:
FATAL: password authentication failed for user "qa_arena"
```

### 원인
1. `.env` 파일에 `DATABASE_URL`이 설정되지 않음
2. Docker 컨테이너의 `POSTGRES_PASSWORD`와 백엔드 설정 불일치
3. PostgreSQL 데이터 볼륨이 다른 비밀번호로 생성됨

### 해결 방법

**방법 A: DATABASE_URL 설정 (권장)**
```bash
# .env 파일에 추가
DATABASE_URL=postgresql://qa_arena:<POSTGRES_PASSWORD>@localhost:5432/qa_arena
```

**방법 B: 볼륨 재생성 (데이터 손실 주의)**
```bash
docker-compose down
docker volume rm qa_labs_postgres_data
docker-compose up -d postgres redis
cd backend && alembic upgrade head
PYTHONIOENCODING=utf-8 python scripts/load_generated_problems.py
```

### 예방 조치
- `.env` 파일에 `DATABASE_URL` 명시적 설정
- `POSTGRES_PASSWORD` 변경 시 `DATABASE_URL`도 함께 수정

---

## 문제 4: PostgreSQL 사용자(Role) 없음

### 증상
```
FATAL: role "qa_arena" does not exist
```

### 원인
- PostgreSQL 데이터 볼륨이 다른 사용자 설정으로 초기 생성됨
- `POSTGRES_USER` 환경변수는 최초 볼륨 생성 시에만 적용됨

### 해결 방법
```bash
# 볼륨 삭제 후 재생성
docker-compose down
docker volume rm qa_labs_postgres_data
docker-compose up -d postgres redis

# DB 초기화
cd backend && alembic upgrade head
```

### 중요 사항
- PostgreSQL 환경변수(`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)는 **최초 볼륨 생성 시에만** 적용됨
- 기존 볼륨이 있으면 환경변수를 변경해도 반영되지 않음

---

## 문제 5: CORS 오류로 표시되는 500 에러

### 증상
```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

### 원인
- 실제로는 백엔드에서 500 Internal Server Error 발생
- 에러 응답에 CORS 헤더가 포함되지 않아 브라우저에서 CORS 오류로 표시

### 진단 방법
```bash
# curl로 직접 API 호출하여 실제 에러 확인
curl -s http://localhost:8000/api/v1/problems
```

### 해결 방법
1. 백엔드 터미널에서 실제 에러 로그 확인
2. 대부분 DB 연결 문제 → PostgreSQL 상태 확인
3. DB 연결 정상화 후 브라우저 새로고침

---

## 문제 6: 포트 충돌

### 증상
```
Error: listen EADDRINUSE: address already in use :::3000
```

### 원인
- 이전 프로세스가 정상 종료되지 않음
- 다른 애플리케이션이 동일 포트 사용

### 해결 방법

**Windows:**
```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr ":3000"
netstat -ano | findstr ":8000"

# 프로세스 종료 (PID 확인 후)
Stop-Process -Id <PID> -Force
```

**또는 PowerShell 원라이너:**
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## 문제 7: Python 유니코드 인코딩 오류

### 증상
```
UnicodeEncodeError: 'cp949' codec can't encode character '\U0001f4c1' in position 0
```

### 원인
- Windows 기본 인코딩(cp949)이 이모지 등 유니코드 문자 지원 안 함
- Python 스크립트에서 이모지 출력 시 발생

### 해결 방법
```bash
# 환경변수로 UTF-8 강제 지정
PYTHONIOENCODING=utf-8 python scripts/load_generated_problems.py
```

### 예방 조치
- 스크립트에서 이모지 사용 시 환경변수 설정 안내 추가
- 또는 스크립트에서 이모지 대신 ASCII 문자 사용

---

## 문제 8: 빈 문제 목록

### 증상
- `/problems` 페이지에서 "문제가 없습니다" 표시
- API 응답: `{"problems": [], "total": 0}`

### 원인
- 새로 생성된 DB에 시드 데이터가 없음
- 문제 데이터 로드 스크립트 미실행

### 해결 방법
```bash
cd backend
PYTHONIOENCODING=utf-8 python scripts/load_generated_problems.py
```

### 참고
- 문제 JSON 파일 위치: `backend/generated_problems/`
- 로드 스크립트: `backend/scripts/load_generated_problems.py`

---

## 빠른 복구 스크립트

모든 문제 한 번에 해결하는 스크립트:

```bash
#!/bin/bash
# reset-local-env.sh

echo "=== 로컬 환경 초기화 ==="

# 1. Docker 컨테이너 정리
docker-compose down

# 2. PostgreSQL 볼륨 삭제 (데이터 손실!)
echo "PostgreSQL 볼륨 삭제 중..."
docker volume rm qa_labs_postgres_data 2>/dev/null || true

# 3. 서비스 시작
echo "서비스 시작 중..."
docker-compose up -d postgres redis

# 4. DB 초기화 대기
echo "PostgreSQL 초기화 대기 (10초)..."
sleep 10

# 5. 마이그레이션
echo "DB 마이그레이션 실행..."
cd backend && alembic upgrade head

# 6. 문제 데이터 로드
echo "문제 데이터 로드..."
PYTHONIOENCODING=utf-8 python scripts/load_generated_problems.py

echo "=== 완료! ==="
echo "백엔드: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "프론트엔드: cd frontend && npm run dev"
```

---

## 관련 파일 경로

| 파일 | 경로 | 설명 |
|------|------|------|
| 환경변수 | `.env` | DB 연결 정보, API 키 등 |
| Docker 설정 | `docker-compose.yml` | 로컬 개발용 컨테이너 |
| DB 마이그레이션 | `backend/alembic/` | 스키마 변경 이력 |
| 문제 데이터 | `backend/generated_problems/` | JSON 형식 문제 파일 |
| 로드 스크립트 | `backend/scripts/load_generated_problems.py` | 문제 DB 로드 |

---

## 문의

추가 문제 발생 시:
1. 백엔드 로그 확인
2. Docker 컨테이너 로그 확인: `docker logs qa_arena_postgres`
3. 이 문서에 새로운 케이스 추가
