---
description: 기능 개발 라이프사이클 자동화. 사양서/마일스톤 생성 → 개발/테스트 사이클 관리 → 완료 리포트 및 아카이브.
---

# /dev-start Skill

> 기능 개발의 전체 라이프사이클을 자동화하는 통합 워크플로우

## 사용법

```
/dev-start "기능명"
/dev-start "비회원 기능 추가"
/dev-start "토큰 정책 리팩토링"
```

---

## 전체 흐름

```
/dev-start "기능명"
       │
       ▼
┌─────────────────────────────────┐
│  Phase 1: 기획                   │
│  - 요구사항 수집 (AskUserQuestion) │
│  - 코드베이스 분석               │
│  - 사양서 생성                   │
│  - 마일스톤 분할                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Phase 2: 개발 (PM Agent)        │
│  - 마일스톤별 개발 → 테스트 사이클 │
│  - QA Engineer Agent 연계 테스트 │
│  - 통합 테스트                   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Phase 3: 완료                   │
│  - 최종 리포트 생성              │
│  - docs/issues/resolved/로 아카이브 │
│  - 결과 요약 출력                │
└─────────────────────────────────┘
```

---

## Phase 1: 기획

### Step 1.1: 요구사항 수집

AskUserQuestion 도구를 사용하여 기능에 대한 세부 요구사항을 수집합니다.

**수집 항목:**
- 기능의 목적과 핵심 요구사항
- 영향받는 모듈/컴포넌트
- 우선순위와 제약 조건
- 예상 복잡도 (소/중/대)

### Step 1.2: 코드베이스 분석

**분석 항목:**
- 관련 기존 코드 파악 (Serena 도구 활용)
- 영향 범위 산정
- 기술적 제약사항 식별
- 재사용 가능한 코드/패턴 확인

```bash
# 관련 파일 검색
grep -r "관련키워드" backend/app/ frontend/src/

# 기존 테스트 확인
ls backend/tests/ | grep -i "관련키워드"
```

### Step 1.3: 사양서 생성

`docs/plans/{project-slug}/spec.md` 파일 생성

**템플릿 위치:** `.claude/skills/dev-start/templates/spec-template.md`

**project-slug 규칙:**
- 기능명을 소문자 kebab-case로 변환
- 예: "비회원 기능 추가" → `guest-features`
- 예: "토큰 정책 리팩토링" → `token-policy-refactoring`

### Step 1.4: 마일스톤 분할

기능을 2-5개의 마일스톤으로 분할합니다.

**마일스톤 크기 기준:**
| 크기 | 예상 변경 라인 | 특징 |
|------|---------------|------|
| 소 | ~100줄 | 단일 파일/함수 수정 |
| 중 | 100~300줄 | 여러 파일, 테스트 포함 |
| 대 | 300줄+ | 분할 권장 |

**파일 생성:**
- `docs/plans/{project-slug}/milestones/m1-{name}.md`
- `docs/plans/{project-slug}/milestones/m2-{name}.md`
- ...

**템플릿 위치:** `.claude/skills/dev-start/templates/milestone-template.md`

---

## Phase 2: 개발

### Step 2.1: Project Manager Agent 호출

Project Manager Agent를 호출하여 개발-테스트 사이클을 관리합니다.

```
Task 도구 호출:
- subagent_type: "project-manager"
- prompt: "docs/plans/{project-slug}/ 프로젝트 개발을 시작합니다. spec.md와 milestones/ 폴더의 마일스톤 파일들을 읽고 순차적으로 구현해주세요."
```

### Step 2.2: 개발-테스트 사이클 (PM Agent가 관리)

```
for each milestone:
    1. 마일스톤 파일 읽기
    2. 태스크 구현
    3. QA Engineer Agent 호출 → 테스트
    4. 통과 시: 다음 마일스톤
       실패 시: 수정 후 재테스트 (최대 3회)
```

### Step 2.3: 통합 테스트

모든 마일스톤 완료 후:
```bash
# 전체 테스트 실행
cd backend && pytest tests/ -v

# 관련 기능 테스트만 실행
pytest tests/ -k "{기능키워드}" -v
```

---

## Phase 3: 완료

### Step 3.1: 최종 리포트 생성

`docs/plans/{project-slug}/final-report.md` 파일 생성

**템플릿 위치:** `.claude/skills/dev-start/templates/report-template.md`

**포함 내용:**
- 프로젝트 요약
- 마일스톤별 결과
- 구현된 기능 목록
- 테스트 결과 요약
- 알려진 제한사항
- 후속 작업 권장사항

### Step 3.2: 아카이브

프로젝트 완료 시 파일을 `docs/issues/resolved/`로 이동합니다.

```bash
# 아카이브
mv docs/plans/{project-slug}/ docs/issues/resolved/{project-slug}/
```

### Step 3.3: 최종 출력

```
========================================
기능 개발 완료: {기능명}
========================================

[프로젝트 정보]
- 위치: docs/issues/resolved/{project-slug}/
- 기간: {시작일} ~ {완료일}
- 마일스톤: {N}개 완료

[구현 내용]
- {주요 기능 1}
- {주요 기능 2}
- {주요 기능 3}

[테스트 결과]
✅ 단위 테스트: XX개 통과
✅ 통합 테스트: 통과

[변경 파일]
- backend/app/services/xxx.py (+120, -30)
- frontend/src/components/xxx.tsx (+80, -15)
- ...

[후속 작업]
- {권장 사항 1}
- {권장 사항 2}

========================================
개발 완료! 최종 리포트: docs/issues/resolved/{project-slug}/final-report.md
========================================
```

---

## 디렉토리 구조

### 진행 중
```
docs/plans/{project-slug}/
├── spec.md                    # 사양서
├── milestones/
│   ├── m1-{name}.md          # 마일스톤 1
│   ├── m2-{name}.md          # 마일스톤 2
│   └── m3-{name}.md          # 마일스톤 3
└── final-report.md           # 완료 시 생성
```

### 완료 후
```
docs/issues/resolved/{project-slug}/
├── spec.md
├── milestones/
│   ├── m1-{name}.md
│   ├── m2-{name}.md
│   └── m3-{name}.md
└── final-report.md
```

---

## 에스컬레이션 조건

다음 상황에서 사용자에게 확인을 요청합니다:

1. **마일스톤 3회 테스트 실패**: 근본적인 설계 문제 가능성
2. **예상 범위 초과**: 마일스톤이 '대' 이상으로 커진 경우
3. **기술적 블로커**: 외부 의존성, 권한 문제 등
4. **요구사항 불명확**: 추가 정보 필요

---

## 관련 도구

| 도구/Agent | 역할 |
|------------|------|
| **Project Manager Agent** | 개발-테스트 사이클 관리 |
| **QA Engineer Agent** | 테스트 케이스 작성/실행 |
| **Docs Writer Agent** | 문서 업데이트 (선택) |
| **AskUserQuestion** | 요구사항 수집/확인 |
| **Serena 도구** | 코드베이스 분석 |

---

## 주의사항

- **200줄 이상 변경 시** 사용자 확인 요청
- **DB 스키마 변경** 시 DB Admin Agent 또는 사용자 검토 필요
- **보안 관련 변경** 시 code-review 스킬 연계 권장
- **Docker/인프라 변경**은 제안만 (실제 적용은 사용자가 수행)

---

*dev-start v1.0 - QA Labs 기능 개발 라이프사이클 자동화*
