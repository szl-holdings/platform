# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""Smoke + API tests for the kipu-qillqaq substrate package."""
import kipu

def test_pool_write_read():
    p = kipu.KipuPool()
    c = kipu.ReceiptCell(organ_origin="Yuyay", payload={"gate": "pass"}, yuyay_score=0.9)
    cid = p.write(c)
    assert cid
    got = p.read({"organ_origin": "Yuyay"})
    assert got is not None and got.organ_origin == "Yuyay"

def test_associative_match():
    c = kipu.ReceiptCell(organ_origin="Yuyay", payload={}, yuyay_score=0.4)
    assert kipu.match_pattern(c, {"yuyay_score": "< 0.5"})
    assert not kipu.match_pattern(c, {"yuyay_score": "> 0.5"})

def test_content_address_verifies():
    c = kipu.ReceiptCell(organ_origin="X", payload={"a": 1}).sign()
    assert c.verify_cid()
