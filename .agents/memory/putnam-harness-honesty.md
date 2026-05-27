---
name: Putnam-harness honesty contract
description: How packages/putnam-harness keeps frontier-model competition numbers receipt-auditable instead of vanity-inflatable.
---

The harness is allowed to produce ONLY receipts (problem/candidate/contradiction/lean.check/judge/attempt/gauge.v1). Numbers without a receipt-chain head are inadmissible.

**Why:** every "frontier model wins benchmark X" claim in 2024–2026 fell apart on retry; the only durable fix is making every step emit a hash-linked receipt anyone can recompute.

**How to apply:**
- Six honesty rules are *enforced by code*, not docstrings:
  1. judge → `verdict:"abstained"` on JSON parse-fail (never silent retry).
  2. lean-check → `toolchainAvailable:false` when lean not on PATH (never fake elaboration).
  3. every candidate carries tokens-in/out + wall-ms + model version.
  4. attempt picker penalises self-declared bluffs ("I cannot prove…") before picking.
  5. quick-mode (K=1) reports contradictionAgreement as null — the probe needs ≥2 candidates.
  6. proof-style competitions (Putnam) do NOT get a fake "lean verified" tick.
- Any future "lift the gauge" PR must keep all six. Removing one to chase a number is the failure mode.
- Publish path: `dist/eval/canonical-<ts>/` is the only canonical aggregation; `cli/publish-agi-forecast.ts` pushes it unmodified to `szl-holdings/agi-forecast` under `runtime/putnam-2025/`. Never publish a non-canonical run.
