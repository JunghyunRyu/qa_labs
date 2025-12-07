# QA-Arena Infrastructure Overview

## 📌 Purpose
This document provides a high-level overview of the QA-Arena production architecture, including service composition, routing, and operational components.

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
postgres
redis
backend (FastAPI)
celery_worker
frontend (Next.js)
nginx (reverse proxy & SSL)
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
- **Frontend:** Next.js
- **Backend:** FastAPI
- **Task Queue:** Celery + Redis
- **Database:** PostgreSQL
- **Reverse Proxy:** Nginx
- **Orchestration:** Docker Compose
- **Hosting:** AWS EC2
