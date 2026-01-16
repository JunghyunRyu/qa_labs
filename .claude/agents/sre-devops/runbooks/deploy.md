# EC2 배포 Runbook

> 표준 배포 절차

---

## 사전 조건

- [ ] 로컬 코드가 push 되어 있음
- [ ] 타입 에러 없음 (로컬에서 `npm run build` 확인)
- [ ] DB 마이그레이션 파일 준비됨 (필요시)

---

## 배포 단계

### Phase 1: 상태 확인
```bash
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && git status && docker compose -f docker-compose.prod.yml ps"]' \
  --query 'Command.CommandId' --output text
```

### Phase 2: 코드 업데이트
```bash
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && git pull origin main"]' \
  --query 'Command.CommandId' --output text
```

### Phase 3: DB 마이그레이션 (필요시)
```bash
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head"]' \
  --query 'Command.CommandId' --output text
```

### Phase 4: 서비스 재빌드
```bash
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx"]' \
  --query 'Command.CommandId' --output text
```

### Phase 5: 검증
```bash
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml ps && curl -s http://localhost:8001/health"]' \
  --query 'Command.CommandId' --output text
```

---

## 결과 확인
```bash
aws ssm get-command-invocation \
  --command-id "<COMMAND_ID>" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query 'StandardOutputContent' --output text
```

---

## 롤백
```bash
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && git checkout HEAD~1 && docker compose -f docker-compose.prod.yml up -d --build backend frontend nginx"]' \
  --query 'Command.CommandId' --output text
```
