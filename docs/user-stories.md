# User Stories – ML Playground

**Version:** 1.0  
**Date:** 2026-06-04  
**Author:** Mohammadhadi 
**Linked documents:** [Project Vision](goal.md) | [System Requirements](requirements.md)

---

## How to read this document
Each story follows the standard format:
> As a **[user type]**, I want **[goal]** so that **[reason]**.

Stories are grouped by feature area. Each includes a **priority** (P1 = MVP, P2 = next release, P3 = future) and a **traceability** tag linking to the requirements document.

**User types referenced:**
- **Anonymous visitor** — not logged in, exploring the tool
- **Learner** — primary user, wants to experiment and understand ML
- **Registered user** — has an account, wants persistence
- **Instructor** — uses the playground to demonstrate concepts

---

## 1. Data Creation (Visual Canvas)

### US1 – Draw points on a canvas
> As a **learner**, I want to **click on a 2D canvas to place data points and assign them to different classes** so that I can visually create my own dataset without typing a single value.

**Priority:** P1 (MVP)  
**Traceability:** FR1, FR2  
**Acceptance Criteria:**
- Canvas loads as an empty 2D plane with labeled axes.
- Clicking places a point at that coordinate.
- A class selector (color‑coded) determines which class the next click assigns.
- Undo button removes the last point. Clear button resets all.
- Existing points can be dragged to new positions.
- A live data table below the canvas shows all points in sync.

---

### US2 – Name my dataset
> As a **learner**, I want to **give my hand‑drawn dataset a name** so that I can identify it later when I save or compare experiments.

**Priority:** P1 (MVP)  
**Traceability:** FR2  
**Acceptance Criteria:**
- Editable text field above the canvas defaults to "Untitled Dataset".
- The name appears in saved experiment entries and comparison views.

---

### US3 – Understand what the canvas represents
> As a **learner**, I want to **see clear axis labels and tooltips on the canvas** so that I understand what my data points represent and how they relate to ML features.

**Priority:** P1 (MVP)  
**Traceability:** FR1  
**Acceptance Criteria:**
- Axes are labeled "Feature 1" and "Feature 2" by default, with a note explaining they represent any two numeric features.
- Hovering over a point shows its exact (x, y) coordinates and class.

---

## 2. Alternative Data Input

### US4 – Upload my own CSV
> As a **learner**, I want to **upload my own CSV file** so that I can experiment with real‑world data I already have.

**Priority:** P1 (MVP)  
**Traceability:** FR3  
**Acceptance Criteria:**
- Upload button accepts .csv files up to 5MB.
- Backend parses the file and shows a preview table.
- User confirms or discards the preview.
- Errors shown for malformed files.

---

### US5 – Use a ready‑made sample dataset
> As an **anonymous visitor**, I want to **pick from a list of built‑in datasets** so that I can immediately see how the playground works without uploading or drawing anything.

**Priority:** P1 (MVP)  
**Traceability:** FR4  
**Acceptance Criteria:**
- Dropdown or card selection for at least 3 datasets (Iris, Wine, Boston Housing).
- Selecting one instantly populates the workspace.
- A short description explains what each dataset contains.

---

## 3. Authentication & Accounts

### US6 – Create an account
> As an **anonymous visitor**, I want to **sign up with my email and password** so that I can save my experiments and return to them later.

**Priority:** P1 (MVP)  
**Traceability:** FR5  
**Acceptance Criteria:**
- Signup form with email, password, confirm password.
- Email uniqueness validated server‑side.
- On success, auto‑logged‑in and redirected to workspace.
- Clear error messages for invalid inputs.

---

### US7 – Log in to my account
> As a **registered user**, I want to **log in with my email and password** so that I can access my saved experiments from any device.

**Priority:** P1 (MVP)  
**Traceability:** FR6  
**Acceptance Criteria:**
- Login form with email and password.
- JWT token stored on success.
- Rate limiting prevents brute‑force attacks.
- Generic error message on failure for security.

---

### US8 – Log out securely
> As a **registered user**, I want to **log out of my account** so that my saved experiments are not accessible to others on a shared device.

**Priority:** P1 (MVP)  
**Traceability:** FR8  
**Acceptance Criteria:**
- Logout button clears token.
- User redirected to landing page.
- History inaccessible until re‑authentication.

---

### US9 – Know why I should sign up
> As an **anonymous visitor**, I want to **see a clear prompt explaining the benefits of creating an account** so that I understand what I gain before committing.

**Priority:** P1 (MVP)  
**Traceability:** FR7  
**Acceptance Criteria:**
- Non‑intrusive banner or tooltip when using save features: "Log in to save your experiments and compare them later."
- The prompt is dismissible but reappears on next relevant action.

---

## 4. Experiment Configuration

### US10 – Choose an algorithm from a list
> As a **learner**, I want to **select an ML algorithm from a dropdown** so that I can try different models without writing any code.

**Priority:** P1 (MVP)  
**Traceability:** FR10
**Acceptance Criteria:**
- Dropdown lists: Logistic Regression, Decision Tree, k‑Nearest Neighbors, K‑Means.
- Selecting an algorithm updates the hyperparameter controls below.
- Each algorithm name has a one‑line plain‑English description.

---

### US11 – Tune hyperparameters with sliders
> As a **learner**, I want to **adjust hyperparameters using sliders and number inputs** so that I can intuitively explore their effect without knowing the exact syntax.

**Priority:** P1 (MVP)  
**Traceability:** FR11
**Acceptance Criteria:**
- Each hyperparameter shows: name, current value, a slider, and a tooltip explaining what it does.
- Defaults match scikit‑learn defaults.
- Changing a slider does not auto‑trigger training.

---

### US12 – Choose which column to predict
> As a **learner**, I want to **select which column of my dataset is the target variable** so that I can control what the model tries to learn.

**Priority:** P1 (MVP)  
**Traceability:** FR10  
**Acceptance Criteria:**
- Dropdown lists all columns in the current dataset.
- For canvas‑created data, the class column is auto‑selected.
- For clustering algorithms, target selection is hidden.

---

## 5. Training & Execution

### US13 – Run an experiment with one click
> As a **learner**, I want to **click a single "Run" button to train the model** so that I don't have to manage any code or terminal.

**Priority:** P1 (MVP)  
**Traceability:** FR12
**Acceptance Criteria:**
- Button is disabled until dataset and algorithm are selected.
- Training starts immediately on click.
- Loading indicator shown during training.
- Button re‑enables when training completes.

---

### US14 – See training progress
> As a **learner**, I want to **see a loading state or progress indicator while the model trains** so that I know the system is working and not frozen.

**Priority:** P1 (MVP)  
**Traceability:** FR13
**Acceptance Criteria:**
- Spinner, progress bar, or skeleton placeholder shown during training.
- For datasets under 10k rows, training completes in under 10 seconds.
- If training fails, a descriptive error replaces the loading state.

---

### US15 – Understand what went wrong if training fails
> As a **learner**, I want to **see a clear error message if my experiment fails** so that I can fix the problem (e.g., wrong target column, incompatible hyperparameters) without guessing.

**Priority:** P2 (Post‑MVP)
**Traceability:** FR13
**Acceptance Criteria:**
- Errors are displayed in plain language, not stack traces.
- Common issues (e.g., "Target column contains non‑numeric values") have suggested fixes.

---

## 6. Results Visualization

### US16 – See performance metrics
> As a **learner**, I want to **see key metrics like accuracy or R² after training** so that I can quantitatively evaluate the model's performance.

**Priority:** P1 (MVP)
**Traceability:** FR14
**Acceptance Criteria:**
- Classification: accuracy, precision, recall, F1‑score displayed in a card or table.
- Clustering: inertia and silhouette score.
- All metrics formatted to 3 decimal places.

---

### US17 – Visualise the decision boundary
> As a **learner**, I want to **see a plot showing the model's decision boundary overlaid on my data points** so that I can visually understand how the algorithm separates classes.

**Priority:** P1 (MVP)
**Traceability:** FR15
**Acceptance Criteria:**
- A 2D plot is generated with the decision boundary as a shaded background and data points as colored dots.
- For datasets with >2 features, PCA or a note explains the reduction.
- The plot is responsive and downloadable as PNG.

---

### US18 – See a confusion matrix
> As a **learner**, I want to **see a confusion matrix as a heatmap** so that I can understand which classes the model confuses with each other.

**Priority:** P1 (MVP)  
**Traceability:** FR15  
**Acceptance Criteria:**
- Heatmap rendered below metrics for classification tasks.
- Cells show counts and are color‑intensity coded.
- Hidden for clustering tasks.

---

### US19 – Understand what the results mean
> As a **learner**, I want to **read plain‑language explanations alongside metrics and plots** so that I can learn what each number and visualization actually tells me about my model.

**Priority:** P2 (Post‑MVP)  
**Traceability:** NFR — Usability  
**Acceptance Criteria:**
- Each metric card includes a collapsible "What does this mean?" section.
- Decision boundary plot includes a note about overfitting if the boundary is overly complex.

---

## 7. Experiment History & Comparison

### US20 – Save my experiment
> As a **registered user**, I want to **save the current experiment results to my account** so that I can revisit them later without re‑running the training.

**Priority:** P1 (MVP)  
**Traceability:** FR16  
**Acceptance Criteria:**
- "Save" button visible after training completes (only for logged‑in users).
- Saves: dataset name, algorithm, hyperparameters, metrics, and plot references.
- Confirmation message on success.

---

### US21 – View my past experiments
> As a **returning user**, I want to **see a list of all my saved experiments** so that I can pick up where I left off.

**Priority:** P1 (MVP)  
**Traceability:** FR17  
**Acceptance Criteria:**
- History page or sidebar showing experiments ordered by date (newest first).
- Each entry shows: timestamp, dataset name, algorithm, top‑line metric.
- Clicking an entry reloads the full results view.

---

### US22 – Compare experiments side‑by‑side
> As a **returning user**, I want to **select two or more saved experiments and compare their metrics in a table** so that I can directly see how different hyperparameters affected performance.

**Priority:** P1 (MVP)  
**Traceability:** FR18  
**Acceptance Criteria:**
- Multi‑select checkboxes in the history view.
- "Compare selected" button generates a side‑by‑side table.
- Rows = metrics, columns = experiments.
- Hyperparameter differences are highlighted.

---

### US23 – Delete old experiments
> As a **registered user**, I want to **delete experiments I no longer need** so that my history stays clean and relevant.

**Priority:** P2 (Post‑MVP)  
**Traceability:** —  
**Acceptance Criteria:**
- Delete button (trash icon) next to each experiment in history.
- Confirmation dialog before deletion.
- Deletion is permanent.

---

## 8. General Usability

### US24 – Understand the tool on first visit
> As an **anonymous visitor**, I want to **see a brief onboarding or sample workflow** so that I immediately understand what the playground does and how to start.

**Priority:** P2 (Post‑MVP)  
**Traceability:** NFR — Usability  
**Acceptance Criteria:**
- Optional guided tour highlighting: canvas, algorithm dropdown, Run button.
- A pre‑drawn sample dataset is loaded on first visit (until user draws or uploads their own).
- Tour is skippable and doesn't reappear once dismissed.

---

### US25 – Use the playground on my tablet
> As a **learner**, I want to **use the playground on a tablet** so that I can experiment during a commute or in a classroom without a laptop.

**Priority:** P2 (Post‑MVP)  
**Traceability:** NFR8  
**Acceptance Criteria:**
- All UI elements (canvas, sliders, buttons) are touch‑friendly.
- Layout adapts to screens ≥ 768px width.
- Point‑and‑click on canvas works with touch events.

---

## Summary & Coverage

| Feature Area | Stories | MVP (P1) | Post‑MVP (P2) | Future (P3) |
|--------------|---------|----------|----------------|-------------|
| Visual Data Canvas | US1, US2, US3 | 3 | 0 | 0 |
| Alternative Data Input | US4, US5 | 2 | 0 | 0 |
| Authentication | US6, US7, US8, US9 | 4 | 0 | 0 |
| Experiment Config | US10, US11, US12 | 3 | 0 | 0 |
| Training & Execution | US13, US14, US15 | 2 | 1 | 0 |
| Results Visualization | US16, US17, US18, US19 | 3 | 1 | 0 |
| History & Comparison | US20, US21, US22, US23 | 3 | 1 | 0 |
| General Usability | US24, US25 | 0 | 2 | 0 |
| **Total** | **25 stories** | **20** | **5** | **0** |

---

## Traceability to Requirements

| Requirement | Covered by User Stories |
|-------------|-------------------------|
| FR1 — Visual Data Canvas | US1, US3 |
| FR2 — Dataset Naming | US2 |
| FR3 — CSV Upload | US4 |
| FR4 — Built‑in Datasets | US5 |
| FR5 — Signup | US6 |
| FR6 — Login | US7 |
| FR7 — Protected Routes | US9, US20 |
| FR8 — Logout | US8 |
| FR10 — Algorithm Selection | US10 |
| FR11 — Hyperparameter Tuning | US11 |
| FR10 — Target Column Selection | US12 |
| FR12 — Run Experiment | US13 |
| FR13 — Asynchronous Training | US14, US15 |
| FR14 — Metrics Display | US16 |
| FR15 — Plots | US17, US18 |
| FR16 — Save Experiment | US20 |
| FR17 — View History | US21 |
| FR18 — Compare Experiments | US22 |
| NFR — Usability | US19, US24, US25 |

---

*Every user story in this document corresponds to at least one functional or non‑functional requirement. No requirement is left without a user‑facing justification.*