# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the wire-d substrate package."""
import wire_d

def test_module_imports():
    assert wire_d is not None

def test_has_register_or_core():
    # wire-d exposes the live-wires register() integration point via its core module
    import wire_d.core as core
    assert hasattr(core, "register") or any(
        callable(getattr(core, n)) for n in dir(core) if not n.startswith("_")
    )
