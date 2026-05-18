"""Smoke + behavioural tests for the canonical Python detectors."""

from __future__ import annotations

from datetime import datetime, timezone

from sidecar.detectors.embedding_drift import drift_score


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def test_health(client) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "py-example/embedding-drift" in body["detectors"]
    assert "py-example/log-anomaly-isolationforest" in body["detectors"]


def test_list_detectors_returns_manifests(client) -> None:
    r = client.get("/detectors")
    assert r.status_code == 200
    detectors = {d["id"]: d for d in r.json()["detectors"]}
    drift = detectors["py-example/embedding-drift"]
    assert drift["runtime"] == "python"
    assert drift["governanceClass"] == "advisory"
    assert "embedding.current" in drift["inputs"]


def test_drift_score_canonical_formula() -> None:
    # Mirrors the TS `driftScore` test fixtures: identical vectors -> 0.
    assert drift_score([0.1, 0.2, 0.3], [0.1, 0.2, 0.3]) == 0.0
    # 100% relative gap on a single dimension.
    s = drift_score([0.2], [0.1])
    assert abs(s - 1.0) < 1e-9


def test_embedding_drift_run_emits_finding(client) -> None:
    body = {
        "detectorId": "py-example/embedding-drift",
        "runId": "run-test-1",
        "triggeredBy": "pytest",
        "startedAt": _now(),
        "params": {"gapMin": 0.05},
        "inputs": {
            "embedding.current": [0.10, 0.20, 0.30, 0.40, 0.50],
            "embedding.baseline": [0.50, 0.10, 0.05, 0.05, 0.30],
        },
    }
    r = client.post("/detectors/py-example/embedding-drift/run", json=body)
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["status"] == "ok"
    assert len(resp["findings"]) == 1
    f = resp["findings"][0]
    assert f["detectorId"] == "py-example/embedding-drift"
    assert f["governanceClass"] == "advisory"
    assert f["score"] > 0


def test_embedding_drift_no_finding_below_threshold(client) -> None:
    body = {
        "detectorId": "py-example/embedding-drift",
        "runId": "run-test-2",
        "triggeredBy": "pytest",
        "startedAt": _now(),
        "params": {"gapMin": 5.0},
        "inputs": {
            "embedding.current": [0.10, 0.20, 0.30],
            "embedding.baseline": [0.11, 0.19, 0.31],
        },
    }
    r = client.post("/detectors/py-example/embedding-drift/run", json=body)
    assert r.status_code == 200
    assert r.json()["findings"] == []


def test_log_anomaly_isoforest_run(client) -> None:
    # 18 baseline rows + 2 obvious outliers — the model should flag
    # at least one of the outliers given contamination=0.10.
    rows = [{"latency_ms": 50 + i, "errors": 0, "host": "h1"} for i in range(18)]
    rows.append({"latency_ms": 50_000, "errors": 99, "host": "h-out-1"})
    rows.append({"latency_ms": 49_000, "errors": 75, "host": "h-out-2"})
    body = {
        "detectorId": "py-example/log-anomaly-isolationforest",
        "runId": "run-test-3",
        "triggeredBy": "pytest",
        "startedAt": _now(),
        "params": {"contamination": 0.10, "randomState": 17},
        "inputs": {"logs.window": rows},
    }
    r = client.post("/detectors/py-example/log-anomaly-isolationforest/run", json=body)
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["status"] == "ok"
    assert len(resp["findings"]) >= 1
    affected = {a for f in resp["findings"] for a in f["affectedAssets"]}
    assert affected.intersection({"h-out-1", "h-out-2"})


def test_unknown_detector_404(client) -> None:
    body = {
        "detectorId": "py-example/does-not-exist",
        "runId": "run-404",
        "triggeredBy": "pytest",
        "startedAt": _now(),
        "params": {},
        "inputs": {},
    }
    r = client.post("/detectors/py-example/does-not-exist/run", json=body)
    assert r.status_code == 404
