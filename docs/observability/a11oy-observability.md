<!--
SPDX-License-Identifier: Apache-2.0
© 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v11/v12
Authored by Yachay (CTO). Co-Authored-By: Perplexity Computer Agent
Doctrine v11 LOCKED: 749 declarations · 14 unique axioms · 163 sorries · 13-axis · SLSA L1 · Λ-uniqueness=Conjecture 1
-->

# A11oy Observability — Provenanced Business Observability for the Agentic Era

**a11oy is the platform. Observability is one of its endpoints — a NATIVE
capability, not a separate product, not an add-on, not a separate brand.**

> Datadog tells you *what* happened. Honeycomb tells you *why*.
> **A11oy lets you prove it 5 years later, cryptographically.**

Endpoints live under `/api/a11oy/v3/observability/*`. The importable substrate
ships as `platform/packages/a11oy-observability/`.

---

## Why a11oy ships observability natively (no separate product, no add-on pricing)

Every modern observability vendor sells observability as a *product*: a separate
SKU, a separate agent, a separate bill that scales with your host count or event
volume. a11oy takes the opposite position. Observability is not something you
bolt onto a governed system after the fact — it is the *natural exhaust* of a
system where every action is already signed, gated, and chained.

Because a11oy already emits a Wire D DSSE receipt for every governed action,
observability is a *read* over data the platform produces by construction.
There is therefore:

- **No separate agent** — the organs already emit telemetry in-process.
- **No add-on pricing** — observability ships with a11oy under Apache-2.0.
- **No separate brand** — it is *a11oy observability*, one of a11oy's endpoints.

The differentiator is not dashboards (everyone has dashboards). It is
**provenance**: a11oy is the only observability stack that **signs every event**
(Wire D DSSE, ECDSA P-256 cosign), **proves the chain via Lean**
(Doctrine v11 — 749 declarations / 14 axioms / 163 sorries), and **replays
business decisions years later** (AYNI-OS event sourcing).

---

## The 9 pillars

A single, unified taxonomy under a11oy. Each pillar is bound to a real organ and
emits real, in-process metrics. A pillar with no wired data source honestly
reports `unknown` — it never fabricates numbers (Doctrine v11 honest posture).

| # | Pillar | Organ | What it measures |
|---|--------|-------|------------------|
| 1 | **ReceiptsPillar** | Wire D / Khipu DSSE | DSSE signing rate, success ratio |
| 2 | **MemoryPillar** | Unay (memory-core) | recall latency, `vss_active` state |
| 3 | **ChainPillar** | Khipu Merkle DAG | DAG depth, RS(10,6) recovery events |
| 4 | **GatePillar** | Yuyay-13 gate | pass/fail per axis (13 axes) |
| 5 | **ReplayPillar** | AYNI-OS | event-sourcing reconstruct rate |
| 6 | **ToolsPillar** | Hatun-MCP | tool invocations |
| 7 | **TracesPillar** | OTel + Wire D | trace continuity |
| 8 | **QueriesPillar** | GraphQL gateway | query latency |
| 9 | **BusinessPillar** | a11oy (native) | revenue attribution + compliance + decision value |

---

## Honest comparison

This table is deliberately conservative. Where a competitor leads, we say so
(Honeycomb owns high-cardinality query; Grafana owns native dashboards and
open-source self-host; AppDynamics owns business-IT correlation). a11oy's
unique column is **provenance**, not feature breadth.

| Capability | a11oy | Datadog | Honeycomb | Grafana | AppDynamics |
|---|---|---|---|---|---|
| OTel ingest | yes | yes | yes | yes | yes |
| Metrics+Traces+Logs | yes | yes | yes | yes | yes |
| High-cardinality query | yes | partial | **yes (best-in-class)** | partial | partial |
| Dashboards | yes (Grafana JSON) | yes | yes | **yes (native)** | yes |
| Cryptographic event signing | **yes (Wire D ECDSA P-256)** | no | no | no | no |
| Lean-proven invariants | **yes (749/14/163)** | no | no | no | no |
| Reed-Solomon erasure-coded chain | **yes (RS(10,6))** | no | no | no | no |
| Event-sourcing replay | **yes (AYNI-OS)** | no | partial | no | partial |
| Business outcome tagging | **yes (native)** | yes (add-on) | no | no | yes (focus) |
| Apache-2.0 self-host | **yes** | no | no | yes | no |
| Per-host pricing | **n/a** | $15–50 | $0.07/M events | n/a | $4–7 |

*Pricing figures are public list-price order-of-magnitude references for
comparison only and change frequently; verify current vendor pricing directly.*

---

## Differentiator

> **Datadog tells you what happened. Honeycomb tells you why. A11oy lets you prove it 5 years later, cryptographically.**

The first two columns of value — *what* and *why* — are well served by the
incumbents. a11oy adds a third axis the incumbents structurally cannot offer
without re-architecting around provenance: **proof**. Each event carries a DSSE
signature (real ECDSA P-256 when the cosign key is present; honestly UNSIGNED
and labelled otherwise — never faked). The chain of events is erasure-coded
RS(10,6) and Merkle-linked. The governing invariants are formalised in Lean.
And any window of business decisions can be deterministically reconstructed from
the event log years after the fact.

---

## Integration via the agentic mesh SDK (drop-in)

Observability is registered into any a11oy Space with a single additive call —
the same pattern every other a11oy organ uses:

```python
# serve.py
import szl_observability
szl_observability.register(app, ns="a11oy")   # → /api/a11oy/v3/observability/*
```

And consumed from the importable package:

```python
from a11oy_observability import (
    BusinessContext, DecisionValue, BusinessOutcome,
    tag_receipt, attribute_revenue, query_observability,
    compliance_scorecard, decision_replay,
)
from a11oy_observability.pillars import all_pillars

ctx = BusinessContext(customer_id="acme-001",
                      decision_value=DecisionValue.HIGH,
                      business_outcome=BusinessOutcome.WON)
node = tag_receipt(receipt, ctx)            # business context rides the Wire D DAG
attribute_revenue(node["digest"], 42000.0)  # late-binding revenue
won = query_observability({"business_outcome": "won"})
sc  = compliance_scorecard("eu_ai_act_art12")
```

### Live endpoints (`/api/a11oy/v3/observability/*`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/manifesto` | Philosophy + the 9 pillars (JSON) |
| GET | `/pillars` | The 9 pillars with current status per organ |
| GET | `/pillars/{name}` | Pillar detail (data sources, metrics, last update) |
| POST | `/tag` | Add business context to a receipt by hash |
| POST | `/attribute-revenue` | Late-binding revenue attribution |
| GET | `/query?customer_id=&decision_value=&…` | Honeycomb-style high-cardinality query |
| GET | `/compliance/{framework}` | Scorecard: `eu_ai_act_art12`, `nist_ai_rmf`, `fedramp_moderate` |
| POST | `/decision-replay` | Replay business decisions in a `{from_ts, to_ts}` window |
| GET | `/dashboard` | Mobile-first HTML dashboard |

---

## Honest posture (Doctrine v11 preserved)

- **SLSA L1** — provenance exists; the build pipeline is **not** hardened (not L3).
- **Λ-uniqueness is Conjecture 1** — a conjecture, not a theorem.
- **163 tracked sorries** remain in the Lean development (749 declarations / 14 unique axioms).
- DSSE signatures are **real** ECDSA-P256-SHA256 cosign sigs **only** when the
  `SZL_COSIGN_PRIVATE_PEM` runtime secret is present; otherwise receipts are
  emitted UNSIGNED and clearly labelled — **never faked**.
- Decision replay is **event-sourcing reconstruction**, not time-travel.
- The FedRAMP scorecard is an **honest roadmap-posture self-assessment** — FedRAMP
  authorization is **NOT** held and no 3PAO assessment has been performed.

---

*© 2026 SZL Holdings. Apache-2.0. Authored by Yachay (CTO).
Co-Authored-By: Perplexity Computer Agent.
Sources: a11oy Space — https://huggingface.co/spaces/SZLHOLDINGS/a11oy ·
platform monorepo — https://github.com/szl-holdings/platform ·
package — https://github.com/szl-holdings/platform/tree/main/packages/a11oy-observability*
