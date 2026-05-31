"""
FastAPI application for apps/eval-runner — `src.main:app`.

This is the import target launched by run.py (`uvicorn src.main:app`). It
exposes:

  GET  /healthz   liveness probe — process up + suites importable
  GET  /suites    list available eval suites with their content_hash
  GET  /suites/{name}
                  fetch one suite descriptor (cases + content_hash)
  POST /eval      RUN AN EVAL: grade a candidate's answers against a named
                  suite and return the per-case scores, weighted aggregate,
                  and the suite content_hash (the reproducibility anchor).

The /eval endpoint does real work: it routes each case through its registered
grader (exact_match / contains), computes a weighted score, and reports
pass/fail. It is not a 200-status placeholder — submitting wrong answers yields a
lower score, and the suite content_hash lets a caller verify the exact case set
that was scored.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .suites import (
    STANDARD_SUITE,
    UnknownGraderError,
    get_suite,
    list_suites,
    score_suite,
)

log = structlog.get_logger("eval-runner")

app = FastAPI(
    title="eval-runner",
    description="FastAPI eval harness: runs governed eval suites and reports weighted, reproducible scores.",
    version="0.1.0",
)


# ─── Schemas ─────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    suites_loaded: int
    standard_suite_hash: str


class SuiteSummary(BaseModel):
    suite_id: str
    name: str
    domain: str
    version: int
    case_count: int
    content_hash: str
    source: Optional[str] = None


class EvalRequest(BaseModel):
    suite: str = Field("standard", description="Suite name: 'standard' or a domain name.")
    answers: Dict[str, str] = Field(
        default_factory=dict,
        description="Map of case id -> candidate answer. Missing cases are graded as empty (typically 0.0).",
    )
    pass_threshold: float = Field(
        0.85, ge=0.0, le=1.0, description="Weighted-score threshold for an overall pass."
    )


class CaseResult(BaseModel):
    id: str
    category: Optional[str]
    grader: str
    weight: int
    expected: str
    candidate: str
    score: float
    passed: bool


class EvalResponse(BaseModel):
    suite_id: str
    suite_name: str
    content_hash: str
    case_count: int
    passed_count: int
    total_weight: int
    earned_weight: float
    weighted_score: float
    pass_threshold: float
    passed: bool
    results: List[CaseResult]


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    """Liveness: confirms the process is up and suites imported cleanly."""
    suites = list_suites()
    return HealthResponse(
        status="ok",
        suites_loaded=len(suites),
        standard_suite_hash=STANDARD_SUITE["content_hash"],
    )


@app.get("/suites", response_model=List[SuiteSummary])
def get_suites() -> List[SuiteSummary]:
    """List all available suites with their reproducibility content_hash."""
    out: List[SuiteSummary] = []
    for suite in list_suites().values():
        out.append(
            SuiteSummary(
                suite_id=suite["suite_id"],
                name=suite["name"],
                domain=suite["domain"],
                version=suite["version"],
                case_count=suite["case_count"],
                content_hash=suite["content_hash"],
                source=suite.get("source"),
            )
        )
    return out


@app.get("/suites/{name}")
def get_one_suite(name: str) -> Dict[str, Any]:
    """Return a full suite descriptor (cases + content_hash)."""
    try:
        return get_suite(name)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"unknown suite {name!r}")


@app.post("/eval", response_model=EvalResponse)
def run_eval(req: EvalRequest) -> EvalResponse:
    """
    Run an eval: grade `answers` against the named suite and return scores.

    This actually executes each case's grader against the supplied candidate
    answer, aggregates by weight, and compares the weighted score to the
    pass_threshold.
    """
    try:
        suite = get_suite(req.suite)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"unknown suite {req.suite!r}")

    try:
        scored = score_suite(suite["cases"], req.answers)
    except UnknownGraderError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    passed = scored["weighted_score"] >= req.pass_threshold
    log.info(
        "eval.run",
        suite=suite["suite_id"],
        content_hash=suite["content_hash"],
        weighted_score=scored["weighted_score"],
        passed=passed,
    )
    return EvalResponse(
        suite_id=suite["suite_id"],
        suite_name=suite["name"],
        content_hash=suite["content_hash"],
        case_count=scored["case_count"],
        passed_count=scored["passed_count"],
        total_weight=scored["total_weight"],
        earned_weight=scored["earned_weight"],
        weighted_score=scored["weighted_score"],
        pass_threshold=req.pass_threshold,
        passed=passed,
        results=[CaseResult(**r) for r in scored["results"]],
    )
