# SPDX-License-Identifier: Apache-2.0
"""Core WAYRA tests: normalize, yuyay gate, WAYRA factor, Khipu chain."""
from wayra.core.normalize import make_event, content_hash, license_class
from wayra.core.yuyay_gate import (gate, wayra_factor, yuyay_13, quality_score,
                                    novelty_score, ACCEPT_THRESHOLD, DROP_THRESHOLD)


def _good_event():
    return make_event(
        source="arxiv", source_detail="cs.LO",
        timestamp="2026-05-28T00:00:00Z",
        title="A Lean-Verified Calculus for Bounded Agentic Utility",
        url="https://arxiv.org/abs/2605.12345",
        parsed_summary=("We present a formally verified calculus in Lean 4 for bounded "
                        "agentic utility, proving monotonicity and a Bekenstein bound."),
        license="cc-by-4.0",
    )


def _spam_event():
    return make_event(
        source="arxiv", source_detail="cs.LO", timestamp="2026-05-28T00:00:00Z",
        title="Buy Now Free Download Crypto Airdrop", url="https://arxiv.org/abs/2605.99999",
        parsed_summary="free download click here 100% guaranteed casino viagra crack keygen",
        license="unknown")


def test_content_hash_deterministic():
    assert content_hash("a", "b") == content_hash("a", "b")
    assert content_hash("a", "b") != content_hash("a", "c")
    assert len(content_hash("x")) == 64


def test_license_class():
    assert license_class("apache-2.0") == "GREEN"
    assert license_class("MIT") == "GREEN"
    assert license_class("llama-community-license") == "AMBER"
    assert license_class("cc-by-nc-4.0") == "RED"
    assert license_class("unknown") == "RED"


def test_wayra_factor_in_unit_envelope():
    # The WAYRA factor is an admissible factor: always in [0,1].
    for q in (0.0, 0.5, 1.0):
        for n in (0.0, 0.5, 1.0):
            for y in (0.0, 0.5, 1.0):
                wf = wayra_factor(q, n, y)
                assert 0.0 <= wf <= 1.0
    # Zero on any axis collapses the factor (conjunctive, no compensation).
    assert wayra_factor(0.0, 1.0, 1.0) == 0.0
    assert wayra_factor(1.0, 0.0, 1.0) == 0.0
    assert wayra_factor(1.0, 1.0, 0.0) == 0.0


def test_yuyay_in_unit_envelope():
    assert 0.0 <= yuyay_13(_good_event()) <= 1.0
    # Spam collapses the sacred non-toxicity axis.
    assert yuyay_13(_spam_event()) < 0.5


def test_good_event_accepts():
    ev = gate(_good_event(), known_hashes=set(), known_titles=set())
    assert ev.decision == "accept"
    assert ev.wayra_factor > ACCEPT_THRESHOLD


def test_spam_event_drops():
    ev = gate(_spam_event(), known_hashes=set(), known_titles=set())
    assert ev.decision == "drop"
    assert ev.wayra_factor < DROP_THRESHOLD


def test_duplicate_has_zero_novelty():
    ev = _good_event()
    n = novelty_score(ev, known_hashes={ev.content_hash})
    assert n == 0.0


def test_khipu_chain_integrity(log):
    # Emit several events; chain must verify.
    for i in range(5):
        ev = make_event(source="arxiv", source_detail="cs.AI",
                        timestamp=f"2026-05-2{i}T00:00:00Z",
                        title=f"Paper number {i} on verified reasoning",
                        url=f"https://arxiv.org/abs/2605.0000{i}",
                        parsed_summary="A long enough abstract about formal verification methods.",
                        license="cc-by-4.0")
        ev = gate(ev, log.known_hashes(), log.known_titles())
        log.emit(ev)
    res = log.verify_chain()
    assert res["ok"] is True
    assert res["depth"] == 5
    assert log.count() == 5
    assert log.receipt_depth() == 5


def test_every_event_gets_a_receipt(log):
    # Even a DROP must produce a Khipu receipt (HARD RULE).
    ev = gate(_spam_event(), log.known_hashes(), log.known_titles())
    log.emit(ev)
    assert ev.decision == "drop"
    assert log.receipt_depth() == 1
