<h1 align="center">
  <!-- <img src="https://your-logo-url.svg" alt="ML Playground" width="100"/> -->
  <br>
  ML Playground
</h1>

<h4 align="center">Experiment with machine learning in the browser — no setup, no code, instant visual results.</h4>

<p align="center">
  <a href="https://ml-playground.vercel.app">Live Demo</a> •
  <a href="#key-features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="docs/">Documentation</a>
</p>

<!-- ![screencast](docs/wireframes/demo.gif) -->

## Why this exists
Beginners hit walls with setup and code‑first approaches. ML Playground gives them a sandbox to **create data, pick an algorithm, tweak hyperparameters, and see outcomes instantly** — all without leaving the browser. It’s designed for learners who need to *see* how ML works, not just read theory.

👉 [Read the full project vision](docs/goal.md)

## Key Features
- 📝 **Inline table editor** — invent small datasets in seconds
- 🧠 **4 classical algorithms** (Logistic Regression, Decision Tree, k‑NN, K‑Means)
- 🎛️ **Interactive hyperparameter sliders**
- 📊 **Instant metrics & plots** (accuracy, confusion matrix, decision boundaries)
- 📁 **Save & compare experiments** side‑by‑side
- 🔒 **No account needed** — start experimenting immediately

## Tech Stack
| Layer      | Technology |
|------------|------------|
| Frontend   | React, Vite, Tailwind CSS, Recharts |
| Backend    | FastAPI, Celery, Redis, scikit‑learn |
| Database   | PostgreSQL, SQLAlchemy, Alembic |
| Deployment | Docker, GitHub Actions, Railway |