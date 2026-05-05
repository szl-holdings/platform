"""
Eval Runner Service
-------------------
FastAPI service that executes governed benchmark evaluations against AI model
endpoints (treating every model as a generation endpoint, not a local checkpoint).

Endpoints:
  GET  /health                    — liveness probe
  POST /runs                      — submit a new eval run
  GET  /runs/{run_id}             — retrieve run status / report
  GET  /runs                      — list recent runs
  POST /runs/{run_id}/reproduce   — deterministic re-run for verification
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any

import httpx
import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .suites import STANDARD_SUITE, DOMAIN_SUITES, get_suite_by_id
from .runner import execute_suite_run, SuiteRunInput
from .store import RunStore

log = structlog.get_logger(__name__)

SERVICE_VERSION = "1.0.0"
SIGNING_KEY = os.environ.get("EVAL_RUNNER_SIGNING_KEY", "eval-runner-dev-key-change-in-prod")

# ── Store selection ─────────────────────────────────────────────────────────────
# Use PostgreSQL-backed store when DATABASE_URL is set (production/staging).
# Fall back to in-memory TTL store for local development without a DB.

def _init_store() -> "RunStore":
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        try:
            from .pg_store import PgRunStore  # type: ignore[import]
            store = PgRunStore()
            log.info("run_store_backend", backend="postgres")
            return store  # type: ignore[return-value]
        except Exception as exc:
            log.error("pg_store_init_failed_falling_back", error=str(exc))
    log.warning("run_store_backend", backend="in_memory", reason="DATABASE_URL not set or pg unavailable")
    return RunStore()

run_store = _init_store()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("eval_runner_starting", version=SERVICE_VERSION)
    yield
    log.info("eval_runner_stopping")


app = FastAPI(
    title="Eval Runner",
    version=SERVICE_VERSION,
    description="Governed benchmark evaluation harness — runs OSS-benchmark suites against AI model endpoints",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    suite_id: str = Field(..., description="Suite identifier, e.g. 'standard-v1' or 'vessels-domain-v1'")
    model_id: str = Field(..., description="Model identifier, e.g. 'gpt-4o-mini' or 'claude-3-haiku-20240307'")
    provider: str = Field(..., description="Provider: openai | anthropic | gemini | huggingface | substrate")
    triggered_by: str = Field("api", description="Who triggered this run")
    baseline_run_id: str | None = Field(None, description="Optional baseline run ID for regression comparison")
    seed: int | None = Field(None, description="Deterministic seed for reproducibility (omit for live run)")


class ReproduceRequest(BaseModel):
    # seed is intentionally ignored — reproducibility is over suite manifest, not model responses
    seed: int | None = Field(None, description="Ignored — reproducibility covers pinned suite manifest, not stochastic model responses")


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "eval-runner",
        "version": SERVICE_VERSION,
        "suites_loaded": len(DOMAIN_SUITES) + 1,
        "timestamp": int(time.time() * 1000),
    }


# ─── Suites registry ──────────────────────────────────────────────────────────

@app.get("/suites")
async def list_suites() -> dict[str, Any]:
    all_suites = [STANDARD_SUITE] + DOMAIN_SUITES
    return {
        "suites": [
            {
                "suite_id": s["suite_id"],
                "name": s["name"],
                "description": s.get("description", ""),
                "domain": s.get("domain", "cross-cutting"),
                "case_count": len(s["cases"]),
                "content_hash": s["content_hash"],
                "version": s.get("version", 1),
            }
            for s in all_suites
        ],
        "total": len(all_suites),
    }


# ─── Submit run ───────────────────────────────────────────────────────────────

@app.post("/runs", status_code=202)
async def submit_run(body: RunRequest) -> dict[str, Any]:
    suite = get_suite_by_id(body.suite_id)
    if suite is None:
        raise HTTPException(status_code=404, detail=f"Suite '{body.suite_id}' not found")

    run_id = str(uuid.uuid4())
    run_input = SuiteRunInput(
        run_id=run_id,
        suite=suite,
        model_id=body.model_id,
        provider=body.provider,
        triggered_by=body.triggered_by,
        baseline_run_id=body.baseline_run_id,
        seed=body.seed,
    )

    # Kick off execution (non-blocking — caller polls GET /runs/{run_id})
    import asyncio
    asyncio.create_task(_execute_and_store(run_input))

    return {
        "run_id": run_id,
        "suite_id": body.suite_id,
        "model_id": body.model_id,
        "provider": body.provider,
        "status": "pending",
        "submitted_at": int(time.time() * 1000),
    }


async def _execute_and_store(run_input: SuiteRunInput) -> None:
    try:
        report = await execute_suite_run(run_input)
        run_store.store(run_input.run_id, report)
    except Exception as exc:
        log.error("eval_run_failed", run_id=run_input.run_id, error=str(exc))
        run_store.store(run_input.run_id, {
            "run_id": run_input.run_id,
            "status": "failed",
            "error": str(exc),
            "completed_at": int(time.time() * 1000),
        })


# ─── Get run ──────────────────────────────────────────────────────────────────

@app.get("/runs/{run_id}")
async def get_run(run_id: str) -> dict[str, Any]:
    record = run_store.get(run_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return record


@app.get("/runs")
async def list_runs(limit: int = 50) -> dict[str, Any]:
    runs = run_store.list(limit=limit)
    return {"runs": runs, "total": len(runs)}


# ─── Reproduce run ────────────────────────────────────────────────────────────
#
# Reproducibility means: the same pinned benchmark suite (content_hash) is
# re-loaded from the same pinned dataset revision SHAs, and a real model call
# is issued against those inputs.  We do NOT use seed-based fixture responses
# here — the `seed` field on the request is intentionally ignored so the
# reproduce path always exercises the live provider path.
#
# What IS verifiable without re-calling the model:
#   · suite_reproduced  — the benchmark suite content_hash matches the original
#   · signed_manifest   — HMAC over (suite_content_hash, model_id, provider)
#   · cli_invocation    — exact shell command any external auditor can run
#
# What is stochastic and therefore NOT expected to match across runs:
#   · individual model responses and the resulting pass_rate (LLMs are stochastic)
#   · This is why we sign the SUITE manifest, not the model-response hash.

@app.post("/runs/{run_id}/reproduce")
async def reproduce_run(run_id: str, body: ReproduceRequest) -> dict[str, Any]:
    original = run_store.get(run_id)
    if original is None:
        raise HTTPException(status_code=404, detail=f"Original run '{run_id}' not found")

    suite = get_suite_by_id(original.get("suite_id", ""))
    if suite is None:
        raise HTTPException(status_code=404, detail=f"Suite '{original.get('suite_id')}' not found")

    # Verify the re-loaded suite hash matches the original — this is the
    # reproducibility claim: same benchmark inputs, same evidence anchor.
    reproduced_suite_hash = suite.get("content_hash", "")
    original_suite_hash = original.get("suite_content_hash", "")
    suite_reproduced = reproduced_suite_hash == original_suite_hash

    # Compute a signed manifest over the stable, non-stochastic fields.
    manifest_payload = json.dumps(
        {
            "suite_id": suite["suite_id"],
            "suite_content_hash": reproduced_suite_hash,
            "model_id": original["model_id"],
            "provider": original["provider"],
            "original_run_id": run_id,
            "reproduced_at": int(time.time() * 1000),
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    manifest_hash = hashlib.sha256(manifest_payload.encode()).hexdigest()
    manifest_signature = _sign_report(manifest_hash)

    # CLI invocation for external auditors
    cli_invocation = (
        f"pnpm eval-harness:reproduce "
        f"--run-id {run_id} "
        f"--suite-id {suite['suite_id']} "
        f"--model-id {original['model_id']} "
        f"--provider {original['provider']}"
    )

    # Execute a real model run (no seed — real provider call against pinned inputs)
    new_run_id = str(uuid.uuid4())
    run_input = SuiteRunInput(
        run_id=new_run_id,
        suite=suite,
        model_id=original["model_id"],
        provider=original["provider"],
        triggered_by="reproduce",
        baseline_run_id=run_id,
        seed=None,  # Never use fixture mode in reproduce path
    )

    report = await execute_suite_run(run_input)
    run_store.store(new_run_id, report)

    original_sig = original.get("signature", "")
    new_sig = report.get("signature", "")

    return {
        "original_run_id": run_id,
        "reproduce_run_id": new_run_id,
        "suite_reproduced": suite_reproduced,
        "suite_content_hash": reproduced_suite_hash,
        "original_suite_content_hash": original_suite_hash,
        "manifest_hash": manifest_hash,
        "manifest_signature": manifest_signature,
        "cli_invocation": cli_invocation,
        "hashes_match": original_sig == new_sig,
        "original_content_hash": original.get("content_hash"),
        "reproduced_content_hash": report.get("content_hash"),
        "original_signature": original_sig,
        "reproduced_signature": new_sig,
        "report": report,
    }


# ─── Verify signature ─────────────────────────────────────────────────────────

@app.post("/runs/{run_id}/verify")
async def verify_run(run_id: str) -> dict[str, Any]:
    record = run_store.get(run_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    payload = record.get("content_hash", "")
    expected_sig = _sign_report(payload)
    actual_sig = record.get("signature", "")
    valid = hmac.compare_digest(expected_sig, actual_sig)

    return {
        "run_id": run_id,
        "signature_valid": valid,
        "content_hash": payload,
    }


def _sign_report(content_hash: str) -> str:
    return hmac.new(
        SIGNING_KEY.encode(),
        content_hash.encode(),
        hashlib.sha256,
    ).hexdigest()
