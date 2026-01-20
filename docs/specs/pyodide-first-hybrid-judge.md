ADR-0001: Pyodide-First 하이브리드 채점 아키텍처로 전환 (Client 기본 / Server Fallback)

ID: ADR-0001

제목: Pyodide(Web Worker) 기반 클라이언트 사이드 채점을 기본으로 하고, Celery+Docker 서버 채점을 Fallback으로 유지한다

상태: Accepted / Implemented

결정일: 2025-12-18 (하이브리드 아키텍처 반영 시점)

최종 업데이트: 2025-12-31 (운영/에러 처리/상태 전이 문서 동기화 시점)

범위: Submission 채점 실행 경로, 상태 전이, 운영 영향 범위, 에러 처리, 옵저버빌리티

관련 문서/섹션

qa-arena-spec.md: Architecture Overview(하이브리드), Client-side Execution(Pyodide), Submission API(client_result), Fallback 조건

SUBMISSION_STATUS_FLOW.md: 클라이언트 경로는 PENDING/RUNNING 없이 SUCCESS/FAILURE로 즉시 확정

ERROR_HANDLING.md: Pyodide 에러 계층/자동 Fallback 메커니즘

overview.md, operations.md: “Celery Worker 다운되어도 기본 채점 정상” 등 운영 영향 범위

1) 배경 (Before)
1.1 기존 아키텍처 (Celery + Docker 서버 채점 중심)

사용자가 제출한 테스트 코드를 서버로 업로드

서버에서 Submission 생성 후 process_submission_task를 Celery 큐에 넣음

Celery Worker가 Docker 컨테이너에서 pytest 실행:

Golden Code(정답 구현) 테스트

Buggy Implementations(뮤턴트) 순회 테스트

kill ratio 기반 점수 계산

(일부 경로에서) AI 피드백 생성

클라이언트는 Polling(예: 2초 간격)으로 상태 확인 (PENDING → RUNNING → SUCCESS/FAILURE/ERROR)

1.2 문제가 되었던 지점 (Celery-only가 MVP 운영에 부적합했던 이유)

아래는 문서에 반영된 성격(“즉각 피드백”, “서버 부하 없음”, “Worker 다운 영향 최소화”, “ALLOW_SERVER_EXECUTION 플래그”)을 기준으로 정리한 결정 동인입니다.

지연(Latency)과 UX 저하

큐 대기(PENDING) + 실행(RUNNING) + Polling 구조는 “제출 → 결과”까지 체감 시간이 길어짐

사용자가 테스트를 빠르게 반복(리팩토링/추가 케이스)하는 사용 패턴에 맞지 않음

운영 가용성(Availability) 취약

Celery Worker가 다운되면 채점 기능 자체가 중단되는 구조(단일 경로)였음

특히 “채점”이 플랫폼 핵심 기능이므로, Worker 장애가 곧 서비스 장애가 됨

서버 부하/비용(Scale & Cost) 증가 구조

채점 연산(특히 mutant 다회 실행)이 제출량에 정비례해 서버 CPU/IO를 소모

단일 EC2/단일 워커 운영에서 스파이크를 흡수하기 어려움

(문서상) ALLOW_SERVER_EXECUTION=false 같은 옵션을 두어 서버 실행을 막는 방향이 나온 것은 “서버 리소스 최적화” 필요성이 명확했음을 의미

보안 리스크(서버에서 untrusted code 실행)

Docker 격리를 하더라도, 서버에서 사용자 코드(pytest)를 실행하는 것은 본질적으로 공격면이 큼

MVP 수준의 제한(conftest import 차단, timeout, docker network off 등)은 “완전한 샌드박스”가 아니라 “완화책”에 가깝고, 운영 부담이 지속됨

2) 목표 (Decision Drivers)

전환 결정은 아래 목표를 동시에 만족시키기 위해 내려졌다.

제출 즉시(near real-time) 결과 제공

Worker 장애가 ‘기본 채점’ 장애로 전이되지 않도록 설계

서버 부하를 구조적으로 줄여 운영 비용/스케일 부담을 축소

서버에서 untrusted code 실행 비중을 최소화하여 보안 리스크를 낮춤

브라우저/환경 제약이 있는 경우에도 “최소 기능”은 유지(Fallback)

3) 고려한 대안 (Options Considered)
옵션 A: Celery + Docker 서버 채점 유지 (기존)

장점: 실행 환경 통제 가능, 결과 무결성(서버가 직접 실행) 높음

단점: 지연/운영 가용성/비용/보안 리스크 문제 지속

옵션 B: Pyodide-only (서버 채점 완전 제거)

장점: 서버 부하 거의 0, 즉각 피드백, Worker 운영 제거

단점: Pyodide 미지원 환경/SharedArrayBuffer 미지원 브라우저/패키지 제한(C 확장 등)에서 채점 불가

Pyodide CDN/초기화 실패 시 서비스 자체가 깨짐

옵션 C: Pyodide-First + Celery Fallback (채택)

장점: 대부분 케이스에서 즉각 피드백 + 서버 부하 감소 + Worker 장애 영향 최소화

단점: 클라이언트 결과 신뢰/무결성 이슈, 브라우저 환경 다양성, Pyodide 초기 로딩 비용

결론: MVP 운영 관점에서 “UX/운영/비용”의 총합이 가장 유리하여 채택

4) 최종 결정 (Decision)
4.1 결정 요약

기본 실행 경로를 브라우저(Pyodide + Web Worker)로 전환한다.

서버는 채점 실행자가 아니라 “결과 저장 + (조건부) 비동기 AI 피드백 생성” 역할로 축소한다.

단, Pyodide가 불가능하거나 문제 데이터 조건이 충족되지 않으면 Celery+Docker 서버 채점으로 자동 Fallback한다.

4.2 “클라이언트 기본 실행” 조건 (Gate)

클라이언트 실행은 아래 조건을 모두 만족할 때만 사용한다.

isPyodideReady === true (Pyodide 초기화 완료)

buggy_implementations.length > 0 (mutant 테스트 가능한 문제)

브라우저가 SharedArrayBuffer 등 Worker 기반 실행 요구사항을 만족

(실무적) Pyodide 로딩/pytest 설치 실패가 없어야 함

조건 미충족 시 서버 실행으로 전환한다.

5) 상세 설계 (After)
5.1 클라이언트 사이드 실행 흐름 (Primary Path)

사용자가 문제 상세 진입

프론트에서 Pyodide Worker를 백그라운드 초기화 (CDN 로드)

micropip으로 pytest 설치

“채점하기” 클릭 시 Worker에서 mutation test 실행:

Golden Code 테스트 (정상 구현이 통과해야 진행)

Buggy Implementations 순회 테스트

kill ratio 및 점수 계산

프론트는 실행 결과를 ClientExecutionResult로 정리

POST /api/v1/submissions에 client_result 포함하여 제출

서버는 결과를 저장만 하고 상태를 즉시 확정:

golden_code_passed=true → SUCCESS

golden_code_passed=false → FAILURE

(회원이고 SUCCESS면) generate_feedback_task.delay()로 피드백 비동기 생성

클라이언트는 Polling 없이 즉시 결과 화면 렌더링

상태 전이 특징

PENDING/RUNNING을 거치지 않는다.

제출 생성 시점에 즉시 SUCCESS/FAILURE로 확정된다.

5.2 서버 사이드 Fallback 실행 흐름 (Secondary Path)

Fallback은 다음 케이스에서 수행한다:

Pyodide 초기화 실패(네트워크/CDN/브라우저 호환)

SharedArrayBuffer 미지원

buggy_implementations 없음

(확장 시) Pyodide에서 지원하지 않는 실행 요구가 존재

서버 경로는 다음과 같다:

POST /api/v1/submissions (client_result 없음)

서버는 Submission 생성: PENDING

process_submission_task.delay(submission_id) 발행

Worker가 실행 시작 시 RUNNING으로 변경

Docker 컨테이너에서 pytest 실행 (Golden → mutants)

성공 시 SUCCESS, 실패 시 FAILURE, 예외/재시도 초과 시 ERROR

클라이언트는 Polling으로 결과를 조회

5.3 API/데이터 계약 (Contract)
클라이언트 제출 페이로드 (요지)
{
  "problem_id": 1,
  "code": "pytest tests ...",
  "client_result": {
    "golden_code_passed": true,
    "mutants_killed": 4,
    "total_mutants": 5,
    "score": 86,
    "details": [
      {"mutant_id": "1", "killed": true, "test_output": "...", "execution_time": 100.5}
    ],
    "total_execution_time": 1234.56
  }
}

서버 저장 시 execution_log 핵심 필드

execution_mode: "client" 또는 "server"

golden_code_passed

total_execution_time_ms

mutant_details(요약)

6) 운영/가용성 관점 결과
6.1 Worker 장애 영향 분리

Pyodide-first 구조에서는 Celery Worker 다운이 곧 채점 장애가 아니다.

영향은 “Fallback 채점 불가 + AI 피드백 지연/실패”로 제한된다.

즉, 플랫폼 핵심 기능(채점)의 기본 경로가 계속 동작한다.

6.2 Redis 장애 영향도 분리

Redis는 Celery 브로커/결과 및 일부 큐에 관여하므로 장애 시 비동기 작업에 영향이 있으나,

클라이언트 채점 자체는 브라우저에서 완료되므로 “기본 채점”은 상대적으로 덜 영향 받는다
(단, 서버 저장/응답 경로의 장애가 별도로 존재할 수 있으므로 API 가용성은 여전히 중요)

7) 트레이드오프 및 리스크 (명시적으로 기록)
7.1 장점 (Why this is better)

Latency: 밀리초 단위에 가까운 즉각 피드백(큐/폴링 제거)

Scalability/Cost: 채점 연산이 클라이언트로 이동 → 서버 부하 급감

Availability: Worker 장애가 기본 채점 장애로 전이되지 않음

Security: 서버에서 untrusted code 실행 비중 축소(공격면 감소)

7.2 단점/리스크 (무시하지 말고 문서로 고정)

클라이언트 결과 무결성(Integrity) 문제

서버는 client_result를 기반으로 점수/kill 정보를 저장한다.

악의적 사용자가 요청을 변조하면 점수 조작 가능성이 존재한다.
→ MVP에서는 “학습/자가진단” 목적에선 허용 가능하지만, 리더보드/인증 시험 등으로 확장 시 치명적.

브라우저 호환성/환경 편차

SharedArrayBuffer, WASM 제약, 모바일/구형 브라우저 등에서 Pyodide가 실패할 수 있음
→ 자동 Fallback 및 사용자 안내 UX가 필수

Pyodide 로딩 비용

최초 진입 시 CDN 로드 + pytest 설치로 초기 지연이 발생할 수 있음
→ 백그라운드 프리로딩/캐싱/진행 UI 필요

패키지/런타임 제한

C 확장 모듈 등 일부 라이브러리 미지원
→ 문제/테스트 설계 단계에서 제약을 반영해야 함

8) 완화책 (Mitigations)
8.1 무결성(Integrity) 완화 로드맵

현 단계(MVP)에서는 다음 중 최소 1개를 우선순위로 고려한다.

(권장) 샘플링 서버 재실행(Audit Run)

일정 비율(예: 1~5%) 또는 특정 조건(고득점/이상치)에서 서버에서 재실행하여 결과를 비교

서버 서명 기반 결과 검증(확장 설계 필요)

문제/뮤턴트 버전 해시 + 실행 로그 요약에 대해 서버 검증 규칙을 도입

리더보드/공식 점수는 server-only로 제한

사용자는 클라이언트로 빠르게 학습, 공식 점수는 서버 검증을 통과한 제출만 반영

8.2 Pyodide 장애 대응

ERROR_HANDLING.md의 계층적 에러 처리에 따라:

Worker → Store → Hook → Page에서 실패 감지

자동으로 서버 Fallback 결정

운영 문서에 Pyodide CDN 장애/초기화 실패 대응 절차 포함

8.3 서버 실행 리스크 통제

서버 채점은 Fallback일 뿐이지만, 여전히 존재하므로:

Docker 네트워크 비활성화

위험 모듈 import 제한(conftest)

pytest timeout

ALLOW_SERVER_EXECUTION=false로 프로덕션에서 서버 실행을 정책적으로 차단 가능

9) 관측 지표 (Metrics to Prove the Decision)

결정이 유효했는지 확인하기 위해 다음 지표를 고정으로 수집한다.

execution_mode 분포: client vs server 비율

Pyodide 초기화 실패율 (isPyodideReady=false 원인 분해)

Fallback 발생률 및 원인(SharedArrayBuffer/buggy_implementations 없음/CDN 실패 등)

제출→결과 화면까지의 P95 latency (클라이언트 경로는 특히 중요)

Worker 장애 빈도/복구 시간과 사용자 영향 범위

AI 피드백 생성 성공률/재시도 횟수(채점과 분리되어야 함)

10) 결론 (Outcome)

QA Arena의 핵심 사용 경험은 “테스트를 빠르게 반복하며 버그 탐지율을 올리는 것”이다.

Celery-only는 큐 기반 지연/운영 장애 전이를 유발하여 이 경험에 불리했다.

Pyodide-first 하이브리드는:

기본 경로에서 즉각 피드백과 서버 부하 절감을 달성하고,

Worker/Redis 장애의 영향을 제한하며,

브라우저 제약은 자동 Fallback으로 흡수한다.

단, 클라이언트 결과 무결성은 MVP 이후 단계에서 반드시 보완해야 한다(리더보드/공식 점수 도입 시 특히).

부록 A) 실행 경로 요약 (ASCII)
[Submit]
  |
  |-- if (isPyodideReady && mutants>0 && SAB supported)
  |      Client: Pyodide Worker runs pytest
  |      -> POST /submissions (client_result 포함)
  |      -> Server: 저장만, 즉시 SUCCESS/FAILURE
  |      -> (user+SUCCESS) generate_feedback_task async
  |
  `-- else
         Server: create PENDING
         -> Celery task enqueue
         -> Worker: RUNNING -> SUCCESS/FAILURE/ERROR
         -> Client: polling
