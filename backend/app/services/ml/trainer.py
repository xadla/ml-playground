import os
import uuid
from typing import Any, cast

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
from matplotlib.colors import Normalize

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
    # Convert X to array with proper dtype
    x_arr = np.array(x, dtype=np.float64)

    # Clean and prepare y labels
    y_str = [str(label).strip() for label in y]  # Convert all to strings
    # Replace empty strings with 'unknown'
    y_str = ["unknown" if label == "" else label for label in y_str]
    y_arr = np.array(y_str)

    # Encode string labels
    le = LabelEncoder()
    y_arr_encoded = le.fit_transform(y_arr)

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

    # Train - USE ENCODED LABELS
    model.fit(x_arr, y_arr_encoded)  # type: ignore

    # Predict and evaluate - USE ENCODED LABELS
    y_pred = model.predict(x_arr)  # type: ignore
    metrics = {
        "accuracy": float(accuracy_score(y_arr_encoded, y_pred)),
        "precision": float(
            precision_score(y_arr_encoded, y_pred, average="weighted", zero_division=0)
        ),
        "recall": float(
            recall_score(y_arr_encoded, y_pred, average="weighted", zero_division=0)
        ),
        "f1_score": float(
            f1_score(y_arr_encoded, y_pred, average="weighted", zero_division=0)
        ),
    }

    # Confusion matrix - USE ENCODED LABELS
    cm = confusion_matrix(y_arr_encoded, y_pred).tolist()

    # Generate plots
    os.makedirs(plot_dir, exist_ok=True)
    plot_paths: dict[str, str] = {}

    # Decision boundary (only if 2 features)
    if x_arr.shape[1] == 2:
        fig, ax = plt.subplots(figsize=(10, 8))
        x_min, x_max = x_arr[:, 0].min() - 1, x_arr[:, 0].max() + 1
        y_min, y_max = x_arr[:, 1].min() - 1, x_arr[:, 1].max() + 1
        xx, yy = np.meshgrid(
            np.linspace(x_min, x_max, 100), np.linspace(y_min, y_max, 100)
        )
        z = model.predict(np.c_[xx.ravel(), yy.ravel()])  # type: ignore
        z = z.reshape(xx.shape)
        ax.contourf(xx, yy, z, alpha=0.3)
        # USE ENCODED LABELS for scatter plot
        scatter = ax.scatter(
            x_arr[:, 0], x_arr[:, 1], c=y_arr_encoded, edgecolors="k", cmap="viridis"
        )
        ax.set_xlabel(feature_names[0] if len(feature_names) > 0 else "x0")
        ax.set_ylabel(feature_names[1] if len(feature_names) > 1 else "x1")

        # Add legend with actual class names - FIXED TYPE ERRORS HERE
        legend_elements = []

        # Get the colormap and norm from the scatter plot
        cmap = scatter.get_cmap()
        norm: Normalize = cast(Normalize, scatter.norm)

        for i, class_name in enumerate(le.classes_):
            # Get the color for this class using the scatter's normalization
            color = cmap(norm(i))

            # Convert color to RGB tuple if it has alpha
            if len(color) == 4:  # RGBA
                color_rgb = (float(color[0]), float(color[1]), float(color[2]))
            else:
                color_rgb = (float(color[0]), float(color[1]), float(color[2]))

            legend_elements.append(
                plt.Line2D(
                    [0],
                    [0],
                    marker="o",
                    color="w",
                    markerfacecolor=color_rgb,
                    markersize=10,
                    label=class_name,
                )
            )
        ax.legend(handles=legend_elements)
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
    # Use encoded labels for tick marks
    tick_marks = np.arange(len(le.classes_))
    ax2.set_xticks(tick_marks)
    ax2.set_yticks(tick_marks)
    ax2.set_xticklabels(le.classes_)
    ax2.set_yticklabels(le.classes_)
    ax2.set_xlabel("Predicted")
    ax2.set_ylabel("True")

    # Add text annotations for each cell
    for i in range(len(le.classes_)):
        for j in range(len(le.classes_)):
            ax2.text(j, i, str(cm[i][j]), ha="center", va="center", color="black")

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
