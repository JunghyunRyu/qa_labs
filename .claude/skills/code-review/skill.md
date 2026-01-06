---
description: 코드 변경사항을 리뷰하고 best practices 준수 여부를 확인합니다.
---

# Code Review Skill

변경된 코드를 분석하여 품질, 보안, 성능 측면에서 리뷰합니다.

## 리뷰 워크플로우

### Step 1: 변경 범위 확인
```bash
# 변경된 파일 목록
git diff --name-only origin/main

# 변경 통계
git diff --stat origin/main

# 상세 변경 내용
git diff origin/main
```

**확인 항목:**
- 변경된 파일 수와 위치
- 추가/삭제된 라인 수
- 영향받는 모듈/컴포넌트

---

### Step 2: 코드 품질 분석

**Python 파일 체크:**
- 타입 힌트 사용 여부
- 함수/클래스 docstring 존재 여부
- PEP 8 스타일 준수
- 복잡도 (너무 긴 함수, 깊은 중첩)

**TypeScript/JavaScript 파일 체크:**
- TypeScript strict 모드 준수
- 적절한 타입 정의
- ESLint 규칙 준수

**일반 체크:**
- 하드코딩된 값 (magic numbers/strings)
- 중복 코드
- 사용하지 않는 import/변수

---

### Step 3: 보안 검토
```bash
# 민감 정보 패턴 검색
git diff origin/main | grep -iE "(password|secret|api_key|token|credential)" || echo "Clean"

# .env 파일 변경 확인
git diff origin/main --name-only | grep -E "\.env" && echo "WARNING: .env 파일 변경!"

# SQL Injection 패턴
git diff origin/main | grep -iE "(execute|raw_sql|cursor\.execute)" || echo "No raw SQL"
```

**체크 항목:**
- 하드코딩된 비밀번호/API 키
- SQL Injection 가능성
- XSS 취약점 (HTML 직접 삽입)
- 사용자 입력 검증 누락

---

### Step 4: 성능 검토

**확인 항목:**
- N+1 쿼리 패턴
- 불필요한 반복문
- 메모리 누수 가능성 (대용량 데이터 처리)
- 비동기 처리 적절성

---

### Step 5: 테스트 커버리지

**확인 항목:**
- 새로운 코드에 대한 테스트 존재 여부
- 엣지 케이스 테스트
- 기존 테스트 영향 여부

```bash
# 테스트 파일 변경 확인
git diff origin/main --name-only | grep -E "(test_|_test\.py|\.test\.ts)" || echo "No test changes"
```

---

## 리뷰 결과 리포트

```
========================================
코드 리뷰 결과
========================================

[변경 요약]
- 파일 수: N개
- 추가 라인: +XXX
- 삭제 라인: -XXX
- 영향 모듈: backend/app/services, frontend/src/components

[코드 품질]
[OK] 타입 힌트: 모든 함수에 타입 정의됨
[OK] 코드 스타일: PEP 8/ESLint 준수
[WARN] 복잡도: submit_handler 함수가 50줄 이상 (분리 권장)

[보안 검토]
[OK] 민감 정보: 하드코딩된 비밀 없음
[OK] 입력 검증: 적절한 validation 적용
[WARN] SQL: raw SQL 사용 발견 (line 45) - 파라미터 바인딩 확인 필요

[성능]
[OK] 쿼리 패턴: N+1 패턴 없음
[INFO] 비동기: 새로운 async 함수 추가됨

[테스트]
[OK] 커버리지: 새 기능에 대한 테스트 추가됨
[WARN] 엣지 케이스: 빈 입력에 대한 테스트 누락

[권장 사항]
1. submit_handler 함수 분리 (단일 책임 원칙)
2. line 45의 raw SQL을 ORM 쿼리로 변경
3. 빈 입력 케이스 테스트 추가

[결론]
[APPROVE] 변경사항 승인됨 (권장 사항은 후속 작업으로 처리 가능)
```

---

## 리뷰 우선순위

| 우선순위 | 유형 | 설명 |
|---------|------|------|
| **CRITICAL** | 보안 | 반드시 수정 필요 (배포 차단) |
| **HIGH** | 버그 | 심각한 로직 오류 |
| **MEDIUM** | 품질 | 코드 품질 개선 권장 |
| **LOW** | 스타일 | 선택적 개선 사항 |

---

## 사용 시점
- `/ec2-deploy` 실행 중 100줄 이상 변경 시 자동 호출
- 수동 코드 리뷰 요청 시 (`/code-review`)
- PR 생성 전 자체 검토 시
