"""
Canonical Python detector — `py-example/log-anomaly-isolationforest`.

Runs `sklearn.IsolationForest` over a windowed log stream and emits
findings for rows scored as anomalies above the configured
contamination threshold.

Input contract:
  inputs["logs.window"] : list[dict]
    Each row must include numeric features; non-numeric columns are
    ignored. The detector lifts a stable subset of features so the
    same window reproduces deterministic findings under a fixed seed.

Params:
  contamination : float = 0.05
  randomState   : int   = 17
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest

from ..contracts import DetectorContext, DetectorManifest, Finding


def _row_features(row: dict[str, Any]) -> list[float]:
    out: list[float] = []
    for k in sorted(row.keys()):
        v = row[k]
        if isinstance(v, bool):
            out.append(1.0 if v else 0.0)
        elif isinstance(v, (int, float)):
            out.append(float(v))
    return out


class LogAnomalyIsoForestDetector:
    manifest = DetectorManifest(
        id="py-example/log-anomaly-isolationforest",
        label="Log Anomaly (Isolation Forest)",
        description=(
            "Scores each row in a windowed log stream with sklearn IsolationForest "
            "and emits a finding for every row classified as an outlier."
        ),
        kind="ml",
        runtime="python",
        inputs=["logs.window"],
        costClass="moderate",
        governanceClass="advisory",
        attackTechniques=["T1078"],
        version="1.0.0",
    )

    async def evaluate(self, ctx: DetectorContext) -> list[Finding]:
        rows = list(ctx.read("logs.window"))
        if len(rows) < 8:
            ctx.trace("insufficient_rows", {"count": len(rows)})
            return []
        feats = [_row_features(r) for r in rows if isinstance(r, dict)]
        widths = {len(f) for f in feats}
        if len(widths) != 1 or next(iter(widths)) == 0:
            ctx.trace("inconsistent_features", {"widths": list(widths)})
            return []
        X = np.array(feats, dtype=float)
        contamination = float(ctx.params.get("contamination", 0.05))
        random_state = int(ctx.params.get("randomState", 17))
        model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=64,
        )
        labels = model.fit_predict(X)
        raw = model.score_samples(X)
        # Higher score_samples = more normal. Normalize anomaly score to [0,1].
        spread = float(raw.max() - raw.min()) or 1.0
        norm = 1.0 - (raw - raw.min()) / spread
        ctx.trace(
            "ml.fit_predict",
            {"rows": len(rows), "outliers": int((labels == -1).sum())},
        )
        findings: list[Finding] = []
        idx = 0
        for i, lab in enumerate(labels):
            if lab != -1:
                continue
            score = float(norm[i])
            severity = (
                "high" if score >= 0.85
                else "medium" if score >= 0.55
                else "low"
            )
            row = rows[i] if isinstance(rows[i], dict) else {"index": i}
            assets = []
            for key in ("host", "asset", "hostname", "ip", "user"):
                if key in row and isinstance(row[key], str):
                    assets.append(row[key])
                    break
            findings.append(
                Finding(
                    id=f"{ctx.detectorId}#{ctx.runId}#{idx}",
                    detectorId=ctx.detectorId,
                    runId=ctx.runId,
                    severity=severity,
                    score=score,
                    title=f"Log anomaly (row {i}, score {score:.2f})",
                    summary=(
                        f"Isolation Forest flagged row {i} as an outlier "
                        f"(contamination={contamination})."
                    ),
                    attackTechniques=["T1078"],
                    affectedAssets=assets,
                    evidence={"row": row, "anomalyScore": score, "rowIndex": i},
                    recommendedAction={
                        "kind": "investigate",
                        "detail": "Pull the surrounding window from the SIEM and correlate against identity activity.",
                    },
                    emittedAt=datetime.now(timezone.utc).isoformat(),
                    governanceClass="advisory",
                )
            )
            idx += 1
        return findings
