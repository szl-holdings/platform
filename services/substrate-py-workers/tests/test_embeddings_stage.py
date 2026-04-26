from __future__ import annotations

import pytest

from worker.stages.embeddings import EMBED_DIM, execute


def _claim(
    input_data: dict,
    mode: str = "counterfactual",
    config: dict | None = None,
    stage_type: str = "embedding",
) -> dict:
    return {
        "protocolVersion": "1.0",
        "messageId": "msg-embedding-test",
        "timestamp": "2026-04-26T00:00:00Z",
        "type": "stage.claim",
        "workerId": "test-engine",
        "runId": "run-embedding-test",
        "workflowId": "wf-embedding-test",
        "stageId": "stage-embedding-test",
        "stageType": stage_type,
        "stageConfig": config or {"stageKind": "embedding"},
        "input": input_data,
        "budgetConfig": {"escalateAt": 0.9, "requireHumanBelow": 0.3},
        "traceId": "trace-embedding",
        "traceparent": None,
        "mode": mode,
    }


@pytest.mark.asyncio
async def test_embedding_vectors_are_deterministic_and_replayable():
    claim = _claim({"texts": ["policy evidence chain"]})

    first = await execute(claim)
    second = await execute(claim)

    assert first["vectors"] == second["vectors"]
    assert len(first["vectors"]) == 1
    assert len(first["vectors"][0]) == EMBED_DIM
    assert first["inputHash"] == second["inputHash"]
    assert first["evidenceIds"] == [f"py-embedding:{first['inputHash']}"]

    replay = _claim(
        {"texts": ["policy evidence chain"], "replayHash": first["inputHash"]},
        mode="replay",
    )
    replay_result = await execute(replay)
    assert replay_result["inputHash"] == first["inputHash"]


@pytest.mark.asyncio
async def test_embedding_replay_rejects_changed_input():
    claim = _claim(
        {"texts": ["policy evidence chain"], "replayHash": "deadbeef00000000"},
        mode="replay",
    )

    with pytest.raises(ValueError, match="Replay hash mismatch"):
        await execute(claim)


@pytest.mark.asyncio
async def test_rerank_orders_candidates_by_query_evidence():
    claim = _claim(
        {
            "operation": "rerank",
            "query": "policy evidence",
            "candidates": [
                {"id": "c1", "text": "unrelated operator note", "score": 0.9},
                {"id": "c2", "text": "policy gate with evidence chain", "score": 0.1},
            ],
            "topK": 2,
        },
        config={"stageKind": "rerank", "operation": "rerank"},
    )

    result = await execute(claim)

    assert result["results"][0]["id"] == "c2"
    assert result["results"][0]["rank"] == 1
    assert result["models"][0]["license"] == "internal-model-free-deterministic"


@pytest.mark.asyncio
async def test_dry_run_returns_replay_metadata_without_outputs():
    result = await execute(_claim({"texts": ["dry run text"]}, mode="dry-run"))

    assert result["dryRun"] is True
    assert result["vectors"] == []
    assert result["results"] == []
    assert result["inputHash"]
    assert result["evidenceIds"] == [f"py-embedding:{result['inputHash']}"]


@pytest.mark.asyncio
async def test_live_mode_requires_explicit_dev_model_gate(monkeypatch):
    monkeypatch.delenv("SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL", raising=False)

    with pytest.raises(RuntimeError, match="Live embedding stage refused"):
        await execute(_claim({"texts": ["live mode text"]}, mode="live"))


@pytest.mark.asyncio
async def test_claim_endpoint_routes_embedding_alias_and_exposes_evidence_ids(async_client):
    claim = _claim({"texts": ["governed semantic scoring"]}, stage_type="embed")

    response = await async_client.post("/claim", json=claim)
    body = response.json()

    assert response.status_code == 200
    assert body["type"] == "stage.result"
    assert body["output"]["operation"] == "embed"
    assert body["evidenceIds"] == body["output"]["evidenceIds"]
