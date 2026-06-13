from typing import Any

import pytest
from pydantic import ValidationError

from app.models.request.auth import SignupRequest
from app.models.request.experiments import CreateExperimentRequest
from app.models.response.error import ErrorResponse


def test_signup_request_valid():
    data = {"email": "user@example.com", "password": "12345678"}
    req = SignupRequest(**data)
    assert req.email == "user@example.com"


def test_signup_password_too_short():
    with pytest.raises(ValidationError) as exc:
        SignupRequest(email="a@b.com", password="123")
    errors = exc.value.errors()
    assert any(e["loc"] == ("password",) for e in errors)


def test_create_experiment_canvas():
    payload: dict[str, Any] = {
        "dataset": {
            "type": "canvas",
            "name": "Test",
            "points": [{"x": 1.0, "y": 2.0, "class": "A"}],
            "feature_names": ["X", "Y"],
        },
        "algorithm": "knn",
        "hyperparameters": {"k": 3},
        "target_column": "class",
    }
    req = CreateExperimentRequest(**payload)
    assert req.algorithm == "knn"


def test_create_experiment_invalid_algorithm():
    with pytest.raises(ValidationError):
        CreateExperimentRequest(
            dataset={"type": "canvas", "name": "X", "points": [], "feature_names": []},
            algorithm="invalid",
            hyperparameters={},
            target_column="y",
        )


def test_error_response_format():
    error = ErrorResponse(error={"code": "AUTH_ERROR", "message": "Bad credentials"})
    assert error.error.code == "AUTH_ERROR"
