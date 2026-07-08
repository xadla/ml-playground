import pytest
import schemathesis
from hypothesis import HealthCheck, settings

from app.main import create_app

# Create the test app directly (not using fixture)
test_app = create_app()

# Override database dependencies for testing
# You can add your override logic here or use the fixture approach

# Create the schema from the test app
schema = schemathesis.openapi.from_asgi(
    "/api/v1/openapi.json",
    app=test_app,
)

# Define which endpoints to skip
SKIP_ENDPOINTS = {
    "/api/v1/datasets/upload",  # Multipart upload issues
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/resend-verification",
    "/api/v1/auth/verify-email",
    "/api/v1/experiments/{experiment_id}",
}


@schema.parametrize()
@settings(
    max_examples=10,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)
def test_api_contract(case, client):
    """
    Contract tests using the test app with sync database session.
    """
    # Skip problematic endpoints
    if case.operation.path in SKIP_ENDPOINTS:
        pytest.skip(f"Skipping {case.operation.path}")

    # Skip endpoints that require authentication
    if case.operation.path in ["/api/v1/auth/me", "/api/v1/auth/logout"]:
        if not case.headers or "Authorization" not in case.headers:
            pytest.skip("Authentication required")

    # Skip if dataset_id is missing
    if case.operation.path == "/api/v1/experiments" and case.method == "POST":
        if case.body and isinstance(case.body, dict):
            if not case.body.get("dataset_id"):
                pytest.skip("Dataset ID required")

    # Make the request
    response = case.call(session=client)

    # Validate the response
    case.validate_response(
        response,
        checks=(
            schemathesis.checks.status_code_conformance,
            schemathesis.checks.content_type_conformance,
            schemathesis.checks.response_schema_conformance,
        ),
    )
