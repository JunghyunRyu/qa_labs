# M5-5 단계형 힌트 시스템 구현 계획

> **상태**: ✅ 구현 완료 (2024-12-31)

---

## 개요

### 목표
사용자가 막혔을 때 단계별(Level 1→2→3) 힌트를 제공하여 학습 효과 극대화

### 결정 사항
- Full 구현 (Level 1~3 모두)
- 점수 패널티: Level 2(-10점), Level 3(-20점)
- AI 어필(히어로/마케팅): 별도 이슈로 나중에

---

## M5-5 세부 마일스톤

### M5-5-1: 데이터 모델 & API (0.5일)

**파일**:
- `backend/app/models/problem.py` - hints JSON 필드 추가
- `backend/app/schemas/problem.py` - HintResponse 스키마
- `backend/app/api/v1/problems.py` - 힌트 엔드포인트

**API 설계**:
```
GET  /api/v1/problems/{id}/hints
POST /api/v1/problems/{id}/hints/view  (level 기록용)
```

---

### M5-5-2: AI 힌트 생성 서비스 (0.5일)

**파일**:
- `backend/app/services/hint_service.py` - HintGenerationService

**프롬프트 전략**:
| Level | 내용 | 길이 |
|-------|------|------|
| 1 | 방향성만, 코드 없음 | ~100자 |
| 2 | 테스트 카테고리, 의사코드 | ~200자 |
| 3 | pytest 코드 예시 1개 | ~300자 |

---

### M5-5-3: 프론트엔드 상태 관리 (0.5일)

**파일**:
- `frontend/stores/hintStore.ts` - Zustand store
- `frontend/hooks/useHints.ts` - API 연동 훅

---

### M5-5-4: HintPanel UI 컴포넌트 (0.5일)

**파일**:
- `frontend/components/HintPanel.tsx`

**UI 상태**:
```
[Level 1: 기본 ✓]  [Level 2: 중간 🔒]  [Level 3: 강함 🔒]
```

---

### M5-5-5: 통합 & 배포 (0.5일)

1. ProblemPanel에 HintPanel 통합
2. 기존 문제에 힌트 생성 스크립트 실행
3. E2E 테스트
4. 배포

---

## 점수 패널티 시스템

| Level | 힌트 내용 | 패널티 |
|-------|----------|--------|
| 1 | 방향성 힌트 | 없음 |
| 2 | 구체적 접근법 | **-10점** (최대 90점) |
| 3 | 코드 예시 | **-20점** (최대 80점) |

---

## 수정 대상 파일 요약

| 파일 | 작업 |
|------|------|
| `backend/app/models/problem.py` | hints 필드 추가 |
| `backend/app/schemas/problem.py` | HintResponse |
| `backend/app/api/v1/problems.py` | GET/POST hints |
| `backend/app/services/hint_service.py` | AI 생성 |
| `frontend/stores/hintStore.ts` | 상태 관리 |
| `frontend/components/HintPanel.tsx` | UI |
| `frontend/components/layout/ProblemPanel.tsx` | 통합 |

---

## 예상 일정
- M5-5-1 ~ M5-5-2: Day 1 (백엔드)
- M5-5-3 ~ M5-5-4: Day 2 (프론트엔드)
- M5-5-5: Day 3 (통합)
- **총: 3일**

---

*생성일: 2024-12-31*
