# Putnam-2025, Receipt-Attested: 1 / 12, and Why That's the Point

*A live evaluation of the SZL stack on the 2025 William Lowell Putnam Mathematical Competition, with every number bound to a verifiable receipt chain.*

---

## TL;DR

- 12 / 12 Putnam-2025 problems attempted live via Anthropic (`claude-sonnet-4-6` candidates, `claude-opus-4-7` judge).
- **1 correct, 10 incorrect, 1 abstained.** Gauge `score01 = 0.083`. The abstain isn't a footnote — it's honesty rule #1 firing for real (the judge couldn't parse its own JSON reply and was forbidden from guessing).
- Every step (problem load, candidate generation, contradiction probe, Lean check, rubric grading, attempt verdict, final gauge) emits a typed receipt with hashes, nonces, tokens, wall-ms, and model+primitive rosters.
- Chain-head + per-problem JSON published unmodified to `szl-holdings/agi-forecast` under `runtime/putnam-2025/`.

If you came for a chart-topping result, this isn't it. If you came to see how a benchmark looks when nobody is allowed to fudge — keep reading.

---

## Why "honest" had to be the spec, not the marketing

LLM math benchmarks are a graveyard of unreproducible victories. Vendor X claims 78%, vendor Y claims 81%, and nobody can rerun the exact prompt, the exact judge, the exact picking rule, the exact "we silently retried until it worked" loop. The fix isn't a stricter judge. The fix is making *every step* of the pipeline produce a receipt that a third party can hash and verify.

So we wrote the harness with six honesty rules baked in at the type level, not the comment level:

1. **The judge abstains on parse failure.** If the rubric reply isn't valid JSON, the problem is marked `abstained`, not silently retried into a win.
2. **`lean-check` reports `toolchainAvailable:false`** when Lean isn't on PATH. No mock-elaboration that hides as a tick.
3. **Every candidate carries tokens-in, tokens-out, wall-ms, model version.** No throwing away the bad rolls.
4. **The picker penalises self-declared bluffs.** "I cannot complete this proof" — even if the model proceeds — eats a score penalty before the picker chooses.
5. **Quick mode (single candidate) reports contradiction-agreement as `null`.** It cannot exercise the probe, so it does not claim to have.
6. **Putnam-2025 is proof-style.** There is no closed-form numeric answer to verify in pure Lean 4 today. The harness says so out loud rather than printing a green checkmark.

These rules are also the reason the result is 1 / 12. Bandaging any one of them would have given a higher number. None of them are interesting to bandage.

---

## What the SZL primitives actually did

- **`sequence-pipeline` (staged evidence).** Each problem flows through `prepare → generate-candidates → contradiction-probe → lean-check → judge → pick` stages, each emitting its own evidence entry. Failure of one stage degrades the gauge; it never crashes the run.
- **`sparse-attention-kit` (contradiction-probe).** When ≥ 2 candidates exist, the probe computes pairwise Jaccard agreement over their final-answer extractions. Agreement < 0.5 marks the attempt `escalated`. Under quick mode this primitive correctly reports it didn't run.
- **`perception-loop` (trace).** Every LLM call is wrapped in a perception trace so wall-ms / tokens-in / tokens-out is attached to the candidate receipt without the candidate body itself being able to forge the numbers.
- **`lean-formulas` (verification).** Where a Lean 4 statement of the problem is feasible, we attempt elaboration. For Putnam-2025 — proof-style, no closed-form output — every problem honestly returns `elaborated:false, toolchainAvailable:false`.

These are real packages in the SZL monorepo, not invented surface for the post. The primitive roster shows up in the gauge:

```
@szl-holdings/sparse-attention-kit@0.1.0
@szl-holdings/sequence-pipeline@0.1.0
@szl-holdings/perception-loop@0.1.0
@szl-holdings/putnam-harness@0.1.0
```

---

## The actual numbers

```
problemsAttempted = 12
problemsCorrect   = 1
problemsPartial   = 0
problemsIncorrect = 10
problemsAbstained = 1
totalAwarded      = 1
totalPossible     = 12
score01           = 0.083
modelRoster       = [claude-sonnet-4-6, claude-opus-4-7]
receiptChainHead  = 687a1a1441e75a6258b9ecb3c601e7e74ae6a222e34c0103ef051eaff673a828
receiptChainRoot  = c3cc3a2d05ce2a662002d9700dc32a918ab20b8655a685a303613d05b8d4e595  (sha256 of canonical gauge body)
```

Two structural additions since the first cut, both driven by an internal code review and both worth saying out loud:

- **Receipt refs are now content-addressed.** Every `receiptRef` is `sha256(canonical-json(receipt-body)).slice(0,16)`. Mutating any field — including `parentRef` or `freshnessNonce` — changes the ref and breaks every downstream chain head that referenced it. The earlier `class:nonce` form let you swap a receipt body without breaking the chain; that was an audit hole.
- **The aggregator refuses to produce a canonical gauge from cross-run cherry-picking.** It now requires exactly 12 attempts from a single coherent run (matching `K`, matching model roster), reads them from one named run directory, and writes a `manifest.json` recording the source path + content-addressed ref of every attempt that fed into the gauge. No more "latest file wins" mtime selection.

Receipt-chain head and root are in `runtime/putnam-2025/latest.json` on `szl-holdings/agi-forecast`. Rebuild them yourself; we want you to.

---

## What we learned

- One-candidate quick mode is a fine **smoke test**, but it cannot exercise the contradiction-probe. Multi-candidate runs (K=3) are the only setting where the probe contributes meaningful signal.
- The rubric judge is the place where the cost of dishonesty is highest. Forcing it to emit strict JSON and abstain on parse-fail removed an entire class of "phantom wins" we'd have otherwise reported.
- A Lean-backed verification layer for proof-style competition mathematics is still an open problem. We don't pretend otherwise in the receipt.

---

## What's next

Lift the gauge *honestly*: better strategy menu, multi-candidate runs with the contradiction-probe biting, and a Lean-statement adapter for the small subset of Putnam-2025 problems that admit a closed-form answer. Every improvement will come with the same receipt chain. If the next number isn't higher, you'll see that too.

— SZL Holdings
