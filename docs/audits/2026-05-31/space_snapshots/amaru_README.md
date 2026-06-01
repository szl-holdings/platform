---
title: amaru — Memory Attestation (Cardano-Anchored)
emoji: 🐍
colorFrom: yellow
colorTo: indigo
sdk: docker
pinned: true
license: apache-2.0
short_description: "memory cortex — Cardano-anchored receipt chain"
ecosystem-stage: operational
---

# amaru — Memory Attestation, Cardano-Anchored

Canonical module Space for **amaru**, the memory cortex of the SZL UDS mesh. a11oy queries amaru for memory; amaru wraps every memory read and write in a cryptographic receipt chain, optionally checkpointing hashes to the Cardano L1. This Space runs the live Docker backend; the architecture deep-dive (formerly the separate `amaru-platform` landing) is folded in below.

> **Live:** this is a running Docker Space. **Not a token · not a blockchain L1 · not custodial** — Cardano is used for hash anchoring only.

**Canonical numbers (locked 2026-05-31):** Doctrine v7 · 15 axioms (14 unique) · 749 Lean 4 declarations · 168 sorries · 44 anchor formula gates · SLSA L1 (honest). These resolve to CI logs and the Mathlib-based Lean source (formula moat); browse them in the [UDS demo Space](https://huggingface.co/spaces/SZLHOLDINGS/uds-demo).

> Cardano-anchored governance receipt minting and convergent multi-source data sync with append-only delta logs and bounded-loop convergence guarantees.

## What amaru is (folded from the landing page)

amaru is a memory attestation runtime for AI agents. It wraps every memory read and write in a cryptographic receipt chain, optionally anchoring checkpoint hashes to the Cardano L1 for tamper-evident provenance. Four interlocking primitives:

- **Governance Receipts** — COSE_Sign1-wrapped receipts (RFC 9052) minted per memory operation; each carries a Λ score, Shor-9 encoded provenance hash, Lamport timestamp, and optional Cardano Tx reference.
- **7-Chakra Scheduler** — a single-thread serpentine pipeline: ASCEND (propose) then DESCEND (commit), no branching mid-tick; all 7 chakras fire sequentially, each emitting a receipt trace entry.
- **Shor-9 Provenance** — provenance hashes are Shor-9-qubit-encoded before anchoring (single-qubit error correction on the receipt chain).
- **Cardano L1 Anchor** — checkpoint hashes anchored as transaction metadata (hash anchoring only, no new token).

## Live features

- **7-Chakra Brain Runtime** — FastAPI service, real-time root → crown kernel evaluation
- **Convergent Sync** — idempotent passes through the Ouroboros kernel until the diff is zero
- **Codex Loop** — Dresden Venus reference run, governance ON vs OFF postures
- **Receipt Chain** — hash-chained append-only governance receipts (COSE_Sign1)
- **Overwatch Panel** — 6-invariant monitoring (R0513 doctrine)
- **Huklla Tripwires** — 10-point health checks across the runtime

## Architecture

| Layer | Technology |
|:------|:-----------|
| Backend | Python 3.12 · FastAPI · Pydantic · httpx |
| Frontend | React 19 · Vite 6 · Tailwind 4 · TanStack Query · Recharts |
| Deployment | Docker (multi-stage build) |

## API surface

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/api/amaru/healthz` | GET | Liveness + chakra status |
| `/api/amaru/chakra/{name}/evaluate` | POST | Run a chakra kernel |
| `/api/amaru/scheduler/tick` | POST | Full root→crown scheduler tick |
| `/api/amaru/receipts` | GET | Receipt chain browser |
| `/api/amaru/tripwires` | GET | Huklla-10 health checks |
| `/api/amaru/overwatch/snapshot` | GET | R0513 6-invariant panel |

## Mesh position

| Layer | Module | Role |
|---|---|---|
| Operator | rosie | human-facing console |
| Substrate | a11oy | policy + receipt substrate |
| **Memory** | **amaru** | **memory cortex a11oy queries (this Space)** |
| Immune | sentra | egress + tripwires |
| Fabric | vessels | deployment skeleton |

## Links & provenance

- UDS mesh demo (everything together): https://huggingface.co/spaces/SZLHOLDINGS/uds-demo
- Source: [`szl-holdings/amaru`](https://github.com/szl-holdings/amaru) · Latest release: [`uds-v0.3.1`](https://github.com/szl-holdings/amaru/releases/tag/uds-v0.3.1)
- Thesis DOI: [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276) · Lean companion DOI: [10.5281/zenodo.20424992](https://doi.org/10.5281/zenodo.20424992)
- Author: Stephen Paul Lutar Jr. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)

---
© SZL Holdings · Stephen P. Lutar Jr. · Doctrine v7 — no marketing language; every number resolves to a CI log or DOI.
