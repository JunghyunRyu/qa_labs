# 보안 개선 계획: Code Execution Security Hardening

> **상태**: 미완료 (별도 진행 예정)

## 목표
사용자가 입력한 악성 코드(`rm -rf`, `os.system()` 등)로부터 서버를 보호하기 위한 보안 취약점 수정

---

## 현재 상태 분석

### 이미 구현된 보안 (양호)
- Docker 컨테이너 격리 (`network_disabled=True`, `mem_limit="128m"`)
- conftest.py에서 위험 모듈 차단 (`os`, `subprocess`, `socket` 등 9개)
- 비-root 사용자 실행 (`user: "1000:1000"`)
- Docker Socket Proxy로 EXEC 차단

### 발견된 취약점

| 취약점 | 위험도 | 파일 |
|-------|--------|------|
| pytest 타임아웃 없음 | 중간 | `judge/conftest.py` |
| 코드 길이 제한 없음 | 낮음 | `backend/app/schemas/submission.py` |

---

## 구현 계획

### Task 1: pytest 타임아웃 추가 (Priority: High)
- 파일: `judge/conftest.py`
- 4초 타임아웃 + 재귀 깊이 200 제한

### Task 2: 코드 길이 제한 추가 (Priority: Medium)
- 파일: `backend/app/schemas/submission.py`
- 10B ~ 50KB 제한

### Task 3: 차단 모듈 목록 확장 (Priority: Low)
- 파일: `judge/conftest.py`
- pty, fcntl, pipes, posix 등 추가

---

## 수정 대상 파일 요약

| 파일 | 변경 사항 |
|-----|----------|
| `judge/conftest.py` | 타임아웃 (4초) + 재귀 제한 (200) + 차단 모듈 확장 |
| `backend/app/schemas/submission.py` | 코드 길이 제한 (10B ~ 50KB) |

---

*생성일: 2024-12-31*
