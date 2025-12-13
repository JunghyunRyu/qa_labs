# QA-Arena Infrastructure Overview

## 📌 Purpose
This document provides a high-level overview of the QA-Arena production architecture, including service composition, routing, and operational components.

> 📅 Last Updated: 2025-12

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
celery_worker      # 채점 Worker (Docker-in-Docker)
worker_monitor     # Worker 헬스체크 + Slack 알림
frontend           # Next.js + Sentry
nginx              # Reverse proxy + SSL (Let's Encrypt)
```

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
- **Backend:** FastAPI (Python 3.11+)
- **Authentication:** GitHub OAuth + JWT
- **Task Queue:** Celery + Redis
- **Database:** PostgreSQL 15
- **Reverse Proxy:** Nginx + Let's Encrypt SSL
- **Monitoring:** Sentry (Frontend + Backend)
- **Alerting:** Slack Webhook (Worker Monitor)
- **Orchestration:** Docker Compose
- **Hosting:** AWS EC2
