# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay (CTO). Doctrine v11 (749/14/163).
"""Tests for the core observability surface (tag/query/attribute/compliance/replay)."""
from __future__ import annotations

import base64
import json

import pytest

import a11oy_observability as obs
from a11oy_observability import (
    BusinessContext, BusinessOutcome, DecisionValue, Scorecard,
    InMemoryReceiptStore, register_store,
)


@pytest.fixture(autouse=True)
def fresh_store():
    register_store(InMemoryReceiptStore())
    yield


def test_doctrine_v11_verbatim():
    d = obs.DOCTRINE_V11
    assert d["declarations"] == 749
    assert d["unique_axioms"] == 14
    assert d["tracked_sorries"] == 163
    assert d["slsa"] == "L1"
    assert d["lambda_uniqueness"] == "Conjecture 1"


def test_business_context_fields():
    ctx = BusinessContext(customer_id="acme", decision_value=DecisionValue.CRITICAL)
    f = ctx.as_receipt_fields()
    assert f["customer_id"] == "acme"
    assert f["decision_value"] == "critical"
    assert f["business_outcome"] == "pending"


def test_tag_receipt_raw():
    ctx = BusinessContext(customer_id="c1", business_outcome=BusinessOutcome.WON)
    node = obs.tag_receipt({"schema": "x", "ts_utc": "2026-06-01T00:00:00+00:00"}, ctx)
    assert node["receipt"]["business_context"]["customer_id"] == "c1"
    assert node["receipt"]["business_context"]["business_outcome"] == "won"


def test_tag_receipt_dsse_envelope():
    inner = {"schema": "szl.khipu.action/v1", "ts_utc": "2026-06-01T00:00:00+00:00"}
    env = {
        "payloadType": "application/vnd.szl.khipu+json",
        "payload": base64.b64encode(json.dumps(inner).encode()).decode(),
        "signatures": [{"sig": "AA", "keyid": "szlholdings-cosign"}],
    }
    ctx = BusinessContext(customer_id="dsse-c")
    node = obs.tag_receipt(env, ctx)
    assert node["receipt"]["business_context"]["customer_id"] == "dsse-c"
    assert node["receipt"]["_dsse_payloadType"] == "application/vnd.szl.khipu+json"


def test_query_observability_high_cardinality():
    obs.tag_receipt({"schema": "a", "ts_utc": "2026-06-01T00:00:00+00:00"},
                    BusinessContext(customer_id="c1", business_outcome=BusinessOutcome.WON))
    obs.tag_receipt({"schema": "b", "ts_utc": "2026-06-01T00:00:00+00:00"},
                    BusinessContext(customer_id="c2", business_outcome=BusinessOutcome.LOST))
    won = obs.query_observability({"business_outcome": "won"})
    assert len(won) == 1
    c1 = obs.query_observability({"customer_id": "c1"})
    assert len(c1) == 1
    none = obs.query_observability({"customer_id": ["c9"]})
    assert none == []


def test_attribute_revenue_late_binding():
    node = obs.tag_receipt({"schema": "a", "ts_utc": "2026-06-01T00:00:00+00:00"},
                           BusinessContext(customer_id="c1"))
    rev = obs.attribute_revenue(node["digest"], 1000.0)
    assert rev["receipt"]["business_context"]["revenue_attribution"] == 1000.0
    assert rev["receipt"]["links_receipt"] == node["digest"]


def test_compliance_scorecard_all_frameworks():
    for fw in ("eu_ai_act_art12", "nist_ai_rmf", "fedramp_moderate"):
        sc = obs.compliance_scorecard(fw)
        assert isinstance(sc, Scorecard)
        assert 0.0 <= sc.coverage_ratio <= 1.0
        assert sc.honest_note
    # fedramp must honestly NOT claim authorization
    fr = obs.compliance_scorecard("fedramp_moderate")
    assert fr.not_covered >= 1
    assert "NOT held" in fr.honest_note


def test_compliance_scorecard_unknown():
    with pytest.raises(ValueError):
        obs.compliance_scorecard("totally_made_up")


def test_decision_replay_window():
    obs.tag_receipt({"schema": "d1", "ts_utc": "2026-06-01T10:00:00+00:00"},
                    BusinessContext(decision_value=DecisionValue.HIGH))
    obs.tag_receipt({"schema": "d2", "ts_utc": "2026-06-05T10:00:00+00:00"},
                    BusinessContext(decision_value=DecisionValue.LOW))
    out = obs.decision_replay("2026-06-01T00:00:00+00:00", "2026-06-02T00:00:00+00:00")
    assert len(out) == 1
    assert out[0].decision_value == DecisionValue.HIGH
