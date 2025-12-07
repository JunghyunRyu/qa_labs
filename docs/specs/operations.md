# QA-Arena Operations & Incident Response Guide

## 📌 Purpose
Step-by-step procedures for identifying issues, recovering the system, and performing routine operational checks.

---

# 1. Frequently Used Commands

### Check container status
```bash
docker ps
```

### View logs
```bash
docker logs backend -f
docker logs celery_worker -f
docker logs nginx -f
docker logs postgres -f
```

### Rebuild and restart all services
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Restart single service
```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

# 2. Incident Response Workflow

## Step 1. Identify failed service
```bash
docker ps
```

## Step 2. Inspect logs
```bash
docker logs backend --tail 200
```

## Step 3. Rebuild system
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Step 4. Rollback
```bash
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

---

# 3. Daily & Weekly Checklist

## Daily
- docker ps  
- docker logs celery_worker  
- df -h  
- htop  

## Weekly
- Create DB backup  
- Check SSL certificate  
- Ensure repo sync  
