---
title: rosie — Operator Console
emoji: 🔄
colorFrom: indigo
colorTo: gray
sdk: docker
app_port: 7860
pinned: true
license: apache-2.0
short_description: "rosie module — the human-facing operator console"
tags:
 - governance
 - agentic-ai
 - doctrine-v9
 - rosie
 - receipt-dag
 - operator
 - lean4
 - mathlib
 - dsse
ecosystem-stage: operational
---

# rosie — Operator Console

Canonical module Space for **rosie**, the operator console of the SZL UDS mesh — ambient in every app, full-power as a standalone. The operator issues commands through rosie; rosie routes to a11oy; a11oy delegates to the organs. This Space runs the live Gradio console; the receipt-DAG library that backs it (formerly described in `rosie-platform`) is folded in below.

> **Live:** this is a running Gradio Space presenting the operator console (eleven tabs: span explorer, receipt verifier, mesh health, doctrine sweep, live formulas, about, cross-space helper, self-learning loop, active inference, cognitive maps, cross-session memory/unay). It also mirrors every a11oy `/v1/*` endpoint (under root, `/api/rosie`, and `/api/a11oy`). rosie is not an organ on the body diagram — it sits outside the body, like a console attached by nerves.

**Canonical numbers (Doctrine v9, locked 2026-05-31):** 456 Lean 4 declarations · 14 unique axioms · 6 tracked sorries · 46 policy gates · 44 anchor formula gates · 12 MCP tools · SLSA L1 (honest). These resolve to CI logs and the Mathlib-based Lean source (formula moat); browse them in the [UDS demo Space](https://huggingface.co/spaces/SZLHOLDINGS/uds-demo).

## The console (this Space)

The Gradio console renders the operator surface over the rosie receipt tooling: span exploration, receipt verification, mesh-health view, doctrine sweep, and live formula evaluation.

## The receipt-DAG library that backs it

rosie ("Receipt-Orchestrated Signed Ingress Environment") is, at its core, a small self-contained TypeScript library (9 `.ts` files, ~1,145 lines including tests, `node:crypto` as its only runtime dependency). It is a pure library of synchronous functions over plain objects:

- **KhipuReceipt DAG (flagship)** — `buildDecision → buildOrgan → buildRoot` constructs a three-tier tree where every node carries a SHA-256 hash and `rootValue = Σ pendantValues = Σ Σ decisionValues`. `verifySumInvariant` is the runtime counterpart of the Lean summation theorem (a runtime check, not a proof); `knotInvariantTag` emits a deterministic, order-invariant 16-hex fingerprint of the DAG skeleton.
- **Brahmi AxisValue option type** — measured/absent option with `hash(absent) ≠ hash(measured(0))` and a geometric-mean helper that skips absent axes.
- **Horus-Eye 6-bit dyadic codec** — encodes weights in units of `1/2 … 1/64`; round-trip exact for all 64 codes.
- **QEC primitives** — Hamming distance/weight, Shor [[9,1,3]] replication + majority decode, CSS stabilizer parity, Kitaev vertex parity, and a pure `wrapIngress`/`verifyIngress` pair.

### Honest scope notes
- `verifyDualAttestation` is **structural-only** (both signers present, distinct, non-empty) — it does not verify cryptographic signatures, per its own doc comment.
- The Lean summation theorem lives in the separate `lutar-lean` repo; nothing in rosie itself proves anything.
- The receipt-DAG library has no LLM advisor, GPU inference, or multi-agent runtime; the operator console in this Space is the human-facing surface, not an autonomous agent.

### Most demoable feature
A 3-organ × 5-decision build yields `rootValue = 3030` and `verifySumInvariant(root).ok === true`; forging a single `pendantValue` (e.g. `999`) flips the invariant to `{ok:false}` — a self-contained tamper demo requiring zero external services.

## Mesh position

| Layer | Module | Role |
|---|---|---|
| **Operator** | **rosie** | **human-facing console — this Space** |
| Substrate | a11oy | policy + receipt substrate rosie commands |
| Memory | amaru | memory cortex |
| Immune | sentra | egress + tripwires |
| Fabric | vessels | deployment skeleton |

## Links & provenance

- UDS mesh demo (everything together): https://huggingface.co/spaces/SZLHOLDINGS/uds-demo
- Source: [szl-holdings/rosie](https://github.com/szl-holdings/rosie) · Release: [`uds-v0.3.0`](https://github.com/szl-holdings/rosie/releases/tag/uds-v0.3.0) (ships CycloneDX + SPDX SBOMs)
- CI (Tests, CodeQL, DCO, SBOM, scorecard) green on `main`; branch protection enforced.

---
© SZL Holdings · Stephen P. Lutar Jr. · Doctrine v9 — no marketing language; every number resolves to a CI log or DOI.
