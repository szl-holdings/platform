"""
Test fixtures for the substrate Python worker fleet.
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from worker.main import app


@pytest.fixture(scope="session")
def sync_client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


def make_claim(
    stage_type: str = "retrieval",
    stage_id: str = "stage-test-1",
    run_id: str = "run-test-1",
    input_data: dict | None = None,
    mode: str = "dry-run",
    config: dict | None = None,
) -> dict:
    return {
        "protocolVersion": "1.0",
        "messageId": "msg-fixture",
        "timestamp": "2026-04-20T00:00:00Z",
        "type": "stage.claim",
        "workerId": "test-engine",
        "runId": run_id,
        "workflowId": "wf-test",
        "stageId": stage_id,
        "stageType": stage_type,
        "stageConfig": config or {"stageKind": stage_type},
        "input": input_data or {},
        "budgetConfig": {"escalateAt": 0.9, "requireHumanBelow": 0.3},
        "traceId": "trace-0000",
        "traceparent": None,
        "mode": mode,
    }
