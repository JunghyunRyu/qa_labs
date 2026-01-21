# QA Arena UX 대폭 개선 사양서

> **생성일**: 2026-01-21
> **상태**: 진행 중
> **프로젝트 ID**: qa-ux-enhancement

---

## 1. 개요

### 1.1 목적
QA Arena의 핵심 가치인 "뮤테이션 테스트 기반 QA 역량 평가"를 사용자가 직관적으로 체감할 수 있도록 UX를 대폭 개선합니다. 특히 **Kill Ratio(버그 탐지율)**를 중심으로 한 결과 시각화와 에디터 경험을 강화합니다.

### 1.2 범위
- **포함**:
  - 결과 패널 개선 (Kill Ratio 시각화, Mutant Killed 피드백)
  - 에디터 UX 개선 (함수 시그니처 고정, 저장 인디케이터, Reset 버튼)
  - AI 코치 컨텍스트 강화 (에러 로그 자동 포함)
  - Pyodide Pre-loading 및 타임아웃 구현
- **제외**:
  - 난이도별 BVA 정보 노출 제어 (별도 마일스톤)
  - AI 프롬프트 고도화 (별도 마일스톤)
  - 실무 스펙 문서 형태 문제 (콘텐츠 영역)

### 1.3 이해관계자
- **요청자**: 사용자 피드백
- **개발**: Claude Code
- **검토**: jhryu

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|---------|------|
| FR-001 | 채점 결과에 Kill Ratio를 명확히 시각화 (버그 포획 현황판) | 최우선 | 대기 |
| FR-002 | pytest Failed를 "Mutant Killed" 긍정 피드백으로 치환 | 최우선 | 대기 |
| FR-003 | 로컬 테스트 vs 채점하기 결과 이원화 UI | 최우선 | 대기 |
| FR-004 | 함수 시그니처 Sticky Header (Copy 가능) | 필수 | 대기 |
| FR-005 | 자동 저장 상태 인디케이터 (저장 중/저장됨) | 필수 | 대기 |
| FR-006 | Reset 버튼 (초기 템플릿 복구 + 확인 모달) | 필수 | 대기 |
| FR-007 | AI 코치에 에러 로그/테스트 결과 자동 컨텍스트 주입 | 필수 | 대기 |
| FR-008 | Pyodide Pre-loading (페이지 진입 시 백그라운드 초기화) | 필수 | 대기 |
| FR-009 | Pyodide 실행 타임아웃 (5초 제한 + 무한루프 방지) | 필수 | 대기 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 설명 |
|----|---------|------|
| NFR-001 | 성능 | Pyodide 초기화 시간 3초 → 백그라운드 Pre-load로 체감 0초 |
| NFR-002 | 안정성 | 무한루프/무한재귀 시 브라우저 멈춤 방지 |
| NFR-003 | 접근성 | 색상 대비, 스크린리더 지원 유지 |

---

## 3. 기술 설계

### 3.1 아키텍처 영향

**영향받는 레이어:**
- [x] Frontend (Next.js)
- [x] Backend (FastAPI) - AI 코치 서비스만
- [ ] Database (PostgreSQL)
- [ ] Celery Worker
- [ ] Infrastructure

### 3.2 변경 영역

| 영역 | 파일/모듈 | 변경 유형 | 설명 |
|------|----------|----------|------|
| Frontend | `components/MutationScoreboard.tsx` | 신규 | Kill Ratio 현황판 컴포넌트 |
| Frontend | `components/SubmissionResultPanel.tsx` | 수정 | Mutant Killed 피드백 추가 |
| Frontend | `components/LocalTestResultPanel.tsx` | 수정 | 로컬 테스트 결과 이원화 |
| Frontend | `components/CodeEditor.tsx` | 수정 | 함수 시그니처 헤더 추가 |
| Frontend | `components/SaveStatusIndicator.tsx` | 신규 | 저장 상태 표시기 |
| Frontend | `components/ResetCodeButton.tsx` | 신규 | Reset 버튼 + 확인 모달 |
| Frontend | `app/problems/[id]/page.tsx` | 수정 | 컴포넌트 통합 |
| Frontend | `workers/pyodide.worker.ts` | 수정 | Pre-loading, 타임아웃 |
| Frontend | `hooks/usePyodidePreload.ts` | 신규 | Pre-loading 훅 |
| Frontend | `components/AICoachPanel.tsx` | 수정 | 컨텍스트 자동 주입 |
| Backend | `app/services/ai_coach_service.py` | 수정 | 에러 로그 컨텍스트 처리 |

### 3.3 의존성

**내부 의존성:**
- `useCodeDraft` 훅 (자동 저장)
- `usePyodide` 훅 (Pyodide 실행)
- `pytestParser` (테스트 결과 파싱)

**외부 의존성:**
- Pyodide CDN (v0.29.0)
- Monaco Editor

### 3.4 데이터 모델

데이터 모델 변경 없음.

---

## 4. 마일스톤 계획

| 마일스톤 | 이름 | 크기 | 설명 |
|---------|------|------|------|
| M1 | 결과 패널 개선 | 중 | Kill Ratio 현황판, Mutant Killed 피드백 |
| M2 | 에디터 UX 개선 | 중 | 시그니처 고정, 저장 인디케이터, Reset |
| M3 | AI 코치 컨텍스트 강화 | 소 | 에러 로그/테스트 결과 자동 주입 |
| M4 | Pyodide 최적화 | 중 | Pre-loading, 타임아웃/무한루프 방지 |

**마일스톤 파일:**
- `milestones/m1-result-panel.md`
- `milestones/m2-editor-ux.md`
- `milestones/m3-ai-context.md`
- `milestones/m4-pyodide-optimization.md`

---

## 5. 위험 요소

| 위험 | 영향도 | 완화 방안 |
|------|-------|----------|
| Pyodide 타임아웃 구현 복잡성 | 중간 | Web Worker terminate() + 재생성 패턴 사용 |
| 결과 패널 레이아웃 깨짐 | 중간 | 기존 ScoreDisplay 활용, 점진적 개선 |
| AI 컨텍스트 토큰 과다 사용 | 낮음 | 최대 10줄 에러 로그 제한 유지 |

---

## 6. 테스트 계획

### 6.1 단위 테스트
- MutationScoreboard 렌더링 테스트
- Kill Ratio 계산 로직 테스트
- 타임아웃 로직 테스트

### 6.2 통합 테스트
- 채점 → 결과 표시 플로우
- Pre-loading → 즉시 실행 플로우
- AI 코치 컨텍스트 주입 플로우

### 6.3 E2E 테스트 (필요 시)
- 전체 문제 풀이 시나리오 (로컬 테스트 → 채점 → AI 질문)

---

## 7. 성공 기준

- [ ] Kill Ratio가 채점 결과에 명확히 표시됨
- [ ] "Mutant Killed" 긍정 피드백 UI 적용
- [ ] 함수 시그니처가 에디터 상단에 고정 표시
- [ ] 저장 상태 인디케이터 정상 동작
- [ ] Reset 버튼 + 확인 모달 동작
- [ ] Pyodide 초기화가 백그라운드에서 완료
- [ ] 5초 타임아웃 정상 동작
- [ ] AI 코치에 에러 로그 자동 포함

---

## 8. 참고 자료

- `docs/specs/qa-arena-spec.md` - 기존 스펙 문서
- `docs/specs/token-policy.md` - AI 토큰 정책
- 사용자 피드백 (2026-01-21)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-21 | 1.0 | 초기 작성 | Claude Code |
