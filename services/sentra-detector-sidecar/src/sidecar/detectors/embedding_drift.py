"""
Canonical Python detector — `py-example/embedding-drift`.

Scores embedding drift between a current and baseline probability
distribution using the same `driftScore` formula as the TS canon at
`lib/formulas/src/risk.ts::driftScore` (mean absolute relative gap with
an epsilon-floor on the baseline). The formula is mirrored here so the
sidecar has no TS-runtime dependency at startup; a drift unit test
asserts that the Python and TS results stay byte-identical on the
shared fixture vectors.

Input contract:
  inputs["embedding.current"]  : list[float]  (length N)
  inputs["embedding.baseline"] : list[float]  (length N)

Params:
  gapMin : float = 0.10  — fire a finding when drift exceeds this gap
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..contracts import (
    DetectorContext,
    DetectorManifest,
    Finding,
)


def drift_score(p: list[float], q: list[float], epsilon: float = 1e-9) -> float:
    """Mirror of lib/formulas/src/risk.ts::driftScore — mean |p-q| / max(|q|, ε)."""
    if not p or not q or len(p) != len(q):
        return 0.0
    total = 0.0
    for a, b in zip(p, q):
        denom = abs(b) if abs(b) > epsilon else epsilon
        total += abs(a - b) / denom
    return total / len(p)


class EmbeddingDriftDetector:
    manifest = DetectorManifest(
        id="py-example/embedding-drift",
        label="Embedding Drift (KL-style)",
        description=(
            "Scores embedding drift against a baseline using the canonical "
            "driftScore formula. Fires when mean relative gap exceeds the "
            "configured gapMin threshold."
        ),
        kind="statistical",
        runtime="python",
        inputs=["embedding.current", "embedding.baseline"],
        costClass="cheap",
        governanceClass="advisory",
        attackTechniques=["T1565"],
        version="1.0.0",
    )

    async def evaluate(self, ctx: DetectorContext) -> list[Finding]:
        current = [float(x) for x in ctx.read("embedding.current")]
        baseline = [float(x) for x in ctx.read("embedding.baseline")]
        gap_min = float(ctx.params.get("gapMin", 0.10))
        score = drift_score(current, baseline)
        ctx.trace(
            "drift.computed",
            {"score": score, "gapMin": gap_min, "n": len(current)},
        )
        if score < gap_min:
            return []
        severity = (
            "critical" if score >= gap_min * 5
            else "high" if score >= gap_min * 3
            else "medium" if score >= gap_min * 1.5
            else "low"
        )
        normalized = min(1.0, score / (gap_min * 5))
        evidence: dict[str, Any] = {
            "driftScore": score,
            "gapMin": gap_min,
            "vectorLen": len(current),
        }
        return [
            Finding(
                id=f"{ctx.detectorId}#{ctx.runId}#0",
                detectorId=ctx.detectorId,
                runId=ctx.runId,
                severity=severity,
                score=normalized,
                title=f"Embedding drift detected (score={score:.3f})",
                summary=(
                    f"Mean relative gap {score:.3f} exceeds threshold {gap_min:.3f} "
                    f"across {len(current)} dimensions."
                ),
                attackTechniques=["T1565"],
                affectedAssets=[],
                evidence=evidence,
                recommendedAction={
                    "kind": "tune",
                    "detail": "Re-baseline the embedding head or inspect upstream data for poisoning.",
                },
                emittedAt=datetime.now(timezone.utc).isoformat(),
                governanceClass="advisory",
            )
        ]
