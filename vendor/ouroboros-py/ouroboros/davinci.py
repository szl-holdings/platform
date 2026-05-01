"""
Davinci module — Primitives 57-60.

Primitive 57: Vitruvian dual-frame check
Primitive 58: Vanishing-point coherence
Primitive 59: Divine-proportion ledger
Primitive 60: Sfumato gradient continuity
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Literal, Optional, Tuple


# ---------------------------------------------------------------------------
# Primitive 57 — Vitruvian dual-frame check
# ---------------------------------------------------------------------------

@dataclass
class FrameTest:
    frame_id: str
    admits: bool
    rationale: str


@dataclass
class DualFrameReceipt:
    frames: List[FrameTest]
    both_admit: bool
    frame_dependent: bool
    rationale: str


def check_dual_frame(frames: List[FrameTest]) -> DualFrameReceipt:
    """
    A claim must be admissible in two independent reference frames; if only
    one frame admits it, the claim is flagged as frame-dependent.
    """
    if len(frames) < 2:
        raise ValueError("dual-frame check requires at least 2 frames")
    distinct_ids = len({f.frame_id for f in frames})
    if distinct_ids < 2:
        raise ValueError("frames must have distinct ids")

    admits_count = sum(1 for f in frames if f.admits)
    both_admit = admits_count == len(frames)
    frame_dependent = admits_count > 0 and admits_count < len(frames)

    if both_admit:
        rationale = "claim is frame-invariant: admitted in every frame"
    elif frame_dependent:
        rationale = "frame-dependent: admitted in some but not all frames"
    else:
        rationale = "claim rejected by every frame"

    return DualFrameReceipt(
        frames=frames,
        both_admit=both_admit,
        frame_dependent=frame_dependent,
        rationale=rationale,
    )


# ---------------------------------------------------------------------------
# Primitive 58 — Vanishing-point coherence
# ---------------------------------------------------------------------------

@dataclass
class Line2D:
    id: str
    p: Tuple[float, float]
    q: Tuple[float, float]


@dataclass
class PerLineResult:
    id: str
    distance: float
    passes: bool


@dataclass
class VPReceipt:
    vanishing_point: Tuple[float, float]
    per_line: List[PerLineResult]
    max_distance: float
    tolerance: float
    coherent: bool
    rationale: str


def _distance_point_to_line(
    v: Tuple[float, float],
    p: Tuple[float, float],
    q: Tuple[float, float],
) -> float:
    """
    Distance from point V to line through P and Q:
    d = |(qy-py)*vx - (qx-px)*vy + qx*py - qy*px| / |q-p|
    """
    vx, vy = v
    px, py = p
    qx, qy = q
    num = abs((qy - py) * vx - (qx - px) * vy + qx * py - qy * px)
    length = math.hypot(qx - px, qy - py)
    if length == 0:
        raise ValueError("degenerate line: p === q")
    return num / length


def check_vanishing_point(
    vp: Tuple[float, float],
    lines: List[Line2D],
    tolerance: float = 0.5,
) -> VPReceipt:
    """
    Verify that declared orthogonal lines pass within tolerance of a
    declared vanishing point.
    """
    if len(lines) < 2:
        raise ValueError("need at least 2 orthogonals")

    per_line = []
    for line in lines:
        d = _distance_point_to_line(vp, line.p, line.q)
        per_line.append(PerLineResult(id=line.id, distance=d, passes=d <= tolerance))

    max_distance = max(r.distance for r in per_line)
    coherent = all(r.passes for r in per_line)

    return VPReceipt(
        vanishing_point=vp,
        per_line=per_line,
        max_distance=max_distance,
        tolerance=tolerance,
        coherent=coherent,
        rationale=(
            "all orthogonals converge at vanishing point within tolerance"
            if coherent
            else "scene incoherent: at least one orthogonal misses vanishing point"
        ),
    )


# ---------------------------------------------------------------------------
# Primitive 59 — Divine-proportion ledger
# ---------------------------------------------------------------------------

PHI: float = (1 + math.sqrt(5)) / 2
EXACT_PHI_TOL: float = 1e-6
APPROX_PHI_TOL: float = 0.05

PhiVerdict = Literal["exact", "approximate", "none"]


@dataclass
class PhiReceipt:
    ratio: float
    delta: float
    verdict: str  # "exact" | "approximate" | "none"
    rationale: str


def ratio_from_pair(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("ratio: denominator zero")
    return a / b


def verify_phi(ratio: float) -> PhiReceipt:
    delta = abs(ratio - PHI)
    if delta <= EXACT_PHI_TOL:
        verdict: str = "exact"
    elif delta <= APPROX_PHI_TOL * PHI:
        verdict = "approximate"
    else:
        verdict = "none"

    if verdict == "exact":
        rationale = "ratio matches φ within 1e-6"
    elif verdict == "approximate":
        rationale = "ratio is approximate φ — must not be cited as exact"
    else:
        rationale = "ratio is not φ"

    return PhiReceipt(ratio=ratio, delta=delta, verdict=verdict, rationale=rationale)


# ---------------------------------------------------------------------------
# Primitive 60 — Sfumato gradient continuity
# ---------------------------------------------------------------------------

@dataclass
class SfumatoSample:
    position: float  # ordered axis (e.g. pixel index)
    value: float     # tonal value


@dataclass
class SfumatoReceipt:
    total_variation: float
    max_step: float
    tolerance: float
    continuous: bool
    discontinuity_index: int  # -1 if continuous
    rationale: str


def check_sfumato(samples: List[SfumatoSample], tolerance: float = 0.05) -> SfumatoReceipt:
    """
    Compute total variation Σ|y_{i+1} − y_i| and the maximum step. A claimed
    continuous gradient must keep maxStep ≤ tolerance.
    """
    if len(samples) < 2:
        raise ValueError("sfumato requires ≥ 2 samples")

    ordered = sorted(samples, key=lambda s: s.position)
    tv = 0.0
    max_step = 0.0
    discontinuity_index = -1

    for i in range(1, len(ordered)):
        step = abs(ordered[i].value - ordered[i - 1].value)
        tv += step
        if step > max_step:
            max_step = step
            if step > tolerance and discontinuity_index == -1:
                discontinuity_index = i

    continuous = max_step <= tolerance
    final_index = -1 if continuous else discontinuity_index

    if continuous:
        rationale = "gradient continuous within tolerance"
    else:
        rationale = (
            f"discontinuity at index {final_index}: "
            f"step {max_step:.4f} > tolerance {tolerance}"
        )

    return SfumatoReceipt(
        total_variation=tv,
        max_step=max_step,
        tolerance=tolerance,
        continuous=continuous,
        discontinuity_index=final_index,
        rationale=rationale,
    )
