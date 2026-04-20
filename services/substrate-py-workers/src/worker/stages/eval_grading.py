"""
Heavy-compute stage: Eval grading and scoring sweeps.

Used by:
  - Eval Console (eval-os / evals-core)

Contract:
  input:
    cases: list[dict]        — each has id, output, groundTruth, rubric?
    scoringFn: str           — "exact" | "f1" | "rouge_l" | "rubric" (default "f1")
    passMark: float          — minimum score to pass (default 0.7)
    mode: str

  output:
    results: list[dict]      — caseId, score, passed, breakdown
    summary: dict            — totalCases, passedCases, failedCases, avgScore, passRate
    gradingHash: str         — deterministic replay hash
    worker: str
"""

from __future__ import annotations

import hashlib
import json
import math
import time
from typing import Any


# ─── Scoring functions ────────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def _exact_match(output: str, ground_truth: str) -> float:
    return 1.0 if output.strip() == ground_truth.strip() else 0.0


def _f1_score(output: str, ground_truth: str) -> float:
    pred_tokens = set(_tokenize(output))
    gt_tokens = set(_tokenize(ground_truth))
    if not pred_tokens and not gt_tokens:
        return 1.0
    if not pred_tokens or not gt_tokens:
        return 0.0
    common = pred_tokens & gt_tokens
    precision = len(common) / len(pred_tokens)
    recall = len(common) / len(gt_tokens)
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def _lcs_length(a: list[str], b: list[str]) -> int:
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(2)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i % 2][j] = dp[(i - 1) % 2][j - 1] + 1
            else:
                dp[i % 2][j] = max(dp[(i - 1) % 2][j], dp[i % 2][j - 1])
    return dp[m % 2][n]


def _rouge_l(output: str, ground_truth: str) -> float:
    pred = _tokenize(output)
    gt = _tokenize(ground_truth)
    if not pred and not gt:
        return 1.0
    if not pred or not gt:
        return 0.0
    lcs = _lcs_length(pred, gt)
    precision = lcs / len(pred)
    recall = lcs / len(gt)
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def _rubric_score(output: str, rubric: dict) -> float:
    criteria = rubric.get("criteria") or []
    if not criteria:
        return _f1_score(output, rubric.get("expectedAnswer") or "")
    scores: list[float] = []
    for criterion in criteria:
        keyword = criterion.get("keyword") or ""
        weight = float(criterion.get("weight") or 1.0)
        hit = keyword.lower() in output.lower() if keyword else False
        scores.append(weight * (1.0 if hit else 0.0))
    total_weight = sum(float(c.get("weight") or 1.0) for c in criteria)
    return sum(scores) / total_weight if total_weight else 0.0


SCORING_FNS = {
    "exact": _exact_match,
    "f1": _f1_score,
    "rouge_l": _rouge_l,
}


def _grade_case(case: dict, scoring_fn: str, pass_mark: float) -> dict:
    case_id = case.get("id", "?")
    output = str(case.get("output") or "")
    ground_truth = str(case.get("groundTruth") or "")
    rubric = case.get("rubric")

    if scoring_fn == "rubric" and rubric:
        score = _rubric_score(output, rubric)
        breakdown = {"rubricApplied": True, "criteriaCount": len(rubric.get("criteria") or [])}
    else:
        fn = SCORING_FNS.get(scoring_fn, _f1_score)
        score = fn(output, ground_truth)
        breakdown = {"scoringFn": scoring_fn}

    return {
        "caseId": case_id,
        "score": round(score, 4),
        "passed": score >= pass_mark,
        "breakdown": breakdown,
    }


def _grading_hash(cases: list[dict], scoring_fn: str, pass_mark: float) -> str:
    payload = json.dumps(
        {
            "case_ids": [c.get("id") for c in cases],
            "scoring_fn": scoring_fn,
            "pass_mark": pass_mark,
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


async def execute(claim: dict[str, Any]) -> dict[str, Any]:
    start = time.monotonic()
    raw_input = claim.get("input") or {}
    mode = claim.get("mode", "live")

    cases: list[dict] = raw_input.get("cases") or []
    scoring_fn: str = raw_input.get("scoringFn") or "f1"
    pass_mark: float = float(raw_input.get("passMark") or 0.7)

    grading_hash = _grading_hash(cases, scoring_fn, pass_mark)

    if mode == "dry-run":
        return {
            "results": [],
            "summary": {
                "totalCases": len(cases),
                "passedCases": 0,
                "failedCases": 0,
                "avgScore": 0.0,
                "passRate": 0.0,
            },
            "gradingHash": grading_hash,
            "worker": "python-fleet",
            "dryRun": True,
        }

    if mode == "replay" and raw_input.get("replayHash"):
        expected = raw_input["replayHash"]
        if grading_hash != expected:
            raise ValueError(
                f"Eval grading replay hash mismatch: expected {expected!r}, got {grading_hash!r}."
            )

    results = [_grade_case(c, scoring_fn, pass_mark) for c in cases]

    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed
    avg_score = sum(r["score"] for r in results) / len(results) if results else 0.0
    pass_rate = passed / len(results) if results else 0.0

    elapsed_ms = int((time.monotonic() - start) * 1000)

    return {
        "results": results,
        "summary": {
            "totalCases": len(cases),
            "passedCases": passed,
            "failedCases": failed,
            "avgScore": round(avg_score, 4),
            "passRate": round(pass_rate, 4),
        },
        "gradingHash": grading_hash,
        "elapsedMs": elapsed_ms,
        "worker": "python-fleet",
        "mode": mode,
    }
