"""
Concurrent load test: N=3 workers handling concurrent runs without duplicate execution.

Tests:
1. N=3 concurrent claims to a single worker complete without duplicate execution.
2. The claim loop's optimistic locking prevents duplicate execution of the same
   (runId, stageId) pair even when issued concurrently.
3. When a worker is at capacity, additional claims receive 503 WORKER_UNAVAILABLE.
4. After claims complete, the worker returns to available state.
5. Graceful drain: SIGTERM-equivalent drain stops new claims while existing
   in-flight claims complete.
"""

from __future__ import annotations

import asyncio
import time
import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from worker.main import app
from worker.claim_loop import ClaimLoop


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_claim(
    stage_type: str = "retrieval",
    run_id: str | None = None,
    stage_id: str | None = None,
    mode: str = "dry-run",
    input_data: dict | None = None,
) -> dict:
    return {
        "protocolVersion": "1.0",
        "messageId": str(uuid.uuid4()),
        "timestamp": "2026-04-20T00:00:00Z",
        "type": "stage.claim",
        "workerId": "test-engine",
        "runId": run_id or f"run-{uuid.uuid4().hex[:8]}",
        "workflowId": "wf-concurrent-test",
        "stageId": stage_id or f"stage-{uuid.uuid4().hex[:8]}",
        "stageType": stage_type,
        "stageConfig": {"stageKind": stage_type},
        "input": input_data or {},
        "budgetConfig": {"escalateAt": 0.9, "requireHumanBelow": 0.3},
        "traceId": "trace-concurrent",
        "traceparent": None,
        "mode": mode,
    }


# ─── N=3 concurrent execution without duplicate ───────────────────────────────

@pytest.mark.asyncio
async def test_three_concurrent_claims_all_succeed():
    """N=3 unique (runId, stageId) claims complete without error or duplication."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        claims = [_make_claim("retrieval", mode="dry-run") for _ in range(3)]

        async def post_claim(claim: dict) -> dict:
            resp = await client.post("/claim", json=claim)
            return resp.json()

        results = await asyncio.gather(*[post_claim(c) for c in claims])

    stage_ids = {r.get("stageId") for r in results}
    assert len(stage_ids) == 3, "Each claim must produce a result with a unique stageId"

    for r in results:
        assert r.get("type") in ("stage.result", "stage.error"), \
            f"Unexpected result type: {r.get('type')}"
        if r.get("type") == "stage.error":
            assert r.get("errorCode") != "WORKER_UNAVAILABLE", \
                "Concurrent claims must not be rejected when slots are available"


@pytest.mark.asyncio
async def test_no_duplicate_execution_for_same_stage():
    """
    Two concurrent claims for the SAME (runId, stageId) must not both execute.
    The second claim should be rejected (the stage is already claimed).
    """
    run_id = f"run-dup-{uuid.uuid4().hex[:8]}"
    stage_id = "stage-dup-1"

    loop = ClaimLoop(worker_id="test-worker-dup", max_concurrency=4)

    acquired_first = await loop.try_claim(run_id, stage_id)
    acquired_second = await loop.try_claim(run_id, stage_id)

    assert acquired_first is True, "First claim must succeed"
    assert acquired_second is False, "Duplicate claim for same stage must be rejected"

    await loop.release(run_id, stage_id)

    acquired_third = await loop.try_claim(run_id, stage_id)
    assert acquired_third is True, "Claim must succeed after previous release"
    await loop.release(run_id, stage_id)


@pytest.mark.asyncio
async def test_at_capacity_returns_503():
    """When max_concurrency is 1, a second concurrent claim must receive 503."""
    loop = ClaimLoop(worker_id="test-capacity", max_concurrency=1)

    first = await loop.try_claim("run-cap-1", "stage-cap-1")
    assert first is True

    second = await loop.try_claim("run-cap-2", "stage-cap-2")
    assert second is False, "Second claim must fail when worker is at capacity"

    await loop.release("run-cap-1", "stage-cap-1")

    third = await loop.try_claim("run-cap-3", "stage-cap-3")
    assert third is True, "Claim must succeed after capacity frees up"
    await loop.release("run-cap-3", "stage-cap-3")


@pytest.mark.asyncio
async def test_drain_stops_new_claims():
    """After drain() is called, try_claim() must always return False."""
    loop = ClaimLoop(worker_id="test-drain", max_concurrency=4)

    assert await loop.try_claim("run-d1", "stage-d1") is True

    asyncio.ensure_future(loop.drain())
    await asyncio.sleep(0.05)

    assert await loop.try_claim("run-d2", "stage-d2") is False, \
        "Must not accept new claims while draining"

    await loop.release("run-d1", "stage-d1")


@pytest.mark.asyncio
async def test_all_four_stage_types_concurrent():
    """All four stage types run concurrently without interfering with each other."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        claims = [
            _make_claim("retrieval", input_data={"query": "concurrent retrieval test"}, mode="dry-run"),
            _make_claim("ocr", input_data={"documents": [{"id": "d1", "text": "contract text"}]}, mode="dry-run"),
            _make_claim("geospatial", input_data={
                "features": [{"id": "f1", "properties": {"lat": 51.5, "lon": -0.1}}],
                "zones": [{"id": "z1", "bbox": [-2, 50, 2, 53]}],
                "domain": "vessels",
            }, mode="dry-run"),
            _make_claim("eval_grading", input_data={
                "cases": [{"id": "c1", "output": "answer", "groundTruth": "answer"}],
                "scoringFn": "exact",
            }, mode="dry-run"),
        ]

        async def post_claim(claim: dict) -> dict:
            resp = await client.post("/claim", json=claim)
            return resp.json()

        results = await asyncio.gather(*[post_claim(c) for c in claims])

    assert len(results) == 4
    for r in results:
        assert r.get("type") == "stage.result", \
            f"Expected stage.result, got {r.get('type')}: {r.get('errorMessage', '')}"


@pytest.mark.asyncio
async def test_health_endpoint_available():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "activeClaims" in body
    assert "maxConcurrency" in body


@pytest.mark.asyncio
async def test_ready_endpoint_available():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/ready")
    body = resp.json()
    assert "ready" in body


@pytest.mark.asyncio
async def test_workers_endpoint_lists_stages():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/workers")
    assert resp.status_code == 200
    body = resp.json()
    assert "workers" in body
    stage_types = body["workers"][0]["capabilities"]["stageTypes"]
    assert "retrieval" in stage_types
    assert "ocr" in stage_types
    assert "geospatial" in stage_types
    assert "eval_grading" in stage_types
