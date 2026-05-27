# MeMo Reflection-Memory Stack Synthesis & Integration Map — 2026

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** DOCTRINE-PASS · Fifth in the synthesis-ledger series, after `agi-stack-synthesis-2026.md`, `perception-bio-synthesis-2026.md`, `electrodynamics-synthesis-2026.md`, and `sparse-attention-synthesis-2026.md`.
**Scope:** A deep audit of *MeMo: Memory as a Model* (Quek, Lee, Leong, Verma, Prakash, Chen, Low, Rus, Solar-Lezama — NUS · A\*STAR · UTokyo · Liquid AI · MIT CSAIL · AI Singapore · SMART; arXiv 2605.15156, v1 14 May 2026, v2 20 May 2026, CC-BY 4.0), re-expressed against our own ontology (AMI v2, Λ-receipts, Doctrine V6, ROSIE governed-decision fabric, A11oy UDS, KS-18 contextuality witness, Sentra fail-closed admission, perception-loop privacy invariant, sparse-attention-kit contradiction-probe). *No upstream source is copied; every idea is re-expressed against our own envelopes and receipt classes.*

---

## How to read this document

Per-entry contract (identical shape to the four prior syntheses):

1. **Thesis** — one paragraph, plain English.
2. **Core primitives** — 2–4 algorithmic / data-shape ideas worth re-expressing.
3. **Closest SZL module** — what already exists; whether we **extend** or **add a sibling**.
4. **Target artifact(s)** — where the re-expression lands.
5. **What we build** — concrete, file-level hooks the downstream extraction task can start cutting against.
6. **Doctrine V6 compliance** — pillar (Governed Autonomy / Evidence-First / Policy-Aware / Operational Ontology) and receipt class emitted on the critical path.

The cross-cutting **Warhacker × MeMo mapping table** and the **Doctrine V6 receipts ledger delta** at the end tie everything together.

---

## Audit method & capture dates

- **Primary source, captured 2026-05-27.** *MeMo: Memory as a Model* — arXiv 2605.15156 (v1 14 May 2026, v2 20 May 2026), CC-BY 4.0. Submitting author: Arun Verma (SMART, MIT). Equal contributions: Lee, Leong, Verma; corresponding author: Verma. Affiliations span NUS Institute of Data Science, NUSGS Integrative Sciences and Engineering, A\*STAR, NUS Computer Science, University of Tokyo, Liquid AI, MIT CSAIL, AI Singapore, and Singapore-MIT Alliance for Research and Technology (SMART).
- **Secondary lineage, all captured 2026-05-27.** HippoRAG2 (Gutierrez et al., 2025, the named SOTA baseline MeMo beats); Cartridges (Eyuboglu et al., 2025, the closest parametric-memory baseline); Memory Decoder (Cao et al., 2025, white-box variant explicitly excluded as not directly comparable); Multi-Agent Reflexion (MAR, Dec 2025); Reflective Memory Management (RMM, ACL 2025). No upstream code is cloned into this repo; the re-expression operates at the *algorithmic envelope* level (frozen-Generator → reflection-corpus → trained-Memory → frozen-Executive-with-three-stage-protocol), not at the model-weights level.
- **The reveal that re-shapes the synthesis.** MeMo's contribution is not "another RAG variant." It is the observation that *the interface between a frozen corpus and a frozen LLM does not have to be retrieval at all* — it can be a **trained intermediary model whose entire training signal is a reflection QA dataset synthesized by a third frozen LLM**, with the inference-time orchestrator constrained to a **structured three-stage protocol** (Grounding → Entity Identification → Answer Seeking & Synthesis) whose individual stage budgets are typed. The lesson worth absorbing is therefore *not* "fine-tune your way out of RAG" — it is "the orchestration protocol between executive and memory is the artifact worth standardising, and every step in both the synthesis pipeline and the inference protocol deserves a content-addressed receipt." That lesson is structurally identical to ROSIE's deny-by-default + staged-evidence + chain-of-custody discipline and to Putnam-harness's just-shipped content-addressed receipt chain, which is why this synthesis lands cleanly in our ecosystem rather than as a foreign graft.

---

## Open follow-up clarifications

Items where intent is ambiguous enough that the dependent extraction task should pause and ask before porting:

- **Generator / Memory weights posture.** MeMo trains the Memory model from Qwen2.5-14B-Instruct using Qwen2.5-32B-Instruct as the Generator, both Apache-2.0. We do not mirror weights; the re-expression operates at the envelope level (the *promise* a reflection QA dataset must satisfy, the *promise* a Memory model must satisfy at sub-query time), so a downstream consumer may bind any open-weights model that satisfies the envelope.
- **Reflection-class taxonomy.** The paper names five training-time transforms — fact extraction, consolidation, verification, entity surfacing, cross-document synthesis. The re-expression promotes each to a typed reflection class with its own content-addressed receipt, and adds a sixth — **provenance** — that records the SHA-256 of the source-corpus span each reflection derives from. Provenance is non-negotiable because the perception-loop privacy invariant requires that no raw corpus byte ever leaves the reflection pipeline; the only thing the Memory model is ever exposed to is the compact reflection snippet plus its provenance hash, never the underlying chunk.
- **Stage budgets.** MeMo gives each of the three inference stages "distinct prompts, sampling temperatures and independent budgets." The re-expression treats those budgets as typed policy on the executive-protocol envelope; defaults are placeholders, confirm with the consumer before binding.
- **Black-box vs white-box parity.** MeMo's explicit boast is that the Executive model is treated as a black box (no weights, no logits) — which is exactly what our `setupReplitAIIntegrations` proxy gives us for closed-source models. We retain that posture; any future white-box optimisation (KV-cache pre-loading à la Cartridges) is gated by a separate admission policy.

---

## 1. Reflection QA dataset synthesis — the data-side primitive

**Thesis.** MeMo's data side rests on a single principle: a target corpus is transformed, by a *frozen* Generator model, into a reflection QA dataset that requires no knowledge of future queries yet naturally serves as the precise interface through which any query can access the underlying corpus. That principle is what we already do in `services/amaru` (staged-evidence over a corpus) and in `packages/sequence-pipeline` (staged transforms over an input stream) — but neither presently emits a content-addressed receipt at *each* transform stage. The re-expression closes that gap: every reflection class (fact, consolidation, verification, entity-surface, cross-doc, provenance) is its own typed receipt, content-addressed via `sha256(canonicalJson(body)).slice(0,16)`, with `parentRef` chaining the transform stages. Mutate any field — including the provenance span hash — and every downstream Memory-training receipt breaks.

**Core primitives.**
1. **Reflection envelope** — a typed (`reflectionClass`, `corpusRef`, `spanHash`, `generatorModel`, `temperature`, `tokensIn`, `tokensOut`, `wallMs`) claim describing one frozen-Generator transform. The corpus is named by hash, not by URL; the *span* is named by hash, never by raw bytes.
2. **Reflection-class taxonomy** — `fact-extract`, `consolidate`, `verify`, `entity-surface`, `cross-doc-synth`, **plus** the additional `provenance` class we introduce to enforce the perception-loop privacy invariant.
3. **Reflection chain head** — sha256 over the canonical-JSON of the reflection-corpus manifest (the ordered list of `(reflectionRef, classHash)` pairs). One number summarises a complete training-corpus state.

**Closest SZL module.** Extend `services/amaru` (staged-evidence) and `packages/sequence-pipeline` (staged transforms); add a sibling `packages/memo-reflection-kit` that owns the envelope + receipt types + chain-head computation (no model weights, no Generator binding — the kit is dependency-free).

**Target artifact(s).** `artifacts/api-server` (the reflection-pipeline orchestrator and the read-side surface); `artifacts/a11oy` (consumes a Memory-model handle as a downstream UDS resource).

**What we build.**
- `packages/memo-reflection-kit/src/reflection.ts` — `ReflectionEnvelope`, `ReflectionClass`, `ReflectionCorpusManifest` typed shapes.
- `packages/memo-reflection-kit/src/receipts.ts` — `memo.reflection.v1`, `memo.verification.v1`, `memo.corpus.manifest.v1`.
- `artifacts/api-server` route: `GET /api/memo/corpus/manifest` — returns the latest reflection-corpus manifest with its chain head, content-addressed.

**Doctrine V6 compliance.** Pillar: **Evidence-First**. Receipt on the critical path: `memo.reflection.v1` (one per transform) and `memo.corpus.manifest.v1` (the per-corpus rollup).

---

## 2. Executive three-stage protocol — the inference-side primitive

**Thesis.** MeMo's inference side is what makes the parametric-memory idea *legible*. A frozen Executive model is forbidden from emitting a final answer in a single turn; it must walk three named stages — Grounding (atomic clue-probing sub-queries), Entity Identification (iterative narrowing to a single entity or graceful skip), Answer Seeking & Synthesis (entity-conditioned follow-ups, then final synthesis) — each with its own prompt, temperature, and budget. The re-expression promotes the protocol to a typed orchestrator that emits a receipt at *every* turn, with `parentRef` chaining sub-queries back to the user query and Stage 2 sub-queries back to the Stage 1 grounding context. The orchestrator never accepts a final answer whose chain does not terminate at the user-query hash. This is structurally identical to ROSIE's staged-evidence walk over a decision; it is *literally* a special case of it.

**Core primitives.**
1. **Executive-protocol envelope** — a typed (`executiveModel`, `memoryModelRef`, `stage1Budget`, `stage2Budget`, `stage3Budget`, `stage1Temperature`, `stage2Temperature`, `stage3Temperature`, `userQueryHash`) claim per run.
2. **Per-stage receipts** — `memo.grounding.v1` (Stage 1: K sub-queries → K independent grounding responses), `memo.entity.identification.v1` (Stage 2: convergence trace, with a `converged` boolean and an `e_star` or `null`), `memo.answer.synthesis.v1` (Stage 3: entity-conditioned follow-ups + final synthesis, or Stage-1-only fallback when Stage 2 did not converge).
3. **Run-rollup receipt** — `memo.executive.run.v1` ties the user query hash to the executive envelope and to the ordered list of per-stage receipts; its chain head is the audit surface for the entire run.

**Closest SZL module.** Extend `services/rosie` (governed-decision fabric — the executive-protocol envelope *is* a decision plan); add to `packages/memo-reflection-kit` the executive-protocol orchestrator types (no LLM client — the kit is dependency-free; the api-server binds Anthropic via `setupReplitAIIntegrations`).

**Target artifact(s).** `artifacts/api-server` (the orchestrator); `artifacts/rosie` (the governed-decision surface that admits an executive-protocol envelope under a policy); `artifacts/a11oy` (executes the protocol against a UDS-attested Memory handle).

**What we build.**
- `packages/memo-reflection-kit/src/executive-protocol.ts` — `ExecutiveProtocolEnvelope`, `Stage1GroundingResult`, `Stage2EntityIdResult`, `Stage3SynthesisResult` typed shapes; pure `composeRunRollup(envelope, stage1, stage2, stage3) → MemoExecutiveRunReceipt`.
- `artifacts/api-server` routes: `POST /api/memo/executive/admit` (admits an envelope under policy, emits `memo.executive.admitted.v1` or `memo.executive.rejected.v1`), `GET /api/memo/executive/run/:runId` (returns the chain-head + per-stage receipts).

**Doctrine V6 compliance.** Pillar: **Governed Autonomy**. Receipt on the critical path: `memo.executive.admitted.v1` (admission), `memo.executive.run.v1` (rollup).

---

## 3. Sub-query contradiction probe — the cross-cutting safety primitive (our addition, not MeMo's)

**Thesis.** MeMo does not penalise the case where Stage 2's narrowed entity `e_star` is *inconsistent* with the Stage 1 grounding responses. The paper acknowledges this implicitly by allowing Stage 3 to be skipped when no candidate converges, but it has no mechanism to detect a Stage 2 that *did* converge on the *wrong* entity given the Stage 1 evidence. We borrow the **contradiction probe** discipline from `packages/sparse-attention-kit` and apply it here: a cheap consistency check between Stage 1's grounding-response keyset and Stage 2's entity-supporting-fact keyset. Disagreement above a typed margin triggers an escalation receipt — the orchestrator MUST either re-run Stage 2 with a longer budget or fall back to Stage-1-only synthesis. The escalation is *receipted*, not silent.

**Core primitives.**
1. **Contradiction-margin envelope** — `(minStage1Stage2Jaccard, escalationBudgetTokens)` typed thresholds carried on the executive-protocol envelope.
2. **Contradiction probe** — pure function `probeStage2Contradiction(stage1: Stage1GroundingResult, stage2: Stage2EntityIdResult): { agreement: number; violated: boolean }`.
3. **Escalation receipt** — `memo.contradiction.v1` (the probe outcome) and `memo.escalated.v1` (the orchestrator's response: re-run-stage-2 or fall-back-to-grounding-only). One of the two is mandatory whenever `violated:true`.

**Closest SZL module.** Sibling import: `@szl-holdings/sparse-attention-kit/contradiction-probe` (re-exports its pure-function shape; we wrap with MeMo-typed inputs).

**Doctrine V6 compliance.** Pillar: **Policy-Aware**. Receipt on the critical path: `memo.contradiction.v1` and `memo.escalated.v1`.

---

## 4. Provenance & privacy invariant — the perception-loop tie-in

**Thesis.** The MeMo paper is silent on what the Memory model is allowed to *remember* about its training corpus. In our stack that silence is unacceptable: the perception-loop privacy invariant (`a11oy-perception-reviewer-wiring.md` in memory) requires that raw frame bytes never appear in the envelope, only feature-vector summaries. We extend that invariant to the reflection pipeline: no `memo.reflection.v1` receipt may contain a raw corpus byte. The receipt carries the *span hash* (sha256 of the source span) and the *reflection snippet* (the Generator's output), never the original chunk. A serialisation test enforces this — the test re-loads every receipt and asserts that none of the original corpus chunks (by substring match on a held-out canary chunk) appear in any receipt body. This is exactly the test we already have for the perception-loop envelope.

**Core primitives.**
1. **Span-hash, never span-bytes** — `ReflectionEnvelope.spanHash` is the only reference to the source; the source itself never enters the receipt.
2. **Canary-substring test** — a vitest that registers a known-string canary in the corpus and asserts the canary never appears in any reflection receipt body.

**Closest SZL module.** Mirrors `a11oy-perception-reviewer-wiring.md` test discipline; no new module — a test in `packages/memo-reflection-kit/src/__tests__/`.

**Doctrine V6 compliance.** Pillar: **Evidence-First**. Receipt on the critical path: `memo.reflection.v1` (the span-hash field is mandatory and tested).

---

## 5. KS-18 contextuality tie-in — the parity witness for grounding sub-queries

**Thesis.** Our KS-18 contextuality witness (`ks18-contextuality-witness.md`) encodes a parity argument: 9 contexts × each vector appearing in exactly 2 contexts ⇒ Σ contexts = 2 · Σ vectors ⇒ Σ vectors = 4.5 ∉ ℤ, an impossibility witness. The MeMo Stage 1 grounding step is structurally analogous: if the Executive issues K atomic sub-queries and the rule "each surfaced fact must appear in exactly 2 sub-queries' grounding responses" is enforced, the same parity arithmetic gives an impossibility witness when K is odd and the surfaced-fact count is also odd. We do not *require* this — MeMo runs without it — but exposing the parity rule as an *optional* grounding-coverage check turns the Stage 1 envelope into a contextuality witness for under-grounded runs. When the parity is violated, the orchestrator emits a `memo.grounding.parity.violated.v1` receipt and may either reject the run or proceed with a recorded uncertainty flag.

**Core primitives.**
1. **Grounding-coverage rule** — optional typed flag `requireParityCoverage: boolean` on the executive-protocol envelope.
2. **Parity check** — pure function `checkGroundingParity(stage1: Stage1GroundingResult): { satisfied: boolean; surfacedFactCount: number; subQueryCount: number; explanation: string }`.

**Closest SZL module.** Reuses the parity witness shape from `@a11oy/core` (KS-18); no new module — a thin function in `packages/memo-reflection-kit/src/executive-protocol.ts`.

**Doctrine V6 compliance.** Pillar: **Operational Ontology**. Receipt on the critical path: `memo.grounding.parity.violated.v1` (only emitted on violation; absence means satisfied or unchecked).

---

## Warhacker × MeMo mapping table

The Warhacker bundle is our internal mapping from "doctrine pillar" to "concrete capability shipping under that pillar." MeMo's contributions fan out as follows:

| Warhacker bundle | Doctrine pillar | MeMo contribution absorbed | Receipt class emitted | Lands in |
| --- | --- | --- | --- | --- |
| Evidence-Ledger | Evidence-First | Reflection-corpus content-addressing | `memo.reflection.v1`, `memo.corpus.manifest.v1` | `packages/memo-reflection-kit`, `services/amaru` |
| Decision-Plan | Governed Autonomy | Three-stage executive protocol as a governed plan | `memo.executive.admitted.v1`, `memo.executive.run.v1` | `services/rosie`, `artifacts/api-server` |
| Safety-Gate | Policy-Aware | Stage-2 contradiction probe + escalation | `memo.contradiction.v1`, `memo.escalated.v1` | `artifacts/api-server`, `artifacts/sentra` |
| Provenance-Loop | Evidence-First | Span-hash-only reflection bodies + canary test | `memo.reflection.v1` (with `spanHash` non-null) | `packages/memo-reflection-kit` |
| Contextuality-Witness | Operational Ontology | Optional parity check on grounding coverage | `memo.grounding.parity.violated.v1` | `packages/memo-reflection-kit`, `artifacts/a11oy` |
| Verification-Closure | Evidence-First | Persisted verification-step outcome (rejected reflections recorded, not silently dropped) | `memo.verification.v1` | `packages/memo-reflection-kit` |

---

## Doctrine V6 receipts ledger delta

The synthesis adds **eight** new receipt classes to the platform-wide ledger. All are content-addressed via `sha256(canonicalJson(body)).slice(0,16)` (same discipline as the Putnam harness):

1. `memo.reflection.v1` — one frozen-Generator transform, carrying `reflectionClass`, `corpusRef`, `spanHash`, model + token + wall metadata, and the reflection snippet. Span bytes never appear.
2. `memo.verification.v1` — the verification-step outcome (`accepted`, `rejected-contradiction`, `rejected-unsupported`, `rejected-out-of-scope`), with the rejected-reflection list persisted. No silent drops.
3. `memo.corpus.manifest.v1` — the per-corpus rollup; chain head over an ordered list of `(reflectionRef, classHash)` pairs.
4. `memo.executive.admitted.v1` / `memo.executive.rejected.v1` — admission outcome for an executive-protocol envelope under a policy.
5. `memo.grounding.v1` — Stage 1 outcome: K sub-queries, K grounding responses, K span-hash citations.
6. `memo.entity.identification.v1` — Stage 2 outcome: convergence trace, `e_star` or `null`, iteration count vs budget.
7. `memo.answer.synthesis.v1` — Stage 3 outcome: entity-conditioned follow-ups, final answer, total tokens.
8. `memo.executive.run.v1` — run rollup: user-query hash + envelope ref + ordered list of per-stage receipt refs. Chain head is the audit surface for the run.

Plus four contradiction / parity classes:

9. `memo.contradiction.v1` — Stage 1 ↔ Stage 2 disagreement above margin.
10. `memo.escalated.v1` — the orchestrator's receipted response to a contradiction (re-run with longer budget, or grounding-only fallback).
11. `memo.grounding.parity.violated.v1` — KS-18-style parity violation on grounding coverage (only when the optional check is enabled).
12. `memo.budget.exhausted.v1` — any of the three stage budgets hit zero before its termination condition.

These twelve, taken together, mean a MeMo-style executive run produces a fully audit-walkable receipt chain from user query to final answer, with no silent drops and no hallucinated provenance.

---

## What we do *not* take

Naming these explicitly avoids the temptation to drift later:

- **Generator / Memory weights themselves.** We do not mirror Qwen2.5-32B or Qwen2.5-14B; consumers bind whichever open-weights model satisfies the envelope.
- **White-box Memory-Decoder-style optimisation.** MeMo's plug-and-play property is the feature; abandoning it for KV-cache pre-loading would break the entire posture and is explicitly excluded.
- **The specific data-synthesis prompts.** The paper publishes them in supplementary materials; we do not vendor them. The reflection-class taxonomy is what we adopt; the prompt strings are a downstream consumer concern.
- **Continual learning of the Memory model.** Out of scope for this synthesis; the kit treats the Memory model as a *handle* whose version is a hash, not a process.

---

## Provenance & honesty notes

- The paper is CC-BY 4.0. Every claim above attributes to the paper or to our own ontology by name.
- We do not claim MeMo numbers as our own. The synthesis adopts the *shape* of MeMo's pipeline and re-expresses it against our receipt-chain discipline. Any benchmark numbers will be produced by a separate harness, content-addressed under our existing rules.
- The contradiction probe (§3), the provenance invariant (§4), the KS-18 parity witness (§5), the eight + four receipt classes, and the explicit black-box-only posture are **our additions** beyond MeMo. They are not in the paper; they are how MeMo lands inside our doctrine.
