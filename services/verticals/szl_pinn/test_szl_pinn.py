# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""Unit tests for the SZL PINN (heat / thermal) verified-compute vertical pack.

These tests exercise the WIRING (service, receipt, endpoint sketch, substrate
contract) and pass whether or not the vendored numpy core is importable: the
honest STUB path (verified=False, stub=True) keeps the structure exercisable
offline, exactly like szl_mechanics.
"""

from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.szl_pinn import (
    brief,
    core_adapter,
    evidence,
    forecast,
    receipt,
    recommendations,
    service,
    signals,
)


class SzlPinnPackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)
        self.evidence = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals, forecast=self.forecast, evidence=self.evidence
        )

    def test_recommendation_passes_contract(self) -> None:
        self.assertEqual(validate_recommendation(self.rec), [])
        self.assertEqual(self.rec.vertical, "szl_pinn")

    def test_brief_carries_moat_and_estimate_label(self) -> None:
        out = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast,
            evidence=self.evidence,
            recommendation=self.rec,
        )
        self.assertIn("moat", out)
        self.assertEqual(out["bounded_error_label"], "ESTIMATE")
        # Load-bearing honesty boundary: PINN output is MODELED, never measured.
        self.assertTrue(out["modeled_not_measured"])
        self.assertIn("energy_honesty", out)


class SolveHeatServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.out = service.solve_heat(
            {"L": 1.0, "T": 1.0, "k_mode": 1, "epochs": 300, "seed": 0},
            alpha=0.4,
            bc={"type": "dirichlet", "value": 0.0},
            ic={"type": "sine_mode", "k": 1},
            sovereign=True,
            with_envelope=True,
        )

    def test_solve_returns_field_and_receipt(self) -> None:
        self.assertIn("field", self.out)
        self.assertIn("receipt", self.out)
        self.assertIn("dsse_envelope", self.out)

    def test_receipt_is_intoto_statement(self) -> None:
        stmt = self.out["receipt"]
        self.assertEqual(stmt["_type"], receipt.STATEMENT_TYPE)
        self.assertEqual(stmt["predicateType"], receipt.PREDICATE_TYPE)
        self.assertEqual(len(stmt["subject"]), 1)

    def test_predicate_has_required_fields_and_attribution(self) -> None:
        pred = self.out["receipt"]["predicate"]
        for f in (
            "method",
            "pde",
            "alpha",
            "physics_residual_loss",
            "solution_error_estimate",
            "rel_L2_estimate",
            "walltime_s",
            "verified",
            "modeled_not_measured",
            "sovereign",
            "attribution",
        ):
            self.assertIn(f, pred)
        self.assertEqual(pred["bounded_error_label"], "ESTIMATE")
        self.assertEqual(pred["pde"], "u_t = alpha*u_xx")
        # Attribution: PINN method = Raissi/Perdikaris/Karniadakis 2019 (clean-room).
        self.assertIn("Raissi", pred["attribution"]["pinn_method"])
        self.assertIn("10.1016/j.jcp.2018.10.045", pred["attribution"]["pinn_method"])

    def test_modeled_not_measured_is_true(self) -> None:
        # ALWAYS True for PINN output — no measured energy is ever asserted.
        self.assertTrue(self.out["receipt"]["predicate"]["modeled_not_measured"])
        self.assertIn("no free-energy", self.out["receipt"]["predicate"]["modeled_note"].lower())

    def test_envelope_is_unsigned_honest(self) -> None:
        env = self.out["dsse_envelope"]
        self.assertEqual(env["payloadType"], receipt.PAYLOAD_TYPE)
        # HONESTY: no fabricated signature.
        self.assertEqual(env["signatures"], [])
        self.assertEqual(env["_signing"]["status"], "UNSIGNED")

    def test_stub_is_never_verified(self) -> None:
        # If numpy/core absent, solve is a stub and MUST NOT be verified.
        if self.out["field"]["stub"]:
            self.assertFalse(self.out["field"]["verified"])


class SolveThermalServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.out = service.solve_thermal(
            {"alpha": 1.0, "T_edge": 0.0, "epochs": 300, "seed": 0},
            sovereign=False,
            with_envelope=False,
        )

    def test_thermal_returns_field_floor_and_receipt(self) -> None:
        self.assertIn("temperature_field", self.out)
        self.assertIn("landauer_floor_MODELED", self.out)
        self.assertIn("receipt", self.out)

    def test_thermal_pde_and_modeled_flag(self) -> None:
        pred = self.out["receipt"]["predicate"]
        self.assertTrue(pred["modeled_not_measured"])
        if not self.out["temperature_field"]["stub"]:
            # real thermal core reports the 2D steady heat-balance PDE
            self.assertIn("T_xx", str(pred["pde"]))
            self.assertEqual(pred.get("joule_accounting_label"), "MODELED — NOT MEASURED")


class ReceiptHelperTests(unittest.TestCase):
    def test_geometry_hash_is_deterministic(self) -> None:
        g = {"problem": "heat", "alpha": 0.4, "L": 1.0}
        h1 = core_adapter.geometry_hash(g)
        h2 = core_adapter.geometry_hash(dict(reversed(list(g.items()))))
        self.assertEqual(h1, h2)  # canonical sort -> order-independent

    def test_pae_roundtrip_shape(self) -> None:
        p = receipt.pae("application/vnd.in-toto+json", b"{}")
        self.assertTrue(p.startswith(b"DSSEv1 "))


if __name__ == "__main__":
    unittest.main()
