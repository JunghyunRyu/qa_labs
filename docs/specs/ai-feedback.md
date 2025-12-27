# AI Feedback (SDD Spec)

- Product: QA-Arena / QA-Labs Arena
- Doc: docs/spec/ai-feedback.md
- Version: v0.2
- Status: Partially Implemented (Base만 구현됨)
- Date (KST): 2025-12-28
- Owner: Product/Backend

## 0. 목적 (Purpose)

본 문서는 “채점 후 AI 피드백”을 **기능/출력/캐시/비용 상한** 관점에서 스펙으로 고정한다.  
특히 **기본 피드백은 무료**로 제공하되, **중복 생성 금지(캐시)** 및 **출력 제한**으로 운영 비용을 통제한다.

## 1. 범위 (Scope)

### 포함
- 피드백 종류 정의: Base / Deep / Regenerate
- 생성 트리거(언제 생성되는가)
- 캐시/재생성 정책
- 출력 포맷(JSON) 및 길이 제한
- 모델 사용 정책(고급/저렴)과 비용 방어 장치

### 제외
- 피드백 품질 평가/랭킹 모델(추후)
- 사용자별 개인화 프롬프트(추후)

## 2. 피드백 종류 (Feedback Types)

### 2.1 Base Feedback (기본 피드백)
- **트리거**: 채점 완료 시(Submission 결과가 terminal 상태가 되었을 때)
- **비용**: 0 토큰 (무료)
- **생성 횟수**: **submission 1건당 1회**
- **캐시**: 생성 결과를 저장하고 이후 요청은 저장된 결과를 반환

### 2.2 Deep Feedback (심화 분석)
- **트리거**: 사용자가 “심화 분석” 버튼 클릭
- **비용**: 2 토큰 (token-policy.md 준수)
- **쿨다운**: submission 기준 60초
- **캐시**: 생성 결과 저장(선택: 최신 1개만 유지)

### 2.3 Regenerate (재생성)
- **트리거**: 사용자가 “재생성” 버튼 클릭
- **비용**: 1 토큰
- **쿨다운**: submission 기준 30초
- **정책**: 기존 Base(또는 Deep)를 대체하거나, `regen_count` 증가 후 최신본 저장

## 3. 상태 머신 (State Model)

각 submission에 대해 피드백 상태를 다음과 같이 관리한다.

- `NONE`: 생성 전
- `GENERATING`: 생성 중(중복 요청 방지용)
- `READY`: 생성 완료
- `FAILED`: 생성 실패(재시도 정책 적용)

### 규칙
- Base는 `READY`가 있으면 재생성 없이 그대로 반환
- `GENERATING` 중 동일 요청이 오면:
  - (A) 동일 작업 결과를 기다리는 폴링 응답
  - (B) 즉시 `ALREADY_GENERATING`(선택) 반환

## 4. 출력 포맷 (Output Schema)

### 4.1 Base Feedback JSON (현재 구현)

> **참고**: 현재 구현된 스키마입니다. 아래 "설계 스키마"는 향후 구현 목표입니다.

```json
{
  "summary": "한 줄 요약",
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "weaknesses": ["아쉬운 점 1", "아쉬운 점 2"],
  "suggested_tests": ["제안 1 (구체적인 입력 예시 포함)", "제안 2"],
  "score_adjustment": 0
}
```

**구현 위치**: `backend/app/services/ai_feedback_engine.py`

### 4.1.1 Base Feedback JSON (설계 스키마 - 향후 목표)

Base Feedback은 "짧고 구조화된" 형태로 고정한다.

```json
{
  "version": "base.v1",
  "summary": "한 문장 요약 (최대 120자)",
  "score_context": {
    "bug_detection_rate": 0.8,
    "mutations_killed": 4,
    "mutations_total": 5
  },
  "strengths": [
    "강점 1 (최대 80자)",
    "강점 2",
    "강점 3"
  ],
  "gaps": [
    "놓친 케이스 1 (최대 80자)",
    "놓친 케이스 2",
    "놓친 케이스 3"
  ],
  "next_tests": [
    {
      "title": "추가 테스트 아이디어 제목 (최대 50자)",
      "why": "왜 필요한지 (최대 120자)",
      "hint": "어떻게 접근할지 (최대 120자)"
    }
  ],
  "tags": ["boundary", "type", "exception"]
}
```

#### Base 출력 제한(필수)
- `summary`: 120자 이내
- `strengths`, `gaps`: 최대 3개
- `next_tests`: 최대 5개
- 각 문자열 길이 제한 준수(비용 상한)

### 4.2 Deep Feedback JSON (고정 스키마)
심화 분석은 더 상세하되, 여전히 구조화한다.

```json
{
  "version": "deep.v1",
  "diagnosis": [
    {
      "area": "예: boundary/exception/stateful/property",
      "finding": "발견 내용 (최대 200자)",
      "impact": "영향 (최대 200자)",
      "recommendation": "권장 개선 (최대 200자)"
    }
  ],
  "test_plan": [
    {
      "name": "테스트 계획 항목명 (최대 80자)",
      "cases": ["케이스1", "케이스2", "케이스3"]
    }
  ],
  "anti_patterns": [
    "자주 보이는 안티패턴 1 (최대 120자)"
  ]
}
```

#### Deep 출력 제한(필수)
- `diagnosis`: 최대 6개
- `test_plan`: 최대 4개
- `cases`: 항목당 최대 6개
- 텍스트 필드 길이 제한 준수

## 5. 입력 데이터(컨텍스트) 규칙

모델 입력으로 포함 가능한 정보(권장):
- 제출 결과 요약(통과/실패/에러)
- mutation 결과(죽인/전체, 어떤 유형이 살아남았는지)
- failing test 요약(있다면)
- 함수 시그니처 / 문제 메타(난이도, 태그)
- 사용자가 작성한 테스트 코드(길이 제한 후)

금지/주의:
- 과도한 원문 로그 전체(비용 폭증, 노이즈 증가)
- 개인정보/비밀키/토큰 등 민감정보(마스킹 필수)

## 6. 모델 사용 정책 (Model Policy)

- Base Feedback: 고급 모델 사용 가능(핵심 가치), 단 **출력 제한 + 캐시**가 전제
- Deep Feedback/Regenerate: 고급 모델 사용(토큰 과금으로 비용 상쇄)

### 실패/에러 시 정책
- 시스템 에러(채점 파이프라인 실패 등): LLM 호출을 생략하거나 최소화된 안내만 제공
- 사용자 코드/테스트 실패: 가능한 한 “구조화된 원인”을 간단히 제공

## 7. 캐시/재생성 정책

### 7.1 Base 캐시(필수)
- 최초 생성 후 저장
- 동일 submission 조회 시 저장본 반환
- Base 생성은 “제출 1건당 1회”가 원칙

### 7.2 Regenerate(정책 선택)
v0.1 권장:
- Base 재생성은 `regen_count` 증가
- 최신 1개만 유지(덮어쓰기) + 이전본은 로그/감사 목적이면 별도 저장

## 8. API 엔드포인트(권장 형태)

- `GET /submissions/{id}/feedback/base`  
  - 존재하면 반환, 없으면 생성(0 토큰)
- `POST /submissions/{id}/feedback/deep`  
  - 2 토큰 차감 후 생성/반환
- `POST /submissions/{id}/feedback/regenerate`  
  - 1 토큰 차감 후 재생성/반환

> 토큰 차감 및 오류 규격은 token-policy.md를 따른다.

## 9. 관측(Logging/Metrics)

필수 로깅(최소):
- action_type별 호출 수
- submission당 생성 횟수(base/deep/regen)
- 생성 실패율, 평균 응답시간
- 모델 호출 추정 비용(가능하면)

## 10. DoD (Acceptance Criteria)

- Base 피드백은 제출 1건당 1회만 생성되고 캐시 재사용된다.
- Base/Deep 출력은 스키마를 항상 만족하고 길이 제한을 지킨다.
- Deep/Regenerate는 토큰 차감 및 쿨다운이 강제된다.
- 더블 클릭/재시도에도 중복 차감/중복 생성이 발생하지 않는다.
