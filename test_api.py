from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generate_block_plan_uses_default_mock_csv_data():
    response = client.post("/generate-block-plan")
    assert response.status_code == 200

    body = response.json()
    assert body["period_id"] == "WEEK-2026-37"
    assert body["period_type"] == "weekly"
    assert body["total_requests_processed"] == 7
    assert body["total_blocks_output"] >= 1
    assert isinstance(body["generated_blocks"], list)
    # BLK-101 (SEC-E/TRK-3) has no matching requests and shouldn't be dropped
    block_ids = {b["block_id"] for b in body["generated_blocks"]}
    assert "BLK-101" in block_ids


def test_generate_block_plan_accepts_inline_override_payload():
    payload = {
        "maintenance_requests": [
            {
                "request_id": "REQ-X",
                "section_id": "SEC-Z",
                "track_id": "TRK-1",
                "asset_type": "rail",
                "earliest_start": "2026-10-01T08:00:00",
                "latest_end": "2026-10-01T12:00:00",
                "estimated_duration_hrs": 2,
                "required_resources": [],
            }
        ],
        "current_blocks": [],
        "planning_calendar": {
            "period_id": "WEEK-OVERRIDE",
            "period_type": "weekly",
            "start_date": "2026-10-01T00:00:00",
            "end_date": "2026-10-07T23:59:59",
        },
    }
    response = client.post("/generate-block-plan", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["period_id"] == "WEEK-OVERRIDE"
    assert body["total_requests_processed"] == 1
    assert body["total_blocks_output"] == 1
    assert body["generated_blocks"][0]["is_new"] is True
    assert "REQ-X" in body["generated_blocks"][0]["merged_request_ids"]


def test_generate_block_plan_rejects_invalid_period_type():
    payload = {
        "maintenance_requests": [],
        "current_blocks": [],
        "planning_calendar": {
            "period_id": "BAD",
            "period_type": "daily",
            "start_date": "2026-10-01T00:00:00",
            "end_date": "2026-10-07T23:59:59",
        },
    }
    response = client.post("/generate-block-plan", json=payload)
    # Pydantic request-body validation rejects this before it reaches the
    # handler, so FastAPI returns 422 (not our custom 400 handler).
    assert response.status_code == 422
