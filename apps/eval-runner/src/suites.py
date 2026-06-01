"""
Eval suites for apps/eval-runner.

An "eval" in this service is a *suite* of small, self-contained cases. Each
case is a dict with a stable schema:

    {
      "id":       str,   # stable, unique within the suite (used as sort key)
      "category": str,   # e.g. "mmlu", "ifeval", "truthfulqa", domain tag
      "prompt":   str,   # the question / instruction posed to a model
      "expected": str,   # the reference answer
      "grader":   str,   # how a candidate answer is scored ("exact_match" | "contains")
      "weight":   int,   # relative weight when aggregating the suite score
    }

The suite is the unit of reproducibility. `_hash_suite()` produces a
deterministic SHA-256 over the canonical JSON of the cases — this
`content_hash` is the non-repudiable evidence anchor referenced by
test_suite_reproducibility.py: if the suite content changes, the hash
changes, and a CI gate can detect it.

Graders are real: `grade_case()` actually evaluates a candidate answer against
a case's `expected` value using the case's `grader` strategy and returns a
0.0–1.0 score. `score_suite()` runs every case through its grader and produces
a weighted aggregate. This is what the FastAPI /eval endpoint runs — there is
no 200-status placeholder behind it.

This module is pure Python (no network I/O) so it is import-safe and
deterministic in offline CI, matching the determinism guards set in
conftest.py.
"""
from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Callable, Dict, List

Case = Dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# Canonicalisation + content hashing (the reproducibility anchor)
# ─────────────────────────────────────────────────────────────────────────────

def _canonical_cases_json(cases: List[Case]) -> str:
    """
    Canonical JSON serialisation of a list of cases.

    Two properties matter for reproducibility:
      1. Order independence: cases are sorted by their "id" before serialising,
         so input ordering never affects the hash.
      2. Byte stability: sort_keys=True + compact separators give a single
         canonical byte string for a given logical content.
    """
    ordered = sorted(cases, key=lambda c: c["id"])
    return json.dumps(ordered, sort_keys=True, separators=(",", ":"))


def _hash_suite(cases: List[Case]) -> str:
    """
    SHA-256 (64-char hex) over the canonical serialisation of `cases`.

    Order-independent, and sensitive to any change in id / prompt / expected /
    grader / weight / category. This is the suite's content_hash.
    """
    canonical = _canonical_cases_json(cases)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _build(
    suite_id: str,
    name: str,
    description: str,
    domain: str,
    version: int,
    cases: List[Case],
) -> Dict[str, Any]:
    """
    Build a suite descriptor with a content_hash derived from its cases.

    The returned dict carries everything a consumer needs to identify the suite
    and verify it has not drifted: suite_id, name, description, domain, version,
    cases, case_count, and content_hash == _hash_suite(cases).
    """
    return {
        "suite_id": suite_id,
        "name": name,
        "description": description,
        "domain": domain,
        "version": version,
        "cases": list(cases),
        "case_count": len(cases),
        "content_hash": _hash_suite(cases),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Graders — real scoring of a candidate answer against a case
# ─────────────────────────────────────────────────────────────────────────────

def _norm(text: str) -> str:
    """Whitespace- and case-normalised comparison form."""
    return " ".join(str(text).strip().lower().split())


def _grade_exact_match(candidate: str, expected: str) -> float:
    """1.0 iff the normalised candidate equals the normalised expected answer."""
    return 1.0 if _norm(candidate) == _norm(expected) else 0.0


def _grade_contains(candidate: str, expected: str) -> float:
    """
    1.0 iff every comma-separated expected token appears in the candidate.

    Used for list-style answers (e.g. "red, green, blue") where order and
    surrounding text should not matter, but all required tokens must be present.
    """
    cand = _norm(candidate)
    tokens = [t.strip() for t in str(expected).split(",") if t.strip()]
    if not tokens:
        return 1.0 if cand == "" else 0.0
    return 1.0 if all(_norm(tok) in cand for tok in tokens) else 0.0


GRADERS: Dict[str, Callable[[str, str], float]] = {
    "exact_match": _grade_exact_match,
    "contains": _grade_contains,
}


class UnknownGraderError(ValueError):
    """Raised when a case references a grader that is not registered."""


def grade_case(case: Case, candidate: str) -> Dict[str, Any]:
    """
    Run a single case's grader against a candidate answer.

    Returns a per-case result: case id, grader used, the score (0.0–1.0),
    pass flag, weight, and the candidate/expected pair for auditability.
    """
    grader_name = case["grader"]
    grader = GRADERS.get(grader_name)
    if grader is None:
        raise UnknownGraderError(
            f"case {case.get('id')!r} references unknown grader {grader_name!r}; "
            f"known graders: {sorted(GRADERS)}"
        )
    score = grader(candidate, case["expected"])
    return {
        "id": case["id"],
        "category": case.get("category"),
        "grader": grader_name,
        "weight": int(case.get("weight", 1)),
        "expected": case["expected"],
        "candidate": candidate,
        "score": score,
        "passed": score >= 1.0,
    }


def score_suite(cases: List[Case], answers: Dict[str, str]) -> Dict[str, Any]:
    """
    Run an entire suite: grade every case against the candidate `answers` map
    (case id -> candidate answer) and produce a weighted aggregate.

    Cases with no supplied answer are graded against the empty string (they
    score per their grader, typically 0.0) so the suite always reports the full
    case set — partial submissions cannot inflate the score.

    Returns:
      - results: per-case grade results
      - total_weight / earned_weight
      - weighted_score: earned_weight / total_weight (0.0–1.0)
      - passed_count / case_count
    """
    results = [grade_case(c, answers.get(c["id"], "")) for c in cases]
    total_weight = sum(r["weight"] for r in results) or 1
    earned_weight = sum(r["weight"] * r["score"] for r in results)
    return {
        "results": results,
        "case_count": len(results),
        "passed_count": sum(1 for r in results if r["passed"]),
        "total_weight": total_weight,
        "earned_weight": earned_weight,
        "weighted_score": earned_weight / total_weight,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Domain suites — pure-Python case sets (no network I/O)
# ─────────────────────────────────────────────────────────────────────────────
# These are small, fixed, audit-grade case sets per SZL Holdings vertical. They
# are intentionally factual/closed-form so a grader can score them offline and
# deterministically. The domain names mirror the verticals modelled in
# packages/aef-evals fixtures (vessels, terra, aegis, etc.).

_VESSELS_CASES: List[Case] = [
    {"id": "vessels-001", "category": "vessels", "prompt": "Which identifier is the 7-digit IMO ship number?", "expected": "IMO number", "grader": "contains", "weight": 1},
    {"id": "vessels-002", "category": "vessels", "prompt": "What broadcast system reports a vessel's position and identity?", "expected": "AIS", "grader": "contains", "weight": 2},
    {"id": "vessels-003", "category": "vessels", "prompt": "A vessel that switches off its transponder to avoid detection is called a?", "expected": "dark vessel", "grader": "contains", "weight": 2},
    {"id": "vessels-004", "category": "vessels", "prompt": "Inspection regime where the port country inspects foreign ships is called?", "expected": "port-state control", "grader": "contains", "weight": 1},
]

_TERRA_CASES: List[Case] = [
    {"id": "terra-001", "category": "terra", "prompt": "Ratio of loan amount to property value, abbreviated?", "expected": "LTV", "grader": "contains", "weight": 1},
    {"id": "terra-002", "category": "terra", "prompt": "Metric for a property's net operating income over its value?", "expected": "cap rate", "grader": "contains", "weight": 2},
    {"id": "terra-003", "category": "terra", "prompt": "Flood-risk designation maintained by FEMA is the flood?", "expected": "flood zone", "grader": "contains", "weight": 1},
]

_AEGIS_CASES: List[Case] = [
    {"id": "aegis-001", "category": "aegis", "prompt": "Public catalogue identifier for a known software vulnerability?", "expected": "CVE", "grader": "contains", "weight": 2},
    {"id": "aegis-002", "category": "aegis", "prompt": "Severity scoring framework for vulnerabilities, abbreviated?", "expected": "CVSS", "grader": "contains", "weight": 1},
    {"id": "aegis-003", "category": "aegis", "prompt": "Observable artefact that signals a breach is an indicator of?", "expected": "compromise", "grader": "contains", "weight": 2},
]

_SENTRA_CASES: List[Case] = [
    {"id": "sentra-001", "category": "sentra", "prompt": "EU regulation governing personal-data protection, abbreviated?", "expected": "GDPR", "grader": "contains", "weight": 2},
    {"id": "sentra-002", "category": "sentra", "prompt": "California consumer privacy statute, abbreviated?", "expected": "CCPA", "grader": "contains", "weight": 1},
    {"id": "sentra-003", "category": "sentra", "prompt": "Documented record of who accessed what and when is an audit?", "expected": "audit trail", "grader": "contains", "weight": 1},
]

_COUNSEL_CASES: List[Case] = [
    {"id": "counsel-001", "category": "counsel", "prompt": "Agreement that keeps shared information confidential, abbreviated?", "expected": "NDA", "grader": "contains", "weight": 1},
    {"id": "counsel-002", "category": "counsel", "prompt": "Investigation a buyer performs before acquiring is called due?", "expected": "due diligence", "grader": "contains", "weight": 2},
    {"id": "counsel-003", "category": "counsel", "prompt": "Clause excusing performance due to extraordinary events is force?", "expected": "force majeure", "grader": "contains", "weight": 2},
]

DOMAIN_CASES: Dict[str, List[Case]] = {
    "vessels": _VESSELS_CASES,
    "terra": _TERRA_CASES,
    "aegis": _AEGIS_CASES,
    "sentra": _SENTRA_CASES,
    "counsel": _COUNSEL_CASES,
}

DOMAIN_SUITES: Dict[str, Dict[str, Any]] = {
    "vessels": _build("vessels-domain-v1", "Vessels", "Maritime risk eval cases", "vessels", 1, _VESSELS_CASES),
    "terra": _build("terra-domain-v1", "Terra", "Real-estate intel eval cases", "terra", 1, _TERRA_CASES),
    "aegis": _build("aegis-domain-v1", "Aegis", "Security incident eval cases", "aegis", 1, _AEGIS_CASES),
    "sentra": _build("sentra-domain-v1", "Sentra", "Governance / compliance eval cases", "sentra", 1, _SENTRA_CASES),
    "counsel": _build("counsel-domain-v1", "Counsel", "Legal advisory eval cases", "counsel", 1, _COUNSEL_CASES),
}


# ─────────────────────────────────────────────────────────────────────────────
# Standard suite — offline fallback baseline
# ─────────────────────────────────────────────────────────────────────────────
# In a GPU/online deployment the standard suite is pulled from the lm-eval
# bridge (MMLU / IFEval / TruthfulQA subsets). When offline (the default in CI,
# enforced by conftest.py setting EVAL_OFFLINE_FALLBACK=1), we bootstrap a small
# built-in baseline so the service stays import-safe and deterministic. The
# fallback is labelled honestly via STANDARD_SUITE["source"].

_OFFLINE_STANDARD_CASES: List[Case] = [
    {"id": "std-001", "category": "mmlu", "prompt": "What is 2+2?", "expected": "4", "grader": "exact_match", "weight": 1},
    {"id": "std-002", "category": "mmlu", "prompt": "What is the capital of France?", "expected": "Paris", "grader": "exact_match", "weight": 1},
    {"id": "std-003", "category": "ifeval", "prompt": "List the three additive primary colours.", "expected": "red, green, blue", "grader": "contains", "weight": 2},
    {"id": "std-004", "category": "truthfulqa", "prompt": "How many continents are there?", "expected": "7", "grader": "exact_match", "weight": 1},
    {"id": "std-005", "category": "truthfulqa", "prompt": "Is the chemical symbol for water H2O?", "expected": "yes", "grader": "exact_match", "weight": 1},
]


def _bootstrap_standard_suite() -> Dict[str, Any]:
    """
    Build STANDARD_SUITE.

    Tries the lm-eval bridge first; if offline / unavailable (the CI default),
    falls back to the built-in offline baseline. The chosen `source` is recorded
    on the suite so consumers can see whether the cases came from lm-eval or the
    offline fallback — no fabricated "online" status when running offline.
    """
    offline_env = os.environ.get("EVAL_OFFLINE_FALLBACK") == "1"
    if not offline_env:
        try:
            from .lm_eval_bridge import load_lm_eval_cases

            cases = load_lm_eval_cases()
            suite = _build("standard-v1", "Standard", "lm-eval standard suite", "standard", 1, cases)
            suite["source"] = "lm_eval"
            return suite
        except Exception:
            # Any failure (offline, missing extras, network error) → fallback.
            pass

    suite = _build(
        "standard-v1",
        "Standard",
        "Offline baseline standard suite (lm-eval bridge unavailable)",
        "standard",
        1,
        _OFFLINE_STANDARD_CASES,
    )
    suite["source"] = "offline_fallback"
    return suite


STANDARD_SUITE: Dict[str, Any] = _bootstrap_standard_suite()


def list_suites() -> Dict[str, Dict[str, Any]]:
    """Return all known suites keyed by their public name (standard + domains)."""
    suites: Dict[str, Dict[str, Any]] = {"standard": STANDARD_SUITE}
    suites.update(DOMAIN_SUITES)
    return suites


def get_suite(name: str) -> Dict[str, Any]:
    """Look up a suite by name. Raises KeyError if unknown."""
    return list_suites()[name]
