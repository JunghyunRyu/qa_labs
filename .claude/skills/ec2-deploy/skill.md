---
description: EC2 배포 전체 워크플로우를 자동화합니다 (체크 → 커밋 → 머지 → 배포 → 헬스체크)
---

# EC2 Deploy Skill

QA Labs 프로젝트를 EC2에 안전하게 배포하는 전체 워크플로우를 자동화합니다.

## 워크플로우

### 1. 사전 체크
```bash
# 로컬 상태 확인
git status
git branch --show-current

# 원격과 비교
git fetch origin
git status
```

**체크 항목:**
- [ ] 현재 브랜치가 feature 브랜치인가?
- [ ] 커밋되지 않은 변경사항이 있는가?
- [ ] main 브랜치가 최신인가?

### 2. 사용자 확인
AskUserQuestion 도구로 다음을 확인:
- 배포하려는 브랜치 확인
- main으로 머지 여부
- 배포 계속 진행 여부

### 3. 로컬 준비
```bash
# 변경사항이 있으면 커밋
git add .
git commit -m "[user-provided message]"

# main 브랜치로 전환 및 머지
git switch main
git pull origin main
git merge [feature-branch]
git push origin main
```

### 4. EC2 배포
```bash
ssh -i <ssh_key_path> <user>@<ec2_ip> << 'EOF'
cd ~/qa_labs
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker ps
EOF
```

### 5. 헬스체크
배포 후 30초 대기 후 다음 확인:

```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 주요 서비스 로그
docker compose -f docker-compose.prod.yml logs backend | tail -20
docker compose -f docker-compose.prod.yml logs celery_worker | tail -20
```

**확인 사항:**
- 모든 컨테이너가 "Up" 상태인가?
- 에러 로그가 없는가?
- API 응답이 정상인가? (curl http://localhost:8001/)

### 6. 롤백 준비
배포 실패 시 이전 커밋으로 자동 롤백:

```bash
# 이전 커밋 해시 저장 (배포 전)
PREV_COMMIT=$(git rev-parse HEAD)

# 배포 실패 시
git checkout $PREV_COMMIT
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 성공 메시지
```
✅ 배포 완료!

브랜치: feature/new-feature → main
커밋: abc1234 - "Add new feature"
컨테이너 상태: 모두 Up ✅
헬스체크: 정상 ✅

배포 완료 시각: 2025-12-09 12:00:00
```

## 실패 시 처리
```
❌ 배포 실패!

오류: celery_worker 컨테이너 시작 실패
로그:
[에러 로그 출력]

자동 롤백 수행 중...
✅ 이전 버전으로 롤백 완료 (커밋: xyz7890)
```

## 사용 시점
- 기능 개발 완료 후 프로덕션 배포
- 긴급 핫픽스 배포
- 정기 업데이트 배포
