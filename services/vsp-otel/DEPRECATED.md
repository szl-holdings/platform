# DEPRECATED — non-canonical mirror

> **Canonical home: [`szl-holdings/vsp-otel`](https://github.com/szl-holdings/vsp-otel).**

This directory (`platform/services/vsp-otel/`) is a **non-canonical partial mirror**
of the standalone [`szl-holdings/vsp-otel`](https://github.com/szl-holdings/vsp-otel)
repository — Layer 4 (Λ-gate exporter) of the SZL 7-layer architecture.

## Status (verified 2026-07-06)

- Every file here is **a byte-identical subset** of the canonical `vsp-otel` repo,
  with two exceptions that are **stale here and current in canonical**:
  - `src/pipeline/dpi_soundness.ts` — canonical uses the fully-qualified Lean name
    `Lutar.DPI.TH6_DPISoundness.dpi_receipt_chain_entropy_bound`; this mirror still
    carries the older `th6_dpi_soundness` string.
  - `runtime/src/server.ts` — an inconsequential comment-wording difference.
- The canonical repo additionally ships the **deployable collector** (`collector/`,
  `lambda_gate.py`, `dsse.py`, `stats.py`, Helm chart, integration docs) that this
  mirror does **not** contain.

## What to use instead

Depend on the canonical repo directly:

```
https://github.com/szl-holdings/vsp-otel
```

## Fold-in plan (later founder step)

1. Repoint any platform build/import that reads `services/vsp-otel/*` at the canonical
   `vsp-otel` package (git submodule or published artifact).
2. Once no build references this path, this directory may be removed by a deliberate
   founder action. **Archiving / deletion is NOT part of this change** — this change
   only adds the pointer, keeping everything reversible (CONSOLIDATION SAFETY RULE).

---

Doctrine v11 LOCKED · 749/14/163 · kernel c7c0ba17 · Λ = Conjecture 1 (never a theorem) · SLSA L1 honest

Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
