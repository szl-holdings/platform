---
title: vessels — Maritime Intelligence Console
emoji: ⚓
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: true
license: other
short_description: "deployment fabric — maritime intelligence UI"
ecosystem-stage: operational
---

# vessels — Maritime Intelligence Console

Canonical module Space for **vessels**, the deployment skeleton / proving ground of the SZL UDS mesh. This Space runs the live Docker backend; the architecture deep-dive (formerly the separate `vessels-platform` landing) is folded in below.

> ⚠ **Orchestrated by a11oy · Simulated AIS feed · Stub data layer in public demo.** Not real-time tracking · not a navigation tool · not insurable telemetry. The public deployment uses simulated AIS data from public registries and committed mock fixtures; production deployments wire the same UI to live AIS providers and the real receipt bus.

**Canonical numbers (Doctrine v9, locked 2026-05-31):** 456 Lean 4 declarations · 14 unique axioms · 6 tracked sorries · 46 policy gates · 44 anchor formula gates · 12 MCP tools · SLSA L1 (honest). These resolve to CI logs and the Mathlib-based Lean source (formula moat); browse them in the [UDS demo Space](https://huggingface.co/spaces/SZLHOLDINGS/uds-demo).

## What vessels is

A React + Vite + TypeScript operator UI for maritime fleet visualization: fleet maps, voyage P&L, risk-simulation cockpit, AIS tracking views, and commodity-flow intelligence. In the mesh, vessels is the structural deployment fabric — the skeleton where the organism runs.

## What is real

- React 19 + Vite 7 + TypeScript (strict) operator UI — **4,738 SLOC across 19 `.ts` files**
- `razNihyehScore()` — a deterministic ownership-graph opacity scorer (CLEAR → DARK)
- **122 mock records** (12 dark-fleet + 46 sanctions-network + 12 disruption + 52 fleet-twin)
- DSSE-wrapped SHA-256 receipts on the same Λ-gate substrate as a11oy

## What is simulated

- AIS position / movement telemetry (public demo)
- The client `api.ts` targets an external api-server not present in the public subtree

## Mesh position

| Layer | Module | Role |
|---|---|---|
| Operator | rosie | human-facing console |
| Substrate | a11oy | policy + receipt substrate |
| Memory | amaru | memory cortex |
| Immune | sentra | egress + tripwires |
| **Fabric** | **vessels** | **deployment skeleton (this Space)** |

## Links

- UDS mesh demo (everything together): https://huggingface.co/spaces/SZLHOLDINGS/uds-demo
- Source: [github.com/szl-holdings/vessels](https://github.com/szl-holdings/vessels) · Latest release: [`uds-v0.3.0`](https://github.com/szl-holdings/vessels/releases/tag/uds-v0.3.0)
- Concept DOI: [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)

---
© SZL Holdings · Stephen P. Lutar Jr. · Doctrine v9 — Proprietary runtime · BSL-1.1 platform · CC-BY-4.0 research · SLSA L1
