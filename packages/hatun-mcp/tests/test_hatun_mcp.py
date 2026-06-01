# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the hatun-mcp substrate package."""
import hatun_mcp

def test_version_present():
    assert hasattr(hatun_mcp, "__version__")
    assert isinstance(hatun_mcp.__version__, str)
