# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the ayni-os substrate package."""
import importlib
import ayni_os

def test_all_declares_submodules():
    for name in ("ledger", "checkpoint", "rewind", "reciprocity_monitor", "tinkuy"):
        assert name in ayni_os.__all__, name

def test_submodules_importable():
    for name in ("ledger", "checkpoint", "rewind", "reciprocity_monitor", "tinkuy"):
        mod = importlib.import_module(f"ayni_os.{name}")
        assert mod is not None
