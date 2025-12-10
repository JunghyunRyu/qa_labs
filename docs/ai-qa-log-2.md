# [AI QA Log #2] AWS + Docker로 개인 QA 연습실 인프라 구축기

> 이 글은 회사 업무와는 별개로 진행 중인  
> **개인 학습용 AI · 테스트 자동화 실험 환경**의 인프라 구축 과정을 정리한 기록입니다.

---

## 1. 목표: “로컬이 아닌, 작더라도 진짜 서버 위의 QA 연습실”

로컬에서만 도는 샘플 프로젝트로는 한계가 명확했다.  
AI, 테스트 자동화, 인프라를 한 번에 엮어서 실험하려면, 결국 이런 환경이 필요했다.

- 인터넷에서 접근 가능한 **작은 웹 서비스 수준의 환경**
- 백엔드, 프론트엔드, DB, 메시지 큐, 워커, 리버스 프록시까지 포함된 **멀티 컨테이너 구조**
- 장애/배포/백업 같은 운영 시나리오를 직접 겪어볼 수 있는 환경
- 비용은 **1인 개발자 수준에서 감당 가능한 정도**

이 조건을 만족시키기 위해 선택한 조합은:

- **AWS EC2 (Ubuntu 24.04 + t3.medium)** – 저렴하지만 테스트/실험엔 충분한 스펙
- **Docker + docker-compose** – 전체 스택을 컨테이너 단위로 관리
- **Nginx + Let’s Encrypt** – 리버스 프록시 + HTTPS
- **PostgreSQL + Redis + Celery** – 상태 저장 + 비동기 작업 처리
- **FastAPI 기반 백엔드 + 웹 프론트엔드** – 실제 서비스 형태를 모사

이 글에서는 “어떤 의사결정을 했고, 어디서 어떻게 삽질했는지”를 중심으로 정리한다.

---

## 2. EC2 인스턴스 프로비저닝 – 최소한의 베이스라인 만들기

### 2.1 인스턴스 타입 / OS 선택

처음에는 “그냥 아무 Ubuntu나 올리면 되겠지” 정도로 생각했는데, 실제로 선택해야 할 것은 꽤 많았다.

- **Region**: 네트워크 레이턴시와 비용을 고려해 국내 리전 선택
- **Instance Type**:  
  - 너무 작으면 Docker 여러 개 돌릴 때 메모리가 버티지 못하고  
  - 너무 크면 비용이 부담  
  → `t3.medium (2vCPU, 4GB RAM)`으로 타협
- **OS 이미지**:  
  - 최신 LTS인 **Ubuntu 24.04**로 통일  
  - 나중에 docker 이미지/패키지 호환성 이슈를 줄이기 위함

여기서 한 번 삐끗했던 지점은,  
기존에 사용하던 볼륨/스냅샷과 새로운 인스턴스 OS 버전이 헷갈리면서  
“이 볼륨이 대체 몇 버전이었지?” 하고 시간을 쓴 것.

결론적으로는:

- *인프라를 공부용으로 새로 잡을 때는, OS 버전도 아예 새로 명시해서 시작하는 게 속 편하다.*

라는 교훈을 얻었다.

### 2.2 기본 보안 세팅

인스턴스를 띄운 직후, 가장 먼저 한 일은 아래 수준의 베이스라인을 맞추는 것이었다.

- SSH 접속:
  - key pair 기반 로그인
  - `PasswordAuthentication no` 설정
- 패키지 업데이트:

```bash
sudo apt update && sudo apt upgrade -y
```

- UFW(기본 방화벽)에서 열어 둔 포트:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 그 외 개발 중에만 잠깐 사용하는 포트는 필요할 때만 오픈

고급 보안 구성을 한 것은 아니지만, “테스트 환경이라 대충”이 아니라,  
최소한의 기본선은 지키고 시작한다는 기준을 스스로에게 세워두었다.

---

## 3. Docker & docker-compose – “모든 것을 컨테이너로”

테스트 환경도 컨테이너 기반으로 통일하고 싶었다.  
QA 입장에서 **“테스트 환경 재현성”**은 매우 중요한 포인트인데,  
Docker는 이를 보장하는 데 딱 맞는 도구다.

### 3.1 Docker 설치

Ubuntu에서는 공식 문서 그대로 설치했다.

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg |   sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo   "deb [arch=$(dpkg --print-architecture)   signed-by=/etc/apt/keyrings/docker.gpg]   https://download.docker.com/linux/ubuntu   $(lsb_release -cs) stable" |   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

그리고 나서:

```bash
sudo usermod -aG docker $USER
```

까지 해두고, 새 세션에서 비루트 사용자로도 Docker를 쓸 수 있게 맞췄다.

### 3.2 docker-compose로 전체 스택 설계

이 프로젝트의 컨테이너 구조는 대략 이렇게 잡았다.

- `backend` – FastAPI
- `frontend` – 웹 프론트엔드 (React/Next 등)
- `postgres` – 애플리케이션 DB
- `redis` – Celery 브로커/캐시
- `celery_worker` – 비동기 작업 처리 (코드 채점 등)
- `judge` – 실제 코드 실행/pytest 수행용 (별도 이미지)
- `nginx` – 리버스 프록시 + 정적 파일 서빙

실제 `docker-compose.prod.yml`의 축은 다음과 비슷하다.

```yaml
version: "3.9"

services:
  backend:
    image: qa_labs-backend
    env_file: .env
    depends_on:
      - postgres
      - redis

  frontend:
    image: qa_labs-frontend
    env_file: .env
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data

  redis:
    image: redis:7

  celery_worker:
    image: qa_labs-celery_worker
    env_file: .env
    depends_on:
      - backend
      - redis

  nginx:
    image: nginx:stable
    depends_on:
      - backend
      - frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d

volumes:
  db_data:
```

여기서 의도한 아키텍처는:

- **애플리케이션 서비스**들은 모두 Docker 내부 네트워크로만 통신
- 외부에서 직접 접근 가능한 것은 **Nginx 컨테이너의 80/443 포트**뿐
- DB/Redis는 오직 내부 컨테이너에서만 접근

이 구조를 잡는 데도 생각보다 시간이 걸렸다.  
중간에 `ports`를 여기저기 열어놓았더니,  
어느 순간 “이게 지금 어떤 경로로 들어오는 거지?”라는 혼란이 왔다.

결국 기준을 이렇게 세웠다.

> “외부에서 트래픽이 들어오는 포트는 Nginx 하나로만 통일한다.”

---

## 4. Nginx + HTTPS – QA 연습실에도 TLS는 필수

### 4.1 리버스 프록시 패턴

Nginx는 다음과 같은 역할을 맡겼다.

- `/` → 프론트엔드 (정적 파일 또는 Node 기반 서버)
- `/api` → FastAPI 백엔드
- 나중에는 `/judge` 같은 내부 API도 붙일 예정

대표적인 리버스 프록시 설정은 이런 형태다.

```nginx
server {
    listen 80;
    server_name qa-arena.example.com;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

여기서 한 번 크게 삐끗했던 지점은:

- `proxy_pass http://backend:8000;` 뒤에 슬래시(`/`) 유무
- 프론트와 백엔드의 Path가 겹치면서 404/502가 오락가락하던 문제

결국 Nginx 로그와 FastAPI 로그를 같이 보면서,  
어떤 요청이 어디로 라우팅되고 있는지 추적해야 했다.

### 4.2 Let’s Encrypt로 TLS 적용

“테스트 환경이라 HTTP로만 써도 되지 않을까?”라고 잠깐 생각했지만,  
결국 QA 관점에서 **TLS가 붙은 상태에서의 동작**을 검증하는 것이 더 자연스럽다고 판단했다.

과정은 다음과 같다.

1. 도메인 DNS A 레코드를 EC2 퍼블릭 IP로 설정
2. Nginx가 80 포트에서 정상 리스닝하도록 기본 설정
3. Certbot으로 인증서 발급:

```bash
sudo certbot --nginx -d qa-arena.example.com
```

4. 자동으로 `listen 443 ssl` 서버 블록이 생성되고,  
   `ssl_certificate` / `ssl_certificate_key` 경로가 설정됨

여기서 삽질 포인트는:

- Docker 기반 Nginx 컨테이너에서 Certbot을 어떻게 돌릴지에 대한 고민
- 결국 **호스트에서 Certbot + volume 마운트** 방식으로 해결

“실제 운영 서비스 수준”까지는 아니지만,  
최소한 QA 연습실도 HTTPS로 접근 가능한 상태를 만들어두니  
심리적으로도 “진짜 서비스 같다”는 느낌이 들었다.

---

## 5. 환경 변수와 시크릿 – .env 하나에 모든 걸 때려 넣지 않기

초기에 `.env` 파일 하나에 모든 환경 변수를 몰아 넣었다.

- DB 접속 정보
- Redis 설정
- 애플리케이션 시크릿 키
- JWT 관련 설정
- 기타 내부용 플래그

이렇게 하다 보니 문제가 생겼다.

- 로컬 개발용 `.env`와 서버용 `.env`가 섞이기 시작
- git에 잘못 커밋할 뻔한 적도 있음
- 설정이 조금만 바뀌어도 어디를 고쳐야 하는지 헷갈림

그래서 기준을 이렇게 정리했다.

1. `.env.example` 파일을 만들어 **구조만 공유**한다.
2. 실제 값이 들어간 `.env`는 서버에서만 관리하고 git에는 절대 올리지 않는다.
3. 테스트/개발/운영(연습실) 환경 간에 공통되는 변수와  
   환경별로 분리해야 할 변수를 분리해서 관리한다.

이는 QA 관점에서도 중요한데,

> “환경 변수/설정 값이 바뀌었을 때, 어떤 테스트를 다시 돌려야 하는가?”

를 생각해보게 만드는 계기가 됐다.

---

## 6. 배포 플로우 정리 – QA 엔지니어의 1인 Runbook

인프라를 어느 정도 잡아놓고 나니,  
이제는 **배포/롤백/장애 대응 플로우**를 정리할 차례였다.

최종적으로는 다음과 같은 배포 시퀀스를 표준으로 삼았다.

```bash
# 1. 서버 접속
ssh ubuntu@your-ec2-ip

# 2. 프로젝트 디렉터리로 이동
cd ~/qa_labs

# 3. 최신 코드 가져오기
git pull origin main

# 4. 컨테이너 빌드 + 재시작
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# 5. 상태 확인
docker ps
docker logs -f qa_arena_backend_prod
```

그리고 장애/이슈가 있을 때의 체크리스트도 만들었다.

1. **증상 확인**
   - 5xx 응답인지, 타임아웃인지, 프론트만 깨졌는지, API만 죽었는지
2. **Nginx 로그 확인**
   - `docker logs nginx-container`
3. **백엔드 로그 확인**
   - `docker logs backend-container`
4. **DB/Redis 상태 확인**
   - `docker ps`로 컨테이너 헬스 체크
5. **컨테이너 재시작 or 롤백**
   - 필요 시 이전 이미지로 롤백, 혹은 git revert + 재배포

이런 Runbook을 만들어두고 나니,  
문제가 생겨도 **“어디부터 봐야 할지”**에 대한 불안이 많이 줄었다.

---

## 7. 인프라를 직접 구축해보며 QA 시야가 바뀐 지점

이 작은 QA 연습실 인프라를 직접 만들면서,  
생각보다 많은 관점 변화가 있었다.

1. **테스트 대상이 단일 서비스가 아니라 “시스템”이 된다.**
   - 이제는 “API가 잘 돌아가는가?” 뿐 아니라,
   - “Nginx → Backend → DB → Redis → Celery”로 이어지는 체인이  
     전체적으로 안정적인지 보게 된다.

2. **장애를 보면 자동으로 재현 시나리오가 떠오른다.**
   - 예: DB 연결이 잠깐 끊겼을 때 재시도 로직이 있는지
   - Redis가 죽어도 서비스가 완전히 죽지 않고 degrade mode로 동작하는지

3. **테스트 범위를 설계할 때 운영 요소를 같이 고려하게 된다.**
   - 배포 중에 사용자가 요청을 보내면 어떻게 되는가?
   - 롤백했을 때 DB 마이그레이션 상태는 어떻게 관리할 것인가?
   - 백업/복구 절차는 실제로 검증해 봤는가?

4. **AI를 붙일 수 있는 지점이 더 명확해진다.**
   - 로그 분석, 장애 패턴 탐지, 설정 값 추천 등  
     “인프라 레벨에서 AI가 도와줄 수 있는 영역”도 눈에 들어오기 시작한다.

---

## 8. 다음 글 예고 – LLM + pytest로 QA 코딩 연습 문제 자동 생성하기

2편에서는 주로 인프라 이야기를 했다.  
다음 3편에서는 이 인프라 위에서 돌아가는 **AI + pytest 기반 QA 문제 생성 파이프라인**을 다룰 예정이다.

- LLM에게 어떤 프롬프트를 줬더니
- 어떤 형식으로 함수/버그/테스트 코드가 생성되고
- 실제 컨테이너 환경에서 pytest로 어떻게 검증했는지
- 그 과정에서 “AI에게 맡길 수 있는 부분”과 “QA가 직접 컨트롤해야 하는 부분”이 어떻게 갈리는지

를 기록해 볼 생각이다.

> 인프라는 “실험실의 바닥”이다.  
> 바닥을 직접 깔고 나니, 이제 그 위에서  
> AI와 테스트 자동화를 마음껏 섞어볼 수 있는 상황이 되었다.
