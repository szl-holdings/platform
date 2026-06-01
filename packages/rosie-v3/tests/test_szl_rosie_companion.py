# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the rosie-v3 substrate package."""
import szl_rosie_companion as rosie

def test_public_surface():
    for name in ("RosieShadow", "RosieResponse", "EvolveProposal", "RosieUnavailable", "make_khipu_receipt"):
        assert hasattr(rosie, name), name

def test_make_khipu_receipt_callable():
    assert callable(rosie.make_khipu_receipt)
