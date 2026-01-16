---
description: EC2 배포 전체 워크플로우를 자동화합니다 (체크 → 보안스캔 → 코드리뷰 → 커밋 → 머지 → 배포 → 헬스체크 → 롤백).
---

# EC2 Deploy Skill

QA Labs 프로젝트를 EC2에 안전하게 배포하는 전체 워크플로우를 자동화합니다.

## Agent 연동

> **이 Skill은 SRE/DevOps Agent와 함께 실행됩니다.**

배포 작업 시 `Task` 도구를 사용하여 SRE/DevOps Agent를 호출하세요:
```
subagent_type: "SRE/DevOps Agent"
prompt: "EC2 배포 진행 - [작업 내용]"
```

Agent가 제공하는 핵심 지식:
- 502 에러 방지를 위한 nginx 재시작 규칙
- Docker 빌드 네트워크 문제 해결
- 트러블슈팅 가이드

---

## Skill 연동

이 Skill은 다음 Skill/Agent들과 연동하여 안전한 배포를 보장합니다:

| Skill/Agent | 역할 | 호출 시점 |
|-------------|------|-----------|
| **`SRE/DevOps Agent`** | 배포 실행 및 트러블슈팅 | 전체 배포 과정 |
| **`/code-review`** | 대규모 변경사항 리뷰 | Step 3 (100줄 이상 변경 시) |
| **`/docker-debug`** | 배포 실패 진단 | Step 7 (헬스체크 실패 시) |

---

## 핵심 배포 규칙

### 반드시 지켜야 할 규칙

1. **backend/frontend 재빌드 시 nginx 반드시 포함**
   ```bash
   # 올바른 명령어
   docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx

   # 잘못된 명령어 (502 에러 발생!)
   docker compose -f docker-compose.prod.yml up -d --build backend frontend
   ```

2. **Docker 빌드 실패 시 network=host 사용**
   ```bash
   docker build --network=host -t qa_labs-backend -f backend/Dockerfile backend/
   docker build --network=host -t qa_labs-frontend -f frontend/Dockerfile frontend/
   ```

3. **타입 에러 발생 시 배포 중단**
   - 메인 에이전트에 코드 수정 요청
   - 수정 후 다시 배포 진행

---

## 워크플로우

### Step 1: 사전 체크
```bash
# 로컬 상태 확인
git status
git branch --show-current

# 원격과 비교
git fetch origin
git status

# 변경 라인 수 확인
git diff --stat origin/main
```

**체크 항목:**
- [ ] 현재 브랜치가 feature 브랜치인가?
- [ ] 커밋되지 않은 변경사항이 있는가?
- [ ] main 브랜치가 최신인가?

---

### Step 2: 보안 스캔
```bash
# 민감 정보 검사
git diff origin/main | grep -iE "(password|secret|api_key|token)" || echo "Clean"

# .env 파일 변경 확인
git diff origin/main --name-only | grep -E "\.env" && echo "WARNING: .env 파일 변경됨!"
```

**확인 사항:**
- 하드코딩된 비밀번호/API 키 없는지
- .env 파일이 커밋에 포함되지 않는지
- 민감한 설정 파일 변경 여부

---

### Step 3: 코드 리뷰 (조건부)

**트리거 조건**: 변경 라인이 100줄 이상인 경우

```bash
# 변경 라인 수 계산
LINES_CHANGED=$(git diff --shortstat origin/main | grep -oP '\d+(?= insertion)' || echo 0)
if [ "$LINES_CHANGED" -gt 100 ]; then
  echo "대규모 변경 감지 ($LINES_CHANGED 라인). 코드 리뷰를 권장합니다."
fi
```

> **대규모 변경 시**: `/code-review` skill을 실행하여 코드 리뷰 수행

---

### Step 4: 사용자 확인
AskUserQuestion 도구로 다음을 확인:
- 배포하려는 브랜치 확인
- main으로 머지 여부
- 코드 리뷰 결과 확인 (해당 시)
- 배포 계속 진행 여부

---

### Step 5: 로컬 준비 및 배포
```bash
# 변경사항이 있으면 커밋
git add .
git commit -m "[user-provided message]"

# main 브랜치로 전환 및 머지
git switch main
git pull origin main
git merge [feature-branch]
git push origin main

# 이전 커밋 해시 저장 (롤백용)
PREV_COMMIT=$(git rev-parse HEAD~1)
echo "롤백 포인트: $PREV_COMMIT"
```

---

### Step 6: EC2 배포
AWS SSM send-command를 통해 EC2에 배포 명령을 전송합니다:

> **중요**: `backend frontend nginx`를 함께 재시작해야 502 에러가 발생하지 않습니다!

```bash
# 롤백 포인트 저장 + 배포 명령 전송
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && git rev-parse HEAD > .rollback_point && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx && docker compose -f docker-compose.prod.yml ps"]' \
  --query 'Command.CommandId' --output text)

echo "Command ID: $COMMAND_ID"

# 60초 대기 후 결과 확인 (빌드 시간 고려)
sleep 60
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query '[Status, StandardOutputContent, StandardErrorContent]'
```

**빌드 실패 시 대안** (네트워크 문제):
```bash
# EC2에서 직접 실행
docker build --network=host -t qa_labs-backend -f backend/Dockerfile backend/
docker build --network=host -t qa_labs-frontend -f frontend/Dockerfile frontend/
docker compose -f docker-compose.prod.yml up -d backend frontend nginx
```

---

### Step 7: 헬스체크
AWS SSM send-command로 EC2에서 헬스체크를 실행합니다:

```bash
# 헬스체크 명령 전송
HEALTH_CMD_ID=$(aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml ps && echo \"=== Backend Logs ===\" && docker compose -f docker-compose.prod.yml logs backend --tail 20 && echo \"=== Celery Logs ===\" && docker compose -f docker-compose.prod.yml logs celery_worker --tail 20 && echo \"=== Health Check ===\" && curl -s -o /dev/null -w \"%{http_code}\" http://localhost:8001/health"]' \
  --query 'Command.CommandId' --output text)

# 10초 대기 후 결과 확인
sleep 10
aws ssm get-command-invocation \
  --command-id "$HEALTH_CMD_ID" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query '[Status, StandardOutputContent]' --output text
```

**확인 사항:**
- 모든 컨테이너가 "Up" 상태인가?
- 에러 로그가 없는가?
- API 응답이 200인가?

> **실패 시**: `/docker-debug` skill을 실행하여 근본 원인 분석

---

### Step 8: Smoke Test (선택)

submission-test skill을 호출하여 기본 기능 검증:

```
Skill: submission-test
Mode: quick (빠른 검증만)
```

자세한 설정은 [smoke-tests.md](smoke-tests.md) 참조

---

### Step 9: 롤백 (실패 시)

헬스체크 또는 Smoke Test 실패 시 AWS SSM send-command로 롤백 실행:

```bash
# 롤백 명령 전송
ROLLBACK_CMD_ID=$(aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && PREV_COMMIT=$(cat .rollback_point) && git checkout $PREV_COMMIT && docker compose -f docker-compose.prod.yml --env-file .env up -d --build && echo \"롤백 완료: $PREV_COMMIT\""]' \
  --query 'Command.CommandId' --output text)

# 30초 대기 후 결과 확인
sleep 30
aws ssm get-command-invocation \
  --command-id "$ROLLBACK_CMD_ID" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query '[Status, StandardOutputContent, StandardErrorContent]'
```

자세한 롤백 정책은 [rollback-config.md](rollback-config.md) 참조

---

## 성공 메시지
```
========================================
EC2 배포 완료
========================================

[배포 정보]
브랜치: feature/new-feature → main
커밋: abc1234 - "Add new feature"
시각: 2025-12-09 12:00:00

[검증 결과]
[OK] 보안 스캔: 통과
[OK] 코드 리뷰: 승인됨 (/code-review)
[OK] 컨테이너 상태: 모두 Up
[OK] 헬스체크: 정상 (HTTP 200)
[OK] Smoke Test: 통과

[롤백 정보]
롤백 포인트: xyz7890 (필요시 사용)
```

---

## 실패 시 처리
```
========================================
EC2 배포 실패
========================================

[오류 정보]
단계: 헬스체크
오류: celery_worker 컨테이너 시작 실패

[에러 로그]
ConnectionRefusedError: Redis 연결 실패

[원인 분석] (/docker-debug)
근본 원인: Redis 컨테이너가 준비되기 전 celery_worker 시작
권장 조치: depends_on에 condition: service_healthy 추가

[자동 롤백]
상태: 완료
이전 커밋: xyz7890
컨테이너: 모두 정상 복구
```

---

## 사용 시점
- 기능 개발 완료 후 프로덕션 배포
- 긴급 핫픽스 배포
- 정기 업데이트 배포
