# SPDX-License-Identifier: Apache-2.0

import unittest

from evidence_doctrine import (
    LEVEL_REQUIREMENTS,
    assert_lambda_case_study,
    evaluate_theorem_u,
    grade_decision,
)


def verified_through(level: str) -> dict:
    evidence = {}
    for current, requirements in LEVEL_REQUIREMENTS.items():
        evidence.update({requirement: "VERIFIED" for requirement in requirements})
        if current == level:
            break
    return evidence


class EvidenceDoctrineTests(unittest.TestCase):
    def test_d0_when_d1_is_incomplete(self):
        result = grade_decision(
            {
                "inputs_recorded": "VERIFIED",
                "policy_recorded": "UNVERIFIED",
                "output_recorded": "VERIFIED",
            }
        )
        self.assertEqual(result.achieved_level, "D0")
        self.assertEqual(result.blocking_requirements, ("policy_recorded",))

    def test_d1(self):
        self.assertEqual(
            grade_decision(verified_through("D1")).achieved_level, "D1"
        )

    def test_no_level_skipping(self):
        evidence = verified_through("D4")
        evidence["tamper_evidence_verified"] = "UNVERIFIED"
        self.assertEqual(grade_decision(evidence).achieved_level, "D1")

    def test_d4(self):
        self.assertEqual(
            grade_decision(verified_through("D4")).achieved_level, "D4"
        )

    def test_truthy_value_is_rejected(self):
        with self.assertRaises(TypeError):
            grade_decision({"inputs_recorded": True})

    def test_lambda_guard(self):
        honest = {
            "claim": "CONJECTURE_1",
            "state": "OPEN",
            "display": "GRAY",
            "machine_checked": False,
        }
        self.assertEqual(assert_lambda_case_study(honest), honest)
        dishonest = dict(honest, display="GREEN")
        with self.assertRaises(ValueError):
            assert_lambda_case_study(dishonest)

    def test_theorem_u_is_conditional(self):
        self.assertEqual(
            evaluate_theorem_u(
                {"u1": "VERIFIED", "u2": "VERIFIED", "u3": "VERIFIED"}
            ),
            "CONDITIONALLY_SATISFIED",
        )
        self.assertEqual(
            evaluate_theorem_u(
                {"u1": "VERIFIED", "u2": "UNVERIFIED", "u3": "VERIFIED"}
            ),
            "CONDITIONAL_OPEN",
        )


if __name__ == "__main__":
    unittest.main()
