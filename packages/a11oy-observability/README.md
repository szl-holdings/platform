# a11oy-observability

**Provenanced business observability — a NATIVE a11oy capability, not a separate product.**

a11oy is the platform. Observability is one of its endpoints, served under
`/api/a11oy/v3/observability/*`. There is no separate brand and no add-on
pricing — observability ships with a11oy.

> Datadog tells you *what* happened. Honeycomb tells you *why*.
> **a11oy lets you *prove* it 5 years later, cryptographically.**

The only observability stack that **signs every event** (Wire D DSSE, ECDSA
P-256 cosign), **proves the chain via Lean** (749/14/163), and **replays
decisions years later** (AYNI-OS event sourcing).

## The 9 pillars

A single, unified taxonomy under a11oy (each pillar is bound to a real organ):

| # | Pillar | Organ | What it measures |
|---|--------|-------|------------------|
| 1 | `ReceiptsPillar` | Wire D / Khipu DSSE | DSSE signing rate, success ratio |
| 2 | `MemoryPillar` | Unay (memory-core) | recall latency, `vss_active` state |
| 3 | `ChainPillar` | Khipu Merkle DAG | DAG depth, RS(10,6) recovery events |
| 4 | `GatePillar` | Yuyay-13 gate | pass/fail per axis (13 axes) |
| 5 | `ReplayPillar` | AYNI-OS | event-sourcing reconstruct rate |
| 6 | `ToolsPillar` | Hatun-MCP | tool invocations |
| 7 | `TracesPillar` | OTel + Wire D | trace continuity |
| 8 | `QueriesPillar` | GraphQL gateway | query latency |
| 9 | `BusinessPillar` | a11oy (native) | revenue attribution + compliance + decision value |

## Quickstart

```python
from a11oy_observability import (
    BusinessContext, DecisionValue, BusinessOutcome,
    tag_receipt, attribute_revenue, query_observability,
    compliance_scorecard, decision_replay,
)
from a11oy_observability.pillars import all_pillars

# Tag a Wire D receipt with business context
ctx = BusinessContext(
    customer_id="acme-001",
    decision_value=DecisionValue.HIGH,
    business_outcome=BusinessOutcome.WON,
    compliance_tags=["eu_ai_act_art12"],
)
node = tag_receipt({"schema": "szl.khipu.action/v1", "ts_utc": "2026-06-01T12:00:00+00:00"}, ctx)

# Late-binding revenue attribution
attribute_revenue(node["digest"], 42000.0)

# Honeycomb-style high-cardinality query
won = query_observability({"business_outcome": "won", "customer_id": "acme-001"})

# Compliance coverage (honest)
sc = compliance_scorecard("eu_ai_act_art12")
print(sc.coverage_ratio, sc.honest_note)

# Pillar status snapshot
for p in all_pillars():
    print(p.status()["name"], p.status()["status"])
```

## Honest posture (Doctrine v11 preserved)

- **SLSA L1** — provenance exists; build pipeline NOT hardened (not L3).
- **Λ-uniqueness is Conjecture 1** — not a theorem.
- **163 tracked sorries** remain (749 declarations / 14 unique axioms).
- DSSE signatures are **real** ECDSA-P256-SHA256 cosign sigs only when
  `SZL_COSIGN_PRIVATE_PEM` is present; otherwise receipts are emitted UNSIGNED
  and clearly labelled — **never faked**.
- Decision replay is **event-sourcing reconstruction**, not time-travel.

## License

Apache-2.0. © 2026 SZL Holdings. Authored by Yachay (CTO).
