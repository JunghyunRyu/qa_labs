---
description: EC2에 QA Labs 프로젝트를 배포합니다 (git pull + docker compose rebuild)
---

# EC2 배포 자동화

다음 단계를 수행하여 EC2에 최신 코드를 배포합니다:

1. `.claude/config.json` 파일에서 EC2 설정 정보를 읽어옵니다   
   - 없으면 config.json 사용

2. EC2에 SSH로 접속하여 다음을 순서대로 실행:
   ```bash
   cd ~/qa_labs
   git pull origin main
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   docker ps
   ```

3. 배포 결과 요약:
   - 컨테이너 상태 (실행 중인 컨테이너 목록)
   - 배포 성공/실패 여부
   - 에러 발생 시 상세 로그

**주의사항:**
- 배포 전에 로컬 변경사항이 커밋되었는지 확인하세요
- main 브랜치가 최신 상태인지 확인하세요
- EC2 환경은 `docker compose` (공백) 명령어를 사용합니다
