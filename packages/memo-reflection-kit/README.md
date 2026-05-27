# @szl-holdings/memo-reflection-kit

Typed envelopes, content-addressed receipts, and pure-function probes for the
**MeMo** (Memory as a Model) reflection-pipeline + three-stage executive
protocol — re-expressed against SZL Holdings' Doctrine V6 receipt-chain
discipline.

**Status:** v0.1.0. Ships **envelope types and pure functions only** — no
model weights, no LLM client, no transport. The api-server binds Anthropic
via `setupReplitAIIntegrations`; this kit never reaches out to a network.

## Why this exists

MeMo (Quek, Lee, Leong, Verma, Prakash, Chen, Low, Rus, Solar-Lezama —
arXiv 2605.15156, May 2026) introduces a modular framework that encodes
new knowledge into a dedicated *Memory model* while keeping a frozen
*Executive model* LLM unchanged. A frozen *Generator model* transforms a
target corpus into a reflection QA dataset via five transforms (fact
extraction, consolidation, verification, entity surfacing, cross-document
synthesis); the Executive model at inference time walks a structured
three-stage protocol (Grounding → Entity Identification → Answer Seeking
& Synthesis) over the trained Memory.

The paper is silent on three things that our doctrine cannot ignore:

1. **Provenance & privacy.** No invariant prevents the Memory model from
   re-emitting raw corpus bytes; our perception-loop invariant requires
   span-hash-only receipts.
2. **Stage-2 contradiction.** No mechanism detects a Stage-2 entity that
   converges but disagrees with Stage-1 grounding evidence; our
   sparse-attention-kit's contradiction-probe discipline applies here.
3. **Grounding witness.** No formal coverage check on the grounding
   sub-queries; our KS-18 parity witness applies as an optional check.

This kit re-expresses MeMo against those three additions, content-addresses
every receipt, and ships 13 typed receipt classes ready to be emitted by
the api-server.

## What ships

| Module | Contents |
| --- | --- |
| `./receipts` | `MemoReceiptCommon`, `RECEIPT_CLASSES`, `canonicalJson`, `computeReceiptRef` |
| `./reflection` | `ReflectionEnvelope`, `ReflectionClass`, `ReflectionCorpusManifest`, `findCanaryLeaks` |
| `./contradiction-probe` | `probeStage2Contradiction` (pure function over fact-ref sets) |
| `./executive-protocol` | `ExecutiveProtocolEnvelope`, `admitExecutive`, per-stage result shapes, `probeRunContradiction`, `checkGroundingParity`, run-rollup shape |

## Receipt classes (13)

`memo.reflection.v1`, `memo.verification.v1`, `memo.corpus.manifest.v1`,
`memo.executive.admitted.v1`, `memo.executive.rejected.v1`,
`memo.grounding.v1`, `memo.entity.identification.v1`,
`memo.answer.synthesis.v1`, `memo.executive.run.v1`,
`memo.contradiction.v1`, `memo.escalated.v1`,
`memo.grounding.parity.violated.v1`, `memo.budget.exhausted.v1`.

All refs are `${class}:${sha256(canonicalJson(body)).slice(0,16)}`.

## What this kit is NOT

- Not a model. We do not ship Generator, Memory, or Executive weights.
- Not an LLM client. The api-server owns transport.
- Not a clone. No source from the upstream paper or any reference impl is
  vendored; every shape is re-expressed against our own ontology.

## Provenance

Re-expression of *MeMo: Memory as a Model* (arXiv 2605.15156, CC-BY 4.0).
Synthesis doc: `docs/research/memo-synthesis-2026.md`. Doctrine V6
compliance notes inline at the top of each source file.
