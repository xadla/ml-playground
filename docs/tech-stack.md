# Technology Stack – ML Playground

**Version:** 1.0
**Date:** 2026-06-06
**Author:** Mohammadhadi

---

## 1. Overview

The ML Playground is a full‑stack web application with an interactive frontend, a REST API backend, a relational database, and a background task queue for machine learning workloads. The stack is chosen to be **modern, fast to develop with, highly performant, and impressive in a portfolio setting**. Every major decision is explained below.

---

## 2. Stack Summary

| Layer | Technology | Version (pinned) |
|-------|------------|------------------|
| **Frontend** | React, Vite, Tailwind CSS, Recharts, React Query | React 18, Vite 5 |
| **Backend** | FastAPI (Python 3.11+), Uvicorn | FastAPI 0.115 |
| **ORM & Migrations** | SQLAlchemy 2.0 (async), Alembic | SQLAlchemy 2.0 |
| **Database** | PostgreSQL | 16 |
| **Task Queue** | Celery with Redis as broker | Celery 5.4, Redis 7 |
| **ML / Scientific** | scikit‑learn, numpy, matplotlib | Latest stable |
| **Authentication** | JWT (python‑jose), bcrypt (passlib) | – |
| **Containerization** | Docker, docker‑compose | – |
| **CI/CD** | GitHub Actions | – |
| **Hosting** | Render / Railway / AWS EC2 | – |
| **Version Control** | Git, GitHub | – |
| **Web Server** | Nginx | 1.20 |

---

## 3. Frontend

| Technology | Purpose | Why this choice |
|------------|---------|-----------------|
| **React** | UI library | Most popular frontend framework; vast ecosystem; looks great on a resume. |
| **Vite** | Build tool & dev server | Extremely fast HMR, zero‑config TypeScript support, out‑of‑the‑box optimised builds. Much better DX than Create React App. |
| **Tailwind CSS** | Utility‑first CSS | Rapid prototyping without leaving HTML; easy to create a consistent, modern design system; highly customisable. |
| **Recharts** | Charting library (metrics, confusion matrix heatmap, scatter plots) | React‑native, composable charts with good defaults. Lightweight and well‑documented. |
| **React Query (TanStack Query)** | Server‑state management | Simplifies API calls, caching, loading states, and background updates. Reduces boilerplate dramatically. |
| **Axios** | HTTP client | Cleaner API than `fetch`, interceptors for JWT tokens, automatic JSON parsing. |
| **shadcn/ui** (optional) | Pre‑styled accessible components | Gives a polished look without a heavy UI library; built on Tailwind. Good for the canvas controls, modals, and forms. |
| **React Router** | Client‑side routing | De facto standard for React SPAs; needed for history page and protected routes. |

**Key principle:** The frontend must stay snappy and responsive, even while waiting for training results. React Query’s polling and background updates handle this elegantly.

---

## 4. Backend

| Technology | Purpose | Why this choice |
|------------|---------|-----------------|
| **FastAPI** | Web framework | Modern, async‑first, auto‑generated OpenAPI docs (`/docs`), built‑in validation via Pydantic. Faster to write and run than Django/Flask. |
| **Uvicorn** | ASGI server | Lightweight, high‑performance, the standard for FastAPI. |
| **SQLAlchemy 2.0 (async)** | ORM | Mature, powerful, supports async sessions natively in 2.0. Allows writing clean, high‑level database code. |
| **Alembic** | Database migrations | Integrates seamlessly with SQLAlchemy. Tracks schema changes in version control. |
| **Pydantic** | Data validation & serialization | Bundled with FastAPI; used for request/response schemas, environment config. |
| **Celery** | Background task queue | Handles ML training asynchronously without blocking the API. Robust, battle‑tested, supports retries. |
| **Redis** | Message broker for Celery | In‑memory, extremely fast, also useful for caching (future) and rate‑limiting. |
| **scikit‑learn** | Machine learning algorithms | The standard library for classical ML. Stable, well‑documented, covers all required algorithms (Logistic Regression, Decision Tree, k‑NN, K‑Means). |
| **numpy / matplotlib** | Numerical processing & plotting | Needed by scikit‑learn for data manipulation and to generate decision boundary / confusion matrix plots server‑side. |
| **python‑jose + passlib** | JWT handling & password hashing | `python‑jose` for encoding/decoding JWT tokens; `passlib` with bcrypt for secure password storage. |

**Key principle:** The backend is split into clear layers (routers → services → models), and all I/O (database, file system, ML training) is asynchronous or offloaded to Celery, keeping the API responsive.

---

## 5. Web Server & Reverse Proxy

| Technology | Purpose | Why this choice |
|------------|---------|-----------------|
| **Nginx** | Reverse proxy, static file serving, TLS termination | Routes requests to the FastAPI backend and serves the built React frontend as static files. Handles HTTPS (via Let's Encrypt), gzip compression, caching headers, and rate limiting before requests hit the application. Essential for any production deployment. |

**Configuration highlights:**
- `/api/` → proxied to FastAPI (Uvicorn on internal port 8000)
- `/` → serves React build output (static files)
- In development, `docker-compose` uses Nginx to unify frontend and backend on a single port, mimicking production.

---

## 6. Database

| Technology | Purpose | Why this choice |
|------------|---------|-----------------|
| **PostgreSQL 16** | Primary data store | Industry‑standard relational database. Excellent JSONB support (for canvas data and hyperparameters), robust ACID compliance, mature ecosystem. Scales from a single server to managed cloud. |

**Alternative considered:** SQLite for simplicity. Rejected because JSONB and concurrent access (Celery workers) are better handled by PostgreSQL. Plus, PostgreSQL on a resume signals real‑world experience.

---

## 7. DevOps & Deployment

| Technology | Purpose | Why this choice |
|------------|---------|-----------------|
| **Docker** | Containerization | Consistent environment across dev, CI, and production. Every service (backend, frontend, Redis, PostgreSQL) runs identically everywhere. |
| **docker‑compose** | Local orchestration | One‑command startup of the entire stack (`docker-compose up`). Makes onboarding trivial. |
| **GitHub Actions** | CI/CD | Free for public repos, easy to set up testing, linting, and deployment pipelines. Shows professional DevOps awareness. |
| **Render / Railway** | Cloud hosting (MVP) | Modern PaaS with simple Docker support, free tiers, and auto‑deploy from GitHub. Avoids the complexity of bare AWS while remaining scalable. |
| **Vercel** (alternative for frontend) | Frontend hosting | If decoupled, the frontend can be deployed to Vercel for optimal CDN performance. |

**Key principle:** The project must be runnable with a single `docker-compose up` command and deployable with a single Git push.

---

## 8. Development Tools & Practices

| Tool | Purpose |
|------|---------|
| **TypeScript** | Optional for frontend (improves code quality and resume appeal; can be added incrementally). |
| **ESLint + Prettier** | Code formatting and linting (consistency). |
| **pytest + pytest‑asyncio** | Backend testing framework. |
| **Vitest** (if TypeScript) | Frontend testing (fast, Vite‑native). |
| **mypy** | Static type checking for Python backend. |
| **pre‑commit hooks** | Run linters and formatters before commits. |

---

## 9. Why This Stack Excels for a Portfolio

1. **Modern and future‑proof** – React 18, FastAPI, async Python, and Docker are exactly what companies use today.
2. **Full‑stack coverage** – demonstrates frontend, backend, database, DevOps, and even ML integration.
3. **High developer velocity** – Vite, Tailwind, FastAPI auto‑docs, and React Query let you build features fast.
4. **Production‑ready patterns** – background tasks (Celery), proper authentication (JWT + bcrypt), database migrations (Alembic), and CI/CD are not toy‑project details.
5. **Well‑documented ecosystem** – every tool has strong community support, making it easy to find help and contributors.

---

## 10. What We Deliberately Avoided

- **Django** – too heavy for a focused API. FastAPI gives better performance and auto‑generated docs.
- **Next.js** – adds server‑side rendering complexity we don’t need. A SPA (React + Vite) is perfect for this interactive tool.
- **TensorFlow / PyTorch** – overkill for classical ML; scikit‑learn keeps training fast and models interpretable.
- **NoSQL (MongoDB)** – relational data with relationships (users → experiments → results) is best modelled in PostgreSQL. JSONB gives us flexibility where needed.

---

*This stack is chosen to maximise learning value, development speed, and portfolio impact. Every tool has a reason to be there.*
