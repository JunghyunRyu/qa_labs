---
description: 로컬과 EC2의 Git 코드 싱크 상태를 확인하고 비교합니다
---

# 코드 싱크 상태 확인

로컬과 EC2 환경의 Git 상태를 비교하여 배포 전 체크리스트로 활용합니다.

## 확인 항목

### 1. 로컬 환경
```bash
# 현재 브랜치
git branch --show-current

# 최신 커밋
git log -1 --oneline

# 작업 상태
git status --short

# 원격 동기화 여부
git fetch origin
git status
```

### 2. EC2 환경
SSH로 접속하여 동일한 정보 수집:
```bash
ssh -i <ssh_key_path> <user>@<ec2_ip> "cd ~/qa_labs && git branch --show-current && git log -1 --oneline && git status --short"
```

### 3. 비교 및 리포트

출력 예시:
```
========================================
로컬 (Windows)
========================================
브랜치: main
최신 커밋: 53d7f86 fix: add Docker group permission
상태:
  M CLAUDE.md (수정됨)
  ?? .claude/ (추적 안 됨)

========================================
EC2 (Linux)
========================================
브랜치: main
최신 커밋: 82f6256 Enhance error handling
상태: 깨끗함

========================================
분석
========================================
❌ 싱크가 맞지 않습니다!

차이점:
- 로컬이 EC2보다 2개 커밋 앞서 있습니다
- 로컬에 커밋되지 않은 변경사항이 있습니다

권장 조치:
1. 로컬 변경사항 커밋: git add . && git commit
2. 원격에 푸시: git push origin main
3. EC2에서 pull: ssh ... "cd ~/qa_labs && git pull origin main"
```

### 4. 자동 제안

싱크가 맞지 않을 때 다음 중 하나를 제안합니다:

**케이스 A: 로컬이 최신**
```bash
# 로컬 → 원격 → EC2
git push origin main
ssh ... "cd ~/qa_labs && git pull origin main"
```

**케이스 B: EC2가 최신**
```bash
# EC2 → 원격 → 로컬
ssh ... "cd ~/qa_labs && git push origin main"
git pull origin main
```

**케이스 C: 둘 다 변경**
```
⚠️ 충돌 가능성 있음!
수동으로 해결 필요:
1. 한쪽 변경사항 stash
2. Pull/Push
3. Stash 복원 및 충돌 해결
```

**사용 시점:**
- 배포 전 체크리스트
- 예상치 못한 충돌 방지
- 환경 간 코드 버전 확인
