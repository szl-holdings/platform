"""Contract tests for the runtime readiness registry."""

from __future__ import annotations

import unittest

import khipu


class FlagshipRegistryTests(unittest.TestCase):
    def test_retired_codenames_remain_honest_skipped_slots(self) -> None:
        targets = {target["name"]: target for target in khipu.FLAGSHIPS}
        self.assertEqual(
            list(targets),
            ["a11oy", "amaru", "sentra", "killinchu", "rosie"],
        )
        for name in ("amaru", "rosie"):
            self.assertEqual(targets[name]["lifecycle"], "retired-inside-a11oy")
            self.assertEqual(targets[name]["endpoints"], {})

    def test_live_targets_use_namespaced_post_contracts(self) -> None:
        targets = {target["name"]: target for target in khipu.FLAGSHIPS}
        for name in ("a11oy", "killinchu"):
            endpoints = targets[name]["endpoints"]
            self.assertEqual(endpoints["healthz"]["path"], f"/api/{name}/healthz")
            self.assertEqual(endpoints["khipu_sign"], {
                "method": "POST",
                "path": f"/api/{name}/khipu/sign",
                "validator": "khipu_sign",
            })
            self.assertEqual(endpoints["khipu_verify"], {
                "method": "POST",
                "path": f"/api/{name}/khipu/verify",
                "validator": "khipu_verify",
            })

    def test_legacy_sentra_cannot_claim_full_contract(self) -> None:
        sentra = next(target for target in khipu.FLAGSHIPS if target["name"] == "sentra")
        self.assertEqual(sentra["lifecycle"], "legacy-compatibility")
        self.assertEqual(set(sentra["endpoints"]), {"healthz"})
        self.assertEqual(sentra["endpoints"]["healthz"]["validator"], "production_health")


if __name__ == "__main__":
    unittest.main()
