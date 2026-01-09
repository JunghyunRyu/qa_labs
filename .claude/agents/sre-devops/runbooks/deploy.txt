# 배포 런북 (Deploy Runbook)

> EC2 프로덕션 배포 절차

---

## 1. 사전 체크

### 1.1 로컬 상태 확인
```bash
# 브랜치 확인
git branch --show-current
# 기대: main

# 미커밋 변경 확인
git status
# 기대: nothing to commit, working tree clean

# 원격과 동기화 확인
git fetch origin
git status
# 기대: Your branch is up to date with 'origin/main'
```

### 1.2 EC2 상태 확인
```bash
# EC2 서비스 상태
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml ps"]'
```

---

## 2. 보안 스캔

### 2.1 시크릿 검색
```bash
# .env 파일 확인 (Git에 포함되면 안됨)
git ls-files | grep -E "\.env$"
# 기대: 결과 없음

# 하드코딩된 시크릿 검색
grep -rn "password\|secret\|api_key" --include="*.py" --include="*.ts" backend/ frontend/ | grep -v "test\|example\|sample"
```

### 2.2 환경 변수 확인
```bash
# .env.example과 실제 환경 변수 비교
cat .env.example | grep -v "^#" | cut -d= -f1 | sort
```

---

## 3. 배포 실행

### 3.1 로컬 커밋 (필요시)
```bash
# 변경사항 커밋
git add .
git commit -m "feat(scope): 변경 내용"

# 원격에 푸시
git push origin main
```

### 3.2 EC2 배포
```bash
# Git Pull
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && git pull origin main"]'

# Docker 재빌드 및 시작
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml up -d --build"]'
```

### 3.3 빌드 로그 확인
```bash
# 빌드 상태 확인
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml logs --tail=50 backend"]'
```

---

## 4. 헬스체크

### 4.1 서비스 상태
```bash
# 컨테이너 상태
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker compose -f /home/ssm-user/qa_labs/docker-compose.prod.yml ps"]'
```

### 4.2 API 헬스체크
```bash
# 로컬에서 확인
curl -s https://qa-arena.qalabs.kr/api/v1/health | jq

# 기대 응답
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "online"
}
```

### 4.3 프론트엔드 확인
```bash
# HTTP 상태 코드
curl -s -o /dev/null -w "%{http_code}" https://qa-arena.qalabs.kr/
# 기대: 200
```

---

## 5. Smoke Test (선택)

### 5.1 핵심 기능 테스트
```bash
# 문제 목록 조회
curl -s https://qa-arena.qalabs.kr/api/v1/problems | jq '.total'

# 헬스체크 상세
curl -s https://qa-arena.qalabs.kr/api/v1/health | jq
```

---

## 6. 롤백 (실패 시)

### 6.1 이전 커밋으로 복구
```bash
# 이전 커밋 해시 확인
git log --oneline -5

# EC2에서 롤백
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && git checkout [이전_해시] && docker compose -f docker-compose.prod.yml up -d --build"]'
```

### 6.2 롤백 후 확인
```bash
# 헬스체크 재실행
curl -s https://qa-arena.qalabs.kr/api/v1/health | jq
```

---

## 체크리스트

### 배포 전
- [ ] main 브랜치인지 확인
- [ ] 미커밋 변경 없음
- [ ] 테스트 통과
- [ ] 시크릿 노출 없음

### 배포 중
- [ ] git pull 성공
- [ ] docker build 성공
- [ ] 컨테이너 시작 성공

### 배포 후
- [ ] 헬스체크 통과
- [ ] 프론트엔드 접근 가능
- [ ] 에러 로그 없음
- [ ] Smoke Test 통과 (선택)

---

*배포 런북 v1.0 - QA Labs*
