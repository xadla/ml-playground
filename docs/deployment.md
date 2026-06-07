# Deployment Plan – ML Playground

**Version:** 1.0  
**Date:** 2026-06-07  
**Author:** Mohammadhadi  

---

## 1. Overview

The ML Playground is deployed as a set of Docker containers behind an Nginx reverse proxy.  
The goal is **one‑command startup** locally (`docker-compose up`) and **automated zero‑downtime deployment** to a cloud VM or PaaS on every push to `main`.

### Target Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| **Development** | Local coding & testing | Docker Desktop + `docker-compose` |
| **Staging / Preview** | Pre‑release validation | Railway / Render preview env |
| **Production** | Live public app | Ubuntu VM (AWS EC2, Hetzner, etc.) or Railway / Render |

---

## 2. Infrastructure Components
```text
[Internet] → Nginx (443) → Frontend (static files)
→ FastAPI (8000) → PostgreSQL
→ Redis (Celery broker)
→ Celery Worker
```

- **Nginx** – terminates TLS, serves React build, proxies `/api` to FastAPI.
- **FastAPI** – handles API logic, authentication, and submits tasks to Celery.
- **Celery Worker** – runs scikit‑learn training asynchronously.
- **PostgreSQL** – persistent data (users, experiments, results).
- **Redis** – message broker for Celery (and future caching).
- **Volumes** – PostgreSQL data, uploaded files (CSVs, plots), and frontend build output.

All services are containerised. In production, only Nginx exposes a port (443). All others communicate over an internal Docker network.

---

## 3. Containerisation

### 3.1 Docker Images

| Service | Dockerfile location | Base image |
|---------|---------------------|------------|
| frontend | `frontend/Dockerfile` | `node:20-alpine` (build stage), `nginx:1.25-alpine` (serve stage) |
| backend / celery_worker | `backend/Dockerfile` | `python:3.11-slim` |
| nginx | – | `nginx:1.25-alpine` (custom config mounted) |
| postgres | – | `postgres:16-alpine` |
| redis | – | `redis:7-alpine` |

**Frontend Dockerfile (multi‑stage)**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage (Nginx)
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
**Backend Dockerfile**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
## 3.2 Volumes & Persistent Storage

- **postgres_data** – PostgreSQL data directory.
- **uploads** – uploaded CSV files (mounted from host or cloud block storage).
- **plots** – generated plot images (mounted from host or cloud block storage).

In production, these should be bind‑mounted to a dedicated data directory (e.g., `/data/mlplayground/`) or replaced with managed storage (S3 for uploads/plots, managed database).

---

## 4. Environment & Secrets Management

All configuration is injected via environment variables. **Never commit `.env` to Git.**

### 4.1 Required Environment Variables

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Secret key for signing JWTs | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@db:5432/mlplayground` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `POSTGRES_USER` | Database user | `mlplayground` |
| `POSTGRES_PASSWORD` | Database password | `strongpassword` |
| `POSTGRES_DB` | Database name | `mlplayground` |
| `ENVIRONMENT` | `development` / `production` | `production` |

### 4.2 Handling Secrets in Production

- Use GitHub Actions secrets for CI/CD.
- On the server, use a `.env` file with restricted permissions (`chmod 600 .env`).
- For a PaaS (Railway/Render), secrets are set via the dashboard and injected at runtime.

---

## 5. Nginx Configuration (Production)

A minimal Nginx config (`nginx/nginx.conf`) that routes traffic and applies security headers:
```nginx
server {
    listen 80;
    server_name ml-playground.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ml-playground.com;

    ssl_certificate /etc/letsencrypt/live/ml-playground.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ml-playground.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API proxy
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (React build)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri /index.html;
    }

    # Generated plots
    location /plots/ {
        alias /app/plots/;
        expires 7d;
    }
}
```

---

## 6. CI/CD Pipeline (GitHub Actions)

### 6.1 Workflow Triggers

- Push to `main` → build, test, deploy to production.
- Pull request to `main` → build, test, deploy to preview environment.

### 6.2 Pipeline Steps (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci && npm run lint && npm run build

  build-and-push:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      - name: Build & push backend
        run: |
          docker build -t yourdockerhub/ml-playground-backend:latest ./backend
          docker push yourdockerhub/ml-playground-backend:latest
      - name: Build & push frontend
        run: |
          docker build -t yourdockerhub/ml-playground-frontend:latest ./frontend
          docker push yourdockerhub/ml-playground-frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/ml-playground
            docker-compose pull
            docker-compose up -d --remove-orphans
            docker system prune -f
```

### 6.3 Alternative: Deploy to Railway / Render

If using a PaaS, replace the deploy job with:
- **Railway:** `railway up` CLI command (after installing Railway CLI).
- **Render:** Render's native GitHub integration auto‑deploys from a `render.yaml` Blueprint.

---

## 7. Deployment Targets (Detailed)

### 7.1 Development (Local)
```bash
# Clone repo
git clone https://github.com/your-username/ml-playground.git
cd ml-playground

# Copy env template
cp .env.example .env
# Edit .env with real values

# Start everything
docker-compose up --build
```

Access the app at `http://localhost`.

### 7.2 Production on a Single VM (e.g., AWS EC2, Hetzner)

1. Provision a Ubuntu 22.04 VM (2 vCPU, 4 GB RAM minimum).
2. Install Docker and docker‑compose.
3. Clone the repo to `/opt/ml-playground`.
4. Create `.env` file with production secrets.
5. Set up Let's Encrypt:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d ml-playground.com
```

6. Update Nginx config with the correct domain and certificate paths.
7. Run `docker-compose -f docker-compose.prod.yml up -d`.
8. Configure automatic renewal via cron: `0 3 * * * certbot renew --quiet && docker-compose restart nginx`.

### 7.3 Production on Railway / Render (PaaS – easiest)

1. Add a `railway.json` or `render.yaml` that describes services.
2. Use managed PostgreSQL and Redis add‑ons.
3. No Nginx container needed (platform provides reverse proxy and TLS).
4. Set environment variables in the dashboard.
5. Connect GitHub repo for auto‑deploy.

---

## 8. TLS & Domain Setup

- **Domain:** Purchase from Namecheap / Google Domains.
- **DNS:** Point A record to server IP (or CNAME for PaaS).
- **TLS:** Let's Encrypt with Certbot (standalone or via Nginx plugin). Auto‑renew via cron.
- **HTTP → HTTPS redirect:** enforced in Nginx config (see above).

---

## 9. Database Backups

- **PostgreSQL:** Schedule daily backups using `pg_dump` in a cron job or a sidecar container.
```bash
docker exec ml-playground-db-1 pg_dump -U user mlplayground > backup.sql
```

- Store backups in a cloud bucket (S3) or an external volume.
- For PaaS, enable automatic backups provided by the managed database service.

---

## 10. Monitoring & Logging

- **Container logs:** `docker-compose logs -f` or aggregated via Docker's journald driver.
- **Health check:** `/api/v1/health` endpoint monitored by UptimeRobot (free).
- **Metrics (future):** Prometheus + Grafana for request latency, Celery queue length, and error rates.

---

## 11. Rollback Strategy

- Docker images are tagged with commit SHA in CI/CD (in addition to `latest`). In production, `docker-compose` uses the specific tag.
- To rollback: `docker-compose up -d backend=<previous-tag>` (re‑pull old image).
- Database rollback requires Alembic downgrade: `alembic downgrade -1` (test carefully).

---

## 12. Future Scaling Considerations

- **Horizontal scaling:** Place Nginx in front of multiple backend containers and use a load‑balancing mechanism (e.g., Traefik or AWS ALB).
- **Managed services:** Migrate PostgreSQL to AWS RDS, Redis to ElastiCache, and file storage to S3.
- **Celery concurrency:** Increase `--concurrency` or run multiple worker containers.

---

*This deployment plan turns a collection of code into a living, accessible web application. Follow it step by step, and the ML Playground will be safely online, maintainable, and ready to impress.*