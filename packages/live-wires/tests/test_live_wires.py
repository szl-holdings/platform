# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the live-wires substrate package."""
import live_wires
import live_wires.core as core

def test_module_imports():
    assert live_wires is not None
    assert core is not None
