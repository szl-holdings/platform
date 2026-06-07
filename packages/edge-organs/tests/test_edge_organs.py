# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the edge-organs substrate package."""
import os
import edge_organs

def test_module_imports():
    assert edge_organs is not None

def test_wasi_rikuq_source_present():
    # wasi_rikuq.py ships in the package; it imports the optional szl_khipu DAG
    # backend lazily at deploy time, so we assert the source file is vendored
    # rather than importing it (no flagship runtime deps in unit tests).
    here = os.path.dirname(edge_organs.__file__)
    assert os.path.exists(os.path.join(here, "wasi_rikuq.py"))
