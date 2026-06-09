# Security – ML Playground

**Version:** 1.0
**Date:** 2026-06-07
**Author:** Mohammadhadi

---

## 1. Overview

Security is built into every layer of the ML Playground — not bolted on at the end. This document describes the measures taken to protect user data, prevent abuse, and ensure the application remains trustworthy. It is intended for developers, reviewers, and anyone evaluating the project’s production readiness.

### Guiding Principles
- **Defence in depth** – multiple overlapping protections.
- **Least privilege** – every component only has the permissions it needs.
- **Secure by default** – insecure settings are opt‑in, never the default.
- **Transparency** – users know what happens with their data.

---

## 2. Authentication & Session Management

### 2.1 Password Handling
- **Hashing:** All passwords are hashed using `bcrypt` via `passlib`. bcrypt is intentionally slow, making brute‑force attacks expensive.
- **Storage:** Only the hash is stored in the `users` table. Plain‑text passwords never touch the database.
- **Validation:** Minimum 8 characters enforced by Pydantic schema.

### 2.2 JSON Web Tokens (JWT)
- **Algorithm:** HS256 with a strong, randomly generated secret (`JWT_SECRET`).
- **Expiry:** Access tokens expire after **24 hours**. No refresh tokens in MVP (the user re‑logs in); future versions will add refresh token rotation.
- **Storage on client:** Tokens are stored in `localStorage` (MVP). For production hardening, move to an httpOnly, Secure, SameSite cookie.
- **Transmission:** Tokens are sent only over HTTPS (enforced by Nginx).

### 2.3 Protected Endpoints
- All endpoints that modify user data or return private information are marked 🔒 in the [API specification](api-spec.md).
- A FastAPI dependency (`get_current_user`) decodes and validates the JWT on every request, then retrieves the user from the database.
- **Rate limiting on login:** Maximum **5 failed attempts per minute per IP** (handled via `slowapi` or Nginx `limit_req`).

---

## 3. Data Protection

### 3.1 User Data
- **Personally identifiable information (PII):** Only the user’s email address is stored (hashed password is not PII).
- **Dataset handling:**
  - **Canvas data** (points drawn by the user) is stored as JSONB in the `datasets` table. It contains no PII.
  - **Uploaded CSV files** are stored temporarily on disk. A periodic cleanup job (cron) removes files older than 24 hours.
  - **Experiment results** (metrics, plots) are linked to the user but contain only aggregate statistics, never raw data points (unless the user saves a dataset explicitly).
- **Data at rest:** PostgreSQL data is stored on a Docker volume. In production, volume encryption at the host level is recommended (e.g., LUKS, AWS EBS encryption).
- **Data in transit:** All traffic between the browser and the server is encrypted with TLS 1.2+ (enforced by Nginx).

### 3.2 No Third‑Party Sharing
- No data is shared with external analytics services, ad networks, or tracking tools.
- No telemetry is collected beyond standard web server access logs (which can be disabled).

---

## 4. Infrastructure Security

### 4.1 Nginx Configuration
- **HTTP → HTTPS redirect:** All port 80 traffic is redirected to 443.
- **Security headers:**
  - `Strict-Transport-Security` (HSTS) with `max-age=63072000`
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Content-Security-Policy` (CSP) – to be added in a future update for tighter control of inline scripts and external resources.
- **TLS configuration:** Only TLS 1.2 and 1.3 are enabled. Strong cipher suites are configured. (Managed by Let's Encrypt / certbot in production.)

### 4.2 Docker Hardening
- Containers run as **non‑root users** (configured in each Dockerfile).
- Backend, Celery worker, and database are on an internal Docker network. Only Nginx exposes a port to the host.
- Docker socket is never mounted inside containers.
- Images are scanned for vulnerabilities (can be integrated into GitHub Actions via `docker scout` or `trivy`).

### 4.3 Port Exposure
| Service | Exposed to host | Exposed to internet |
|---------|-----------------|---------------------|
| Nginx | 80, 443 | Yes (via firewall) |
| FastAPI | 8000 (internal) | No |
| PostgreSQL | 5432 (internal) | No |
| Redis | 6379 (internal) | No |
| Celery Worker | – | No |

### 4.4 Firewall
- On a production VM, `ufw` (or cloud security groups) restricts inbound traffic to ports 22 (SSH), 80, and 443 only.

---

## 5. Application Security

### 5.1 Input Validation
- **Pydantic schemas** on every endpoint strictly validate request bodies, query parameters, and file uploads.
- **File upload restrictions:**
  - Max size: 5 MB (enforced by FastAPI `UploadFile`).
  - Allowed MIME types: `text/csv` only.
  - File contents are parsed server‑side; malformed CSV is rejected.
- **Canvas data validation:** Maximum 200 data points, each point validated for numeric coordinates and valid class labels.

### 5.2 SQL Injection Prevention
- All database queries use **SQLAlchemy ORM** with parameterized queries. Raw SQL is never concatenated with user input.

### 5.3 Cross‑Site Scripting (XSS) Prevention
- React automatically escapes all values inserted into JSX, preventing XSS.
- No user‑generated HTML is rendered (no `dangerouslySetInnerHTML`).
- Dataset names and other user‑provided strings are treated as plain text.

### 5.4 Cross‑Site Request Forgery (CSRF)
- Since authentication uses a JWT sent in the `Authorization` header (not a cookie), CSRF attacks are not applicable. The browser will not automatically attach the header.

### 5.5 Rate Limiting
- **Authentication endpoints:** 5 requests per minute per IP.
- **General API endpoints:** 60 requests per minute per authenticated user, 30 per anonymous IP.
- Implemented via `slowapi` (backend) or Nginx `limit_req` for coarse‑grained limits.

### 5.6 Dependency Management
- All Python and Node packages are pinned to exact versions in `requirements.txt` / `package-lock.json`.
- Renovate or Dependabot configured to automatically open PRs for security updates.

---

## 6. Operational Security

### 6.1 Secrets Management
- All secrets (`JWT_SECRET`, `DATABASE_URL`, `POSTGRES_PASSWORD`) are injected via environment variables, never committed to Git.
- A `.env.example` file provides the template without real values.
- In production, secrets are stored in GitHub Actions secrets, Railway/Render dashboard, or a `.env` file with `chmod 600`.

### 6.2 Logging
- No sensitive information (passwords, full tokens) is logged.
- Access logs capture IP addresses, timestamps, and requested paths — useful for debugging and rate limiting.
- Logs are shipped to stdout/stderr and collected by Docker; no external log service in MVP.

### 6.3 Backups
- Daily PostgreSQL backups via `pg_dump`, encrypted and stored off‑server (S3 or external volume).
- Backup retention: 7 daily backups, rotated weekly.

### 6.4 Incident Response (future)
- For the portfolio project, a short incident response plan can be included: define who is responsible, how to roll back, and who to notify in case of a data breach (even if it's just you). This shows maturity.

---

## 7. Testing for Security

- **Automated tests:** All authentication dependencies are tested (`pytest`) to ensure invalid tokens are rejected.
- **Manual testing:** Before launch, perform a basic security check:
  - Try accessing protected endpoints without a token → must return `401`.
  - Try submitting invalid JWTs → must return `401`.
  - Upload a non‑CSV file → must return `400`.
- **Future:** Integrate a SAST tool (e.g., Bandit for Python, npm audit for JS) into the CI/CD pipeline.

---

## 8. Responsible Disclosure

If you discover a security vulnerability in the ML Playground, please report it by opening a private issue or emailing `hadinjr4122@gmail.com`.
I commit to acknowledging reports within 48 hours and providing a timeline for a fix.

---

*This document demonstrates that security is a first‑class citizen in the ML Playground architecture and development process.*
