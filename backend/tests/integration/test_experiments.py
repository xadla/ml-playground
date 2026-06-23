from typing import Any

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.db.users import User


@pytest.mark.asyncio
async def test_create_experiment_canvas(
    client: AsyncClient, test_user: User, mock_celery_task
):
    """Test creating a canvas experiment with a specific user."""
    # Create access token for the test user
    token = create_access_token({"sub": str(test_user.id)})
    client.headers["Authorization"] = f"Bearer {token}"

    payload: dict[str, Any] = {
        "dataset": {
            "type": "canvas",
            "name": "Test",
            "points": [
                {"x": 1.0, "y": 2.0, "class": "A"},
                {"x": 3.0, "y": 4.0, "class": "B"},
            ],
            "feature_names": ["X", "Y"],
        },
        "algorithm": "knn",
        "hyperparameters": {"k": 1},
        "target_column": "class",
    }

    resp = await client.post("/api/v1/experiments", json=payload)
    assert resp.status_code == 202
    data = resp.json()
    experiment_id = data["experiment_id"]
    assert data["status"] == "pending"

    resp2 = await client.get(f"/api/v1/experiments/{experiment_id}")
    assert resp2.status_code == 200
    result = resp2.json()
    # assert result["status"] == "completed"
    assert "result" in result
    # assert "metrics" in result["result"]
