# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Tests for the khipu-lmdb durable receipt log."""
import tempfile

import khipu_lmdb


def test_append_and_verify_chain():
    with tempfile.TemporaryDirectory() as d:
        k = khipu_lmdb.KhipuLMDB(d, organ="test")
        r1 = k.append({"event": "first"})
        r2 = k.append({"event": "second"})
        assert r1["digest"] and r2["digest"] and r1["digest"] != r2["digest"]
        # r2 must chain onto r1 (tamper-evident prev-link)
        assert r2["prev"] == r1["digest"]
        report = k.verify()
        # verify() re-walks the on-disk chain; depth should be 2 and no break
        assert report["depth"] >= 2
        assert report["ok"] is True
        k.close()


def test_durability_across_reopen():
    with tempfile.TemporaryDirectory() as d:
        k = khipu_lmdb.KhipuLMDB(d, organ="test")
        r = k.append({"event": "persist"})
        k.close()
        k2 = khipu_lmdb.KhipuLMDB(d, organ="test")
        got = k2.get_by_receipt(r["digest"])
        assert got is not None
        k2.close()
