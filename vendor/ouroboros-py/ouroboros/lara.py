"""Lara primitives — Python port (Primitives 33–36).

Faithful Python reimplementation of packages/lara/src/*.ts.

Sources
-------
Jamneshan, Shalom, Tao, Math. Ann. 394:11 (2026),
  https://doi.org/10.1007/s00208-026-03344-5.
Bergelson–Tao–Ziegler 2010; Candela–González-Sánchez–Szegedy 2023.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal


# ---------------------------------------------------------------------------
# Primitive 33 — Gowers uniformity norm U^{k+1}(F_p^n)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class DomainSpec:
    p: int   # characteristic
    n: int   # exponent: domain is F_p^n


GowersGateVerdict = Literal["STRUCTURED", "UNIFORM", "ESTIMATED"]


@dataclass(frozen=True)
class GowersGateResult:
    verdict: str  # GowersGateVerdict
    norm: float
    eta: float
    reason: str
    exact: bool


def _c_mul(a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
    return (a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0])


def _c_conj(a: tuple[float, float]) -> tuple[float, float]:
    return (a[0], -a[1])


def _int_to_vec(idx: int, p: int, n: int) -> list[int]:
    v = [0] * n
    x = idx
    for i in range(n):
        v[i] = x % p
        x //= p
    return v


def _vec_to_int(v: list[int], p: int) -> int:
    x = 0
    for i in range(len(v) - 1, -1, -1):
        x = x * p + v[i]
    return x


def _vec_add_mod(a: list[int], b: list[int], p: int) -> list[int]:
    return [(a[i] + b[i]) % p for i in range(len(a))]


def gowers_norm(
    domain: DomainSpec,
    k: int,
    values: list[tuple[float, float]],
    eta: float = 0.05,
    max_exact_domain: int = 4096,
) -> GowersGateResult:
    """Compute the Gowers U^{k+1} norm gate."""
    G = domain.p ** domain.n
    if len(values) != G:
        raise ValueError(f"values length {len(values)} != p^n = {G}.")
    if k < 1 or not isinstance(k, int):
        raise ValueError("k must be a positive integer.")

    if G > max_exact_domain:
        s = sum(
            math.pow(v[0] * v[0] + v[1] * v[1], 2 ** k)
            for v in values
        )
        proxy = math.pow(s / G, 1 / 2 ** (k + 1))
        return GowersGateResult(
            verdict="ESTIMATED",
            norm=proxy,
            eta=eta,
            reason="Domain too large for exact enumeration; proxy used (no STRUCTURED claim emitted).",
            exact=False,
        )

    p = domain.p
    n = domain.n
    dims = k + 1
    cube_count = 1 << dims  # 2^{k+1}

    total = G ** (dims + 1)
    if total > 5_000_000:
        return GowersGateResult(
            verdict="ESTIMATED",
            norm=float("nan"),
            eta=eta,
            reason=f"Cube enumeration {total:.2e} exceeds 5e6; estimator path required.",
            exact=False,
        )

    idx_to_vec = [_int_to_vec(i, p, n) for i in range(G)]

    sum_re = 0.0
    sum_im = 0.0

    def enumerate(depth: int, accum: list[list[int]]) -> None:
        nonlocal sum_re, sum_im
        if depth == dims + 1:
            x = accum[0]
            prod_re = 1.0
            prod_im = 0.0
            for omega_mask in range(cube_count):
                pt = list(x)
                weight = 0
                for j in range(dims):
                    if (omega_mask >> j) & 1:
                        pt = _vec_add_mod(pt, accum[j + 1], p)
                        weight += 1
                pt_idx = _vec_to_int(pt, p)
                v = values[pt_idx]
                if weight % 2 == 1:
                    v = _c_conj(v)
                m = _c_mul((prod_re, prod_im), v)
                prod_re = m[0]
                prod_im = m[1]
            sum_re += prod_re
            sum_im += prod_im
            return
        for i in range(G):
            accum[depth] = idx_to_vec[i]
            enumerate(depth + 1, accum)

    accum: list[list[int]] = [[]] * (dims + 1)
    enumerate(0, accum)

    denom = G ** (dims + 1)
    mean_re = sum_re / denom
    norm_val = math.pow(max(0.0, mean_re), 1 / cube_count)

    verdict: str = "STRUCTURED" if norm_val >= eta else "UNIFORM"
    return GowersGateResult(
        verdict=verdict,
        norm=norm_val,
        eta=eta,
        reason=(
            f"\u2016f\u2016_{{U^{{{k+1}}}}} = {norm_val:.6f} \u2265 \u03b7 = {eta}; polynomial structure asserted."
            if verdict == "STRUCTURED"
            else f"\u2016f\u2016_{{U^{{{k+1}}}}} = {norm_val:.6f} < \u03b7 = {eta}; pseudo-random."
        ),
        exact=True,
    )


# ---------------------------------------------------------------------------
# Primitive 34 — Abramov-order gate
# ---------------------------------------------------------------------------

AbramovStatus = Literal["ABRAMOV_PROVEN", "ABRAMOV_FAILS", "ABRAMOV_OPEN"]


@dataclass(frozen=True)
class AbramovGateResult:
    p: int
    k: int
    status: str  # AbramovStatus
    citation: str
    reason: str


def abramov_gate(p: int, k: int) -> AbramovGateResult:
    """Determine the Abramov property status for (p, k)."""
    if not isinstance(p, int) or p < 2:
        raise ValueError("p must be a prime ≥ 2.")
    if not isinstance(k, int) or k < 1:
        raise ValueError("k must be a positive integer.")

    if k <= p + 1:
        return AbramovGateResult(
            p=p, k=k,
            status="ABRAMOV_PROVEN",
            citation="Bergelson–Tao–Ziegler 2010 (k+1 ≤ p) + Candela–González-Sánchez–Szegedy 2023 (k ≤ p+1).",
            reason=f"k={k} ≤ p+1={p + 1}; Abramov property holds.",
        )
    if p == 2 and k == 5:
        return AbramovGateResult(
            p=p, k=k,
            status="ABRAMOV_FAILS",
            citation="Jamneshan, Shalom, Tao, Math. Ann. 394:11 (2026), https://doi.org/10.1007/s00208-026-03344-5.",
            reason=(
                "Counter-example: there exists a Host–Kra F_2^ω-system of order 5 that is not Abramov "
                "of order 5. Strong inverse conjecture for U^6 fails (non-measurability)."
            ),
        )
    return AbramovGateResult(
        p=p, k=k,
        status="ABRAMOV_OPEN",
        citation="Status open as of 2026.",
        reason=f"(p={p}, k={k}) outside proven range and outside known counter-example.",
    )


# ---------------------------------------------------------------------------
# Primitive 35 — Measurability assertion
# ---------------------------------------------------------------------------

MeasurabilityVerdict = Literal["MEASURABLE", "NON_MEASURABLE", "UNDETERMINED"]


@dataclass(frozen=True)
class ReconstructionTrial:
    m: int
    M: int
    epsilon_at_m: float
    observed_deviation: float
    correlation: float
    succeeded: bool


@dataclass(frozen=True)
class MeasurabilityResult:
    candidate_polynomial_id: str
    verdict: str  # MeasurabilityVerdict
    success_rate: float
    trial_count: int
    reason: str


def assess_measurability(
    candidate_polynomial_id: str,
    trials: list[ReconstructionTrial],
    required_success_rate: float = 0.5,
    min_trials: int = 8,
) -> MeasurabilityResult:
    """Assess whether a polynomial is measurably reconstructible."""
    if not trials:
        return MeasurabilityResult(
            candidate_polynomial_id=candidate_polynomial_id,
            verdict="UNDETERMINED",
            success_rate=0.0,
            trial_count=0,
            reason="No trials submitted.",
        )
    successes = sum(1 for t in trials if t.succeeded)
    rate = successes / len(trials)

    if rate >= required_success_rate:
        return MeasurabilityResult(
            candidate_polynomial_id=candidate_polynomial_id,
            verdict="MEASURABLE",
            success_rate=rate,
            trial_count=len(trials),
            reason=f"Success rate {rate * 100:.1f}% ≥ {required_success_rate * 100:.0f}% (Conjecture 1.3 satisfied).",
        )
    if len(trials) < min_trials:
        return MeasurabilityResult(
            candidate_polynomial_id=candidate_polynomial_id,
            verdict="UNDETERMINED",
            success_rate=rate,
            trial_count=len(trials),
            reason=f"Trial count {len(trials)} < min {min_trials}; insufficient to declare non-measurable.",
        )
    return MeasurabilityResult(
        candidate_polynomial_id=candidate_polynomial_id,
        verdict="NON_MEASURABLE",
        success_rate=rate,
        trial_count=len(trials),
        reason=(
            f"Success rate {rate * 100:.1f}% < {required_success_rate * 100:.0f}% "
            f"across {len(trials)} trials; reconstruction not Lipschitz-recoverable from bounded shifts."
        ),
    )


# ---------------------------------------------------------------------------
# Primitive 36 — Lara-gap declaration
# ---------------------------------------------------------------------------

LaraReceiptKind = Literal["LARA_OK", "LARA_GAP", "LARA_HOLD", "LARA_BUG", "LARA_NA"]

_PAPER = (
    "Jamneshan–Shalom–Tao, Math. Ann. 394:11 (2026), "
    "https://doi.org/10.1007/s00208-026-03344-5"
)


@dataclass(frozen=True)
class LaraReceipt:
    detection_id: str
    kind: str  # LaraReceiptKind
    reconstructibility_claim_allowed: bool
    axis_n: float
    reason: str
    citations: tuple[str, ...]


def declare_lara(
    detection_id: str,
    gowers: GowersGateResult,
    abramov: AbramovGateResult,
    measurability: MeasurabilityResult | None,
) -> LaraReceipt:
    """Declare a Lara receipt given the three sub-gate results."""
    if gowers.verdict in ("UNIFORM", "ESTIMATED"):
        return LaraReceipt(
            detection_id=detection_id,
            kind="LARA_NA",
            reconstructibility_claim_allowed=False,
            axis_n=1.0,
            reason=(
                "No structure detected; Lara N/A."
                if gowers.verdict == "UNIFORM"
                else "Estimator path; Lara cannot speak."
            ),
            citations=(_PAPER,),
        )

    if not measurability or measurability.verdict == "UNDETERMINED":
        return LaraReceipt(
            detection_id=detection_id,
            kind="LARA_HOLD",
            reconstructibility_claim_allowed=False,
            axis_n=1.0,
            reason="Measurability undetermined; runtime defers reconstruction claim.",
            citations=(_PAPER,),
        )

    if abramov.status == "ABRAMOV_FAILS" and measurability.verdict == "NON_MEASURABLE":
        return LaraReceipt(
            detection_id=detection_id,
            kind="LARA_GAP",
            reconstructibility_claim_allowed=False,
            axis_n=1.0,
            reason=(
                "Structure detected; Abramov property fails for (p,k); reconstruction non-measurable. "
                "Use allowed; reconstructibility claim forbidden."
            ),
            citations=(_PAPER, abramov.citation),
        )

    if abramov.status != "ABRAMOV_FAILS" and measurability.verdict == "MEASURABLE":
        return LaraReceipt(
            detection_id=detection_id,
            kind="LARA_OK",
            reconstructibility_claim_allowed=True,
            axis_n=1.0,
            reason=(
                "Structure detected and reconstruction Lipschitz-recoverable; "
                "reconstructibility claim permitted."
            ),
            citations=(_PAPER, abramov.citation),
        )

    if abramov.status == "ABRAMOV_PROVEN" and measurability.verdict == "NON_MEASURABLE":
        return LaraReceipt(
            detection_id=detection_id,
            kind="LARA_BUG",
            reconstructibility_claim_allowed=False,
            axis_n=0.0,
            reason=(
                "Contradiction: Abramov holds for (p,k) but reconstruction failed. "
                "Runtime bug; halt and audit."
            ),
            citations=(_PAPER, abramov.citation),
        )

    if abramov.status == "ABRAMOV_OPEN" and measurability.verdict == "NON_MEASURABLE":
        return LaraReceipt(
            detection_id=detection_id,
            kind="LARA_GAP",
            reconstructibility_claim_allowed=False,
            axis_n=1.0,
            reason=(
                "Abramov open for (p,k); empirical non-measurability observed. "
                "Treat as gap; record receipt."
            ),
            citations=(_PAPER, abramov.citation),
        )

    # ABRAMOV_FAILS + MEASURABLE — empirically lucky but no general guarantee
    return LaraReceipt(
        detection_id=detection_id,
        kind="LARA_HOLD",
        reconstructibility_claim_allowed=False,
        axis_n=0.5,
        reason=(
            "Empirical reconstruction succeeded but Abramov fails in general for (p,k); "
            "claim withheld."
        ),
        citations=(_PAPER, abramov.citation),
    )


def non_measurability_honesty(receipts: list[LaraReceipt]) -> float:
    """Mean axis_n over a batch of Lara receipts."""
    if not receipts:
        return 1.0
    return sum(r.axis_n for r in receipts) / len(receipts)
