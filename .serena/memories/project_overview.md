# QA-Arena 프로젝트 개요

## 프로젝트 목적
QA-Arena는 AI 보조 온라인 코딩 테스트 플랫폼입니다. QA 엔지니어의 테스트 설계 및 테스트 코드 작성 역량을 정량화하는 것이 목표입니다.

## 주요 기능

### 1. 테스트 코드 작성 및 채점
- 사용자가 pytest 기반 테스트 코드를 작성하고 제출
- Golden Code와 Buggy Implementations(mutants)에 대한 테스트 실행
- Mutation Testing 기반 점수화
- **클라이언트 사이드 채점**: Pyodide (WebAssembly Python)로 브라우저에서 실행
- **서버 사이드 채점**: Celery Worker (Fallback용)

### 2. AI 피드백 시스템
- 채점 결과를 기반으로 AI가 자연어 피드백 생성
- Deep Feedback: 상세한 테스트 개선 제안
- AI Coach: 실시간 학습 도우미
- 힌트 시스템: 단계별 힌트 제공
- "Why Failed" 힌트: 놓친 버그에 대한 설명

### 3. 테스트 품질 분석
- 테스트 케이스 파싱 및 분류
- 테스트 품질 점수화
- 개선점 자동 분석

### 4. AI 문제 생성
- Admin이 AI를 활용하여 문제를 빠르게 생성
- 템플릿 기반 문제 생성
- Golden Code + Buggy Implementations 자동 생성

### 5. 사용자 시스템
- GitHub/Google OAuth 인증
- 게스트 모드 지원 (Guest AI Conversion 시스템 - M6)
- 진행 상황 추적
- 토큰 기반 사용량 관리

### 6. 요금제 시스템
- 무료/유료 플랜 구분
- 토큰 할당 및 사용량 추적
- Rate Limiting

### 7. 게이미피케이션 (신규)
- **SDET Career Path**: 통합 랭크 시스템 (점수 기반 등급)
- **Daily Bounty**: 일일 현상금 시스템
- **Weekend Challenge**: 주말 랭킹 챌린지 배너
- 점수 뱃지 및 필터링 기능

## 핵심 컨셉

### Docker-in-Docker 구조
- `celery_worker` 컨테이너 내부에서 judge 컨테이너를 생성하여 코드 실행
- 샌드박스 환경에서 안전한 코드 실행 보장
- 호스트 공유 볼륨(`/tmp/qa_arena_judge`)을 통한 파일 공유

### Mutation Testing
- Golden Code: 정답 구현
- Buggy Implementations: 의도적으로 버그가 포함된 변형(mutants)
- 사용자의 테스트 코드가 버그를 얼마나 잘 잡아내는지 평가

## 모니터링 및 운영
- **Sentry**: 프론트엔드/백엔드 에러 트래킹
- **Discord**: 알림 연동 (Daily Report 등)
- **Google Analytics 4**: 사용자 행동 분석
- **Worker Monitor**: Celery 워커 상태 모니터링

## 개발 환경
- **로컬 개발**: Windows
- **프로덕션**: EC2 (Ubuntu 24.04 LTS)
- **인코딩**: UTF-8 (한글 이슈 주의)

## 마일스톤 현황 (2026-01-18 기준)
- **M5**: 보안 강화 (완료)
- **M6**: Guest AI Conversion, 주말 챌린지, 일일 현상금 (완료)
- **M6-1~M6-3**: Guest AI Conversion 구현
- **M6-4**: 주말 랭킹 챌린지 배너
