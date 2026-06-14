# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
"""Unit tests for the SZL Mechanics (FE-NO) verified-compute vertical pack."""

from __future__ import annotations

import math
import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.szl_mechanics import (
    brief,
    core_adapter,
    evidence,
    forecast,
    receipt,
    recommendations,
    service,
    signals,
)


class SzlMechanicsPackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)
        self.evidence = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals, forecast=self.forecast, evidence=self.evidence
        )

    def test_recommendation_passes_contract(self) -> None:
        self.assertEqual(validate_recommendation(self.rec), [])
        self.assertEqual(self.rec.vertical, "szl_mechanics")

    def test_brief_carries_moat_and_estimate_label(self) -> None:
        out = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast,
            evidence=self.evidence,
            recommendation=self.rec,
        )
        self.assertIn("moat", out)
        self.assertEqual(out["bounded_error_label"], "ESTIMATE")


class SolveServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.geometry = {"kind": "block", "dims_m": [1.0, 0.1, 0.1], "n_dofs": 64}
        self.bcs = {"dirichlet": [{"face": "x_min", "fix": ["ux"]}]}
        self.out = service.solve(self.geometry, self.bcs, sovereign=True, with_envelope=True)

    def test_solve_returns_solution_and_receipt(self) -> None:
        self.assertIn("solution", self.out)
        self.assertIn("receipt", self.out)
        self.assertIn("dsse_envelope", self.out)

    def test_receipt_is_intoto_statement(self) -> None:
        stmt = self.out["receipt"]
        self.assertEqual(stmt["_type"], receipt.STATEMENT_TYPE)
        self.assertEqual(stmt["predicateType"], receipt.PREDICATE_TYPE)
        self.assertEqual(len(stmt["subject"]), 1)
        self.assertEqual(len(stmt["subject"][0]["digest"]["sha256"]), 64)

    def test_predicate_has_required_fields_and_attribution(self) -> None:
        pred = self.out["receipt"]["predicate"]
        for f in (
            "method",
            "geometry_hash",
            "schwarz_iterations",
            "bounded_error_estimate",
            "walltime_s",
            "verified",
            "sovereign",
            "attribution",
        ):
            self.assertIn(f, pred)
        self.assertEqual(pred["bounded_error_label"], "ESTIMATE")
        self.assertIn("arXiv:2606.08796", pred["attribution"]["feno_method"])
        self.assertIn("DeepONet", pred["attribution"]["deeponet"])

    def test_envelope_is_unsigned_honest(self) -> None:
        env = self.out["dsse_envelope"]
        self.assertEqual(env["payloadType"], receipt.PAYLOAD_TYPE)
        # HONESTY: no fabricated signature.
        self.assertEqual(env["signatures"], [])
        self.assertEqual(env["_signing"]["status"], "UNSIGNED")

    def test_stub_is_never_verified(self) -> None:
        # Until Dev 1's core is vendored, solves are stub and MUST NOT be verified.
        if self.out["solution"]["stub"]:
            self.assertFalse(self.out["solution"]["verified"])

    def test_geometry_hash_is_deterministic(self) -> None:
        h1 = core_adapter.geometry_hash(self.geometry)
        h2 = core_adapter.geometry_hash(dict(reversed(list(self.geometry.items()))))
        self.assertEqual(h1, h2)  # canonical sort -> order-independent

    def test_pae_roundtrip_shape(self) -> None:
        p = receipt.pae("application/vnd.in-toto+json", b"{}")
        self.assertTrue(p.startswith(b"DSSEv1 "))


if __name__ == "__main__":
    unittest.main()
