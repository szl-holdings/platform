"""Blanca primitives — Python port (Primitives 21–24).

Faithful Python reimplementation of packages/blanca/src/*.ts.

Sources
-------
Primitive 21: Albert Einstein, "Zur Elektrodynamik bewegter Körper",
  Annalen der Physik (ser. 4) 17 (1905), pp. 891–921.
Primitive 22: Albert Einstein, "Über das Relativitätsprinzip..." (1907);
  "Über den Einfluß der Schwerkraft..." (1911).
Primitive 23: A. Einstein, B. Podolsky, N. Rosen, Phys. Rev. 47 (1935);
  J. S. Bell, Physics 1 (1964); Clauser–Horne–Shimony–Holt (1969).
Primitive 24: A. Einstein, Sitzungsberichte (1917, 1931).
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal, Sequence


# ---------------------------------------------------------------------------
# Primitive 21 — Lorentz-invariance witness
# ---------------------------------------------------------------------------

C_DEFAULT = 299_792_458  # speed of light in m/s


@dataclass(frozen=True)
class SpacetimeEvent:
    t: float
    x: tuple[float, ...]


@dataclass(frozen=True)
class PairedObservation:
    frame1A: SpacetimeEvent
    frame1B: SpacetimeEvent
    frame2A: SpacetimeEvent
    frame2B: SpacetimeEvent


@dataclass(frozen=True)
class InvarianceThresholds:
    invariant: float = 1e-9
    near: float = 1e-3


@dataclass(frozen=True)
class InvarianceReading:
    interval1: float
    interval2: float
    defect: float
    relative_defect: float
    verdict: str  # "INVARIANT" | "NEAR_INVARIANT" | "BROKEN"


_DEFAULT_INVARIANCE_THRESHOLDS = InvarianceThresholds()


def _squared_interval(a: SpacetimeEvent, b: SpacetimeEvent, c: float) -> float:
    if len(a.x) != len(b.x):
        raise ValueError("blanca.squared_interval: spatial vectors must have matching length")
    dt = b.t - a.t
    dx2 = sum((b.x[i] - a.x[i]) ** 2 for i in range(len(a.x)))
    return c * c * dt * dt - dx2


def check_invariance(
    obs: PairedObservation,
    c: float = C_DEFAULT,
    thresholds: InvarianceThresholds = _DEFAULT_INVARIANCE_THRESHOLDS,
) -> InvarianceReading:
    """Test whether a paired observation is Lorentz-invariant."""
    if not math.isfinite(c) or c <= 0:
        raise ValueError("blanca.check_invariance: c must be a positive finite number")
    s1 = _squared_interval(obs.frame1A, obs.frame1B, c)
    s2 = _squared_interval(obs.frame2A, obs.frame2B, c)
    for v in (s1, s2):
        if not math.isfinite(v):
            raise ValueError("blanca.check_invariance: non-finite interval")
    defect = abs(s1 - s2)
    scale = max(abs(s1), abs(s2), 1.0)
    relative_defect = defect / scale
    if relative_defect <= thresholds.invariant:
        verdict = "INVARIANT"
    elif relative_defect <= thresholds.near:
        verdict = "NEAR_INVARIANT"
    else:
        verdict = "BROKEN"
    return InvarianceReading(
        interval1=s1,
        interval2=s2,
        defect=defect,
        relative_defect=relative_defect,
        verdict=verdict,
    )


def invariance_axis(
    reading: InvarianceReading,
    thresholds: InvarianceThresholds = _DEFAULT_INVARIANCE_THRESHOLDS,
) -> float:
    """Reduce an invariance reading to I ∈ [0, 1]."""
    if reading.verdict == "BROKEN":
        return 0.0
    t = 1 - reading.relative_defect / thresholds.near
    return max(0.0, min(1.0, t))


# ---------------------------------------------------------------------------
# Primitive 22 — Equivalence-principle witness
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class EquivalenceObservation:
    mean_acceleration: float
    tidal_delta: float
    window: float


@dataclass(frozen=True)
class EquivalenceThresholds:
    field_threshold: float = 0.1
    frame_threshold: float = 0.01
    max_window: float = 60.0


@dataclass(frozen=True)
class EquivalenceReading:
    tidal_ratio: float
    deferral_ceiling: float
    verdict: str  # "INDISTINGUISHABLE" | "FIELD_DETECTED" | "FRAME_ARTIFACT" | "WINDOW_EXCEEDED"


_DEFAULT_EQUIVALENCE_THRESHOLDS = EquivalenceThresholds()


def check_equivalence(
    obs: EquivalenceObservation,
    thresholds: EquivalenceThresholds = _DEFAULT_EQUIVALENCE_THRESHOLDS,
) -> EquivalenceReading:
    """Apply the equivalence-principle test to a witness observation."""
    for v in (obs.mean_acceleration, obs.tidal_delta, obs.window):
        if not math.isfinite(v):
            raise ValueError(
                "blanca.check_equivalence: observation must contain finite numbers"
            )
    if obs.window <= 0:
        raise ValueError("blanca.check_equivalence: window must be positive")
    if obs.tidal_delta < 0:
        raise ValueError("blanca.check_equivalence: tidal_delta must be non-negative")

    denom = abs(obs.mean_acceleration)
    if denom == 0:
        tidal_ratio = 0.0 if obs.tidal_delta == 0 else math.inf
    else:
        tidal_ratio = obs.tidal_delta / denom

    deferral_ceiling = thresholds.max_window

    if obs.window > thresholds.max_window:
        verdict = "WINDOW_EXCEEDED"
    elif tidal_ratio >= thresholds.field_threshold:
        verdict = "FIELD_DETECTED"
    elif tidal_ratio <= thresholds.frame_threshold:
        verdict = "FRAME_ARTIFACT"
    else:
        verdict = "INDISTINGUISHABLE"

    return EquivalenceReading(
        tidal_ratio=tidal_ratio,
        deferral_ceiling=deferral_ceiling,
        verdict=verdict,
    )


def equivalence_axis(
    reading: EquivalenceReading,
    thresholds: EquivalenceThresholds = _DEFAULT_EQUIVALENCE_THRESHOLDS,
) -> float:
    """Reduce an equivalence reading to E ∈ [0, 1]."""
    if reading.verdict in ("FIELD_DETECTED", "WINDOW_EXCEEDED"):
        return 0.0
    if reading.verdict == "FRAME_ARTIFACT":
        return 1.0
    # INDISTINGUISHABLE
    span = thresholds.field_threshold - thresholds.frame_threshold
    if span <= 0:
        return 1.0
    t = 1 - (reading.tidal_ratio - thresholds.frame_threshold) / span
    return max(0.0, min(1.0, t))


# ---------------------------------------------------------------------------
# Primitive 23 — EPR completeness test (CHSH)
# ---------------------------------------------------------------------------

_TSIRELSON = 2 * math.sqrt(2)  # ≈ 2.828


@dataclass(frozen=True)
class CHSHRound:
    a1: Literal[-1, 1]
    a2: Literal[-1, 1]
    b1: Literal[-1, 1]
    b2: Literal[-1, 1]


@dataclass(frozen=True)
class EPRReport:
    rounds: int
    E_ab: float
    E_abp: float
    E_apb: float
    E_apbp: float
    S: float
    abs_S: float
    verdict: str  # "LOCAL_REALIST" | "EPR_INCOMPLETE" | "SUPERLUMINAL_REJECT" | "INSUFFICIENT"


def epr_test(rounds: Sequence[CHSHRound]) -> EPRReport:
    """Compute the CHSH statistic on a list of paired-witness rounds."""
    n = len(rounds)
    if n < 16:
        return EPRReport(
            rounds=n,
            E_ab=float("nan"),
            E_abp=float("nan"),
            E_apb=float("nan"),
            E_apbp=float("nan"),
            S=float("nan"),
            abs_S=float("nan"),
            verdict="INSUFFICIENT",
        )
    for r in rounds:
        for v in (r.a1, r.a2, r.b1, r.b2):
            if v not in (-1, 1):
                raise ValueError("blanca.epr_test: outcomes must be ±1")

    s_ab = s_abp = s_apb = s_apbp = 0
    for r in rounds:
        s_ab += r.a1 * r.b1
        s_abp += r.a1 * r.b2
        s_apb += r.a2 * r.b1
        s_apbp += r.a2 * r.b2

    E_ab = s_ab / n
    E_abp = s_abp / n
    E_apb = s_apb / n
    E_apbp = s_apbp / n

    S = E_ab - E_abp + E_apb + E_apbp
    abs_S = abs(S)

    if abs_S <= 2:
        verdict = "LOCAL_REALIST"
    elif abs_S <= _TSIRELSON + 1e-9:
        verdict = "EPR_INCOMPLETE"
    else:
        verdict = "SUPERLUMINAL_REJECT"

    return EPRReport(
        rounds=n,
        E_ab=E_ab,
        E_abp=E_abp,
        E_apb=E_apb,
        E_apbp=E_apbp,
        S=S,
        abs_S=abs_S,
        verdict=verdict,
    )


def epr_axis(report: EPRReport) -> float:
    """Reduce an EPR report to Q ∈ [0, 1]."""
    if report.verdict in ("INSUFFICIENT", "LOCAL_REALIST"):
        return 1.0
    if report.verdict == "SUPERLUMINAL_REJECT":
        return 0.0
    # EPR_INCOMPLETE
    t = 1 - (report.abs_S - 2) / (_TSIRELSON - 2)
    return max(0.0, min(1.0, t))


# ---------------------------------------------------------------------------
# Primitive 24 — Λ-Retraction discipline
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class FalsifiabilityCommitment:
    constant_name: str
    constant_value: float
    witness_name: str
    retraction_threshold: float
    public_log_ref: str


@dataclass(frozen=True)
class RetractionEvent:
    timestamp: float
    observed_signal: float
    retracted: bool
    public_log_ref: str
    reason: str


@dataclass(frozen=True)
class RetractionReport:
    commitment: FalsifiabilityCommitment
    observed_signal: float
    retracted: bool
    margin: float
    verdict: str  # "HOLDING" | "MARGINAL" | "RETRACTED" | "INADMISSIBLE"


def validate_commitment(c: FalsifiabilityCommitment) -> bool:
    """Validate that a Falsifiability-Λ commitment is admissible."""
    if not isinstance(c.constant_name, str) or not c.constant_name.strip():
        return False
    if not math.isfinite(c.constant_value):
        return False
    if not isinstance(c.witness_name, str) or not c.witness_name.strip():
        return False
    if not math.isfinite(c.retraction_threshold) or c.retraction_threshold <= 0:
        return False
    if not isinstance(c.public_log_ref, str) or not c.public_log_ref.strip():
        return False
    return True


def apply_retraction(
    commitment: FalsifiabilityCommitment,
    observed_signal: float,
) -> RetractionReport:
    """Apply the retraction discipline."""
    if not validate_commitment(commitment):
        return RetractionReport(
            commitment=commitment,
            observed_signal=observed_signal,
            retracted=False,
            margin=float("nan"),
            verdict="INADMISSIBLE",
        )
    if not math.isfinite(observed_signal):
        raise ValueError("blanca.apply_retraction: observed_signal must be finite")
    magnitude = abs(observed_signal)
    margin = commitment.retraction_threshold - magnitude
    if magnitude >= commitment.retraction_threshold:
        verdict = "RETRACTED"
        retracted = True
    elif magnitude >= 0.8 * commitment.retraction_threshold:
        verdict = "MARGINAL"
        retracted = False
    else:
        verdict = "HOLDING"
        retracted = False
    return RetractionReport(
        commitment=commitment,
        observed_signal=observed_signal,
        retracted=retracted,
        margin=margin,
        verdict=verdict,
    )


def lambda_retraction_axis(report: RetractionReport) -> float:
    """Reduce a retraction report to L ∈ [0, 1]."""
    if report.verdict == "HOLDING":
        return 1.0
    if report.verdict in ("RETRACTED", "INADMISSIBLE"):
        return 0.0
    # MARGINAL
    t = report.margin / (0.2 * report.commitment.retraction_threshold)
    return max(0.0, min(1.0, t))


def record_retraction(
    report: RetractionReport,
    timestamp: float,
    reason: str,
) -> RetractionEvent:
    """Build a public retraction log entry."""
    if not math.isfinite(timestamp) or timestamp < 0:
        raise ValueError(
            "blanca.record_retraction: timestamp must be a non-negative finite number"
        )
    return RetractionEvent(
        timestamp=timestamp,
        observed_signal=report.observed_signal,
        retracted=report.retracted,
        public_log_ref=report.commitment.public_log_ref,
        reason=reason,
    )
