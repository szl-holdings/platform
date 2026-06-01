# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the formula-os substrate package."""
import formula_os

def test_specs_registry():
    assert isinstance(formula_os.SPECS, (list, tuple, dict))
    assert formula_os.BY_ID is not None

def test_doctrine_locked():
    assert formula_os.DOCTRINE_V11_LOCKED

def test_formula_agent_constructible():
    assert formula_os.FormulaAgent is not None
