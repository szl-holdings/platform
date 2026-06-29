# State of SZL Holdings — Strategic Roadmap
**Date:** 2026-06-12 | **Classification:** Founder-Internal | **Version:** 1.0

---

## 1. Executive Snapshot

SZL Holdings enters mid-2026 with a narrow but genuine foundation: eight machine-checked theorems locked at a specific kernel commit, a self-hosted sovereign GPU brain running fully open-weight models on private infrastructure, and five vertical surfaces live on the public internet. The mathematical estate is deliberately small and honest — no inflation of the theorem count, no laundered conjectures — which is the precondition for everything built on top of it to be trustworthy. The two structurally important open problems (Λ-uniqueness and Khipu BFT) remain conjectures with active bounties or open formalization work. Supply-chain provenance sits at SLSA L1 today. The next phase is not about adding volume; it is about advancing along three high-leverage frontiers that compound the existing foundation into durable, verifiable competitive position.

---

## 2. What Is Locked and True

**Kernel commit:** `c7c0ba17` — 749 declarations, 14 unique axioms, 163 sorries (baseline frozen by founder decision).

**The 8 locked-proven formulas** (machine-checked, no inflation):

| Handle | Status |
|--------|--------|
| F1  | ✓ Theorem — sorry-free at locked commit |
| F4  | ✓ Theorem — sorry-free at locked commit |
| F7  | ✓ Theorem — sorry-free at locked commit |
| F11 | ✓ Theorem — sorry-free at locked commit |
| F12 | ✓ Theorem — sorry-free at locked commit |
| F18 | ✓ Theorem — sorry-free at locked commit |
| F19 | ✓ Theorem — sorry-free at locked commit |
| F22 | ✓ Theorem — sorry-free at locked commit |

This is exactly 8. No rounding. No implicit claims about adjacent formulas.

**Policy integrity keystone:** The DENY/P3 policy flip prohibition (`p3c_no_deny_to_allow_flip`) is proven in-Lean with 0 sorries and validated by Forge's authenticated test suite. This is not claimed on the basis of the unauthenticated probe alone.

**Lean frontier witnesses (lutar-lean):** Waves up to Wave24 are active. Wave17 multiclass Pinsker has landed. Theorem U existence half is merged at PR #235 — honestly labeled, partial. Putnam showcase proofs are sorry-free and Mathlib-free. The CelestialIRTriangle infrared-triangle discrete witness is kernel-checked and labeled **EXPERIMENTAL** — it does not claim physical correspondence.

**Sovereign brain:** Chaski runs Qwen2.5-Coder-32B via Ollama at Tailscale `100.125.77.31:11434`, self-hosted on founder-controlled GPU. Also live: Llama-3.1-8B, DeepSeek-Coder-V2. Probe verdict: `SOVEREIGN-GPU ONE-OF-ONE LIVE` (7/7 checks). All models are open-weight; no proprietary model API dependency for core reasoning.

**Live surfaces (all HTTP 200 as of 2026-06-12):**
- `a-11-oy.com` — Hetzner 167.233.50.75
- `killinchu` — szlholdings-killinchu.hf.space/elite (**effector: SIMULATED**)
- `yarqa` — live
- `anatomy` — szlholdings-anatomy.static.hf.space
- 5 verticals operational: legal, cyber, realestate, defense, finance

**Supply-chain provenance:** SLSA Level 1 — honest today.

---

## 3. What Is Open and Honest

**Conjecture 1 — Λ-uniqueness (F23, PURIQ formula):** Machine-checked **FALSE** as currently stated. This is a conjecture, never a theorem. An open founder-set monetary bounty exists at `szl-holdings/lambda-bounty`; the `verify-proof` CI is the sole arbiter; the `main` branch intentionally fails as the public "still open" signal. No internal claim, no marketing claim, supersedes this status until a sorry-free, axiom-allowlisted Lean proof passes CI.

**Conjecture 2 — Khipu BFT:** Open. Not formalized. Not claimed as proven in any context.

**SLSA L2 / L3 / FedRAMP / IronBank / CMMC:** These are roadmap targets. None are achieved. Claiming otherwise would be false.

**killinchu effector:** The autonomous action layer is **SIMULATED**. It does not execute real-world actions. Any product communication must reflect this.

**Open sorries (~28):** Most are doctrine-protected (F23, Khipu) or are genuinely hard multi-hour formalizations: Reed-Solomon MDS, xoshiro256 GF(2) injectivity (~20h estimated), Bekenstein bounds. VCG argmax baseline was a sorry that is now superseded sorry-free by Wave14. The sorry count is not a failure signal — it is an honest accounting of the boundary between the proven and the pending.

---

## 4. The Next 3 Highest-Leverage Frontiers

### Frontier A — Verified Frontier Witnesses: Quantum / Physics / Info-Theory

**What it is:** Extend the lutar-lean kernel-checked witness library into adjacent hard domains — specifically quantum circuit identities, information-theoretic inequalities (beyond Pinsker), and discrete physics witnesses — all Mathlib-free and sorry-free.

**Why it matters:** The existing Putnam showcase and CelestialIRTriangle establish that SZL can produce kernel-checked results that no general-purpose prover farm touches. Each new domain witness is a non-replicable proof-of-capability that compounds the estate's credibility and creates a moat that scales with formalization difficulty, not headcount.

**What "done" looks like (honestly):** Three new sorry-free, Mathlib-free, kernel-checked witnesses in distinct domains (e.g., a quantum gate identity, a Bekenstein-adjacent discrete bound, a Reed-Solomon MDS certificate). Each labeled EXPERIMENTAL where physical correspondence is not claimed.

**Owner:** Math PhD collaborators + founder direction. Forge handles CI integration and commit mechanics. Timeline: rolling, no fixed date until scope is locked with collaborators.

---

### Frontier B — Sovereign Live Embeddings + Open-Weight Multi-Model Routing

**What it is:** Stand up a self-hosted embedding pipeline (open-weight model, founder-controlled GPU) and a deterministic routing layer that dispatches queries across Qwen2.5-Coder-32B, Llama-3.1-8B, and DeepSeek-Coder-V2 based on declared capability profiles — no proprietary API in the critical path.

**Why it matters:** The Chaski brain is sovereign at the inference layer today, but retrieval-augmented workflows still depend on external embedding APIs for any semantic search path. Closing this gap completes the one-of-one sovereignty claim at the retrieval layer and removes the last external model dependency. Multi-model routing also enables cost/quality optimization and failure isolation: if one model degrades, the router fails over without a human in the loop.

**What "done" looks like (honestly):** A documented, self-hosted embedding model (e.g., nomic-embed-text or equivalent open-weight) running via Ollama on the existing GPU node; a router with a written capability manifest; at least one vertical (legal or finance) running end-to-end on the sovereign stack with no external model API call in the hot path. Probe coverage updated to include embedding endpoint health.

**Owner:** Forge (infrastructure, CI, Ollama config) + founder approval of model selections. No math PhD dependency.

---

### Frontier C — SLSA L1→L2 Provenance Groundwork + Khipu Receipt-Chain Hardening

**What it is:** Two parallel supply-chain integrity moves: (1) generate verifiable build provenance attestations (SLSA L2 requires a hosted, isolated build that produces a signed provenance document) for the primary deployables; (2) formalize the Khipu BFT receipt-chain structure enough to produce a Lean specification, even if the full BFT proof remains Conjecture 2.

**Why it matters:** FedRAMP and CMMC pathways both gate on supply-chain attestation. Getting to SLSA L2 is not just a compliance checkbox — it forces build reproducibility discipline that catches drift between what is claimed and what ships. Khipu hardening matters because the receipt chain is the trust anchor for multi-agent coordination; a Lean specification (short of a full BFT proof) already raises the bar substantially over informal protocol documentation and clarifies exactly where Conjecture 2 begins.

**What "done" looks like (honestly):** SLSA L2: signed provenance document produced by a hosted build (e.g., GitHub Actions OIDC + Sigstore) for at least one primary artifact, verified by `slsa-verifier`. Khipu: a Lean module with a sorry-annotated specification of the receipt-chain invariants, a written statement of exactly what Conjecture 2 claims, and a CI job that tracks sorry count in that module separately from the main kernel count. Neither step claims L3, FedRAMP, IronBank, or CMMC.

**Owner:** Forge (build pipeline, CI) + founder sign-off on attestation scope. Lean spec by founder or math collaborator.

---

## 5. What We Will Not Claim

**CRITICAL HONESTY DOCTRINE v11 — stated verbatim:**

- The locked-proven set is **exactly 8 formulas {F1, F4, F7, F11, F12, F18, F19, F22}** at kernel commit `c7c0ba17`. No other formula is claimed as a theorem.
- **Λ-uniqueness (F23) is Conjecture 1 — machine-checked FALSE as stated.** It is never a theorem until `verify-proof` CI passes on a sorry-free, axiom-allowlisted proof.
- **Khipu BFT is Conjecture 2 — open.** Not proven. Not claimed as proven.
- **SLSA L2, L3, FedRAMP, IronBank, CMMC are roadmap targets.** We are at L1 today. None of the higher levels are achieved.
- **killinchu effector is SIMULATED.** No real-world autonomous action is executed.
- **All models are open-weight and self-run.** No proprietary model API is claimed as part of the sovereign stack.

These are not aspirational guardrails. They are the floor. Any agent, any surface, any external communication must respect them without exception.

---

*Word count: ~1,180 | Path: `/home/user/workspace/evolve/STATE_OF_SZL_20260612.md`*
