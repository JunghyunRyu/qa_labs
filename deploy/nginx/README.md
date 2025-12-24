# Nginx Configuration for QA Arena

## Setup Instructions

1. Copy the configuration file to nginx:
```bash
sudo cp qa-arena.conf /etc/nginx/sites-available/qa-arena
```

2. Enable the site:
```bash
sudo ln -sf /etc/nginx/sites-available/qa-arena /etc/nginx/sites-enabled/qa-arena
```

3. Remove default site (optional):
```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

4. Test and reload nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## SSL Certificate

SSL certificates are managed by Let's Encrypt (certbot).

Renew certificates:
```bash
sudo certbot renew
```

## Ports

- Frontend (Next.js): `127.0.0.1:3000`
- Backend (FastAPI): `127.0.0.1:8001`
