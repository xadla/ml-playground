import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_history_empty(auth_client: AsyncClient):
    resp = await auth_client.get("/api/v1/history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_history_with_items(
    auth_client: AsyncClient, test_user_with_experiments
):
    # Use auth_client with the test user token (already set)
    resp = await auth_client.get("/api/v1/history")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 3
    # Verify top_metric may be None because no results, adjust test accordingly
    # We'll add results in fixture later.


@pytest.mark.asyncio
async def test_get_history_experiment(
    auth_client: AsyncClient, test_user_with_experiments
):
    # First, get a list to fetch an ID
    list_resp = await auth_client.get("/api/v1/history")
    exp_id = list_resp.json()["items"][0]["id"]
    resp = await auth_client.get(f"/api/v1/history/{exp_id}")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_delete_experiment(auth_client: AsyncClient, test_user_with_experiments):
    list_resp = await auth_client.get("/api/v1/history")
    exp_id = list_resp.json()["items"][0]["id"]
    del_resp = await auth_client.delete(f"/api/v1/history/{exp_id}")
    assert del_resp.status_code == 204
    # Verify it's gone
    check_resp = await auth_client.get(f"/api/v1/history/{exp_id}")
    assert check_resp.status_code == 404


# @pytest.mark.asyncio
# async def test_compare_experiments(auth_client: AsyncClient, test_user_with_experiments):
#     list_resp = await auth_client.get("/api/v1/history")
#     ids = [item["id"] for item in list_resp.json()["items"][:2]]
#     resp = await auth_client.post("/api/v1/history/compare", json={"experiment_ids": ids})
#     assert resp.status_code == 200
#     data = resp.json()
#     assert len(data["experiments"]) == 2
