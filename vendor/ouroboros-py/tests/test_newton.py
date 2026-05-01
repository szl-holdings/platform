"""Tests for the Newton primitives Python port (Primitives 41–44)."""
from __future__ import annotations

import hashlib
import math

import pytest

from ouroboros.newton import (
    FluxionClaim,
    FluxionWitnessCentral,
    FluxionWitnessForward,
    FluxionWitnessSymbolic,
    LedgerSummary,
    Mint,
    SpectrumChannel,
    ThreeLawsLedger,
    TransitionEntry,
    decompose_spectrum,
    receive_fluxion,
)


def _sha(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def _pyx(s: str) -> str:
    return hashlib.sha256(("pyx::" + s).encode()).hexdigest()


# ---------------------------------------------------------------------------
# Primitive 41 — Three-Laws ledger
# ---------------------------------------------------------------------------

class TestThreeLawsLedger:
    def test_ok_on_lex2(self) -> None:
        l = ThreeLawsLedger()
        r = l.append(TransitionEntry(
            id="t1", p0=(0.0, 0.0, 0.0), F=(1.0, 0.0, 0.0),
            dt=2.0, p1=(2.0, 0.0, 0.0), reaction_pair_id="R",
        ))
        assert r.verdict == "OK"

    def test_lex2_fail_when_momentum_wrong(self) -> None:
        l = ThreeLawsLedger()
        r = l.append(TransitionEntry(id="t2", p0=(0.0,), F=(1.0,), dt=1.0, p1=(10.0,)))
        assert r.verdict == "LEX2_FAIL"

    def test_dim_mismatch(self) -> None:
        l = ThreeLawsLedger()
        r = l.append(TransitionEntry(id="t3", p0=(0.0, 0.0), F=(1.0,), dt=1.0, p1=(1.0, 0.0)))
        assert r.verdict == "DIM_MISMATCH"

    def test_lex3_unpaired_when_force_but_no_pair(self) -> None:
        l = ThreeLawsLedger()
        l.append(TransitionEntry(id="a", p0=(0.0,), F=(2.0,), dt=1.0, p1=(2.0,)))
        s = l.summary()
        assert s.lex3_unpaired == 1

    def test_ok_when_paired_action_reaction(self) -> None:
        l = ThreeLawsLedger()
        l.append(TransitionEntry(id="a", p0=(0.0,), F=(2.0,), dt=1.0, p1=(2.0,), reaction_pair_id="P"))
        l.append(TransitionEntry(id="b", p0=(0.0,), F=(-2.0,), dt=1.0, p1=(-2.0,), reaction_pair_id="P"))
        s = l.summary()
        assert s.ok == 2
        assert s.lex3_unpaired == 0

    def test_zero_force_no_pair_required(self) -> None:
        l = ThreeLawsLedger()
        l.append(TransitionEntry(id="a", p0=(5.0,), F=(0.0,), dt=1.0, p1=(5.0,)))
        s = l.summary()
        assert s.ok == 1
        assert s.lex3_unpaired == 0

    def test_rejects_non_positive_dt(self) -> None:
        l = ThreeLawsLedger()
        r = l.append(TransitionEntry(id="z", p0=(0.0,), F=(1.0,), dt=0.0, p1=(0.0,)))
        assert r.verdict == "LEX2_FAIL"

    def test_rejects_non_positive_tolerance(self) -> None:
        with pytest.raises(ValueError):
            ThreeLawsLedger(0)
        with pytest.raises(ValueError):
            ThreeLawsLedger(-1)


# ---------------------------------------------------------------------------
# Primitive 42 — Fluxions receipt
# ---------------------------------------------------------------------------

class TestFluxionsReceipt:
    def test_accepted_forward_x_squared(self) -> None:
        h = 1e-4
        r = receive_fluxion(FluxionClaim(
            claim_id="fwd", point=2, asserted=4.0,
            witness=FluxionWitnessForward(kind="FORWARD", fx=4.0, fxh=(2 + h) ** 2, h=h),
        ))
        assert r.verdict == "ACCEPTED"
        assert r.witness_kind == "FORWARD"

    def test_accepted_central_cos_at_0(self) -> None:
        h = 1e-4
        r = receive_fluxion(FluxionClaim(
            claim_id="cen", point=0, asserted=0.0,
            witness=FluxionWitnessCentral(kind="CENTRAL", fxh=math.cos(h), fxmh=math.cos(-h), h=h),
        ))
        assert r.verdict == "ACCEPTED"

    def test_accepted_symbolic(self) -> None:
        r = receive_fluxion(FluxionClaim(
            claim_id="sym", point=3, asserted=6.0,
            witness=FluxionWitnessSymbolic(kind="SYMBOLIC", closed_form=6.0),
        ))
        assert r.verdict == "ACCEPTED"
        assert r.residual == 0.0

    def test_rejected_tol(self) -> None:
        r = receive_fluxion(FluxionClaim(
            claim_id="bad", point=1, asserted=99.0, tolerance=1e-6,
            witness=FluxionWitnessSymbolic(kind="SYMBOLIC", closed_form=1.0),
        ))
        assert r.verdict == "REJECTED_TOL"

    def test_rejected_bare_when_nan(self) -> None:
        r = receive_fluxion(FluxionClaim(
            claim_id="bare", point=0, asserted=float("nan"),
            witness=FluxionWitnessSymbolic(kind="SYMBOLIC", closed_form=1.0),
        ))
        assert r.verdict == "REJECTED_BARE"

    def test_rejected_h_when_nonpositive(self) -> None:
        r = receive_fluxion(FluxionClaim(
            claim_id="h0", point=0, asserted=0.0,
            witness=FluxionWitnessForward(kind="FORWARD", fx=0.0, fxh=0.0, h=0.0),
        ))
        assert r.verdict == "REJECTED_H"

    def test_central_more_accurate_than_forward(self) -> None:
        x, h = 1.0, 1e-3
        true_d = math.cos(x)
        fwd = receive_fluxion(FluxionClaim(
            claim_id="fwd", point=x, asserted=true_d,
            witness=FluxionWitnessForward(kind="FORWARD", fx=math.sin(x), fxh=math.sin(x + h), h=h),
        ))
        cen = receive_fluxion(FluxionClaim(
            claim_id="cen", point=x, asserted=true_d,
            witness=FluxionWitnessCentral(kind="CENTRAL", fxh=math.sin(x + h), fxmh=math.sin(x - h), h=h),
        ))
        assert cen.residual < fwd.residual


# ---------------------------------------------------------------------------
# Primitive 43 — Prismatic spectrum
# ---------------------------------------------------------------------------

class TestPrismaticSpectrum:
    def test_decomposed_orthonormal(self) -> None:
        r = decompose_spectrum(
            artifact_id="white",
            composite=[3.0, 4.0],
            basis=[SpectrumChannel(name="red", amplitude=0), SpectrumChannel(name="blue", amplitude=0)],
            basis_vectors=[[1.0, 0.0], [0.0, 1.0]],
        )
        assert r.verdict == "DECOMPOSED"
        red = next(c for c in r.channels if c.name == "red")
        blue = next(c for c in r.channels if c.name == "blue")
        assert math.isclose(red.amplitude, 3.0, abs_tol=1e-9)
        assert math.isclose(blue.amplitude, 4.0, abs_tol=1e-9)

    def test_recombination_fail_incomplete_basis(self) -> None:
        r = decompose_spectrum(
            artifact_id="x",
            composite=[1.0, 2.0, 3.0],
            basis=[SpectrumChannel(name="only", amplitude=0)],
            basis_vectors=[[1.0, 0.0, 0.0]],
        )
        assert r.verdict == "RECOMBINATION_FAIL"
        assert r.recombination_error > 0

    def test_basis_dim_mismatch_lengths(self) -> None:
        r = decompose_spectrum(
            artifact_id="x",
            composite=[1.0, 2.0],
            basis=[SpectrumChannel(name="a", amplitude=0)],
            basis_vectors=[[1.0]],
        )
        assert r.verdict == "BASIS_DIM_MISMATCH"

    def test_basis_incomplete_zero_norm(self) -> None:
        r = decompose_spectrum(
            artifact_id="x",
            composite=[1.0, 2.0],
            basis=[SpectrumChannel(name="a", amplitude=0)],
            basis_vectors=[[0.0, 0.0]],
        )
        assert r.verdict == "BASIS_INCOMPLETE"

    def test_basis_dim_mismatch_count(self) -> None:
        r = decompose_spectrum(
            artifact_id="x",
            composite=[1.0, 2.0],
            basis=[SpectrumChannel(name="a", amplitude=0), SpectrumChannel(name="b", amplitude=0)],
            basis_vectors=[[1.0, 0.0]],
        )
        assert r.verdict == "BASIS_DIM_MISMATCH"

    def test_decomposed_rgb(self) -> None:
        r = decompose_spectrum(
            artifact_id="white3",
            composite=[1.0, 1.0, 1.0],
            basis=[
                SpectrumChannel(name="r", amplitude=0),
                SpectrumChannel(name="g", amplitude=0),
                SpectrumChannel(name="b", amplitude=0),
            ],
            basis_vectors=[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
        )
        assert r.verdict == "DECOMPOSED"
        for ch in r.channels:
            assert math.isclose(ch.amplitude, 1.0, abs_tol=1e-9)


# ---------------------------------------------------------------------------
# Primitive 44 — Mint forensics
# ---------------------------------------------------------------------------

class TestMintForensics:
    def test_genuine(self) -> None:
        m = Mint()
        m.issue("a1", "hello", 5, 1)
        r = m.assay("a1", _sha("hello"), 5, _pyx("hello"))
        assert r.verdict == "GENUINE"

    def test_digest_mismatch(self) -> None:
        m = Mint()
        m.issue("a1", "hello", 5, 1)
        r = m.assay("a1", _sha("tampered"), 5)
        assert r.verdict == "DIGEST_MISMATCH"

    def test_weight_mismatch(self) -> None:
        m = Mint()
        m.issue("a1", "hello", 5, 1)
        r = m.assay("a1", _sha("hello"), 4)
        assert r.verdict == "WEIGHT_MISMATCH"

    def test_pyx_mismatch(self) -> None:
        m = Mint()
        m.issue("a1", "hello", 5, 1)
        r = m.assay("a1", _sha("hello"), 5, "not the pyx")
        assert r.verdict == "PYX_MISMATCH"

    def test_not_found(self) -> None:
        m = Mint()
        r = m.assay("missing", "x", 0)
        assert r.verdict == "NOT_FOUND"

    def test_rejects_double_issue(self) -> None:
        m = Mint()
        m.issue("a1", "hello", 5, 1)
        with pytest.raises(ValueError):
            m.issue("a1", "hello", 5, 2)

    def test_rejects_negative_weight(self) -> None:
        m = Mint()
        with pytest.raises(ValueError):
            m.issue("a1", "hello", -1, 1)

    def test_respects_weight_tolerance(self) -> None:
        m = Mint(weight_tolerance=0.5)
        m.issue("a1", "hello", 5, 1)
        r = m.assay("a1", _sha("hello"), 5.4)
        assert r.verdict == "GENUINE"
