---
name: MeMo reflection-memory absorption — what we kept, what we added
description: How the MeMo (arXiv 2605.15156) reflection-pipeline + three-stage executive protocol absorb into SZL doctrine — what crosses the membrane, what does not, and the three additions we made on top.
---

## What MeMo gave us (kept)

- The **shape**: frozen-Generator → reflection-QA-corpus → trained-Memory + frozen-Executive walking a structured three-stage protocol (Grounding → Entity Identification → Answer Seeking & Synthesis), each stage with its own typed prompt / temperature / budget.
- The **reflection taxonomy**: fact-extract, consolidate, verify, entity-surface, cross-doc-synth.
- The **black-box posture**: Executive treated as an opaque LLM, no weights/logits required. This is the property that makes a `setupReplitAIIntegrations` binding clean.

## What we did NOT take

- Generator/Memory weights. The kit is dependency-free; consumers bind whichever open-weights model satisfies the envelope.
- White-box optimisations (Memory-Decoder-style KV-cache pre-loading). Breaking the black-box posture would defeat the point.
- The specific data-synthesis prompts (in the paper's supplementary materials) — that is a downstream consumer concern, not a doctrine concern.

## What we added on top (the membrane)

These three additions are the non-negotiable price MeMo pays to land inside our doctrine. Each is enforced by the type system, not a docstring.

1. **Content-addressed receipt refs.** Every receipt is `${class}:${sha256(canonicalJson(body)).slice(0,16)}`, same discipline as the Putnam harness. Mutate any field (including `freshnessNonce` or `parentRef`) and every downstream chain head breaks. MeMo gave us none of this.

2. **Stage-1 ↔ Stage-2 contradiction probe.** MeMo has no mechanism to detect a Stage 2 that *converges on the wrong entity* given Stage 1's grounding evidence. We borrow the sparse-attention-kit contradiction-probe discipline: Jaccard agreement over the reflection-ref keysets of the two stages, with a typed minimum threshold on the envelope. Disagreement above margin triggers a `memo.escalated.v1` receipt — re-run with a longer budget or fall back to grounding-only synthesis. Silence on contradiction is a doctrine violation.

3. **Perception-loop privacy invariant on reflections.** No `memo.reflection.v1` may contain a raw corpus byte — only `spanHash` (sha256 of the source span) plus the reflection snippet. The kit ships `findCanaryLeaks` for the canary-substring serialisation test that mirrors the perception-loop test discipline. This is identical to the rule that lets perception-loop be reviewed without leaking raw frames.

## Optional KS-18 grounding-parity witness

`checkGroundingParity` exposes the same parity arithmetic as the KS-18 contextuality witness — "each surfaced fact must appear in ≥2 sub-queries' grounding responses, and the total citation count must be even" — and surfaces under-grounded runs as `memo.grounding.parity.violated.v1`. Opt-in via `requireGroundingParity` on the envelope; absence means satisfied or unchecked, never silent failure.

## Authoritative pointers

- Synthesis doc: `docs/research/memo-synthesis-2026.md` (fifth in the synthesis-ledger after AGI / perception-bio / electrodynamics / sparse-attention).
- Kit: `packages/memo-reflection-kit/` — dependency-free, ships envelopes + pure functions + 13 typed receipt classes, no LLM client.
- Live route: `GET /api/memo/{receipts/classes,policy}`, `POST /api/memo/executive/admit` — public-read, mounted before `authMiddleware`. The admit endpoint stamps `freshnessNonce` + `issuedAt` and returns a content-addressed `ref`.

## **Why** these additions, not others

The paper deliberately treats the Memory as a black-box oracle and stops there. That posture is correct for a single research artifact but unsafe for a fabric that has to compose across A11oy / ROSIE / Sentra / Amaru: an unverified oracle, even when convenient, becomes a load-bearing trust assumption the rest of the platform cannot interrogate. The three additions above (content-addressing, contradiction-probe, privacy invariant) are precisely the audit surfaces that make MeMo composable with the rest of the receipt-chain discipline. They are not improvements over MeMo; they are the *interface* MeMo has to satisfy before it can be load-bearing here.

## **How to apply** when the next reflection-style paper lands

Use the same six-question per-entry contract from the synthesis doc (thesis / core primitives / closest SZL module / target artifact / what we build / Doctrine V6 receipt class). Before merging the absorption, verify three things: (a) every new receipt class is content-addressed, (b) every cross-stage interaction has an explicit contradiction probe or a documented reason there cannot be one, (c) every raw-byte exposure path has a canary-substring test in the kit's `__tests__`.
