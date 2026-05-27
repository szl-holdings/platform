# @workspace/putnam-harness

Receipt-attested live evaluation harness for Putnam-2025 against the SZL
primitive stack (sparse-attention-kit, sequence-pipeline, perception-loop,
lean-formulas). Six honesty rules baked into code — see
`.agents/memory/putnam-harness-honesty.md`.

## Run

```bash
tsx src/cli/eval-live.ts --quick 1 2 3   # 1 candidate, 2k tokens (smoke)
tsx src/cli/eval-live.ts                 # K=3 candidates, all 12 problems
tsx src/cli/aggregate.ts                 # canonical run from latest per-problem
GH_WORKFLOW_TOKEN=… tsx src/cli/publish-agi-forecast.ts
```

## Receipts emitted

`putnam.problem.v1`, `putnam.candidate.v1`, `putnam.contradiction.v1`,
`putnam.lean.check.v1`, `putnam.judge.v1`, `putnam.attempt.v1`,
`putnam.gauge.v1` — each with `freshnessNonce`, `parentRef`,
`receiptChainHead`.

## Honesty rules

1. Judge → `verdict:"abstained"` on JSON parse-fail.
2. `lean-check` → `toolchainAvailable:false` when lean not on PATH.
3. Every candidate carries tokens-in / tokens-out / wall-ms / model.
4. Picker penalises self-declared bluffs ("I cannot prove…").
5. Quick mode (K=1) reports `contradictionAgreement: null`.
6. Proof-style problems do NOT get a fake lean-verified tick.

Lift the gauge by changing the algorithm, never by relaxing a rule.
