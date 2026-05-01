"""Tests for the Emerald primitives Python port (Primitives 37–40)."""
from __future__ import annotations

import math

import pytest

from ouroboros.emerald import (
    HermeticProvenance,
    ScaleObservation,
    SubstanceTrace,
    check_above_below,
    check_one_thing,
    run_solve_coagula,
    seal_envelope,
    verify_seal,
)

_BASE_PROV = HermeticProvenance(
    author="Hermes",
    timestamp="2026-05-01T00:00:00Z",
    source_uri="ouroboros://emerald-tablet",
)


# ---------------------------------------------------------------------------
# Primitive 37 — Above-Below correspondence
# ---------------------------------------------------------------------------

class TestAboveBelow:
    def test_holds_when_exactly_equal(self) -> None:
        r = check_above_below([
            ScaleObservation(scale="micro", value=1.0),
            ScaleObservation(scale="macro", value=1.0),
        ])
        assert r.holds is True
        assert r.symmetric_delta == 0.0

    def test_holds_within_tolerance(self) -> None:
        r = check_above_below([
            ScaleObservation(scale="micro", value=1.0),
            ScaleObservation(scale="macro", value=1.04),
        ], tolerance=0.05)
        assert r.holds is True

    def test_scale_break_when_exceeds_tolerance(self) -> None:
        r = check_above_below([
            ScaleObservation(scale="micro", value=1.0),
            ScaleObservation(scale="macro", value=2.0),
        ], tolerance=0.05)
        assert r.holds is False
        assert "scale-break" in r.rationale

    def test_ratio_computed(self) -> None:
        r = check_above_below([
            ScaleObservation(scale="micro", value=2.0),
            ScaleObservation(scale="macro", value=4.0),
        ])
        assert r.ratio == 0.5

    def test_rejects_missing_scale(self) -> None:
        with pytest.raises(ValueError):
            check_above_below([ScaleObservation(scale="micro", value=1.0)])

    def test_symmetric_delta_invariant_under_swap(self) -> None:
        a = check_above_below([
            ScaleObservation(scale="micro", value=3.0),
            ScaleObservation(scale="macro", value=4.0),
        ])
        b = check_above_below([
            ScaleObservation(scale="micro", value=4.0),
            ScaleObservation(scale="macro", value=3.0),
        ])
        assert math.isclose(a.symmetric_delta, b.symmetric_delta, abs_tol=1e-12)

    def test_handles_negative_values(self) -> None:
        r = check_above_below([
            ScaleObservation(scale="micro", value=-1.0),
            ScaleObservation(scale="macro", value=-1.0),
        ])
        assert r.holds is True


# ---------------------------------------------------------------------------
# Primitive 38 — One-Thing identity
# ---------------------------------------------------------------------------

class TestOneThing:
    def test_preserved_when_origin_matches_and_equal(self) -> None:
        r = check_one_thing(
            SubstanceTrace(origin_id="X", conserved=100.0, transformations=()),
            SubstanceTrace(origin_id="X", conserved=100.0, transformations=("t1",)),
        )
        assert r.preserved is True

    def test_violated_when_origin_differs(self) -> None:
        r = check_one_thing(
            SubstanceTrace(origin_id="X", conserved=100.0, transformations=()),
            SubstanceTrace(origin_id="Y", conserved=100.0, transformations=()),
        )
        assert r.preserved is False
        assert "origin mismatch" in r.rationale

    def test_violated_when_conserved_drifts(self) -> None:
        r = check_one_thing(
            SubstanceTrace(origin_id="X", conserved=100.0, transformations=()),
            SubstanceTrace(origin_id="X", conserved=90.0, transformations=()),
        )
        assert r.preserved is False

    def test_preserved_within_tolerance(self) -> None:
        r = check_one_thing(
            SubstanceTrace(origin_id="X", conserved=100.0, transformations=()),
            SubstanceTrace(origin_id="X", conserved=100.0 + 1e-12, transformations=()),
        )
        assert r.preserved is True

    def test_drift_rel_correct(self) -> None:
        r = check_one_thing(
            SubstanceTrace(origin_id="X", conserved=200.0, transformations=()),
            SubstanceTrace(origin_id="X", conserved=198.0, transformations=()),
        )
        assert math.isclose(r.drift_rel, 0.01, abs_tol=1e-6)

    def test_rationale_on_success(self) -> None:
        r = check_one_thing(
            SubstanceTrace(origin_id="X", conserved=5.0, transformations=()),
            SubstanceTrace(origin_id="X", conserved=5.0, transformations=()),
        )
        assert "preserved" in r.rationale


# ---------------------------------------------------------------------------
# Primitive 39 — Solve-et-Coagula gate
# ---------------------------------------------------------------------------

class TestSolveCoagula:
    def test_closes_when_balanced(self) -> None:
        r = run_solve_coagula(whole=10.0, parts=[3.0, 3.0, 4.0], recombined=10.0)
        assert r.closes is True
        assert math.isclose(r.solve_residue, 0.0, abs_tol=1e-12)
        assert math.isclose(r.coagula_residue, 0.0, abs_tol=1e-12)

    def test_rejects_missing_solve_phase(self) -> None:
        r = run_solve_coagula(whole=10.0, parts=[], recombined=10.0)
        assert r.closes is False
        assert r.both_phases_present is False
        assert "missing" in r.rationale

    def test_honest_residue_when_solve_doesnt_close(self) -> None:
        r = run_solve_coagula(whole=10.0, parts=[3.0, 3.0, 3.0], recombined=10.0)
        assert r.closes is False
        assert math.isclose(r.solve_residue, 1.0, abs_tol=1e-9)

    def test_honest_residue_when_coagula_doesnt_close(self) -> None:
        r = run_solve_coagula(whole=10.0, parts=[5.0, 5.0], recombined=11.0)
        assert r.closes is False
        assert math.isclose(r.coagula_residue, 1.0, abs_tol=1e-9)

    def test_parts_sum_correct(self) -> None:
        r = run_solve_coagula(whole=6.0, parts=[1.0, 2.0, 3.0], recombined=6.0)
        assert r.parts_sum == 6.0


# ---------------------------------------------------------------------------
# Primitive 40 — Hermetic seal
# ---------------------------------------------------------------------------

class TestHermeticSeal:
    def test_seals_and_verifies(self) -> None:
        env = seal_envelope("payload-A", _BASE_PROV)
        v = verify_seal(env)
        assert v.valid is True

    def test_detects_payload_tampering(self) -> None:
        env = seal_envelope("payload-A", _BASE_PROV)
        import dataclasses
        tampered = dataclasses.replace(env, payload="payload-B")
        assert verify_seal(tampered).valid is False

    def test_detects_provenance_tampering(self) -> None:
        env = seal_envelope("payload-A", _BASE_PROV)
        import dataclasses
        tampered_prov = dataclasses.replace(env.provenance, author="imposter")
        tampered = dataclasses.replace(env, provenance=tampered_prov)
        assert verify_seal(tampered).valid is False

    def test_seal_deterministic(self) -> None:
        a = seal_envelope("p", _BASE_PROV)
        b = seal_envelope("p", _BASE_PROV)
        assert a.seal == b.seal

    def test_seal_changes_with_timestamp(self) -> None:
        import dataclasses
        a = seal_envelope("p", _BASE_PROV)
        b = seal_envelope("p", dataclasses.replace(_BASE_PROV, timestamp="2026-05-02T00:00:00Z"))
        assert a.seal != b.seal

    def test_rationale_describes_outcome(self) -> None:
        env = seal_envelope("payload-A", _BASE_PROV)
        assert "intact" in verify_seal(env).rationale
        import dataclasses
        tampered = dataclasses.replace(env, payload="X")
        assert "broken" in verify_seal(tampered).rationale

    def test_seal_is_hex_64_chars(self) -> None:
        env = seal_envelope("p", _BASE_PROV)
        import re
        assert re.match(r'^[0-9a-f]{64}$', env.seal)
