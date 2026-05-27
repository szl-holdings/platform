# LinkedIn — Putnam-2025 honest receipt

We ran a receipt-attested evaluation of our SZL stack on all 12 Putnam-2025 problems and the result is what it is: **1 / 12 correct, gauge 0.083**.

Breakdown: 1 correct, 10 incorrect, **1 abstained** (the judge couldn't parse its own rubric reply and was forbidden from guessing). That's not a benchmark win. It's a benchmark *receipt*. Every problem carries:

- a `putnam.problem.v1` receipt with the SHA-256 of the official MathArena statement and grading scheme,
- a `putnam.candidate.v1` per candidate (model, strategy, tokens-in, tokens-out, wall-ms),
- a `putnam.contradiction.v1` from our sparse-attention-kit contradiction-probe (Jaccard agreement across strategies),
- a `putnam.lean.check.v1` which honestly reports `toolchainAvailable:false` when Lean isn't on PATH instead of fabricating a check,
- a `putnam.judge.v1` from a strict-JSON rubric judge that *abstains* on parse-fail rather than guessing,
- a `putnam.attempt.v1` whose verdict picker penalises self-declared bluffs ("I cannot prove …"),
- a `putnam.gauge.v1` whose chain-head ties the whole roster together.

The chain-head root for this run is published unmodified to `szl-holdings/agi-forecast` under `runtime/putnam-2025/`. You can verify the numbers without trusting me.

Why publish a losing score?

Because the only way a frontier-model benchmark becomes useful is when the *cost of fabricating it* is higher than the *cost of running it honestly*. Receipts make fabrication expensive. A flattering number that nobody can rebuild is worth less than an unflattering one anyone can.

Next milestone, in public: lift the gauge by making the contradiction-probe and Lean-check actually bite, not by swapping the judge for a kinder one.

#agi #benchmarks #receipts #honesty
