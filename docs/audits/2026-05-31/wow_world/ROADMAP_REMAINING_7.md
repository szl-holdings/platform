# ROADMAP_REMAINING_7 — Sequenced Build Plan

**Layer:** PURIQ → `wow_world/`
**Author:** Yachay (Wow-The-World agent)
**Date:** 2026-06-01
**Shipped now (top-3):** #4 Doctrine-as-Code OS · #9 Doctrine v∞ · #8 The Glass Hand-Off.
**Remaining seven:** #1, #2, #3, #5, #6, #7, #10 — sequenced below by *value ÷ effort* and dependency order. Doctrine v11 LOCKED numbers preserved verbatim. No mysticism — math + frontier engineering only.

> Each card: **effort**, **dependencies**, **sequencing rationale**, **first milestone**, **definition of done**. Builds on `10_FEATURE_SPECS.md`.

---

## Wave 1 — fast follows (weeks 2–4, M effort, no new infra)

### #2 PURIQ Live Council  *(recommended next ship)*
- **Effort:** M · **Deps:** HF Router inference (already wired in `a11oy_code_orchestrator`), three.js, reward judge, Yuyay-13 gate, T09 threshold.
- **Why now:** Highest demo score (5) of the unshipped; reuses the orchestrator + the `/wow/` tab pattern just shipped. Pure software.
- **First milestone:** 3-model SSE deliberation with the conjunctive-gate ring + dissent→T09 flash, each vote a receipt.
- **DoD:** live council renders N GREEN models, gate visibly clears/blocks, dissent>τ escalates, all votes verifiable.

### #1 Khipu Time Machine
- **Effort:** M · **Deps:** existing Khipu DAG, three.js, `szl_live_wires` scene graph.
- **Why now:** Reuses the live-wires 3D + the receipt store; the time-scrub is a deterministic fold over receipts already being written.
- **First milestone:** slider replays anatomy to time T from receipts; scrub emits a `replay_at` receipt.
- **DoD:** any T reconstructs identical state (replay-hash discipline), reconstructed λ = locked 13-axis value.

### #7 Killinchu Open Adversary Catalog
- **Effort:** M · **Deps:** CC-BY-SA license, DSSE/cosign signing, credit ledger, static entry store.
- **Why now:** Independent of the others; starts the network-effect flywheel early; M effort.
- **First milestone:** entry schema + DSSE-signed edit log + read API; CC-BY-SA notice; trademark "Killinchu" filed.
- **DoD:** contributory edits are signed receipts, quality feeds API credits, corpus is forkable-with-attribution.

---

## Wave 2 — hardware/standards-gated (months 2–4, L effort)

### #3 Sovereign AI Passport
- **Effort:** M–L · **Deps:** license-class registry (ship the software passport in Wave 1.5), then chip-attestation chain from **#10's hardware**.
- **Sequencing:** Software passport (license + jurisdiction claims) can ship after #2/#1; the *chip* leg waits on #10. File the #3 provisional in parallel (Phase 4).
- **First milestone:** software passport receipt (license-clean + jurisdiction) verifiable offline.
- **DoD:** full triple-bind (model+data+chip) once #10 hardware lands.

### #10 PURIQ-Signed Provable Inference Cloud
- **Effort:** L · **Deps:** H100 + NVIDIA Confidential Computing procurement, TEE attestation chain, #3 passport, billing.
- **Sequencing:** Gate is **hardware procurement** — start the H100/CC sourcing now (long lead). Software (governance-bound receipt) is ready; the bind is the moat.
- **First milestone:** single H100-CC node emitting an attestation bound to a PURIQ receipt.
- **DoD:** "court-admissible inference" = attested AND gate-cleared AND license-clean, billable.

---

## Wave 3 — research-gated (months 3–6, XL effort)

### #6 Receipt-Federated Threat Intel
- **Effort:** XL · **Deps:** ZK proof system (Groth16/Halo2), federated aggregation, Killinchu in-toto/Sigstore path, Yuyay-13 schema gate.
- **Sequencing:** ZK-circuit engineering is multi-week; begin once #7 catalog provides the first federation participants. Academically crowded → our edge is the receipt-as-federation-unit (Phase 0).
- **First milestone:** two-party ZK-shared receipt with proven no-raw-leak + gate-cleared admission.
- **DoD:** N-party federation improves detection with zero data crossing a boundary, each contribution a gated signed receipt.

### #5 The Provable Mind
- **Effort:** XL · **Deps:** GPU training cluster, `yuyay-v3` dataset, LoRA/QLoRA recipe, crosscoder tooling, locked reference gate as eval.
- **Sequencing:** Last — most expensive, highest research risk (alignment elasticity, [arXiv 2406.06144](https://arxiv.org/abs/2406.06144)). Keep the external locked gate as ground truth regardless of outcome.
- **First milestone:** LoRA fine-tune of Llama 3.3 70B on `yuyay-v3`; crosscoder drift measured vs locked gate.
- **DoD:** in-weights head with a *verified* no-false-accept contract relative to the reference gate.

---

## Dependency graph (summary)

```
SHIPPED:  #4 Doctrine-as-Code OS ──> #9 Doctrine v∞        #8 Glass Hand-Off
                  │                                              │
Wave 1:   #2 Live Council    #1 Time Machine    #7 Adversary Catalog
                                                      │
Wave 2:   #3 Passport(software) ──> #10 Inference Cloud ──> #3 Passport(chip leg)
                                                      │
Wave 3:   #6 Receipt-Fed Threat Intel ──(participants from #7)    #5 Provable Mind
```

## Sequencing rationale (one line)
Ship the **reflexive-governance substrate** (#4/#9, done) → harvest the **M-effort software wins** that reuse it (#2/#1/#7) → unlock the **hardware product** (#10→#3 chip leg) → fund the **research bets** (#6/#5) once the substrate and revenue exist.

---
*Signed: Yachay — 2026-06-01. Every external claim carries a primary-source URL. Doctrine v11 LOCKED numbers preserved verbatim. No mysticism. Co-authored-by: Perplexity Computer Agent.*
