# QA-Arena Infrastructure Overview

## 📌 Purpose
This document provides a high-level overview of the QA-Arena production architecture, including service composition, routing, and operational components.

> 📅 Last Updated: 2025-12-18
> 하이브리드 아키텍처 (클라이언트 + 서버 사이드 실행) 반영

---

## 🖥️ EC2 Server Information
| Item | Value |
|------|--------|
| OS | Ubuntu 24.04 LTS |
| Instance | t3.medium |
| Domain | https://qa-arena.qalabs.kr |
| Project Path | `/home/ubuntu/qa_labs` |

---

## 🧱 Architecture Structure (Docker Compose)

The QA-Arena production stack consists of:

```
postgres           # PostgreSQL 15
redis              # Redis 7 (Celery broker + result backend)
backend            # FastAPI + JWT 인증
celery_worker      # 채점 Worker (서버 사이드 Fallback용)
worker_monitor     # Worker 헬스체크 + Slack 알림
frontend           # Next.js + Pyodide (클라이언트 사이드 채점)
nginx              # Reverse proxy + SSL (Let's Encrypt)
```

> **참고**: 클라이언트 사이드 실행(Pyodide)이 기본이므로,
> celery_worker는 Fallback용으로만 사용됩니다.
> Celery Worker가 다운되어도 기본 채점 기능은 정상 동작합니다.

---

## 🔀 Reverse Proxy Routing

| Route | Service |
|-------|---------|
| `/` | Next.js Frontend |
| `/api` | FastAPI Backend |

---

## 🗂️ Directory Structure (Simplified)
```
qa_labs/
└── backend/
└── frontend/
└── docker-compose.prod.yml
└── .env
└── nginx/
```

---

## 🔧 Technology Stack Summary
- **Frontend:** Next.js 14 + TypeScript + Monaco Editor
- **Client-side Execution:** Pyodide (WebAssembly Python) + Web Worker
- **Backend:** FastAPI (Python 3.11+)
- **Authentication:** GitHub OAuth + JWT
- **Task Queue:** Celery + Redis (서버 사이드 Fallback 및 AI 피드백용)
- **Database:** PostgreSQL 15
- **Reverse Proxy:** Nginx + Let's Encrypt SSL
- **Monitoring:** Sentry (Frontend + Backend)
- **Alerting:** Slack Webhook (Worker Monitor)
- **Orchestration:** Docker Compose
- **Hosting:** AWS EC2

---

## 📝 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12 | 초기 문서 생성 |
| 2025-12-18 | 클라이언트 사이드 실행(Pyodide) 하이브리드 아키텍처 반영 |
