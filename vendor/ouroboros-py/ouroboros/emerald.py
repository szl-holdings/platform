"""Emerald primitives — Python port (Primitives 37–40).

Faithful Python reimplementation of packages/emerald/src/*.ts.

Sources
-------
Hermes Trismegistus, Emerald Tablet (tr. Newton, c. 1680).
Newton MS Add 3975 (King's College Cambridge).
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Literal


# ---------------------------------------------------------------------------
# Primitive 37 — Above-Below correspondence
# ---------------------------------------------------------------------------

_EPS = 1e-12


@dataclass(frozen=True)
class ScaleObservation:
    scale: str  # "micro" | "macro"
    value: float


@dataclass(frozen=True)
class AboveBelowReceipt:
    micro: float
    macro: float
    ratio: float
    symmetric_delta: float
    tolerance: float
    holds: bool
    rationale: str


def check_above_below(
    obs: list[ScaleObservation],
    tolerance: float = 0.05,
) -> AboveBelowReceipt:
    """Test scale-invariance (above ↔ below correspondence)."""
    micro_obs = next((o for o in obs if o.scale == "micro"), None)
    macro_obs = next((o for o in obs if o.scale == "macro"), None)
    if not micro_obs or not macro_obs:
        raise ValueError("above-below requires one micro and one macro observation")

    denom = max(abs(micro_obs.value), abs(macro_obs.value), _EPS)
    symmetric_delta = abs(micro_obs.value - macro_obs.value) / denom
    macro_val = macro_obs.value if macro_obs.value != 0 else _EPS
    ratio = micro_obs.value / macro_val
    holds = symmetric_delta <= tolerance

    return AboveBelowReceipt(
        micro=micro_obs.value,
        macro=macro_obs.value,
        ratio=ratio,
        symmetric_delta=symmetric_delta,
        tolerance=tolerance,
        holds=holds,
        rationale=(
            "scale-invariance holds within tolerance"
            if holds
            else "scale-break declared: above and below disagree"
        ),
    )


# ---------------------------------------------------------------------------
# Primitive 38 — One-Thing identity (substance preservation)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class SubstanceTrace:
    origin_id: str
    conserved: float
    transformations: tuple[str, ...]


@dataclass(frozen=True)
class OneThingReceipt:
    origin_id: str
    pre_total: float
    post_total: float
    drift_abs: float
    drift_rel: float
    tolerance: float
    preserved: bool
    rationale: str


def check_one_thing(
    pre: SubstanceTrace,
    post: SubstanceTrace,
    tolerance: float = 1e-9,
) -> OneThingReceipt:
    """Check substance preservation across transformations."""
    if pre.origin_id != post.origin_id:
        return OneThingReceipt(
            origin_id=pre.origin_id,
            pre_total=pre.conserved,
            post_total=post.conserved,
            drift_abs=float("nan"),
            drift_rel=float("nan"),
            tolerance=tolerance,
            preserved=False,
            rationale=f"origin mismatch: {pre.origin_id} -> {post.origin_id}",
        )
    drift_abs = abs(post.conserved - pre.conserved)
    denom = max(abs(pre.conserved), 1e-12)
    drift_rel = drift_abs / denom
    preserved = drift_rel <= tolerance
    return OneThingReceipt(
        origin_id=pre.origin_id,
        pre_total=pre.conserved,
        post_total=post.conserved,
        drift_abs=drift_abs,
        drift_rel=drift_rel,
        tolerance=tolerance,
        preserved=preserved,
        rationale=(
            "one-thing identity preserved: conserved quantity within tolerance"
            if preserved
            else "one-thing violated: substance not conserved across transformations"
        ),
    )


# ---------------------------------------------------------------------------
# Primitive 39 — Solve-et-Coagula gate
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class SolveCoagulaReceipt:
    parts_sum: float
    solve_residue: float
    coagula_residue: float
    tolerance: float
    both_phases_present: bool
    closes: bool
    rationale: str


def run_solve_coagula(
    whole: float,
    parts: list[float],
    recombined: float,
    tolerance: float = 1e-9,
) -> SolveCoagulaReceipt:
    """Run the Solve-et-Coagula gate."""
    both_phases_present = len(parts) > 0
    parts_sum = sum(parts)
    solve_residue = whole - parts_sum
    coagula_residue = recombined - whole
    closes = (
        both_phases_present
        and abs(solve_residue) <= tolerance
        and abs(coagula_residue) <= tolerance
    )
    if not both_phases_present:
        rationale = "rejected: solve phase missing (no parts logged)"
    elif closes:
        rationale = "solve and coagula both close within tolerance"
    else:
        rationale = "honest residue logged: separation or recombination did not close"

    return SolveCoagulaReceipt(
        parts_sum=parts_sum,
        solve_residue=solve_residue,
        coagula_residue=coagula_residue,
        tolerance=tolerance,
        both_phases_present=both_phases_present,
        closes=closes,
        rationale=rationale,
    )


# ---------------------------------------------------------------------------
# Primitive 40 — Hermetic seal (tamper-evident envelope)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class HermeticProvenance:
    author: str
    timestamp: str   # ISO-8601
    source_uri: str


@dataclass(frozen=True)
class HermeticEnvelope:
    payload: str
    provenance: HermeticProvenance
    seal: str  # SHA-256 hex


@dataclass(frozen=True)
class SealVerification:
    valid: bool
    expected: str
    observed: str
    rationale: str


def _canonicalise(payload: str, provenance: HermeticProvenance) -> str:
    return json.dumps({
        "payload": payload,
        "author": provenance.author,
        "timestamp": provenance.timestamp,
        "sourceUri": provenance.source_uri,
    }, separators=(",", ":"))


def seal_envelope(payload: str, provenance: HermeticProvenance) -> HermeticEnvelope:
    """Seal a payload with its provenance into a hermetic envelope."""
    canonical = _canonicalise(payload, provenance)
    seal = hashlib.sha256(canonical.encode()).hexdigest()
    return HermeticEnvelope(payload=payload, provenance=provenance, seal=seal)


def verify_seal(env: HermeticEnvelope) -> SealVerification:
    """Verify a hermetic envelope's seal."""
    expected = hashlib.sha256(_canonicalise(env.payload, env.provenance).encode()).hexdigest()
    valid = expected == env.seal
    return SealVerification(
        valid=valid,
        expected=expected,
        observed=env.seal,
        rationale=(
            "hermetic seal intact: payload and provenance unchanged"
            if valid
            else "seal broken: payload or provenance has been altered"
        ),
    )
