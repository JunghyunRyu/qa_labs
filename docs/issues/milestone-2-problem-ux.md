# Milestone 2: 문제 풀이 UX 개선

**우선순위**: P0
**의존성**: Milestone 1 (게스트 지원)
**예상 작업량**: 중

---

## 목표

문제 풀이 페이지의 사용자 경험을 개선합니다.

---

## 배경

기획서 v0.2에서 요구하는 UX 개선 사항 중 현재 미구현된 항목:

| 요구사항 | 현재 상태 |
|----------|-----------|
| submission_id 노출 + 복사 버튼 | ❌ UI에 표시 안됨 |
| Sticky 요약 패널 (데스크탑) | ❌ 없음 |
| 모바일 Drawer | ⚠️ ScoringMethodDrawer만 존재 |
| 폴링 지수 백오프 | ❌ 단순 5회 에러 후 중지 |

---

## Todo List

### 1. [FE] submission_id 노출 + 복사 버튼

- [ ] **파일 수정**: `frontend/components/SubmissionResultPanel.tsx`
- [ ] **구현 내용**:
  - 제출 완료 후 submission ID 표시 (축약: `abc12345...`)
  - 전체 ID 툴팁 표시
  - 클립보드 복사 버튼 추가
  - 복사 성공 시 토스트 알림 또는 아이콘 변경
- [ ] **UI 예시**:
  ```
  제출 ID: abc12345... [📋]
  ```

### 2. [FE] CopyButton 공용 컴포넌트

- [ ] **파일 생성/수정**: `frontend/components/CopyButton.tsx`
- [ ] **Props**:
  ```typescript
  interface CopyButtonProps {
    value: string;           // 복사할 값
    label?: string;          // 접근성 레이블
    size?: 'sm' | 'md';      // 버튼 크기
    onCopy?: () => void;     // 복사 성공 콜백
  }
  ```
- [ ] **기능**:
  - navigator.clipboard.writeText() 사용
  - 복사 성공 시 아이콘 변경 (📋 → ✓)
  - 2초 후 원래 아이콘으로 복귀
- [ ] **사용처**:
  - 함수 시그니처 복사
  - submission_id 복사

### 3. [FE] Sticky 요약 패널 (데스크탑)

- [ ] **파일 생성**: `frontend/components/ProblemStickyPanel.tsx`
- [ ] **내용**:
  - 난이도 배지
  - 태그 목록
  - 함수 시그니처 + 복사 버튼
  - 최신 제출 상태 배지
  - AI 모드 토글 (M4와 연계, placeholder로 시작)
- [ ] **스타일**:
  ```css
  position: sticky;
  top: calc(header-height + 16px);
  max-height: calc(100vh - header-height - 32px);
  overflow-y: auto;
  ```
- [ ] **반응형**: 데스크탑(lg:)에서만 표시
- [ ] **페이지 통합**: `frontend/app/problems/[id]/page.tsx`

### 4. [FE] 모바일 요약 Drawer 개선

- [ ] **파일 생성**: `frontend/components/ProblemMobileDrawer.tsx`
- [ ] **트리거**: 하단 고정 버튼 또는 헤더 아이콘
- [ ] **내용**: Sticky 패널과 동일
- [ ] **스타일**:
  - 하단에서 슬라이드 업
  - 배경 오버레이
  - 스와이프로 닫기 (선택)
- [ ] **반응형**: 모바일(< lg)에서만 표시

### 5. [FE] 폴링 지수 백오프 구현

- [ ] **파일 수정**: `frontend/app/problems/[id]/page.tsx`
- [ ] **현재 로직**:
  ```typescript
  // 2초 간격, 연속 5회 에러 후 중지
  ```
- [ ] **개선 로직**:
  ```typescript
  const BASE_INTERVAL = 2000;
  const MAX_RETRIES = 5;

  const getBackoffInterval = (errorCount: number) => {
    // 2초 → 4초 → 8초 → 16초 → 32초
    return BASE_INTERVAL * Math.pow(2, errorCount);
  };

  // 성공 시 간격 초기화
  // 에러 시 간격 증가
  ```
- [ ] **사용자 안내**: 5회 에러 후 "연결 문제가 발생했습니다. 새로고침해 주세요."

### 6. [FE] 상태 배지 디자인 통일

- [ ] **파일 수정**: `frontend/components/SubmissionStatus.tsx`
- [ ] **상태별 스타일**:

| 상태 | 색상 | 아이콘 | 텍스트 |
|------|------|--------|--------|
| PENDING | gray-500 | 시계 (Clock) | 대기 중 |
| RUNNING | blue-500 | 스피너 (회전) | 채점 중 |
| SUCCESS | green-500 | 체크 (Check) | 완료 |
| FAILURE | red-500 | X (X) | 실패 |
| ERROR | orange-500 | 경고 (AlertTriangle) | 오류 |

- [ ] **아이콘 라이브러리**: lucide-react (이미 사용 중)
- [ ] **애니메이션**: RUNNING 상태에서 스피너 회전

---

## 관련 파일

| 파일 | 작업 유형 |
|------|-----------|
| `frontend/components/SubmissionResultPanel.tsx` | 수정 |
| `frontend/components/CopyButton.tsx` | 신규/수정 |
| `frontend/components/ProblemStickyPanel.tsx` | 신규 생성 |
| `frontend/components/ProblemMobileDrawer.tsx` | 신규 생성 |
| `frontend/app/problems/[id]/page.tsx` | 수정 |
| `frontend/components/SubmissionStatus.tsx` | 수정 |

---

## 완료 조건

- [ ] submission_id가 UI에 표시되고 복사 가능
- [ ] 데스크탑에서 Sticky 요약 패널 정상 동작
- [ ] 모바일에서 요약 Drawer 접근 가능
- [ ] 네트워크 에러 시 지수 백오프로 재시도
- [ ] 상태별 배지 색상/아이콘 통일

---

## 테스트 케이스

1. **submission_id 복사 테스트**
   - 제출 완료 후 ID 표시 확인
   - 복사 버튼 클릭 → 클립보드에 전체 ID 복사
   - 붙여넣기로 검증

2. **Sticky 패널 테스트**
   - 데스크탑에서 스크롤 시 패널 고정 확인
   - 모바일에서 패널 숨김 확인
   - 내용 정확성 확인

3. **모바일 Drawer 테스트**
   - 트리거 버튼 클릭 → Drawer 열림
   - 배경 클릭 → Drawer 닫힘
   - 내용 Sticky 패널과 동일

4. **폴링 백오프 테스트**
   - 네트워크 차단 후 폴링 간격 증가 확인
   - 5회 에러 후 사용자 안내 메시지 표시
   - 네트워크 복구 후 간격 초기화

5. **상태 배지 테스트**
   - 각 상태별 색상/아이콘 확인
   - RUNNING 상태 애니메이션 확인

---

## UI/UX 참고

### Sticky 패널 레이아웃 (데스크탑)

```
┌─────────────────────────────────────────────────────┐
│ [문제 콘텐츠 영역]            │ [Sticky 패널]       │
│                               │                     │
│ 문제 설명                     │ 난이도: ●●○ Medium │
│ 함수 시그니처                 │ 태그: array, hash   │
│ Golden Code                   │                     │
│ 코드 에디터                   │ def function(...):  │
│ 결과 패널                     │     [복사]          │
│                               │                     │
│                               │ 최신 제출: ✓ 85점  │
│                               │                     │
│                               │ AI 코치: [OFF/ON]   │
└─────────────────────────────────────────────────────┘
```

### 모바일 Drawer

```
┌─────────────────────────────────────────┐
│ [문제 페이지 전체]                       │
│                                          │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│ ═══════════════════════════════════════ │ ← 드래그 핸들
│ 난이도: Medium   태그: array, hash       │
│                                          │
│ def function_name(param):                │
│     [복사 버튼]                          │
│                                          │
│ 최신 제출: ✓ 85점                        │
│                                          │
│ AI 코치: [OFF] [ON]                      │
└──────────────────────────────────────────┘
```

---

## 주의사항

- CopyButton은 HTTPS 환경에서만 정상 동작 (localhost 예외)
- Sticky 패널 높이가 뷰포트를 초과하면 내부 스크롤 적용
- 모바일 Drawer는 iOS Safari의 bottom safe area 고려
