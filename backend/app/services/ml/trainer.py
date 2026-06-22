import os
import uuid
from typing import Any

import matplotlib
import numpy as np
from sklearn.linear_model import LogisticRegression  # type: ignore
from sklearn.metrics import (  # type: ignore
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.neighbors import KNeighborsClassifier  # type: ignore
from sklearn.preprocessing import LabelEncoder  # type: ignore

matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt

from app.config import settings


def train_and_evaluate(
    algorithm: str,
    hyperparameters: dict[str, Any],
    x: list[list[float]],
    y: list[float | int | str],
    feature_names: list[str],
    plot_dir: str = settings.PLOT_DIR,
) -> dict[str, Any]:
    """Train a model and return metrics + plot paths."""
    # Convert to arrays
    x_arr = np.array(x)
    y_arr = np.array(y)

    # Encode string labels if necessary
    if y_arr.dtype == object:
        le = LabelEncoder()
        y_arr = le.fit_transform(y_arr)

    # Choose model
    if algorithm == "knn":
        k = hyperparameters.get("k", 5)
        weights = hyperparameters.get("weights", "uniform")
        model = KNeighborsClassifier(n_neighbors=k, weights=weights)
    elif algorithm == "logistic_regression":
        c = hyperparameters.get("C", 1.0)
        penalty = hyperparameters.get("penalty", "l2")
        model = LogisticRegression(C=c, penalty=penalty, max_iter=1000)
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")

    # Train
    model.fit(x_arr, y_arr)

    # Predict and evaluate
    y_pred = model.predict(x_arr)
    metrics = {
        "accuracy": float(accuracy_score(y_arr, y_pred)),
        "precision": float(
            precision_score(y_arr, y_pred, average="weighted", zero_division=0)
        ),
        "recall": float(
            recall_score(y_arr, y_pred, average="weighted", zero_division=0)
        ),
        "f1_score": float(f1_score(y_arr, y_pred, average="weighted", zero_division=0)),
    }

    # Confusion matrix
    cm = confusion_matrix(y_arr, y_pred).tolist()

    # Generate plots
    os.makedirs(plot_dir, exist_ok=True)
    plot_paths = {}

    # Decision boundary (only if 2 features)
    if x_arr.shape[1] == 2:
        fig, ax = plt.subplots(figsize=(10, 8))
        x_min, x_max = x_arr[:, 0].min() - 1, x_arr[:, 0].max() + 1
        y_min, y_max = x_arr[:, 1].min() - 1, x_arr[:, 1].max() + 1
        xx, yy = np.meshgrid(
            np.linspace(x_min, x_max, 100), np.linspace(y_min, y_max, 100)
        )
        z = model.predict(np.c_[xx.ravel(), yy.ravel()])
        z = z.reshape(xx.shape)
        ax.contourf(xx, yy, z, alpha=0.3)
        ax.scatter(x_arr[:, 0], x_arr[:, 1], c=y_arr, edgecolors="k")
        ax.set_xlabel(feature_names[0] if len(feature_names) > 0 else "x0")
        ax.set_ylabel(feature_names[1] if len(feature_names) > 1 else "x1")
        boundary_filename = f"decision_boundary_{uuid.uuid4()}.png"
        boundary_path = os.path.join(plot_dir, boundary_filename)
        fig.savefig(boundary_path, bbox_inches="tight", dpi=300)
        plt.close(fig)
        plot_paths["decision_boundary"] = f"/api/v1/plots/{boundary_filename}"

    # Confusion matrix heatmap
    fig2, ax2 = plt.subplots(figsize=(8, 6))
    im = ax2.imshow(cm, interpolation="nearest", cmap="Blues")
    ax2.set_title("Confusion Matrix")
    plt.colorbar(im, ax=ax2)
    tick_marks = np.arange(len(np.unique(y_arr)))
    ax2.set_xticks(tick_marks)
    ax2.set_yticks(tick_marks)
    ax2.set_xlabel("Predicted")
    ax2.set_ylabel("True")
    cm_filename = f"confusion_matrix_{uuid.uuid4()}.png"
    cm_path = os.path.join(plot_dir, cm_filename)
    fig2.savefig(cm_path, bbox_inches="tight", dpi=300)
    plt.close(fig2)
    plot_paths["confusion_matrix_heatmap"] = f"/api/v1/plots/{cm_filename}"

    return {
        "metrics": metrics,
        "confusion_matrix": cm,
        "plots": plot_paths,
    }
