"""
Behavioural tests for the FastAPI app (src.main) and the graders (src.suites).

These assert real eval behaviour, not liveness:
  - correct answers score 1.0 and pass; wrong answers score 0.0 and fail;
    partial submissions score strictly between (no inflation);
  - the graders distinguish exact_match vs contains correctly;
  - /healthz reports the standard suite content_hash;
  - the suite content_hash is reproducible across two builds and matches the
    lm_eval_bridge content-hash helper (cross-module agreement).

conftest.py sets the offline flags before import, so the standard suite here is
the offline baseline.
"""
from fastapi.testclient import TestClient

from src.main import app
from src.suites import (
    STANDARD_SUITE,
    _hash_suite,
    grade_case,
    score_suite,
)
from src.lm_eval_bridge import compute_cases_content_hash

client = TestClient(app)


# ── Grader unit behaviour ─────────────────────────────────────────────────────

def test_exact_match_grader_is_strict_but_case_insensitive():
    case = {"id": "x", "category": "c", "prompt": "p", "expected": "Paris",
            "grader": "exact_match", "weight": 1}
    assert grade_case(case, "paris")["score"] == 1.0
    assert grade_case(case, "  PARIS ")["score"] == 1.0
    assert grade_case(case, "Paris, France")["score"] == 0.0


def test_contains_grader_requires_all_tokens():
    case = {"id": "x", "category": "c", "prompt": "p", "expected": "red, green, blue",
            "grader": "contains", "weight": 1}
    assert grade_case(case, "the colours are red, green and blue")["score"] == 1.0
    assert grade_case(case, "red and green")["score"] == 0.0


def test_score_suite_aggregates_by_weight():
    cases = [
        {"id": "a", "category": "c", "prompt": "p", "expected": "yes", "grader": "exact_match", "weight": 1},
        {"id": "b", "category": "c", "prompt": "p", "expected": "no", "grader": "exact_match", "weight": 3},
    ]
    # Only the weight-3 case correct → 3/4 = 0.75
    scored = score_suite(cases, {"a": "WRONG", "b": "no"})
    assert scored["weighted_score"] == 0.75
    assert scored["passed_count"] == 1


# ── HTTP behaviour ────────────────────────────────────────────────────────────

def test_healthz_reports_standard_hash():
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["standard_suite_hash"] == STANDARD_SUITE["content_hash"]
    assert body["suites_loaded"] >= 1


def test_eval_all_correct_passes():
    correct = {"std-001": "4", "std-002": "Paris", "std-003": "red, green, blue",
               "std-004": "7", "std-005": "yes"}
    r = client.post("/eval", json={"suite": "standard", "answers": correct})
    assert r.status_code == 200
    body = r.json()
    assert body["weighted_score"] == 1.0
    assert body["passed"] is True


def test_eval_all_wrong_fails():
    wrong = {cid: "banana" for cid in
             ("std-001", "std-002", "std-003", "std-004", "std-005")}
    body = client.post("/eval", json={"suite": "standard", "answers": wrong}).json()
    assert body["weighted_score"] == 0.0
    assert body["passed"] is False


def test_eval_partial_is_between_zero_and_one():
    body = client.post(
        "/eval", json={"suite": "standard", "answers": {"std-001": "4", "std-002": "Paris"}}
    ).json()
    assert 0.0 < body["weighted_score"] < 1.0
    assert body["passed"] is False


def test_eval_unknown_suite_404():
    assert client.post("/eval", json={"suite": "nope", "answers": {}}).status_code == 404


# ── Cross-module hash agreement ───────────────────────────────────────────────

def test_bridge_hash_matches_suite_hash():
    cases = STANDARD_SUITE["cases"]
    assert compute_cases_content_hash(cases) == _hash_suite(cases)
    assert _hash_suite(cases) == STANDARD_SUITE["content_hash"]
