# QA-Arena 프로젝트 개요

## 프로젝트 목적
QA-Arena는 AI 보조 온라인 코딩 테스트 플랫폼입니다. QA 엔지니어의 테스트 설계 및 테스트 코드 작성 역량을 정량화하는 것이 목표입니다.

## 주요 기능

### 1. 테스트 코드 작성 및 채점
- 사용자가 pytest 기반 테스트 코드를 작성하고 제출
- Golden Code와 Buggy Implementations(mutants)에 대한 테스트 실행
- Mutation Testing 기반 점수화

### 2. AI 피드백
- 채점 결과를 기반으로 AI가 자연어 피드백 생성
- OpenAI API 사용

### 3. AI 문제 생성
- Admin이 AI를 활용하여 문제를 빠르게 생성
- 템플릿 기반 문제 생성

## 핵심 컨셉

### Docker-in-Docker 구조
- `celery_worker` 컨테이너 내부에서 judge 컨테이너를 생성하여 코드 실행
- 샌드박스 환경에서 안전한 코드 실행 보장
- 호스트 공유 볼륨(`/tmp/qa_arena_judge`)을 통한 파일 공유

### Mutation Testing
- Golden Code: 정답 구현
- Buggy Implementations: 의도적으로 버그가 포함된 변형(mutants)
- 사용자의 테스트 코드가 버그를 얼마나 잘 잡아내는지 평가

## 개발 환경
- **로컬 개발**: Windows
- **프로덕션**: EC2 (Linux)
- **인코딩**: UTF-8 (한글 이슈 주의)
