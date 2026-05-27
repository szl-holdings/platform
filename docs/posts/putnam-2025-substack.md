# Putnam-2025: A Receipt You Can Audit, Whether We Won or Not

*An operator's letter on running a frontier-model benchmark in public, with no escape hatches.*

---

Friends,

This week we shipped the Putnam-2025 evaluation harness, and ran it end-to-end against all twelve problems on the official MathArena release. The summary number is the kind of number engineering teams usually bury: **1 correct, 10 incorrect, 1 abstained — gauge 0.083**.

The abstain is not a typo. It is honesty rule #1 firing for real: the rubric judge failed to emit valid JSON on one problem and was forbidden — by the type system, not by a docstring — from guessing a score.

I want to tell you why we are publishing it loudly instead.

## A benchmark is worth what its receipt is worth

Every other week someone announces an LLM math win that nobody can reproduce. The cause is rarely fraud. The cause is *the absence of an audit surface*. A rubric judge gets re-prompted until it returns the answer the author wanted. A failed candidate gets quietly resampled. A "Lean-verified" claim turns out to have been a string match. None of these are visible in the headline.

We decided the harness would be allowed to produce *only* receipts. Not summaries: receipts. Each step — problem load, candidate generation, contradiction probe, Lean check, rubric judge, attempt verdict, gauge rollup — emits a typed object with a `receiptClass`, a `freshnessNonce`, a SHA-256 of every external input, a token count, a wall-clock, and a hash linking it to the previous step. The chain head of a run is a single 32-byte value. If two runs disagree on that value, they disagree on the entire history.

For this run the chain-head is `687a1a1441e75a6258b9ecb3c601e7e74ae6a222e34c0103ef051eaff673a828` and the receipt-chain root (sha256 of the canonical gauge body) is `c3cc3a2d05ce2a662002d9700dc32a918ab20b8655a685a303613d05b8d4e595`. You can pull it from `szl-holdings/agi-forecast` under `runtime/putnam-2025/`. You can recompute it. You can prove us wrong.

## Why the score isn't higher

Six honesty rules are wired into the type system, not the docstrings:

- The rubric judge **abstains on parse failure** instead of being silently retried.
- `lean-check` **reports `toolchainAvailable:false`** when Lean isn't on PATH. No pretend ticks.
- **Every candidate carries its full cost.** No throwing away the bad rolls.
- The picker **penalises self-declared bluffs** — "I cannot prove …" inside a proof body eats a score penalty before the picker chooses.
- **Quick mode (K = 1) cannot exercise the contradiction-probe.** It says so out loud.
- **Putnam-2025 is proof-style.** No closed-form numeric output. The harness does not pretend Lean can verify a free-form proof in 2026.
- **The canonical aggregator refuses partial or mixed-K runs** — twelve coherent attempts from one named run, or nothing.
- **Receipt refs are content-addressed.** Edit any field of any receipt and every downstream chain head breaks. The audit surface is the hash, not the trust.

Loosen any single one of these and the headline number goes up. None of them are *interesting* to loosen.

## What we actually run

Two Anthropic models (`claude-sonnet-4-6` as the candidate, `claude-opus-4-7` as the rubric judge). Four SZL primitives wired in as packages, not as marketing terms:

- `sequence-pipeline` — staged evidence with per-stage receipts.
- `sparse-attention-kit` — contradiction-probe via pairwise Jaccard on extracted final answers, with `escalated:true` when agreement drops below 0.5.
- `perception-loop` — wall-clock + token instrumentation that the candidate body cannot forge.
- `lean-formulas` — pure-Lean-4 verification stub that honestly degrades when the toolchain isn't available.

The whole thing took 355 seconds of candidate-generation wall and roughly 24 thousand output tokens.

## The shape of the next run

The gauge will be lifted by:

1. Multi-candidate runs (K = 3) so the contradiction-probe contributes signal.
2. A small Lean-statement adapter for the Putnam-2025 problems that admit closed-form answers (a minority, but a real one).
3. A wider strategy menu (currently three; aiming for seven, half of them deliberately wrong on purpose so the probe earns its keep).

You will see all of these as fresh receipt chains, with the prior chains preserved. If the number does not move, you will see that too.

That's the whole point. Honest numbers, published whether or not they flatter the team that produced them. Anything else is theater.

— Yours in receipts,
SZL Holdings
