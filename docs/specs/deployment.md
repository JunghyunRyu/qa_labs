# QA-Arena Deployment Guide

## 📌 Purpose
Defines the official and quick deployment flows for the QA-Arena production environment.

---

# 1. Prerequisites
- SSH access to EC2
- GitHub repo connected to EC2
- `.env` file exists on EC2
- Docker & Docker Compose installed

---

# 2. Standard Deployment Procedure

```bash
ssh -i ~/.ssh/my_proton_key.pem ubuntu@<EC2-IP>
```

Then:

```bash
cd ~/qa_labs
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker ps
```

---

# 3. Quick Deploy

```bash
ssh -i ~/.ssh/my_proton_key.pem ubuntu@<EC2-IP> "cd ~/qa_labs && git pull && docker compose -f docker-compose.prod.yml --env-file .env up -d --build && docker ps"
```

---

# 4. Notes
- `.env` changes require rebuild
- Backend changes require rebuild
- Frontend static changes require rebuild
