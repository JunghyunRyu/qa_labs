# Subagent System

> 1인 개발자를 위한 가상 팀 - 역할별 전문화 에이전트

---

## 개요

Subagent는 특정 역할에 특화된 독립적인 에이전트입니다. 각 에이전트는:
- **격리된 컨텍스트**: 역할에 필요한 정보만 보유
- **제한된 도구**: 역할에 맞는 도구만 사용 가능
- **병렬 실행**: 백그라운드에서 동시 작업 가능

---

## 사용 가능한 Agents

| Agent | 역할 | 사용 시점 |
|-------|------|----------|
| **qa-engineer** | 테스트 케이스 작성, 버그 재현 | 기능 개발 후 테스트 필요 시 |
| **docs-writer** | 문서 자동 업데이트 | 코드 변경 후 문서화 필요 시 |
| **db-admin** | 스키마 관리, 쿼리 최적화 | DB 작업 시 |
| **sre-devops** | 배포, 인프라 관리 | 배포/운영 작업 시 |

---

## 사용 방법

### 기본 호출
```bash
# Task 도구를 통한 Agent 호출
claude에게: "@qa-engineer 이 기능에 대한 테스트 케이스 작성해줘"

# 또는 명시적으로
claude에게: "qa-engineer agent를 사용해서 테스트 작성해줘"
```

### 백그라운드 실행
```bash
# 메인 작업 중 백그라운드에서 Agent 실행
claude에게: "@docs-writer --background API 변경사항 문서화해줘"
```

---

## Agent vs Skill 차이

| 특성 | Skills | Agents |
|------|--------|--------|
| 컨텍스트 | 메인 대화 공유 | 격리된 전용 컨텍스트 |
| 도구 접근 | 전체 | 역할별 제한 |
| 실행 방식 | 순차 (명령→완료→종료) | 독립 세션 (병렬 가능) |
| 용도 | 단일 작업 | 지속적 역할 담당 |

---

## 디렉토리 구조

```
.claude/agents/
├── README.md                    # 이 파일
├── _template/                   # Agent 템플릿
│   ├── agent.md
│   └── CONTEXT.md
├── qa-engineer/                 # QA Engineer Agent
│   ├── agent.md
│   ├── CONTEXT.md
│   └── examples/
├── docs-writer/                 # Docs Writer Agent
│   ├── agent.md
│   ├── CONTEXT.md
│   └── templates/
├── db-admin/                    # Database Admin Agent
│   ├── agent.md
│   ├── CONTEXT.md
│   └── queries/
└── sre-devops/                  # SRE/DevOps Agent
    ├── agent.md
    ├── CONTEXT.md
    └── runbooks/
```

---

## 파일 설명

### agent.md
각 Agent의 정의 파일:
- **역할**: Agent가 담당하는 업무
- **허용 도구**: 사용 가능한 도구 목록
- **금지 도구**: 사용 불가한 도구 목록
- **워크플로우**: 작업 수행 방법

### CONTEXT.md
Agent 전용 컨텍스트:
- 역할에 필요한 프로젝트 정보만 포함
- 불필요한 정보로 인한 혼란 방지
- 축소된 CLAUDE.md 역할

---

## 새 Agent 추가 방법

1. `_template/` 복사하여 새 디렉토리 생성
2. `agent.md` 수정 (역할, 도구, 워크플로우)
3. `CONTEXT.md` 작성 (역할 관련 정보)
4. 필요시 보조 파일 추가 (examples/, templates/ 등)

---

## 주의사항

1. **도구 제한 준수**: 각 Agent는 지정된 도구만 사용
2. **컨텍스트 격리**: Agent 간 정보 공유 최소화
3. **위험 작업 금지**: 각 Agent별 금지 도구 목록 확인
4. **기존 Skills 호환**: 기존 /code-review, /deploy 등 정상 동작

---

*최종 업데이트: 2026-01-09*
