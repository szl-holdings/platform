"""Posture drift — baseline vs current snapshot diff with severity-weighted Λ score.

Lambda (Λ) score is a weighted aggregation of drift events. The module attempts
to import ``lambda_math`` (created by the spine task); if absent, it falls back
to a local implementation with the same signature.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Literal, Mapping

Severity = Literal["critical", "high", "medium", "low"]

_SEVERITY_WEIGHT: dict[Severity, float] = {
    "critical": 1.0,
    "high": 0.75,
    "medium": 0.45,
    "low": 0.2,
}


def _lambda_score(weights: Iterable[float]) -> float:
    """Compute Λ as the saturated sum of weights: 1 - exp(-sum)."""

    try:  # pragma: no cover - dependency-soft import
        from lambda_math import saturated_sum  # type: ignore[import-not-found]

        return float(saturated_sum(list(weights)))
    except Exception:
        import math

        total = sum(weights)
        return round(1.0 - math.exp(-total), 4)


@dataclass(frozen=True)
class Control:
    id: str
    name: str
    severity: Severity = "medium"
    state: str = "enabled"  # enabled | disabled | partial | unknown
    metadata: Mapping[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class PostureSnapshot:
    snapshot_id: str
    captured_at: str  # ISO-8601
    controls: tuple[Control, ...]

    def by_id(self) -> dict[str, Control]:
        return {c.id: c for c in self.controls}


@dataclass(frozen=True)
class ControlDrift:
    control_id: str
    name: str
    change: Literal["added", "removed", "changed"]
    severity: Severity
    weight: float
    before: Control | None
    after: Control | None
    notes: str


@dataclass(frozen=True)
class DriftReport:
    baseline_id: str
    current_id: str
    added: tuple[ControlDrift, ...]
    removed: tuple[ControlDrift, ...]
    changed: tuple[ControlDrift, ...]
    lambda_score: float  # 0..1 — severity-weighted aggregate drift
    severity_band: Severity

    def to_dict(self) -> dict:
        def _ser(c: Control | None) -> dict | None:
            if c is None:
                return None
            d = dict(c.__dict__)
            d["metadata"] = dict(c.metadata)
            return d

        def _drift(d: ControlDrift) -> dict:
            return {
                "control_id": d.control_id,
                "name": d.name,
                "change": d.change,
                "severity": d.severity,
                "weight": d.weight,
                "before": _ser(d.before),
                "after": _ser(d.after),
                "notes": d.notes,
            }

        return {
            "baseline_id": self.baseline_id,
            "current_id": self.current_id,
            "added": [_drift(x) for x in self.added],
            "removed": [_drift(x) for x in self.removed],
            "changed": [_drift(x) for x in self.changed],
            "lambda_score": self.lambda_score,
            "severity_band": self.severity_band,
        }


def _band(score: float) -> Severity:
    if score >= 0.8:
        return "critical"
    if score >= 0.55:
        return "high"
    if score >= 0.3:
        return "medium"
    return "low"


def compute_drift(baseline: PostureSnapshot, current: PostureSnapshot) -> DriftReport:
    """Diff two posture snapshots, returning a typed, severity-weighted report."""

    b = baseline.by_id()
    c = current.by_id()

    added: list[ControlDrift] = []
    removed: list[ControlDrift] = []
    changed: list[ControlDrift] = []
    weights: list[float] = []

    for cid, ctrl in c.items():
        if cid not in b:
            w = _SEVERITY_WEIGHT[ctrl.severity]
            added.append(
                ControlDrift(
                    control_id=cid,
                    name=ctrl.name,
                    change="added",
                    severity=ctrl.severity,
                    weight=w,
                    before=None,
                    after=ctrl,
                    notes=f"Control {ctrl.name} introduced in {current.snapshot_id}",
                )
            )
            # Added controls are generally posture-positive; small weight.
            weights.append(w * 0.25)

    for cid, ctrl in b.items():
        if cid not in c:
            w = _SEVERITY_WEIGHT[ctrl.severity]
            removed.append(
                ControlDrift(
                    control_id=cid,
                    name=ctrl.name,
                    change="removed",
                    severity=ctrl.severity,
                    weight=w,
                    before=ctrl,
                    after=None,
                    notes=f"Control {ctrl.name} removed since {baseline.snapshot_id}",
                )
            )
            weights.append(w)  # full weight — removals are bad

    for cid, after in c.items():
        before = b.get(cid)
        if before is None or before == after:
            continue
        sev = (
            after.severity
            if _SEVERITY_WEIGHT[after.severity] >= _SEVERITY_WEIGHT[before.severity]
            else before.severity
        )
        w = _SEVERITY_WEIGHT[sev]
        state_changed = before.state != after.state
        changed.append(
            ControlDrift(
                control_id=cid,
                name=after.name,
                change="changed",
                severity=sev,
                weight=w,
                before=before,
                after=after,
                notes=(
                    f"state {before.state}->{after.state}"
                    if state_changed
                    else "metadata changed"
                ),
            )
        )
        weights.append(w * (1.0 if state_changed else 0.5))

    lam = _lambda_score(weights)
    return DriftReport(
        baseline_id=baseline.snapshot_id,
        current_id=current.snapshot_id,
        added=tuple(added),
        removed=tuple(removed),
        changed=tuple(changed),
        lambda_score=lam,
        severity_band=_band(lam),
    )
