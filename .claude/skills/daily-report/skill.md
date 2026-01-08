---
description: EC2 프로덕션 환경의 일일 모니터링 리포트를 생성합니다 (DB/로그/시스템 메트릭).
---

# Daily Report Skill

EC2 프로덕션 환경의 데이터를 수집하여 종합 일일 모니터링 리포트를 생성합니다.

## 수집 항목

| 카테고리 | 항목 |
|----------|------|
| DB 현황 | 총 사용자, 금일 가입, 총 제출, 금일 제출, 문제 수 |
| 문제 통계 | 문제별 성공/실패/오류 수, 실패율 |
| 토큰 사용 | AI 코치/힌트/피드백 사용량, 금일 총 소비 |
| 오류 현황 | 발생 시간, 내용, 파일, 예상 원인 |
| 시스템 리소스 | CPU, 메모리, 디스크 사용률 |
| 채점 시스템 | 평균 시간, 타임아웃 수, 큐 대기, Worker 상태 |

---

## 워크플로우

### Step 1: EC2에서 리포트 스크립트 실행
AWS SSM send-command로 EC2에서 리포트 생성 스크립트를 실행합니다:

```bash
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml exec -T backend python /app/scripts/daily_report.py --output json 2>/dev/null"]' \
  --query 'Command.CommandId' --output text)

echo "Command ID: $COMMAND_ID"
```

### Step 2: 결과 수집 (60초 대기)
```bash
sleep 60
RESULT=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "i-05b23ecec2bdcd44a" \
  --query 'StandardOutputContent' --output text)

echo "$RESULT"
```

### Step 3: 결과 파싱 및 출력
JSON 결과를 파싱하여:
1. 터미널에 컬러 포맷으로 출력
2. `reports/daily-report-YYYY-MM-DD.md` 파일로 저장

---

## 출력 형식

### 터미널 출력 (컬러)
```
╔════════════════════════════════════════════════════════════╗
║           QA Labs Daily Report - 2025-01-09                ║
╚════════════════════════════════════════════════════════════╝

📊 DB 현황
┌──────────────────────────────────────────────────────────┐
│ 총 사용자: 150명 (금일 가입: +5명)                       │
│ 총 제출:   1,234건 (금일: 45건)                          │
│ 총 문제:   25개 (공개: 20개)                             │
└──────────────────────────────────────────────────────────┘

🎯 문제별 실패율
┌────────────────┬─────────┬─────────┬────────┬───────────┐
│ Problem        │ SUCCESS │ FAILURE │ Rate   │ Status    │
├────────────────┼─────────┼─────────┼────────┼───────────┤
│ E01-LoginTest  │   45    │    5    │ 10.0%  │ ✅ 정상   │
│ E02-CartTest   │   30    │   15    │ 33.3%  │ ⚠️ 주의   │
│ H01-PaymentTest│   10    │   20    │ 66.7%  │ 🔴 높음   │
└────────────────┴─────────┴─────────┴────────┴───────────┘

🤖 토큰 사용 현황
┌──────────────────────────────────────────────────────────┐
│ AI 코치: 25회 (총 50 토큰)                               │
│ AI 힌트: 30회 (총 30 토큰)                               │
│ 딥 피드백: 10회 (총 30 토큰)                             │
│ 금일 총 소비: 110 토큰                                   │
└──────────────────────────────────────────────────────────┘

🔴 오류 현황 (3건)
┌──────────────────────────────────────────────────────────┐
│ [14:32:15] ConnectionError: Redis connection refused     │
│   파일: app/services/judge.py:45                         │
│   원인: Redis 일시적 과부하                              │
├──────────────────────────────────────────────────────────┤
│ [09:15:03] TimeoutError: Judge execution timeout         │
│   파일: app/services/executor.py:120                     │
│   원인: 사용자 코드 무한루프 가능성                      │
└──────────────────────────────────────────────────────────┘

💻 시스템 리소스
┌──────────────────────────────────────────────────────────┐
│ CPU:    45% ████████████░░░░░░░░░░░░░░░░░░               │
│ Memory: 62% ████████████████████░░░░░░░░░░               │
│ Disk:   38% ████████████░░░░░░░░░░░░░░░░░░               │
└──────────────────────────────────────────────────────────┘

⏱️ 채점 시스템
┌──────────────────────────────────────────────────────────┐
│ 평균 채점 시간: 3.2초                                    │
│ 타임아웃 발생: 2건 (전체의 0.4%)                         │
│ 현재 큐 대기: 0건                                        │
│ Worker 상태: ✅ ONLINE (1/1)                             │
└──────────────────────────────────────────────────────────┘

📁 리포트 저장: reports/daily-report-2025-01-09.md
```

### 마크다운 파일
위 내용을 마크다운 형식으로 저장하여 Slack/Notion에서 공유 가능

---

## 상태 판단 기준

| 지표 | ✅ 정상 | ⚠️ 주의 | 🔴 위험 |
|------|---------|---------|---------|
| 문제 실패율 | < 30% | 30-50% | > 50% |
| CPU 사용률 | < 60% | 60-80% | > 80% |
| 메모리 사용률 | < 70% | 70-85% | > 85% |
| 디스크 사용률 | < 70% | 70-85% | > 85% |
| 타임아웃 비율 | < 1% | 1-5% | > 5% |

---

## 사용 시점
- 매일 아침: 전날 밤 이슈 확인
- 매일 저녁: 퇴근 전 시스템 상태 확인
- 이상 징후 발생 시: 빠른 현황 파악
- 주간/월간 리포트 작성 시: 기초 데이터 수집

---

## 트러블슈팅

### 스크립트 실행 실패 시
```bash
# EC2에서 직접 확인
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml exec -T backend python -c \"import scripts.daily_report; print('OK')\""]' \
  --query 'Command.CommandId' --output text
```

### DB 연결 실패 시
```bash
# PostgreSQL 상태 확인
aws ssm send-command \
  --instance-ids "i-05b23ecec2bdcd44a" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ssm-user/qa_labs && docker compose -f docker-compose.prod.yml ps postgres"]' \
  --query 'Command.CommandId' --output text
```
