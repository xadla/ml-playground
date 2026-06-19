# Project Vision: ML Playground

## 1. Problem Statement
Learning machine learning should be about exploration, not environment setup.
Today, a student who wants to understand how a Decision Tree behaves must:
- Install Python, libraries, and an IDE
- Write boilerplate code just to load data and train a model
- Manually re‑run scripts to see the effect of a changed hyperparameter
- Open a spreadsheet or write code just to create a tiny test dataset

This friction kills curiosity, slows down learning, and excludes people who learn best by doing.
ML Playground eliminates every barrier — it puts a live, interactive ML lab in the browser where users can **draw their data** by clicking on a canvas, train models instantly, and see results visually. No code, no spreadsheets, no setup.

## 2. Target Users
- **Primary:** Data science students and self‑taught learners who want to build intuition by tinkering — especially those who think visually and want to *sketch* data points rather than type them.
- **Secondary:** Instructors leading workshops who can draw a dataset live during a lecture; analysts who need a quick one‑off model on small tabular data.
- **Tertiary:** Technical recruiters and peers evaluating this portfolio — they'll see a product that solves a real human problem with genuine UX innovation.

## 3. Core User Journey (The "Aha!" Loop)
1. **Draw or load data** – User lands on a 2D canvas. They **click to place points** for different classes (e.g., red dots for Class A, blue dots for Class B), visually building a dataset in seconds. Alternatively, they can pick a built‑in dataset or upload a CSV.
2. **Configure** – Chooses an algorithm (e.g., k‑NN) from a list. Relevant hyperparameter sliders appear. Drags a slider to change `k`.
3. **Train & Visualise** – Clicks "Run" and instantly gets accuracy, a confusion matrix, and a decision‑boundary plot overlaid on their hand‑drawn points.
4. **Iterate** – Drags a point on the canvas, clicks "Run" again — sees how the boundary shifts. Moves the slider, clicks "Run" — sees the model change in real time.
5. **Save & Compare** (authenticated users) – Creates an account, saves the experiment to a personal history, runs another, and views a side‑by‑side comparison.

This entire loop is designed to take **under 90 seconds** for a hand‑drawn dataset, turning "what if?" into "I see!" with zero code and zero spreadsheets.

## 4. Unique Value Proposition
Unlike Google Colab (code‑first, requires setup), Teachable Machine (only classification on pre‑defined image/audio data), or other ML demos (read‑only, no data creation),
ML Playground is:
- **Open‑source** and **self‑hostable**
- Focused on **tabular data** and **classical ML algorithms** (where hyperparameter intuition matters most)
- Built around a **visual point‑and‑click data canvas** — users *draw* their datasets directly, no spreadsheet or code required
- Designed to make the **invisible knobs of ML visible** — every hyperparameter has a live visual consequence on the user's own data
- **Account‑based with persistent history** — users can save experiments, return later, and compare results across sessions
- A **portfolio‑grade full‑stack system** that demonstrates backend (FastAPI), frontend (React), database design (PostgreSQL), MLOps, UX design, and authentication

## 5. Business Goals (Product & Portfolio)
- **Product goal:** Become the quickest, most intuitive way for anyone to test a classical ML idea on a small dataset — no setup, no code, just click and draw.
- **Learning goal:** Reduce the time from "I wonder what changing C in SVM does to this cluster shape" to "I can see it" to under 90 seconds.
- **Portfolio goal:** Prove end‑to‑end technical ability and product thinking — from user research and UX design to deployment, authentication, and monitoring.
- **Community goal:** Attract open‑source contributions (new algorithms, visualization types, data canvas tools) and build a reputation as a maintainer.

## 6. Success Metrics (Post‑Launch)
- **Experimentation velocity:** Average 50+ experiments run per user within first session.
- **Repeat usage:** 40% of registered users return within a week (higher threshold now that accounts exist; returning implies saved value).
- **Qualitative feedback:** "I finally understand bias‑variance because I drew a dataset and watched the boundary change."
- **Account conversion:** 20%+ of anonymous experimenters create an account to save their work.
- **GitHub stars & forks** (a secondary signal for portfolio visibility).

## 7. Non‑Goals (Explicit Boundaries)
- We will **not** support images, audio, or unstructured data in the MVP.
- We will **not** implement deep learning (TensorFlow/PyTorch) — we stick to scikit‑learn for clear, interpretable models.
- We will **not** build real‑time collaboration — single‑user experience only.
- We will **not** become a data storage service — uploaded datasets are ephemeral or capped. Saved experiments store metadata and canvas coordinates, not arbitrary user files.
- The data canvas is **not** a full drawing tool — no freehand drawing, no shape tools. It is specifically for placing discrete data points on a 2D plane for ML experimentation.
- We will **not** export canvas datasets as CSV in the MVP (can be added later).

## 8. Ethical Guardrails
- All data processing happens server‑side and user data is never shared with third parties.
- Dataset uploads are limited in size and scanned for file type validity.
- User passwords are hashed (bcrypt/argon2) and never stored in plain text. Authentication uses JWT with token expiry.
- Model results include plain‑language explanations of metrics and caveats about overfitting.
- The playground explicitly shows that a model trained on biased or poorly distributed data can yield biased results — education and responsible AI awareness come first.

## 9. MVP Scope
- **Data input options:**
  - **Visual point‑and‑click canvas:** A 2D coordinate plane where users click to add points, assign them to classes (via color/dropdown), drag to reposition, undo/delete, and clear. Optimised for datasets up to 200 points. Includes a read‑only data table preview synced with the canvas.
  - **Built‑in datasets** (Iris, Boston housing, Wine) for one‑click demos.
  - **Upload CSV** (max 5MB) for real‑world data.
- **Authentication:** Signup, login, logout. JWT‑based. Protected routes for saving experiments and viewing history. Anonymous users can still use the canvas and run experiments (with a prompt to log in to save).
- **4 algorithms:** Logistic Regression, Decision Tree, k‑Nearest Neighbors, K‑Means.
- **2–4 tunable hyperparameters per algorithm**, exposed as sliders with tooltips.
- **Output:** accuracy/score, confusion matrix, decision‑boundary plot overlaid on data points, scatter plot of predictions/clusters.
- **Saved experiments** (logged‑in users only): save, view history, compare side‑by‑side.

---

*This document is the north star for all subsequent design and technical decisions.*
