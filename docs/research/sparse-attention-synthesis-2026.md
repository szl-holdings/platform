# Sparse-Attention Stack Synthesis & Integration Map — 2026

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** DOCTRINE-PASS · Fourth in the synthesis-ledger series, after `agi-stack-synthesis-2026.md`, `perception-bio-synthesis-2026.md`, and `electrodynamics-synthesis-2026.md`.
**Scope:** A deep audit of the 2025 sparse-attention / long-context research wave — MiniMax (M1 Lightning, M2 sparse-and-revert), DeepSeek NSA (ACL 2025 best paper), Moonshot MoBA, Tri Dao's FlashAttention lineage, and Songlin Yang's flash-linear-attention spine — re-expressed against our own ontology (AMI v2, Lutar Lambda, Ising/WebGPU solver, Ouroboros Λ-receipts, Doctrine V6, ROSIE governed-decision fabric, KS-18 contextuality witness). *No upstream source is copied; every idea is re-expressed against our own envelopes and receipt classes.*

---

## How to read this document

Per-entry contract (identical shape to the three prior syntheses):

1. **Thesis** — one paragraph, plain English.
2. **Core primitives** — 2–4 algorithmic / data-shape ideas worth re-expressing.
3. **Closest SZL module** — what already exists; whether we **extend** or **add a sibling**.
4. **Target artifact(s)** — where the re-expression lands.
5. **What we build** — concrete, file-level hooks the downstream extraction task can start cutting against.
6. **Doctrine V6 compliance** — pillar (Governed Autonomy / Evidence-First / Policy-Aware / Operational Ontology) and receipt class emitted on the critical path.

The cross-cutting **Warhacker × Sparse-Attention mapping table** and the **Doctrine V6 receipts ledger delta** at the end tie everything together.

---

## Audit method & capture dates

- **Primary sources, captured 2026-05-27.** MiniMax M2 SGLang-collaboration deconstruction ("No Free Lunch", LMSYS, 2025-11-04); MiniMax-M1 (arXiv 2506.13585, Lightning Attention); NSA (arXiv 2502.11089, Yuan/Gao/Dai/…/Liang, ACL 2025 best paper); MoBA (arXiv 2502.13189, Lu/Jiang/…/Su/Yang, Moonshot AI, Feb 2025); FlashAttention 1/2/3 (Tri Dao, Dao-AILab); flash-linear-attention (Songlin Yang, fla-org); plus the post-MoBA optimization line (arXiv 2511.11571) and the top-k sparse-attention total-variation theory line (arXiv 2512.07647).
- **Secondary sources.** Public GitHub orgs only: `MiniMax-AI/MiniMax-M2`, `MiniMax-AI/MiniMax-M1`, `MoonshotAI/MoBA`, `Dao-AILab/flash-attention`, `fla-org/flash-linear-attention`. No clones into this repo; no model weights mirrored.
- **The reveal that re-shapes the synthesis.** The MiniMax team's own November 2025 retrospective states they **reverted M2 to full attention** after Lightning Attention in M1, because the hybrid-sparse variant matched full attention on small-scale benchmarks but degraded measurably on **multi-hop reasoning at scale** and because the production inference stack is increasingly optimized for full attention. The lesson worth absorbing is therefore *not* "sparse is the answer" — it is "sparse without a contradiction detector and an escalation path is a benchmark trick that fails industrial validation." That lesson is structurally identical to ROSIE's deny-by-default + contradiction-probe + escalation discipline, which is why this synthesis lands cleanly in our ecosystem rather than as a foreign graft.

---

## Open follow-up clarifications

Items where intent is ambiguous enough that the dependent extraction task should pause and ask before porting:

- **Block size as a knob, not a constant.** NSA, MoBA, and the M2-style index/sparse diagram all use a fixed block size (typically 64 or 128 tokens). Our re-expression treats the block size as a *typed envelope parameter*, never a literal — the dependent extraction task should confirm per consumer whether to expose it as a per-tenant policy field or hardcode per artifact.
- **Index-branch dimensionality.** NSA's "coarse-grained token compression" and the M2 diagram's `Idx Q / Idx KV` projection both reduce to an inner dimension `d_idx ≤ d`. The re-expression keeps this as a hyperparameter on the envelope; the *value* is a downstream tuning concern, not a doctrine concern.
- **Sparse-vs-full escalation threshold.** The contradiction-probe (§7) escalates from sparse to full attention when the index branch and the sparse branch disagree by more than a configurable margin. Default margin is a placeholder; confirm with the consumer before binding.
- **GQA group fan-out.** The diagram fans 6 query heads into 2 KV groups (Idx Q1/Q2 share KV per group). Our re-expression keeps the fan-out as a typed parameter on the GQA envelope; do not hardcode 6/2.
- **Patent / publication posture.** NSA, MoBA, and Lightning Attention have published reference implementations under permissive licenses, but the *training-time hardware-aligned* code paths are organization-specific. The re-expression operates at the *algorithmic envelope* level — block-select, top-k, sparse-attend, receipt-on-commit — not at the CUDA-kernel level. We do not ship a kernel; we ship a receipt-emitting orchestrator that *can* be backed by any of these kernels.

---

## 1. MiniMax (M1 Lightning → M2 reverted-to-full) — the no-free-lunch teacher

**Thesis.** MiniMax's two-model arc is the most honest piece of evidence in the field: M1 shipped Lightning Attention (a linear-attention hybrid) and M2 explicitly reverted to full attention because the hybrid won on benchmarks but lost on long-horizon multi-hop reasoning at scale. The contribution worth re-expressing is **the empirical envelope** — *where sparse is safe and where it is not* — encoded as a typed policy guard, not a folk rule. This is exactly the shape of our existing Sentra Safety Gate (fail-closed admission) and ROSIE's contradiction detector. The re-expression here is `sparseAttentionEnvelope` — a typed claim of "the regime in which this sparse variant is permitted" — with mandatory escalation to full attention outside the envelope.

**Core primitives.**
1. **Sparse-regime envelope** — a typed (`maxBlocks`, `maxHopDepth`, `minIndexAgreement`, `tenantClass`) claim under which sparse attention is permitted; outside the envelope, the orchestrator MUST escalate to full attention.
2. **Contradiction probe** — a cheap consistency check between the index branch's top-k prediction and the sparse branch's actual attention distribution; disagreement above margin triggers escalation and emits a `sparse.contradiction.v1` receipt.
3. **Benchmark-vs-reality witness** — every sparse run records, alongside the prediction, a small set of held-out "trap" queries known to require multi-hop reasoning; failure on any trap demotes the regime and writes `sparse.regime.demoted.v1`.

**Closest SZL module.** Extend `@szl-holdings/payload` and `services/amaru` (already speaks contradiction-detector); add a sibling `packages/sparse-attention-kit` that owns the envelope + receipt types only (no kernel).

**Target artifact(s).** `artifacts/api-server` (the orchestrator); `artifacts/rosie` (the governed-decision surface that approves a sparse regime); `artifacts/sentra` (the fail-closed admission for cross-tenant sparse plans).

**What we build.**
- `packages/sparse-attention-kit/src/envelope.ts` — `SparseAttentionEnvelope` Zod schema with the four fields above.
- `packages/sparse-attention-kit/src/contradiction-probe.ts` — pure function that scores index/sparse disagreement.
- `artifacts/api-server` route: `POST /sparse-attention/regime/admit` — admits a sparse plan against the envelope; emits `sparse.regime.admitted.v1` or `sparse.regime.rejected.v1` on the critical path.
- `artifacts/api-server` route: `POST /sparse-attention/escalate` — records the escalation back to full attention; emits `sparse.escalated.v1` referencing the parent admission receipt.

**Doctrine V6 compliance.**
- **Pillar:** Policy-Aware Actions + Evidence-First.
- **Receipts:** `sparse.regime.admitted.v1`, `sparse.regime.rejected.v1`, `sparse.contradiction.v1`, `sparse.escalated.v1`, `sparse.regime.demoted.v1`. A sparse plan that has no admission receipt cannot execute; a contradiction without an escalation receipt is a doctrine violation.

---

## 2. DeepSeek NSA (Native Sparse Attention) — the hardware-aligned hierarchy

**Thesis.** NSA's contribution is the **dynamic hierarchical strategy**: coarse-grained token compression to preserve global awareness, layered with fine-grained token selection to preserve local precision, both natively trainable end-to-end rather than retrofitted onto a pretrained model. The shape worth re-expressing is *the two-level commitment*: a low-rank index decides what is even eligible for fine-grained attention, and the fine-grained step is what actually consumes the budget. This is structurally the Lutar-Lambda receipt pattern — a coarse claim (Λ floor) gates a fine claim (event-specific witness).

**Core primitives.**
1. **Coarse / fine two-level commit** — the index branch makes a typed `sparse.index.score.v1` claim that names eligible blocks; the sparse branch makes a typed `sparse.execute.v1` claim that names what was actually attended.
2. **Block-top-k as a budget primitive** — `k` is not a hyperparameter, it is a *budget*. Exhausting the budget without escalating is a Sentra fail-closed event (`sparse.budget.exhausted.v1`).
3. **Natively trainable, natively receipted** — the receipt chain is emitted not just at inference but during training-trace replay, so a model's sparse behavior is auditable end-to-end.

**Closest SZL module.** Extend `@szl-holdings/payload` (already carries the Λ-floor pattern); add `packages/sparse-attention-kit/src/two-level-commit.ts`.

**Target artifact(s).** `artifacts/api-server`, `artifacts/amaru` (the convergence runtime — sparse selection is naturally a Λ-bounded delta-replay).

**What we build.**
- `packages/sparse-attention-kit/src/two-level-commit.ts` — pure functions `scoreIndex(...)`, `topKCommit(...)`, `executeSparse(...)` that each emit the matching receipt type.
- `artifacts/api-server` route: `POST /sparse-attention/two-level` — runs the pair in sequence, refusing to execute the sparse step without a valid index receipt.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First + Operational Ontology.
- **Receipts:** `sparse.index.score.v1`, `sparse.topk.commit.v1`, `sparse.execute.v1`, `sparse.budget.exhausted.v1`. The sparse step is rejected at receipt-write if its parent `sparse.topk.commit.v1` is missing or older than the freshness nonce.

---

## 3. Moonshot MoBA (Mixture of Block Attention) — the MoE-of-attention shape

**Thesis.** MoBA's contribution is applying the **Mixture-of-Experts gating** discipline to *attention itself* rather than to FFN layers — let the model learn where to attend rather than imposing a sink/window/stride prior, and ship a runtime that can switch between sparse and full attention seamlessly. The shape worth re-expressing is the **less-structure principle**: do not bake a predefined sparsity pattern; record the pattern the model actually used and treat that record as the artifact under audit. Our analogue is ROSIE's "witnesses are not predicates, they are records" stance — we do not pre-commit a sparsity shape; we record the shape and validate it after the fact.

**Core primitives.**
1. **Gated block router** — a per-query block-selection function whose output (which blocks it gated to) is the receipt, not its parameters.
2. **Seamless sparse↔full switch** — the same orchestrator path can run either mode; the choice is policy, not architecture.
3. **Recorded-not-prescribed sparsity** — the sparsity *pattern* is an artifact of the run, signed and chained, so the question "what did this run actually attend to?" has a single-source answer.

**Closest SZL module.** Extend `artifacts/rosie` (the witness-record discipline) and `packages/sparse-attention-kit` (the orchestrator).

**Target artifact(s).** `artifacts/rosie` (the governance surface that approves a router); `artifacts/api-server` (the runtime).

**What we build.**
- `packages/sparse-attention-kit/src/recorded-router.ts` — a thin wrapper around any block-selection function that captures (router-id, query-id, blocks-selected, score-distribution, freshness-nonce) into a `sparse.router.trace.v1` receipt.
- `artifacts/rosie/src/components/SparseRouterCard.tsx` — a lightweight read-only card that renders a router's recent trace receipts so operators can see *what the router has actually been routing to*, not what it was claimed to route to.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy + Evidence-First.
- **Receipt:** `sparse.router.trace.v1` — fields: `routerRef`, `queryId`, `blocksSelected[]`, `scoreDistribution`, `freshnessNonce`, `parentRegimeRef`. A router whose recent traces violate its declared envelope is auto-demoted.

---

## 4. Tri Dao / Dao-AILab — FlashAttention as the IO-aware substrate

**Thesis.** FlashAttention's contribution is *not* a sparsity pattern; it is the **IO-aware kernel discipline** — every attention computation is bounded by HBM bandwidth, not FLOPs, and the win is in fusing/tiling so that intermediate matrices never round-trip to HBM. The shape worth re-expressing is **the bandwidth-as-budget claim**: every receipt that names an attention compute MUST also name its IO budget and consumed bandwidth, so a sparse plan that *saves FLOPs but inflates IO* is detectable at the receipt-ledger level. This is the same discipline our existing Ising/WebGPU solver uses (wall-clock-as-budget); we re-express it here for attention.

**Core primitives.**
1. **IO-budget envelope** — every sparse/full attention receipt names an `ioBudgetBytes` claim and a `ioConsumedBytes` measurement.
2. **Fused-or-rejected** — a sparse plan whose IO measurement exceeds a known full-attention IO floor is rejected as "non-fused-equivalent" and the plan is demoted.
3. **Hardware-independent envelope, hardware-recorded measurement** — the envelope is platform-agnostic; the measurement names the device class so cross-device receipts are comparable.

**Closest SZL module.** Sibling kit only — `packages/sparse-attention-kit/src/io-budget.ts`. Not a substitute for FlashAttention itself; we do not ship a kernel.

**Target artifact(s).** `artifacts/api-server` (records the measurement); `artifacts/sentra` (fails-closed on non-fused-equivalent plans).

**What we build.**
- `packages/sparse-attention-kit/src/io-budget.ts` — the envelope + measurement types.
- `artifacts/api-server` middleware that captures wall-clock + bytes-read into every `sparse.execute.v1` receipt.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First + Operational Ontology.
- **Receipt extension:** `sparse.execute.v1.ioBudget` (sub-field) — without it, the receipt is malformed and rejected at write.

---

## 5. Songlin Yang / fla-org — the linear-attention dual

**Thesis.** Songlin Yang's flash-linear-attention spine (Gated Linear Attention, RWKV variants, Mamba-style state-space hybrids) is the **algebraic dual** of block-sparse attention: instead of selecting a sub-quadratic *subset* of pairs, replace the softmax with a recurrence whose state is bounded. The contribution worth re-expressing is **the dual-mode admission**: at any given step, a query can be served by either the sparse-attention path or the linear-attention path, and the choice is a typed claim with a receipt, not a hardcoded branch. This generalizes MoBA's seamless-switch lesson into a three-way admission (full / sparse-blocks / linear-recurrence).

**Core primitives.**
1. **Three-mode admission** — `full | sparse-blocks | linear-recurrence`, each with its own envelope and its own receipt class.
2. **State-bound claim** — linear-mode receipts MUST name the bounded state size as part of the claim; a state that grew beyond the bound is a doctrine violation.
3. **Mode-handover witness** — switching modes mid-conversation requires a `sparse.mode.handover.v1` receipt that names the pre- and post-mode envelopes and a contradiction-probe score across the boundary.

**Closest SZL module.** Sibling `packages/sparse-attention-kit/src/linear-mode.ts`; extends the envelope from §1.

**Target artifact(s).** `artifacts/api-server` (the admission router); `artifacts/rosie` (the mode-handover approval surface).

**What we build.**
- `packages/sparse-attention-kit/src/linear-mode.ts` — the linear-mode envelope and the three-way admission function.
- `artifacts/api-server` route: `POST /sparse-attention/mode-handover` — emits `sparse.mode.handover.v1` with contradiction-probe score.

**Doctrine V6 compliance.**
- **Pillar:** Policy-Aware Actions + Governed Autonomy.
- **Receipts:** `sparse.mode.linear.v1`, `sparse.mode.handover.v1`.

---

## 6. Cross-cutting: the SZL differentiator

Every paper in this synthesis treats sparse attention as a **stateless block-selection problem**. The SZL contribution — the thing we own that nobody else in this lineage owns — is that **every sparse decision becomes a witnessed governed decision**:

- An admitted sparse regime is a `sparse.regime.admitted.v1` receipt under a `SparseAttentionEnvelope`.
- A top-k commit is a `sparse.topk.commit.v1` receipt with the score distribution and budget.
- An executed sparse attend is a `sparse.execute.v1` receipt with the IO measurement.
- A router's recent behavior is a `sparse.router.trace.v1` receipt set, queryable in ROSIE.
- A disagreement between index and sparse branches is a `sparse.contradiction.v1` receipt that escalates to full attention and emits `sparse.escalated.v1`.
- A mode handover (full ↔ sparse ↔ linear) is a `sparse.mode.handover.v1` receipt with a contradiction-probe score across the boundary.

This is the same hash-chained receipt discipline already in place for Ouroboros (Λ-receipts), Vessels (voyage receipts), Sentra (admission receipts), A11oy (attestation sidecar), and Rosie (witness receipts). Sparse attention is not a new genre of compute — it is a new *citizen* in the existing receipt ecosystem.

---

## 7. Warhacker × Sparse-Attention mapping

| Bundle | Sparse-attention primitive bound to it | Receipt class emitted on critical path | What it lets the bundle do that it could not before |
|---|---|---|---|
| **a11oy.UDS** | Sparse routing over palette / token-context space — only run KS-18 contextuality probe on top-k brand contexts that survive the index gate | `sparse.regime.admitted.v1` + `attestation.sealed.v1` (parent chain) | Bound brand-compute spend per impression while keeping the contextuality witness mandatory on the survivors |
| **sentra.UDS** | Sparse threat-block selection — exact CSF 2.0 / D3FEND check runs only on top-k risk-scored attack paths; rest fail-closed | `sparse.budget.exhausted.v1` (escalates to full check, never silently skips) | Triage at million-event scale without the silent-skip failure mode that breaks the Safety Gate |
| **amaru.UDS** | Sparse delta-replay — only replay blocks where KL divergence > Λ floor; the rest are receipted as "Λ-skipped" not "skipped" | `sparse.topk.commit.v1` + `convergence.proof.v1` (parent chain) | Million-document sync with the same convergence proof as full replay, at a fraction of the bandwidth |
| **rosie.UDS** | Sparse witness-binding — fire witnesses on top-k governed decisions, emit `denied.no-witness.v1` for all rejects | `sparse.router.trace.v1` + `decision.witnessed.v1` (parent chain) | Govern decisions at million-per-day without the "we sampled, so we didn't witness" gap |
| **vessels.UDS** | Sparse AIS-window attention — CPA + collision-cone computed over top-k vessel-pair blocks; sanctions screen runs full on the survivors | `sparse.execute.v1` + `voyage.assertion.v1` (parent chain) | Million-vessel basin coverage without dropping the AIS-gap Λ floor or the sanctions screen |

The pattern is identical across all five: **sparse where it is safe, full where it is not, contradiction-probe at the boundary, receipt on every commit.**

---

## 8. Doctrine V6 receipts ledger — delta from this synthesis

| Receipt class | Pillar | Emitted by | Required parent |
|---|---|---|---|
| `sparse.regime.admitted.v1` | Policy-Aware | `POST /sparse-attention/regime/admit` | none (regime is root) |
| `sparse.regime.rejected.v1` | Policy-Aware | `POST /sparse-attention/regime/admit` | none |
| `sparse.index.score.v1` | Evidence-First | index-branch step | `sparse.regime.admitted.v1` |
| `sparse.topk.commit.v1` | Evidence-First | top-k commit step | `sparse.index.score.v1` |
| `sparse.execute.v1` | Evidence-First | sparse-attend step | `sparse.topk.commit.v1` |
| `sparse.budget.exhausted.v1` | Policy-Aware | top-k commit step | `sparse.regime.admitted.v1` |
| `sparse.contradiction.v1` | Governed Autonomy | contradiction probe | `sparse.execute.v1` |
| `sparse.escalated.v1` | Governed Autonomy | escalation step | `sparse.contradiction.v1` |
| `sparse.regime.demoted.v1` | Governed Autonomy | trap-query failure | `sparse.regime.admitted.v1` |
| `sparse.router.trace.v1` | Evidence-First | recorded-router wrapper | `sparse.regime.admitted.v1` |
| `sparse.mode.handover.v1` | Policy-Aware | mode router | `sparse.regime.admitted.v1` × 2 (pre + post) |
| `sparse.mode.linear.v1` | Operational Ontology | linear-mode step | `sparse.regime.admitted.v1` |

Twelve new receipt classes. Every one of them is auditable from ROSIE's existing decision-fabric surface; none of them require a kernel-level change in any artifact's runtime — they ride on top of whatever attention implementation the artifact already uses (full, FlashAttention, NSA-style, MoBA-style, or linear).

---

## 9. The lesson worth burning into doctrine

The MiniMax M2 retrospective is the most valuable single piece of evidence in this synthesis: **a benchmark win on sparse attention is not a production win on sparse attention**, and the gap is multi-hop reasoning at scale. The corollary for our ecosystem is precise: *we may absorb every sparse-attention primitive in this synthesis, but the contradiction probe (§1 / §7) is non-negotiable.* A sparse plan without a contradiction probe is a benchmark trick; a sparse plan with a contradiction probe and a fail-up-to-full-compute escalation path is a governed decision. The receipt classes above enforce the latter at the ledger level — *no escape valve, no quiet downgrade.*

This is the same discipline that makes Sentra fail-closed, Amaru convergent, Vessels CPA-bound, A11oy contextuality-witnessed, and Rosie deny-by-default. Sparse attention joins the family on the same terms.

---

## 10. Downstream extraction tasks

The dependent extraction task should land, in order:

1. `packages/sparse-attention-kit` with the envelope, two-level-commit, recorded-router, IO-budget, and linear-mode primitives — schema + pure functions only, no kernel.
2. `artifacts/api-server` route surface for regime admission, two-level commit, mode handover, and escalation — each emitting the matching receipt class.
3. `artifacts/rosie` read-only cards: `SparseRegimeCard`, `SparseRouterCard`, `SparseContradictionLedger` — so the operator can see what sparse plans have been admitted, what they actually routed to, and what escalated.
4. Doctrine v6 scanner — extend `scripts/check-doctrine-v6.mjs` exempt-list to include this synthesis doc's reference to upstream names (MiniMax / DeepSeek / Moonshot / Tri Dao / Songlin Yang are research-citations, not brand-drift).
5. `scripts/release/uds-version-sync.json` — once the kit lands, add the receipt-class catalogue under each bundle's `doctrine` field so the LinkedIn / pull-guide narrative can name "sparse-attention receipted compute" as a series-A claim.

No artifact is rewritten; every artifact gains a sparse-attention layer that is governed by the same receipt discipline already in production.
