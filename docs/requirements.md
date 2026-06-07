# System Requirements Specification – ML Playground

**Version:** 1.0  
**Date:** 2026-06-04  
**Author:** Mohammadhadi  
**Linked documents:** [Project Vision](goal.md) | [User Stories](user-stories.md) | [Architecture](architecture.md)  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non‑functional requirements for the **ML Playground**, a browser‑based interactive environment for experimenting with classical machine learning algorithms on small, user‑provided datasets.

### 1.2 Scope
The system allows users to:
- **Create datasets visually** by plotting points on a 2D canvas (point-and-click).
- Upload CSV files or use built‑in datasets.
- Create an account and log in to save experiments.
- Choose from a set of scikit‑learn algorithms.
- Tune hyperparameters via UI controls.
- Trigger model training and receive instant visual results (metrics, plots).
- Save, revisit, and compare past experiments tied to their account.

The MVP does **not** include deep learning, image/audio data, collaboration features, or a code editor.

### 1.3 Definitions & Acronyms
| Term | Meaning |
|------|---------|
| **Experiment** | A single run of an algorithm on a dataset with chosen hyperparameters. |
| **Inline table editor** | A spreadsheet‑like UI component that allows creating/editing tabular data directly in the browser. |
| **Hyperparameter** | A configuration variable external to the model (e.g., `k` in k‑NN, `C` in SVM). |
| **Data Canvas** | The visual workspace where users create datasets by clicking to place data points on a 2D plane. |
| **Point-and-click generator** | A UI that lets users build labeled datasets by plotting points directly onto a scatter area. |

---

## 2. General Description

### 2.1 User Characteristics
- **Primary**: Learners with basic ML theory knowledge who want to *draw* data and see how algorithms respond — no programming or spreadsheet skills required.
- **Secondary**: Instructors who want to quickly sketch a dataset during a lecture; analysts running ad‑hoc checks.
- **All users** can create an account to save work across sessions.

### 2.2 Product Perspective
The ML Playground is a stand‑alone web application consisting of a React frontend, a FastAPI backend, a PostgreSQL database, and a Celery task queue for background model training.

---

## 3. Functional Requirements

### 3.1 Data Management

**FR1 – Visual Data Canvas (Point‑and‑Click Generator)**
- **Description:** The system shall provide a 2D canvas where users create datasets by clicking to place data points. Each point belongs to a class (for classification) or has a continuous value (for regression).
- **Acceptance Criteria:**
  - The canvas shows an empty 2D coordinate plane with labeled axes (Feature 1, Feature 2) by default.
  - Users can **add points** by clicking anywhere on the canvas. A click places a dot at that (x, y) coordinate.
  - Users can **assign classes** via a color palette or dropdown: at least 2 classes supported (e.g., red/blue, Class A/Class B). The active class is highlighted in the UI; subsequent clicks place points of that class.
  - Users can **undo** the last point (Ctrl+Z or a button).
  - Users can **delete individual points** by clicking on them with an eraser tool or right‑click menu.
  - Users can **clear all points** with a reset button.
  - The canvas supports **drag‑to‑move** existing points to adjust their coordinates.
  - Axes scales are visible (e.g., 0–100 or auto‑scaled) and adjustable.
  - A **data table preview** below the canvas shows all points in tabular form (read‑only, synchronized with canvas).
  - Minimum canvas size: 500×500 pixels, responsive.
  - Works on both mouse and touch devices (tablet support).

**FR2 – Dataset Naming & Metadata**
- **Description:** Users can name their hand‑drawn dataset and add optional notes.
- **Acceptance Criteria:**
  - An editable text field at the top of the canvas area shows “Untitled Dataset” by default.
  - Dataset name is included when saving an experiment.

**FR3 – CSV Upload**
- **Description:** The system shall allow users to upload a CSV file to use as a dataset.
- **Acceptance Criteria:**
  - Upload size limit: 5 MB.
  - The backend parses the file, infers column types, and returns a preview to the user.
  - Users can confirm the preview or discard the file.
  - Error handling for malformed files (wrong format, empty file, non‑tabular content).

**FR4 – Built‑in Datasets**
- **Description:** The system shall offer a set of pre‑loaded sample datasets.
- **Acceptance Criteria:**
  - At least 3 datasets available (e.g., Iris, Boston Housing, Wine).
  - Selecting a dataset instantly populates the workspace.
  - A short description is shown alongside each dataset.

### 3.2 User Authentication & Accounts

**FR5 – User Signup**
- **Description:** A visitor can create an account by providing an email and password.
- **Acceptance Criteria:**
  - Signup form fields: email, password, confirm password.
  - Email must be unique; server returns error if already registered.
  - Password must be at least 8 characters with basic complexity (uppercase + number).
  - On success, user is auto‑logged‑in (JWT returned) and redirected to the workspace.
  - Email validation format is checked both client‑side and server‑side (Pydantic).

**FR6 – User Login**
- **Description:** A registered user can log in with email and password.
- **Acceptance Criteria:**
  - Login form fields: email, password.
  - On success, a JWT access token is returned and stored in the browser (httpOnly cookie or secure localStorage; document the choice).
  - On failure, a generic error message is shown (“Invalid email or password”).
  - Rate limiting: maximum 5 failed attempts per IP per minute.

**FR7 – Protected Routes / Session**
- **Description:** Certain actions require authentication.
- **Acceptance Criteria:**
  - Saving experiments, viewing history, and comparing past experiments are only available to logged‑in users.
  - Non‑authenticated users can still use the canvas, upload CSVs, and run experiments; they see a “Log in to save your work” prompt.
  - Frontend detects token expiry and prompts re‑login.

**FR8 – Logout**
- **Description:** A logged‑in user can log out.
- **Acceptance Criteria:**
  - Token is cleared from storage.
  - User is redirected to the landing page.
  - Saved experiments are not visible until re‑authentication.

**FR9 – Password Reset (Future consideration, note only)**
- **Description:** A mechanism to reset forgotten passwords. Not in MVP scope, but the database schema should support a `reset_token` field for future implementation.

### 3.3 Experiment Configuration

**FR10 – Target Column Selection**
- **Description:** For supervised algorithms, the user must designate which column is the target.
- **Acceptance Criteria:**
  - A dropdown lists all columns in the current dataset.
  - For data created on the canvas, the “class” column is auto‑selected as target for classification; for clustering, no target needed.
  - Changing the target updates the training context immediately.

**FR11 – Algorithm Selection**
- **Description:** Users shall be able to choose an ML algorithm from a list.
- **Acceptance Criteria:**
  - Supported algorithms in MVP: Logistic Regression, Decision Tree, k‑Nearest Neighbors, K‑Means.
  - The selection triggers the display of relevant hyperparameter controls.

**FR12 – Hyperparameter Tuning**
- **Description:** The UI shall expose the most important hyperparameters for the selected algorithm via sliders, number inputs, or toggles.
- **Acceptance Criteria:**
  - Each hyperparameter control shows its name, current value, and a brief tooltip explanation.
  - Default values are pre‑filled and equal to scikit‑learn defaults.
  - Changing a value does not automatically trigger training; user must click “Run”.

### 3.4 Training & Execution

**FR13 – Run Experiment**
- **Description:** The user initiates model training by clicking a “Run” button.
- **Acceptance Criteria:**
  - The button is disabled if no dataset is loaded or if the algorithm requires a target column that hasn’t been selected.
  - A loading state is shown with estimated time or a progress indicator.
  - On completion, results are displayed without page reload.

**FR14 – Asynchronous Training**
- **Description:** Model training shall be executed asynchronously on the backend to avoid blocking the user interface.
- **Acceptance Criteria:**
  - The frontend polls or receives a notification when the experiment is finished.
  - If training fails (e.g., invalid hyperparameter combination), a descriptive error message is returned.

### 3.5 Results Visualization

**FR15 – Metrics Display**
- **Description:** The system shall present key performance metrics after training.
- **Acceptance Criteria:**
  - For classification: accuracy, precision, recall, F1‑score (if applicable).
  - For regression (future): R², MSE.
  - For clustering: inertia, silhouette score.
  - Metrics are formatted to 3 decimal places.

**FR16 – Plots**
- **Description:** The system shall generate and display visualizations.
- **Acceptance Criteria:**
  - For classification: a confusion matrix (heatmap) and a 2D decision boundary plot (if only 2 features, or after PCA reduction).
  - For clustering: a scatter plot of clusters.
  - Plots are responsive and can be downloaded as PNG.

### 3.6 Experiment History & Comparison

**FR17 – Save Experiment**
- **Description:** Logged‑in users can save the current experiment to their personal history.
- **Acceptance Criteria:**
  - A “Save” button is visible after training completes.
  - Clicking “Save” triggers an API call: `POST /api/experiments` with dataset metadata, algorithm, hyperparameters, and results summary.
  - The experiment is linked to the authenticated user’s ID (foreign key).
  - A success toast/message confirms the save.
  - Non‑authenticated users see a “Log in to save” prompt instead.

**FR18 – View Experiment History**
- **Description:** Logged‑in users can view a list of their saved experiments.
- **Acceptance Criteria:**
  - A history page or sidebar shows all saved experiments for the current user, ordered by date (newest first).
  - Each entry displays: timestamp, dataset name, algorithm name, top‑line metric.
  - Clicking an entry loads that experiment’s full results.

**FR19 – Compare Experiments**
- **Description:** Users can select two or more saved experiments and view their metrics side‑by‑side.
- **Acceptance Criteria:**
  - A comparison table is rendered with rows for each metric and columns for each experiment.
  - Differences in hyperparameters are highlighted.
  - This feature is only accessible to logged‑in users.

---

## 4. Non‑Functional Requirements

### 4.1 Performance
- **NFR1:** Model training for datasets up to 10,000 rows must complete within 10 seconds (p95).
- **NFR2:** The frontend must load and become interactive within 3 seconds on a 4G connection.
- **NFR3:** API response time for non‑training endpoints must be < 200ms (p95).

### 4.2 Security
- **NFR4:** All traffic must be over HTTPS.
- **NFR5:** Uploaded files are scanned for malicious content (file type validation, size limits).
- **NFR6:** No user‑uploaded data is shared with third parties; datasets are deleted after experiment session or within 24 hours.
- **NFR6:** User passwords must be hashed using bcrypt or argon2 before storage.
- **NFR7:** JWT access tokens expire after 24 hours; refresh token rotation (if implemented) described in architecture doc.
- **NFR8:** API endpoints that modify user data (save experiment) must validate JWT and user ownership.

### 4.3 Usability
- **NFR9:** The core experiment flow (create visual data → algo → run → see results) must be completable within 90 seconds by a first‑time user (accounts for point‑plotting time).
- **NFR10:** The application must be fully responsive and usable on tablets and desktops (minimum width 768px for MVP).

### 4.4 Reliability
- **NFR11:** The backend uptime target is 99.5%.
- **NFR12:** In case of backend failure during training, the frontend shall gracefully timeout and display an error.

### 4.5 Compatibility
- **NFR13:** The frontend must work on the latest two versions of Chrome, Firefox, Safari, and Edge.

---

## 5. Data Requirements
- **DR1:** User account data (email, hashed password) is stored in a `users` table.
- **DR2:** Uploaded datasets and canvas‑created datasets are stored temporarily for the active session; they persist in the database only if associated with a saved experiment.
- **DR3:** Each saved experiment is linked to a `user_id` (foreign key to `users`).
- **DR4:** Canvas‑created datasets are stored as JSON arrays of `{x, y, class}` objects when saved.

---

## 6. Constraints
- **CO1:** The MVP must use only classical ML algorithms implemented in scikit‑learn; no TensorFlow/PyTorch.
- **CO2:** The manual data editor is limited to 50 rows × 20 columns for performance.
- **CO3:** No real‑time collaboration; single‑user experience only.
- **CO4:** Deployment must be containerised (Docker) and runnable on a single server with ≤ 2 GB RAM.

---

## 7. Assumptions & Dependencies
- Users have a stable internet connection and a modern browser.
- The backend server has access to sufficient compute for scikit‑learn (CPU only, no GPU required).
- The Celery task queue uses Redis as broker (Redis must be available in the deployment environment).
- External libraries (scikit‑learn, numpy, matplotlib) remain backward‑compatible.

---

## 8. Traceability (Requirements → User Stories)
*To be completed after user‑story document is written.*

| Requirement | Related User Story |
|-------------|--------------------|
| FR1, FR2 | As a learner, I want to draw points on a canvas so I can visually create my own dataset |
| FR3, FR4 | As a learner, I want to upload or pick a ready‑made dataset so I can use real data |
| FR5–FR9 | As a user, I want to create an account and log in so my work is saved and private |
| FR10, FR11 | As a learner, I want to pick an algorithm and tune its knobs so I can see their effect |
| FR12, FR13 | As a user, I want the training to run smoothly in the background |
| FR14, FR15 | As a learner, I want to see metrics and plots to understand model performance |
| FR16–FR18 | As a returning user, I want to save and compare experiments to track my learning |