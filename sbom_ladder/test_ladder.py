import unittest

from sbom_ladder.ladder import (Component, ComponentError, L1_INVENTORY, L2_DIGEST_PINNED,
                                L3_BUILD_PINNED, SignatureClaimError,
                                attained_level, ladder_report)

DIG = "a" * 64
DIG2 = "b" * 64
PROV = "ourobo/build-recipes/r1#example"


class ComponentTests(unittest.TestCase):
    def test_l1_inventory_only(self):
        c = Component(name="fastapi", version="0.115.0")
        self.assertEqual(attained_level(c), L1_INVENTORY)

    def test_l2_digest_pinned(self):
        c = Component(name="fastapi", version="0.115.0", content_digest=DIG)
        self.assertEqual(attained_level(c), L2_DIGEST_PINNED)

    def test_l3_build_pinned(self):
        c = Component(name="fastapi", version="0.115.0", content_digest=DIG,
                      build_digest=DIG2, provenance_ref=PROV)
        self.assertEqual(attained_level(c), L3_BUILD_PINNED)

    def test_l3_requires_recipe_digest_and_provenance(self):
        # content digest present, build digest present, NO provenance ref -> L2
        c = Component(name="pkg", version="1.0", content_digest=DIG, build_digest=DIG2)
        self.assertEqual(attained_level(c), L2_DIGEST_PINNED)
        # content digest present, provenance present, NO build recipe digest -> L2
        c2 = Component(name="pkg", version="1.0", content_digest=DIG, provenance_ref=PROV)
        self.assertEqual(attained_level(c2), L2_DIGEST_PINNED)

    def test_ingredient_gaps_downgrade_honestly(self):
        c = Component(name="pkg", version="1.0", build_digest=DIG2, provenance_ref=PROV)
        self.assertEqual(attained_level(c), L1_INVENTORY)  # weakest pin governs
        rep = ladder_report([c])
        row = rep["per_component"][0]
        self.assertIn("missing content_digest", "".join(row["downgrade_reasons"]))

    def test_malformed_lower_pin_rejected_not_downgraded(self):
        # malformed build_digest on an otherwise-L2 component RAISES; it is
        # never silently ignored into a downgrade
        with self.assertRaises(ComponentError):
            Component(name="pkg", version="1.0", content_digest=DIG, build_digest="zz" * 32)

    def test_non_hex_digest_rejected(self):
        with self.assertRaises(ComponentError):
            Component(name="pkg", version="1.0", content_digest="ZZ" * 32)

    def test_signature_claim_rejected_fail_closed(self):
        with self.assertRaises(SignatureClaimError):
            Component(name="pkg", version="1.0", signature_ref="sig:alone")

    def test_signature_claim_rejected_with_lower_evidence(self):
        # the owner-gated claim fails closed even alongside full L3 evidence
        with self.assertRaises(SignatureClaimError):
            Component(name="pkg", version="1.0", content_digest=DIG,
                      build_digest=DIG2, provenance_ref=PROV,
                      signature_ref="sig:with-lower-evidence")

    def test_empty_component_rejected(self):
        with self.assertRaises(ComponentError):
            Component(name="", version="1.0")
        with self.assertRaises(ComponentError):
            Component(name="pkg", version="")
        with self.assertRaises(ComponentError):
            Component(name="pkg", version="1.0", provenance_ref="   ")

    def test_l4_unreachable_structurally(self):
        best = Component(name="pkg", version="1.0", content_digest=DIG,
                         build_digest=DIG2, provenance_ref=PROV)
        self.assertEqual(attained_level(best), L3_BUILD_PINNED)  # never L4 without mint


class ReportTests(unittest.TestCase):
    def test_report_no_merged_status_key(self):
        rep = ladder_report([Component(name="a", version="1", content_digest=DIG),
                             Component(name="b", version="2")])
        self.assertNotIn("overall", rep)
        self.assertTrue(rep["no_merged_status"])
        self.assertEqual(rep["level_counts"][L2_DIGEST_PINNED], 1)
        self.assertEqual(rep["level_counts"][L1_INVENTORY], 1)
        self.assertEqual(rep["l4_signed_count"], 0)
        self.assertTrue(all("L4_SIGNED owner-gated" in "".join(r["downgrade_reasons"])
                            for r in rep["per_component"]))

    def test_duplicate_component_rejected(self):
        with self.assertRaises(ComponentError):
            ladder_report([Component(name="a", version="1"),
                           Component(name="a", version="1")])

    def test_empty_component_collection_rejected(self):
        with self.assertRaises(ComponentError):
            ladder_report([])

    def test_rejects_non_component(self):
        with self.assertRaises(ComponentError):
            ladder_report([{"name": "x"}])


if __name__ == "__main__":
    unittest.main()
