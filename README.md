<h1 align="center">
  <img src="docs/logo.png" alt="ML Playground" width="80"/>
  <br>
  ML Playground
</h1>

<h4 align="center">Draw data. Tune models. See results. <em>No code, no setup.</em></h4>

<p align="center">
  <a href="https://ml-playground-demo.vercel.app">Live Demo</a> •
  <a href="#key-features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="docs/">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
  <img src="https://img.shields.io/badge/docs-complete-brightgreen" alt="Documentation"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome"/>
</p>

![Demo Screenshot](docs/wireframes/demo.gif)

---

## Why this exists

Beginners hit walls with setup and code‑first approaches.
**ML Playground** gives them a visual sandbox to:

- 🎨 **Draw datasets** by clicking on a 2D canvas
- 🧠 **Pick a classical ML algorithm** (Logistic Regression, Decision Tree, k‑NN, K‑Means)
- 🎛️ **Tune hyperparameters** with sliders
- 📊 **See instant metrics, confusion matrices, and decision boundaries**
- 🔐 **Save experiments** to your personal history and compare them side‑by‑side

👉 [Read the full project vision](docs/goal.md)

---

## Key Features

- ✏️ **Visual point‑and‑click data canvas** – create classification datasets by placing points, no spreadsheets needed
- 📁 **Upload your own CSV** or start from a built‑in dataset (Iris, Wine, …)
- ⚙️ **4 classical algorithms** with interactive hyperparameter controls
- ⚡ **Asynchronous training** – the UI stays snappy while models train in the background
- 📈 **Instant results** – accuracy, precision, recall, F1‑score, confusion matrix heatmap, decision boundary plot
- 🔒 **User accounts** – sign up, log in, save experiments, and compare past runs
- 🐳 **One‑command startup** with Docker – zero‑dependency local development
- 📚 **Fully documented** – from vision to deployment

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, React Query |
| **Backend** | FastAPI (Python 3.11), Uvicorn, Celery, Redis |
| **ML / Scientific** | scikit‑learn, numpy, matplotlib |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 (async), Alembic |
| **Web Server** | Nginx (reverse proxy, TLS termination, static files) |
| **Containerization** | Docker, docker‑compose |
| **CI/CD** | GitHub Actions |
| **Cloud** | Railway / Render / AWS EC2 |

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-username/ml-playground.git
cd ml-playground

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, database password, etc.)

# 3. Start everything
docker-compose up --build

# 4. Open the app
open http://localhost
```

The app will be available at `http://localhost`.

FastAPI auto‑generated docs: `http://localhost/api/docs`

---

## Documentation

All project documentation lives in the `docs/` folder.

Highly recommended reading for contributors and curious engineers:

| Document | Description |
|---|---|
| Project Vision | Why this project exists and for whom |
| Requirements | Full functional & non‑functional specs |
| User Stories | 27 stories with priorities and traceability |
| Tech Stack | Tooling choices and justifications |
| Database Schema | ERD, table definitions, design rationale |
| Architecture Overview | System design, data flows, component details |
| API Specification | All REST endpoints and examples |
| Deployment Plan | CI/CD, containerization, TLS, scaling |
| Wireframes | UI mockups (coming soon) |

---

## Architecture at a Glance
```text
Browser → Nginx (TLS) → React (static) + FastAPI (api)
                       → Celery Worker (ML training)
                       → PostgreSQL (data) + Redis (queue)
```

[Full architecture diagram and explanation →](/docs/architecture.md)

---

## Contributing

Contributions are welcome!

See `CONTRIBUTING.md` for guidelines on adding new algorithms, visualizations, or improving the data canvas.

---

## License

This project is licensed under the MIT License – see `LICENSE` for details.

---

## Author

Mohammadhadi
[GitHub]() • [LinkedIn]()

<p align="center">Built with ❤️ and a lot of scikit‑learn</p>
