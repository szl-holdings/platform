"""Newton primitives — Python port (Primitives 41–44).

Faithful Python reimplementation of packages/newton/src/*.ts.

Sources
-------
Newton, Philosophiae Naturalis Principia Mathematica (1687);
Newton, "Method of Fluxions and Infinite Series" (1736);
Newton, Opticks (1704); Newton's Mint MSS.
"""
from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from typing import Literal


# ---------------------------------------------------------------------------
# Primitive 41 — Three-Laws ledger
# ---------------------------------------------------------------------------

TransitionVerdict = Literal["OK", "LEX2_FAIL", "LEX3_UNPAIRED", "DIM_MISMATCH"]


@dataclass(frozen=True)
class TransitionEntry:
    id: str
    p0: tuple[float, ...]
    F: tuple[float, ...]
    dt: float
    p1: tuple[float, ...]
    reaction_pair_id: str | None = None


@dataclass(frozen=True)
class TransitionResult:
    id: str
    verdict: str  # TransitionVerdict
    residual_norm: float
    reason: str


@dataclass(frozen=True)
class LedgerSummary:
    total: int
    ok: int
    lex2_failures: int
    lex3_unpaired: int
    dim_mismatches: int
    results: tuple[TransitionResult, ...]


def _norm(v: tuple[float, ...]) -> float:
    return math.sqrt(sum(x * x for x in v))


class ThreeLawsLedger:
    """Three-Laws ledger for Newtonian motion accounting."""

    def __init__(self, tolerance: float = 1e-6) -> None:
        if tolerance <= 0 or not math.isfinite(tolerance):
            raise ValueError("tolerance must be positive finite.")
        self._tolerance = tolerance
        self._entries: list[TransitionEntry] = []

    def append(self, e: TransitionEntry) -> TransitionResult:
        if len(e.p0) != len(e.F) or len(e.F) != len(e.p1):
            r = TransitionResult(
                id=e.id,
                verdict="DIM_MISMATCH",
                residual_norm=float("nan"),
                reason=f"Dimension mismatch: |p0|={len(e.p0)}, |F|={len(e.F)}, |p1|={len(e.p1)}.",
            )
            self._entries.append(e)
            return r
        if not math.isfinite(e.dt) or e.dt <= 0:
            r = TransitionResult(
                id=e.id,
                verdict="LEX2_FAIL",
                residual_norm=float("nan"),
                reason=f"dt must be positive finite; got {e.dt}.",
            )
            self._entries.append(e)
            return r

        residual = tuple(e.p1[i] - e.p0[i] - e.F[i] * e.dt for i in range(len(e.p0)))
        r2 = _norm(residual)
        if r2 > self._tolerance:
            verdict = "LEX2_FAIL"
            reason = f"Lex II violated: residual {r2:.3e} > tol {self._tolerance:.2e}."
        else:
            verdict = "OK"
            reason = f"Lex II residual {r2:.3e} ≤ tol {self._tolerance:.2e}; pair check deferred."

        self._entries.append(e)
        return TransitionResult(id=e.id, verdict=verdict, residual_norm=r2, reason=reason)

    def summary(self) -> LedgerSummary:
        pair_count: dict[str, int] = {}
        for e in self._entries:
            if e.reaction_pair_id:
                pair_count[e.reaction_pair_id] = pair_count.get(e.reaction_pair_id, 0) + 1

        results: list[TransitionResult] = []
        ok = lex2 = lex3 = dim = 0

        for e in self._entries:
            if len(e.p0) != len(e.F) or len(e.F) != len(e.p1):
                results.append(TransitionResult(
                    id=e.id, verdict="DIM_MISMATCH",
                    residual_norm=float("nan"), reason="dimension mismatch",
                ))
                dim += 1
                continue

            residual = tuple(e.p1[i] - e.p0[i] - e.F[i] * e.dt for i in range(len(e.p0)))
            r2 = _norm(residual)
            force2 = _norm(e.F)

            unpaired = False
            if force2 > 0:
                if not e.reaction_pair_id:
                    unpaired = True
                elif pair_count.get(e.reaction_pair_id, 0) < 2:
                    unpaired = True

            if r2 > self._tolerance:
                verdict = "LEX2_FAIL"
                reason = f"Lex II violated: residual {r2:.3e}."
                lex2 += 1
            elif unpaired:
                verdict = "LEX3_UNPAIRED"
                reason = "Force applied without paired reaction (Lex III)."
                lex3 += 1
            else:
                verdict = "OK"
                reason = "Lex II within tolerance; Lex III paired (or zero force)."
                ok += 1

            results.append(TransitionResult(id=e.id, verdict=verdict, residual_norm=r2, reason=reason))

        return LedgerSummary(
            total=len(self._entries),
            ok=ok,
            lex2_failures=lex2,
            lex3_unpaired=lex3,
            dim_mismatches=dim,
            results=tuple(results),
        )

    def size(self) -> int:
        return len(self._entries)


# ---------------------------------------------------------------------------
# Primitive 42 — Fluxions / derivative receipt
# ---------------------------------------------------------------------------

FluxionWitnessKind = Literal["FORWARD", "CENTRAL", "SYMBOLIC"]
FluxionVerdict = Literal["ACCEPTED", "REJECTED_TOL", "REJECTED_BARE", "REJECTED_H"]


@dataclass(frozen=True)
class FluxionWitnessForward:
    kind: str  # "FORWARD"
    fxh: float
    fx: float
    h: float


@dataclass(frozen=True)
class FluxionWitnessCentral:
    kind: str  # "CENTRAL"
    fxh: float
    fxmh: float
    h: float


@dataclass(frozen=True)
class FluxionWitnessSymbolic:
    kind: str  # "SYMBOLIC"
    closed_form: float


@dataclass(frozen=True)
class FluxionClaim:
    claim_id: str
    point: float
    asserted: float
    witness: FluxionWitnessForward | FluxionWitnessCentral | FluxionWitnessSymbolic
    tolerance: float = 1e-3


@dataclass(frozen=True)
class FluxionResult:
    claim_id: str
    verdict: str  # FluxionVerdict
    witness_kind: str  # FluxionWitnessKind
    computed: float
    asserted: float
    residual: float
    reason: str


def receive_fluxion(claim: FluxionClaim) -> FluxionResult:
    """Receive and verify a fluxion claim with a witness."""
    tol = claim.tolerance
    if not math.isfinite(claim.asserted):
        return FluxionResult(
            claim_id=claim.claim_id,
            verdict="REJECTED_BARE",
            witness_kind=claim.witness.kind,
            computed=float("nan"),
            asserted=claim.asserted,
            residual=float("nan"),
            reason="Asserted value is not finite.",
        )

    w = claim.witness
    if w.kind == "FORWARD":
        if w.h <= 0 or not math.isfinite(w.h):
            return FluxionResult(
                claim_id=claim.claim_id,
                verdict="REJECTED_H",
                witness_kind="FORWARD",
                computed=float("nan"),
                asserted=claim.asserted,
                residual=float("nan"),
                reason="Step size h must be positive finite.",
            )
        computed = (w.fxh - w.fx) / w.h
    elif w.kind == "CENTRAL":
        if w.h <= 0 or not math.isfinite(w.h):
            return FluxionResult(
                claim_id=claim.claim_id,
                verdict="REJECTED_H",
                witness_kind="CENTRAL",
                computed=float("nan"),
                asserted=claim.asserted,
                residual=float("nan"),
                reason="Step size h must be positive finite.",
            )
        computed = (w.fxh - w.fxmh) / (2 * w.h)
    else:  # SYMBOLIC
        computed = w.closed_form

    residual = abs(computed - claim.asserted)
    if residual > tol:
        return FluxionResult(
            claim_id=claim.claim_id,
            verdict="REJECTED_TOL",
            witness_kind=w.kind,
            computed=computed,
            asserted=claim.asserted,
            residual=residual,
            reason=f"Residual {residual:.3e} exceeds tolerance {tol:.2e}.",
        )
    return FluxionResult(
        claim_id=claim.claim_id,
        verdict="ACCEPTED",
        witness_kind=w.kind,
        computed=computed,
        asserted=claim.asserted,
        residual=residual,
        reason=f"Witness {w.kind} confirms ẏ at x={claim.point}.",
    )


# ---------------------------------------------------------------------------
# Primitive 43 — Prismatic spectrum decomposition
# ---------------------------------------------------------------------------

SpectrumVerdict = Literal[
    "DECOMPOSED", "RECOMBINATION_FAIL", "BASIS_DIM_MISMATCH", "BASIS_INCOMPLETE"
]


@dataclass(frozen=True)
class SpectrumChannel:
    name: str
    amplitude: float


@dataclass(frozen=True)
class SpectrumResult:
    artifact_id: str
    verdict: str  # SpectrumVerdict
    channels: tuple[SpectrumChannel, ...]
    recombination_error: float
    reason: str


def decompose_spectrum(
    artifact_id: str,
    composite: list[float],
    basis: list[SpectrumChannel],
    basis_vectors: list[list[float]],
    tolerance: float = 1e-6,
) -> SpectrumResult:
    """Decompose a composite signal and verify recombination."""
    if len(basis) != len(basis_vectors):
        return SpectrumResult(
            artifact_id=artifact_id,
            verdict="BASIS_DIM_MISMATCH",
            channels=(),
            recombination_error=float("nan"),
            reason="basis and basisVectors length mismatch.",
        )
    for v in basis_vectors:
        if len(v) != len(composite):
            return SpectrumResult(
                artifact_id=artifact_id,
                verdict="BASIS_DIM_MISMATCH",
                channels=(),
                recombination_error=float("nan"),
                reason="basisVector length must equal composite length.",
            )

    channels: list[SpectrumChannel] = []
    reconstructed = [0.0] * len(composite)

    for i, (ch, v) in enumerate(zip(basis, basis_vectors)):
        dot = sum(v[k] * composite[k] for k in range(len(v)))
        norm2 = sum(x * x for x in v)
        if norm2 == 0:
            return SpectrumResult(
                artifact_id=artifact_id,
                verdict="BASIS_INCOMPLETE",
                channels=(),
                recombination_error=float("nan"),
                reason=f"Zero-norm basis vector for channel {ch.name}.",
            )
        amp = dot / norm2
        channels.append(SpectrumChannel(name=ch.name, amplitude=amp))
        for k in range(len(v)):
            reconstructed[k] += amp * v[k]

    err = math.sqrt(sum((composite[k] - reconstructed[k]) ** 2 for k in range(len(composite))))
    if err > tolerance:
        return SpectrumResult(
            artifact_id=artifact_id,
            verdict="RECOMBINATION_FAIL",
            channels=tuple(channels),
            recombination_error=err,
            reason=f"Basis incomplete: recombination error {err:.3e} > tol {tolerance:.2e}.",
        )
    return SpectrumResult(
        artifact_id=artifact_id,
        verdict="DECOMPOSED",
        channels=tuple(channels),
        recombination_error=err,
        reason="Composite decomposed and recombined within tolerance (Newton experimentum crucis).",
    )


# ---------------------------------------------------------------------------
# Primitive 44 — Mint forensics
# ---------------------------------------------------------------------------

AssayVerdict = Literal["GENUINE", "DIGEST_MISMATCH", "WEIGHT_MISMATCH", "PYX_MISMATCH", "NOT_FOUND"]


@dataclass(frozen=True)
class MintEntry:
    artifact_id: str
    content_digest_sha256: str
    declared_weight: float
    pyx_sample: str
    timestamp: float


@dataclass(frozen=True)
class AssayResult:
    artifact_id: str
    verdict: str  # AssayVerdict
    reason: str


class Mint:
    """Newtonian Mint for artifact issuance and assay."""

    def __init__(self, weight_tolerance: float = 0.0) -> None:
        if weight_tolerance < 0 or not math.isfinite(weight_tolerance):
            raise ValueError("weightTolerance must be non-negative finite.")
        self._weight_tolerance = weight_tolerance
        self._entries: dict[str, MintEntry] = {}

    def issue(
        self,
        artifact_id: str,
        content: str,
        declared_weight: float,
        timestamp: float,
    ) -> MintEntry:
        if artifact_id in self._entries:
            raise ValueError(f"Mint already has entry for {artifact_id}; double-issue.")
        if declared_weight < 0 or not math.isfinite(declared_weight):
            raise ValueError(f"declaredWeight must be non-negative finite; got {declared_weight}.")
        digest = hashlib.sha256(content.encode()).hexdigest()
        pyx_sample = hashlib.sha256(("pyx::" + content).encode()).hexdigest()
        entry = MintEntry(
            artifact_id=artifact_id,
            content_digest_sha256=digest,
            declared_weight=declared_weight,
            pyx_sample=pyx_sample,
            timestamp=timestamp,
        )
        self._entries[artifact_id] = entry
        return entry

    def assay(
        self,
        artifact_id: str,
        presented_digest_sha256: str,
        presented_weight: float,
        presented_pyx_sample: str | None = None,
    ) -> AssayResult:
        entry = self._entries.get(artifact_id)
        if not entry:
            return AssayResult(
                artifact_id=artifact_id,
                verdict="NOT_FOUND",
                reason="No issuance record for this artifact.",
            )
        if entry.content_digest_sha256 != presented_digest_sha256:
            return AssayResult(
                artifact_id=artifact_id,
                verdict="DIGEST_MISMATCH",
                reason="Presented digest does not match issuance record.",
            )
        if abs(entry.declared_weight - presented_weight) > self._weight_tolerance:
            return AssayResult(
                artifact_id=artifact_id,
                verdict="WEIGHT_MISMATCH",
                reason=f"Weight mismatch: declared {entry.declared_weight}, presented {presented_weight}.",
            )
        if presented_pyx_sample is not None and presented_pyx_sample != entry.pyx_sample:
            return AssayResult(
                artifact_id=artifact_id,
                verdict="PYX_MISMATCH",
                reason="Pyx sample mismatch (clipping/counterfeit suspected).",
            )
        return AssayResult(
            artifact_id=artifact_id,
            verdict="GENUINE",
            reason="Digest, weight, and pyx all match issuance record (Newton's Trial of the Pyx).",
        )

    def size(self) -> int:
        return len(self._entries)
