# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the puriq-os substrate package."""
import puriq_os

def test_locked_doctrine():
    assert hasattr(puriq_os, "LOCKED")
    assert hasattr(puriq_os, "LOCKED_REPLAY_HASH")

def test_replay_hash_checker():
    assert callable(puriq_os.check_replay_hash)

def test_core_types_present():
    for name in ("OrganAgent", "Action", "LoopStatus"):
        assert hasattr(puriq_os, name), name
