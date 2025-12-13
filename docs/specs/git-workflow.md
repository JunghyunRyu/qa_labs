# QA Labs – Git Workflow Guide

이 문서는 `qa_labs` 프로젝트를 안정적으로 개발·배포하기 위해 사용하는 **표준 Git 운영 가이드**입니다.

> 📅 Last Updated: 2025-12

---

## 1. 브랜치 전략

### 🟢 `main` (프로덕션 브랜치)
- 배포 가능한 안정 버전
- 직접 수정 금지
- PR 또는 merge로만 변경
- 프로덕션 EC2는 항상 main을 사용

### 🟡 Feature/Fix 브랜치
- 새로운 기능/버그는 항상 별도 브랜치에서 작업
- 예:  
  - `feature/add-admin-dashboard`  
  - `fix/frontend-api-url`

### 🔵 Local/Server-only 파일
Git이 추적하면 안 되는 파일들은 `.gitignore`로 관리  
예:  
```
.env
nginx/conf.d/qa_arena.conf.local
scripts/*.ps1
```

---

## 2. 새 작업 시작 루틴

```bash
cd ~/qa_labs
git switch main
git fetch origin
git pull origin main
git switch -c feature/my-new-feature
```

---

## 3. 작업 중 커밋 & 백업

```bash
git status
git add <파일>
git commit -m "메시지"
git push -u origin feature/my-new-feature
```

---

## 4. main에 반영하기

### 방법 1: GitHub PR (추천)
1. 브랜치를 push  
2. GitHub에서 PR 생성  
3. Merge  
4. 로컬 및 서버 main 최신화:

```bash
git switch main
git pull origin main
```

### 방법 2: CLI merge
```bash
git switch main
git pull origin main
git merge feature/my-new-feature
git push origin main
```

---

## 5. 프로덕션 EC2 배포 루틴

```bash
ssh -i C:\pem\my_proton_key.pem ubuntu@3.38.179.33
cd ~/qa_labs
git fetch origin
git switch main
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

---

## 6. 서버 수정 금지 원칙

❌ 서버에서 Git-tracked 파일 수정 금지  
✔ 필요하면 `.local` 파일 생성  
✔ 또는 feature 브랜치로 수정 후 main에 병합

---

## 7. 충돌 방지 핵심 8가지

1. 작업 전 main 최신화
2. main 직접 작업 금지
3. 서버에서 tracked 파일 수정 금지
4. 환경 파일은 `.gitignore`
5. 브랜치 단위로 작은 작업
6. PR merge 후 main 최신화 필수
7. push되지 않은 변경은 서버에서 pull하지 않기
8. 서버/로컬 설정 파일은 `.local`로 관리

---

## 8. 문제 발생 시 체크리스트

### pull 충돌 시
- `git status` 확인
- 브랜치 상태 확인
- 충돌 파일 백업 후 main reset

### 서버 파일 덮어쓰기
- `.local` 사용 여부 확인

---

## 9. 요약

| 항목 | 룰 |
|------|-----|
| main | 배포 전용 / 직접 수정 금지 |
| 서버 | Git-tracked 파일 직접 수정 금지 |
| 개발 | feature 브랜치에서 수행 |
| 배포 | main → docker-compose build |
| 환경파일 | .gitignore 관리 |

---

## 10. AI / 코드 어시스턴트와 함께 사용할 때
- 인프라 관련 파일은 **AI가 직접 덮어쓰지 않도록** 한다:
  - `docker-compose.prod.yml`
  - `nginx/qa_arena.conf`
  - 프로덕션 `.env`
- 위 파일들에 대한 변경은:
  1. 변경 이유와 영향을 먼저 정리하고
  2. PR 또는 직접 편집으로 사람이 검토/적용한다.
- AI에게 Git / 배포 관련 작업을 시킬 때는 항상 다음을 선행한다:
  - "이 작업이 `docs/specs/AI_SAFETY_PROTOCOLS.md`의 금지 사항에 해당하지 않는지 먼저 확인해줘."
- 프로덕션에서 **볼륨 삭제 명령**(`docker compose down -v`, `docker volume rm`, `docker volume prune`)은 제안하거나 실행하지 않는다.