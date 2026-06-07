# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay (CTO). Doctrine v11 (749/14/163).
"""At least one passing test per pillar + the core observability surface."""
from __future__ import annotations

import pytest

from a11oy_observability import pillars as P


def test_nine_pillars_registered():
    assert len(P.ALL_PILLARS) == 9
    names = [c.name for c in P.ALL_PILLARS]
    assert names == [
        "receipts", "memory", "chain", "gate", "replay",
        "tools", "traces", "queries", "business",
    ]


def test_all_pillars_unknown_without_source():
    # Honest posture: no data source wired => UNKNOWN, never faked numbers.
    for p in P.all_pillars():
        snap = p.status()
        assert snap["status"] == "unknown"
        assert snap["metrics"] == {}


# ---- one explicit test per pillar, feeding a live source ----

def test_receipts_pillar():
    src = lambda: {"count": 4, "signed_total": 0, "signing_available": False,
                   "nodes": [{"signed": False}] * 4}
    snap = P.ReceiptsPillar(source=src).status()
    assert snap["organ"].startswith("Wire D")
    assert snap["metrics"]["receipts_total"] == 4
    assert snap["status"] == "amber"  # no key wired -> amber, not red


def test_memory_pillar():
    src = lambda: {"recall_latency_ms_p50": 12, "recall_latency_ms_p95": 40, "vss_active": True, "recall_count": 9}
    snap = P.MemoryPillar(source=src).status()
    assert snap["status"] == "green"
    assert snap["metrics"]["vss_active"] is True


def test_chain_pillar():
    src = lambda: {"dag_depth": 7, "khipu_root": "abc", "rs_recovery_events": 0}
    snap = P.ChainPillar(source=src).status()
    assert snap["metrics"]["rs_k"] == 6 and snap["metrics"]["rs_n"] == 10
    assert snap["status"] == "green"


def test_gate_pillar():
    src = lambda: {"pass_total": 10, "fail_total": 2, "per_axis": {"a1": 1}}
    snap = P.GatePillar(source=src).status()
    assert snap["metrics"]["axes"] == 13
    assert snap["metrics"]["pass_ratio"] == pytest.approx(0.8333, abs=1e-3)


def test_replay_pillar():
    src = lambda: {"events_total": 100, "reconstruct_rate": 1.0, "last_replay_ms": 5}
    snap = P.ReplayPillar(source=src).status()
    assert snap["metrics"]["deterministic"] is True
    assert snap["status"] == "green"


def test_tools_pillar():
    src = lambda: {"invocations_total": 33, "tools_available": 16, "error_total": 1}
    snap = P.ToolsPillar(source=src).status()
    assert snap["organ"] == "Hatun-MCP"
    assert snap["metrics"]["tools_available"] == 16


def test_traces_pillar():
    src = lambda: {"trace_volume": 200, "active_span_count": 3, "wire_d_status": "LIVE"}
    snap = P.TracesPillar(source=src).status()
    assert snap["metrics"]["wire_d_status"] == "LIVE"
    assert snap["status"] == "green"


def test_queries_pillar():
    src = lambda: {"query_count": 50, "latency_ms_p50": 4, "latency_ms_p95": 22, "error_rate": 0.0}
    snap = P.QueriesPillar(source=src).status()
    assert snap["organ"] == "GraphQL gateway"
    assert snap["metrics"]["query_count"] == 50


def test_business_pillar():
    src = lambda: {"revenue_attributed_total": 42000.0, "tagged_receipts": 3, "high_value_decisions": 1}
    snap = P.BusinessPillar(source=src).status()
    assert snap["status"] == "green"
    assert snap["metrics"]["revenue_attributed_total"] == 42000.0
    assert "eu_ai_act_art12" in snap["metrics"]["compliance_frameworks"]


def test_pillar_by_name():
    p = P.pillar_by_name("business")
    assert isinstance(p, P.BusinessPillar)
    with pytest.raises(KeyError):
        P.pillar_by_name("nope")
