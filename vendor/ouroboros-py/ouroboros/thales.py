"""Thales primitives — Python port.

Source: Thales of Miletus (c. 624–546 BCE), as presented in
    Maor & Jost, Beautiful Geometry, Chapter 1 (Princeton University Press).

Two primitives:
  15. Similarity Ratio (Cheops Method) — H/S = h/s
  16. Inscribed-Angle Locus (Thales' theorem) — every point on the circle
      subtends the diameter at exactly π/2.

Faithful reimplementation of packages/reconciliation/src/thales.ts. The
numerical behaviour matches the TypeScript runtime within IEEE-754 tolerance.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal, Optional, Sequence


# --- Primitive 15: Similarity Ratio --------------------------------------

SimilarityVerdict = Literal["SIMILAR", "DEGRADED", "BROKEN", "UNDEFINED"]


@dataclass(frozen=True)
class ThalesReference:
    reference_height: float  # h
    reference_shadow: float  # s


@dataclass(frozen=True)
class ThalesObservation:
    observed_shadow: float  # S
    observed_height: Optional[float] = None  # H_obs


@dataclass(frozen=True)
class SimilarityThresholds:
    similar: float = 0.05
    degraded: float = 0.20


@dataclass(frozen=True)
class SimilarityReading:
    inferred_height: float
    trust_ratio: float
    workload_ratio: float
    similarity_defect: float
    verdict: SimilarityVerdict


def compute_similarity(
    reference: ThalesReference,
    observation: ThalesObservation,
    thresholds: SimilarityThresholds = SimilarityThresholds(),
) -> SimilarityReading:
    """Thales' staff-and-shadow inference: H = h · S / s."""
    h = reference.reference_height
    s = reference.reference_shadow
    S = observation.observed_shadow
    Hobs = observation.observed_height

    if not (math.isfinite(h) and math.isfinite(s) and math.isfinite(S)):
        raise ValueError("thales.similarity: h, s, S must all be finite")
    if h <= 0 or s <= 0 or S < 0:
        raise ValueError(
            "thales.similarity: h, s must be > 0 and S must be ≥ 0"
        )

    trust = h / s
    workload = S / s
    inferred = trust * S

    defect = float("nan")
    verdict: SimilarityVerdict = "UNDEFINED"

    if Hobs is not None:
        if not math.isfinite(Hobs) or Hobs < 0:
            raise ValueError("thales.similarity: H_obs must be a non-negative finite number")
        if inferred == 0:
            defect = 0.0 if Hobs == 0 else math.inf
        else:
            defect = abs(Hobs - inferred) / inferred
        if defect <= thresholds.similar:
            verdict = "SIMILAR"
        elif defect <= thresholds.degraded:
            verdict = "DEGRADED"
        else:
            verdict = "BROKEN"

    return SimilarityReading(
        inferred_height=inferred,
        trust_ratio=trust,
        workload_ratio=workload,
        similarity_defect=defect,
        verdict=verdict,
    )


def similarity_axis(
    reading: SimilarityReading,
    thresholds: SimilarityThresholds = SimilarityThresholds(),
) -> float:
    """Reduce a similarity reading to a Lutar axis fraction in [0, 1]."""
    if reading.verdict == "UNDEFINED":
        return 1.0
    if reading.verdict == "BROKEN":
        return 0.0
    t = 1 - reading.similarity_defect / thresholds.degraded
    return max(0.0, min(1.0, t))


# --- Primitive 16: Inscribed-Angle Locus ---------------------------------

LocusVerdict = Literal["ON_LOCUS", "DRIFT", "OFF_LOCUS", "INSUFFICIENT"]


@dataclass(frozen=True)
class Point2D:
    x: float
    y: float


@dataclass(frozen=True)
class WitnessOnCircle:
    id: str
    point: Point2D


@dataclass(frozen=True)
class Chord:
    a: Point2D
    b: Point2D


@dataclass(frozen=True)
class SubtendedReading:
    witness_id: str
    angle: float
    deviation: float


@dataclass(frozen=True)
class LocusReport:
    verdict: LocusVerdict
    median_angle: float
    mean_angle: float
    max_deviation: float
    readings: tuple[SubtendedReading, ...]


@dataclass(frozen=True)
class LocusThresholds:
    on_locus: float = math.pi / 180          # 1°
    drift: float = (5 * math.pi) / 180       # 5°


def _subtended_angle(p: Point2D, chord: Chord) -> float:
    ax = chord.a.x - p.x
    ay = chord.a.y - p.y
    bx = chord.b.x - p.x
    by = chord.b.y - p.y
    dot = ax * bx + ay * by
    cross = ax * by - ay * bx
    return abs(math.atan2(cross, dot))


def _median(xs: Sequence[float]) -> float:
    if not xs:
        return float("nan")
    s = sorted(xs)
    n = len(s)
    mid = n // 2
    if n % 2 == 0:
        return (s[mid - 1] + s[mid]) / 2
    return s[mid]


def verify_inscribed_angle(
    witnesses: Sequence[WitnessOnCircle],
    chord: Chord,
    thresholds: LocusThresholds = LocusThresholds(),
) -> LocusReport:
    """Verify Thales' inscribed-angle invariance across a witness set."""
    if len(witnesses) < 3:
        return LocusReport(
            verdict="INSUFFICIENT",
            median_angle=float("nan"),
            mean_angle=float("nan"),
            max_deviation=float("nan"),
            readings=(),
        )

    angles = [_subtended_angle(w.point, chord) for w in witnesses]
    med = _median(angles)
    mean = sum(angles) / len(angles)

    readings = tuple(
        SubtendedReading(witness_id=w.id, angle=angles[i], deviation=abs(angles[i] - med))
        for i, w in enumerate(witnesses)
    )
    max_dev = max((r.deviation for r in readings), default=0.0)

    if max_dev <= thresholds.on_locus:
        verdict: LocusVerdict = "ON_LOCUS"
    elif max_dev <= thresholds.drift:
        verdict = "DRIFT"
    else:
        verdict = "OFF_LOCUS"

    return LocusReport(
        verdict=verdict,
        median_angle=med,
        mean_angle=mean,
        max_deviation=max_dev,
        readings=readings,
    )


def locus_axis(
    report: LocusReport,
    thresholds: LocusThresholds = LocusThresholds(),
) -> float:
    if report.verdict == "INSUFFICIENT":
        return 1.0
    t = 1 - report.max_deviation / thresholds.drift
    return max(0.0, min(1.0, t))


def unit_diameter() -> Chord:
    """Diameter of the unit circle along the x-axis."""
    return Chord(a=Point2D(-1, 0), b=Point2D(1, 0))
