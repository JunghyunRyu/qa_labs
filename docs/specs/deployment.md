# QA-Arena Deployment Guide

## 📌 Purpose
Defines the official and quick deployment flows for the QA-Arena production environment.

---

# 1. Prerequisites
- SSH access to EC2
- GitHub repo connected to EC2
- `.env` file exists on EC2
- Docker & Docker Compose installed

---

# 2. Standard Deployment Procedure

## 1. EC2 접속
```bash
ssh -i ~/.ssh/my_proton_key.pem ubuntu@qa-arena.qalabs.kr
```

## 2. 프로젝트 디렉터리로 이동
```bash
cd ~/qa_labs
```

## 3. main 브랜치 동기화
```bash 
git switch main
git fetch origin
git pull origin main
```

## 4. (선택) DB 스키마 변경이 있을 때만 백업 실행
- 모델/Alembic 마이그레이션 변경이 포함된 배포라면:

``` bash
./scripts/backup_db.sh
# /backup/postgres/qa_arena_YYYYMMDD_HHMMSS.dump 가 생성되었는지 확인
```
## 5. Docker Compose로 배포 (빌드 + 재기동)
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
``` 

## 6. 컨테이너 상태 확인
```bash
docker compose -f docker-compose.prod.yml ps
```
## 7. 애플리케이션 헬스 체크
- 또는 EC2에서:
```bash
curl -I https://qa-arena.qalabs.kr -k
```

---

# 3. Quick Deploy
> ⚠ DB 스키마/마이그레이션 변경이 없는, 순수 코드 변경 배포용이다.

```bash
ssh -i ~/.ssh/my_proton_key.pem ubuntu@qa-arena.qalabs.kr \
  "cd ~/qa_labs && \
   git switch main && git pull origin main && \
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build && \
   docker compose -f docker-compose.prod.yml ps"

```
---

4. Notes
- env 변경, Backend 코드 변경, Frontend 정적 리소스 변경 시에는 항상 --build 포함 배포.
- DB 스키마 변경 전에는 반드시 ./scripts/backup_db.sh 로 백업을 남긴다.
- 프로덕션에서는 다음 명령은 사용하지 않는다:
    - docker compose down -v
    - docker volume rm, docker volume prune
- AI/코드 어시스턴트로 배포 스크립트를 수정할 때는 @docs/specs/AI_SAFETY_PROTOCOLS.md 의 절대 금지 사항을 먼저 확인한다.