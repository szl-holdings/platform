"""Negative and positive contracts for the protected stage-claim boundary."""

from __future__ import annotations

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

import worker.main as worker_main
from worker.security import WorkerSecurityConfigurationError, load_worker_security_config
from worker.stages import STAGE_REGISTRY


API_KEY_ENV = "SUBSTRATE_PYTHON_WORKER_API_KEY"
AUTH_BYPASS_ENV = "SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS"
WORKER_ENV_ENV = "SUBSTRATE_PYTHON_WORKER_ENV"
TENANT_ID_ENV = "SUBSTRATE_PYTHON_WORKER_TENANT_ID"
TEST_CREDENTIAL = "unit-test-worker-credential"
TENANT_ID = "tenant-auth-test"
PRODUCTION_MARKERS = (
    "RUNTIME_MODE",
    "SUBSTRATE_PYTHON_WORKER_ENV",
    "APP_ENV",
    "NODE_ENV",
    "SZL_ENV",
)


def _claim(*, tenant_id: str = TENANT_ID, stage_type: str = "retrieval") -> dict:
    return {
        "protocolVersion": "1.0",
        "messageId": str(uuid.uuid4()),
        "timestamp": "2026-10-06T00:00:00Z",
        "type": "stage.claim",
        "workerId": "test-engine",
        "runId": f"run-{uuid.uuid4().hex[:8]}",
        "workflowId": "wf-auth-test",
        "tenantId": tenant_id,
        "stageId": f"stage-{uuid.uuid4().hex[:8]}",
        "stageType": stage_type,
        "stageConfig": {"stageKind": stage_type},
        "input": {"query": "auth contract"},
        "budgetConfig": {"escalateAt": 0.9, "requireHumanBelow": 0.3},
        "traceId": "trace-auth-test",
        "traceparent": None,
        "mode": "dry-run",
    }


def _enable_bearer_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(WORKER_ENV_ENV, "test")
    monkeypatch.setenv(API_KEY_ENV, TEST_CREDENTIAL)
    monkeypatch.setenv(TENANT_ID_ENV, TENANT_ID)
    monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)


def _headers(*, credential: str | None = TEST_CREDENTIAL, tenant_id: str = TENANT_ID) -> dict:
    headers = {"X-Tenant-ID": tenant_id}
    if credential is not None:
        headers["Authorization"] = f"Bearer {credential}"
    return headers


@pytest.mark.asyncio
async def test_claim_rejects_missing_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_bearer_auth(monkeypatch)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post("/claim", json=_claim(), headers=_headers(credential=None))

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json() == {"detail": "Invalid worker credentials"}


@pytest.mark.asyncio
async def test_claim_rejects_wrong_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_bearer_auth(monkeypatch)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/claim",
            json=_claim(),
            headers=_headers(credential="definitely-not-the-worker-credential"),
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid worker credentials"}


@pytest.mark.asyncio
async def test_claim_rejects_cross_tenant_mismatch(monkeypatch: pytest.MonkeyPatch) -> None:
    _enable_bearer_auth(monkeypatch)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/claim",
            json=_claim(tenant_id="tenant-payload"),
            headers=_headers(),
        )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Claim tenant does not match the authenticated tenant"
    }


@pytest.mark.asyncio
async def test_claim_requires_tenant_in_authenticated_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_bearer_auth(monkeypatch)
    claim = _claim()
    claim.pop("tenantId")
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post("/claim", json=claim, headers=_headers())

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_claim_rejects_tenant_outside_credential_binding(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_bearer_auth(monkeypatch)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/claim",
            json=_claim(tenant_id="tenant-other"),
            headers=_headers(tenant_id="tenant-other"),
        )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Authenticated worker credential is not authorized for this tenant"
    }


@pytest.mark.asyncio
async def test_claim_accepts_matching_bearer_and_tenant(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_bearer_auth(monkeypatch)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post("/claim", json=_claim(), headers=_headers())

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "stage.result"
    assert body["confidence"] is None
    assert body["metadata"]["confidenceAssessment"] == "UNASSESSED"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("marker", "value"),
    [
        ("RUNTIME_MODE", "production"),
        *[
            (marker, value)
            for marker in PRODUCTION_MARKERS
            if marker != "RUNTIME_MODE"
            for value in ("prod", "production")
        ],
    ],
)
async def test_every_production_marker_holds_before_claim_or_handler_side_effects(
    monkeypatch: pytest.MonkeyPatch,
    marker: str,
    value: str,
) -> None:
    for environment_name in PRODUCTION_MARKERS:
        monkeypatch.setenv(
            environment_name,
            "local-dev" if environment_name == "RUNTIME_MODE" else "test",
        )
    monkeypatch.setenv(marker, value)
    monkeypatch.setenv(API_KEY_ENV, TEST_CREDENTIAL)
    monkeypatch.setenv(TENANT_ID_ENV, TENANT_ID)
    monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

    observed = {
        "claim_loop": 0,
        "try_claim": 0,
        "resolve_handler": 0,
        "handler": 0,
        "release": 0,
    }

    class ObservedClaimLoop:
        draining = False
        active_claims = 0
        max_concurrency = 1

        async def try_claim(self, _run_id: str, _stage_id: str) -> bool:
            observed["try_claim"] += 1
            return True

        async def release(self, _run_id: str, _stage_id: str) -> None:
            observed["release"] += 1

    loop = ObservedClaimLoop()

    def observed_claim_loop() -> ObservedClaimLoop:
        observed["claim_loop"] += 1
        return loop

    async def observed_handler(_claim_body: dict) -> dict:
        observed["handler"] += 1
        return {"confidence": 1.0}

    def observed_resolver(_stage_type: str, _stage_config: dict):
        observed["resolve_handler"] += 1
        return observed_handler

    monkeypatch.setattr(worker_main, "get_claim_loop", observed_claim_loop)
    monkeypatch.setattr(worker_main, "_resolve_stage_handler", observed_resolver)

    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        readiness = await client.get("/ready")
        response = await client.post("/claim", json=_claim(), headers=_headers())

    for held_response in (readiness, response):
        assert held_response.status_code == 503
        assert held_response.headers["x-evidence-state"] == "UNAVAILABLE"
        body = held_response.json()
        assert body["ready"] is False
        assert body["status"] == "HOLD"
        assert body["code"] == "PRODUCTION_STAGE_EXECUTION_UNAVAILABLE"
        assert body["promotionState"] == "EVALUATION_HOLD"
        assert body["capabilities"] == {
            "stageReceiptsQualified": False,
            "durableClaimResultStore": False,
            "durableLedger": False,
        }
        assert "type" not in body
        assert "output" not in body
        assert "confidence" not in body

    assert observed == {
        "claim_loop": 0,
        "try_claim": 0,
        "resolve_handler": 0,
        "handler": 0,
        "release": 0,
    }


@pytest.mark.parametrize("value", ["prod", "staging", "sandbox", "unknown"])
def test_invalid_runtime_mode_is_startup_fatal(value: str) -> None:
    with pytest.raises(WorkerSecurityConfigurationError, match="RUNTIME_MODE must be one of"):
        load_worker_security_config(
            {
                "RUNTIME_MODE": value,
                WORKER_ENV_ENV: "test",
                AUTH_BYPASS_ENV: "1",
            }
        )


@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["/workers", "/metrics"])
async def test_operational_state_routes_require_authentication(
    monkeypatch: pytest.MonkeyPatch,
    path: str,
) -> None:
    _enable_bearer_auth(monkeypatch)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        missing = await client.get(path)
        cross_tenant = await client.get(
            path,
            headers=_headers(tenant_id="tenant-other"),
        )
        accepted = await client.get(path, headers=_headers())

    assert missing.status_code == 401
    assert cross_tenant.status_code == 403
    assert accepted.status_code == 200


@pytest.mark.asyncio
async def test_production_startup_rejects_missing_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(WORKER_ENV_ENV, "production")
    monkeypatch.delenv(API_KEY_ENV, raising=False)
    monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

    with pytest.raises(RuntimeError, match=API_KEY_ENV):
        async with worker_main.lifespan(worker_main.app):
            pytest.fail("production lifespan must not start without an injected credential")


@pytest.mark.asyncio
async def test_production_startup_rejects_development_bypass(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(WORKER_ENV_ENV, "development")
    monkeypatch.setenv("NODE_ENV", "production")
    monkeypatch.setenv(AUTH_BYPASS_ENV, "1")
    monkeypatch.delenv(API_KEY_ENV, raising=False)

    with pytest.raises(RuntimeError, match="permitted only"):
        async with worker_main.lifespan(worker_main.app):
            pytest.fail("a development label must not downgrade NODE_ENV=production")


@pytest.mark.asyncio
async def test_invalid_bypass_value_fails_closed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(WORKER_ENV_ENV, "test")
    monkeypatch.setenv(AUTH_BYPASS_ENV, "maybe")
    monkeypatch.delenv(API_KEY_ENV, raising=False)

    with pytest.raises(RuntimeError, match="explicit boolean"):
        async with worker_main.lifespan(worker_main.app):
            pytest.fail("an invalid bypass value must not be treated as disabled")


@pytest.mark.asyncio
async def test_production_startup_rejects_unbound_credential(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(WORKER_ENV_ENV, "production")
    monkeypatch.setenv(API_KEY_ENV, TEST_CREDENTIAL)
    monkeypatch.delenv(TENANT_ID_ENV, raising=False)
    monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

    with pytest.raises(RuntimeError, match=TENANT_ID_ENV):
        async with worker_main.lifespan(worker_main.app):
            pytest.fail("production lifespan must not start with an unbound credential")


@pytest.mark.asyncio
async def test_execution_exception_is_5xx_and_does_not_leak_internals(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_bearer_auth(monkeypatch)
    internal_detail = "private backend detail must not cross the worker boundary"

    async def explode(_claim: dict) -> dict:
        raise RuntimeError(internal_detail)

    monkeypatch.setitem(STAGE_REGISTRY, "exploding-test-stage", explode)
    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/claim",
            json=_claim(stage_type="exploding-test-stage"),
            headers=_headers(),
        )

    body = response.json()
    assert response.status_code == 500
    assert body["type"] == "stage.error"
    assert body["errorCode"] == "STAGE_EXECUTION_ERROR"
    assert body["retryable"] is False
    assert len(body["correlationId"]) == 32
    assert internal_detail not in response.text


@pytest.mark.asyncio
async def test_public_probes_do_not_overstate_readiness(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(WORKER_ENV_ENV, "production")
    monkeypatch.delenv(API_KEY_ENV, raising=False)
    monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

    async with AsyncClient(
        transport=ASGITransport(app=worker_main.app), base_url="http://test"
    ) as client:
        health = await client.get("/health")
        readiness = await client.get("/ready")

    assert health.status_code == 200
    assert readiness.status_code == 503
    assert readiness.json() == {
        "ready": False,
        "reason": "worker security configuration is unavailable",
        "role": "stage-execution-worker",
        "authority": "typescript-substrate",
        "dependencyStatus": "not-asserted",
    }
