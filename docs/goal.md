# Project Vision: ML Playground

## 1. Problem Statement
Learning machine learning should be about exploration, not environment setup.
Today, a student who wants to understand how a Decision Tree behaves must:
- Install Python, libraries, and an IDE
- Write boilerplate code just to load data and train a model
- Manually re‑run scripts to see the effect of a changed hyperparameter

This friction kills curiosity, slows down learning, and excludes people who learn best by doing.
ML Playground eliminates the barrier entirely — it puts a live, interactive ML lab in the browser.

## 2. Target Users
- **Primary:** Data science students and self‑taught learners who want to build intuition by tinkering.
- **Secondary:** Instructors leading workshops; analysts who need a quick one‑off model on small tabular data.
- **Tertiary:** Technical recruiters and peers evaluating this portfolio — they’ll see a product that solves a real human problem.

## 3. Core User Journey (The “Aha!” Loop)
1. **Create or load data** – User lands on the page. They can **type a small table** directly (add/remove rows and columns, name features) in seconds, or pick a built‑in dataset, or upload a CSV.
2. **Configure** – Chooses an algorithm (e.g., k‑NN), drags a slider to change `k`.
3. **Train & Visualise** – Clicks “Run” and instantly gets accuracy, a confusion matrix, and a decision‑boundary plot.
4. **Iterate** – Moves the slider again, clicks “Run” — sees the boundary update in real time.
5. **Save & Compare** – Saves the experiment, runs another, and views a side‑by‑side comparison.

This entire loop is designed to take **under 60 seconds**, turning “what if?” into “I see!” with zero code.

## 4. Unique Value Proposition
Unlike Google Colab (code‑first, requires setup) or Teachable Machine (only classification on pre‑defined data),
ML Playground is:
- **Open‑source** and **self‑hostable**
- Focused on **tabular data** and **classical ML algorithms** (where hyperparameter intuition matters most)
- Built to make the **invisible knobs of ML visible** — every hyperparameter has a live visual consequence
- A **portfolio‑grade full‑stack system** that demonstrates backend (FastAPI), frontend (React), MLOps, and UX design
- **Data‑creation gap:** Users who want to test a hypothesis on a tiny, hand‑crafted dataset currently have to open a spreadsheet, type values, export as CSV, then upload. The playground eliminates this — data creation is built in.
- **Built‑in table editor** lets users invent tiny datasets on the fly — no spreadsheet app required, no file export. Perfect for “what if” experiments.

## 5. Business Goals (Product & Portfolio)
- **Product goal:** Become the quickest way for anyone to test a classical ML idea on a small dataset, without leaving the browser.
- **Learning goal:** Reduce the time from “I wonder what changing C in SVM does” to “I can see it” to under 1 minute.
- **Portfolio goal:** Prove end‑to‑end technical ability and product thinking — from user research to deployment and monitoring.
- **Community goal:** Attract open‑source contributions (new algorithms, visualization types) and build a reputation as a maintainer.

## 6. Success Metrics (Post‑Launch)
- **Experimentation velocity:** Average 50+ experiments run per user within first session.
- **Repeat usage:** 30% of users return within a week.
- **Qualitative feedback:** “I finally understand bias‑variance because I saw it change.”
- **GitHub stars & forks** (a secondary signal for portfolio visibility).

## 7. Non‑Goals (Explicit Boundaries)
- We will **not** support images, audio, or unstructured data in the MVP.
- We will **not** implement deep learning (TensorFlow/PyTorch) — we stick to scikit‑learn for clear, interpretable models.
- We will **not** build real‑time collaboration — single‑user experience only.
- We will **not** become a data storage service — uploaded datasets are ephemeral or capped.
- The manual data editor is not a full spreadsheet — no formulas, no import from Google Sheets, no export to CSV (export can be added later, not in MVP).

## 8. Ethical Guardrails
- All data processing happens server‑side and user data is never shared.
- Dataset uploads are limited in size and scanned for PII warnings.
- Model results include plain‑language explanations of metrics and caveats about overfitting.
- The playground explicitly shows that a model trained on biased data can yield biased results — education first.

## 9. MVP Scope
- **Data input options:**
  - **Inline table editor:** Create a dataset manually in the browser (specify column names, add/delete rows, fill numeric or categorical values). Optimised for ≤ 50 rows.
  - **Built‑in datasets** (Iris, Boston housing, etc.) for one‑click demos.
  - **Upload CSV** (max 5MB) for real‑world data.
- 4 algorithms: Logistic Regression, Decision Tree, k‑NN, K‑Means.
- 2–4 tunable hyperparameters per algorithm, exposed as sliders.
- Output: accuracy/score, confusion matrix, scatter plot of predictions/clusters.
- Anonymous experiment saving (no auth required).

---

*This document is the north star for all subsequent design and technical decisions.*