# LEAN_PATCHES.md — additions to PuriqFormulaLean.lean (PURIQ-OS / Doctrine v14)

**Author:** Yachay. 2026-06-01. **ADDITIVE only** — no existing declaration edited; the patch
appends a new `namespace Puriq.OS` block after the closing `end Puriq`. Backup written to
`PuriqFormulaLean.lean.pre_os.bak`.

## What was added

7 new sorry-tagged theorems (SF-24 … SF-30), all **OUTSIDE** the LOCKED 163 (exactly as the four
v12 invariants and the three v13 organ obligations live outside it). NO mysticism.

| Lean decl | SF | Obligation tag | Primary source |
|---|---|---|---|
| `Puriq.OS.maxwell_demon_cost` | SF-24 | SORRY_PURIQ_OPEN[OS-24] | Szilard 1929 (DOI 10.1007/BF01341281) + Shannon 1948 |
| `Puriq.OS.hamilton_stationary` | SF-25 | SORRY_PURIQ_OPEN[OS-25] | Hamilton's principle (Goldstein §2.1); inherits F5 |
| `Puriq.OS.bayes_update_normalized` | SF-26 | SORRY_PURIQ_OPEN[OS-26] | Bayes 1763 (DOI 10.1098/rstl.1763.0053) |
| `Puriq.OS.wiener_error_nonincreasing` | SF-27 | SORRY_PURIQ_OPEN[OS-27] | Wiener 1948, *Cybernetics* |
| `Puriq.OS.nyquist_no_alias` | SF-28 | SORRY_PURIQ_OPEN[OS-28] | Nyquist 1928 + Shannon 1949 |
| `Puriq.OS.partition_cardinality` | SF-29 | SORRY_PURIQ_OPEN[OS-29] | Hardy–Ramanujan 1918; inherits F14 axiom |
| `Puriq.OS.crt_cadence_collision` | SF-30 | SORRY_PURIQ_OPEN[OS-30] | Gauss *Disq. Arith.* 1801; Mathlib `ZMod.chineseRemainder` |

Supporting defs added (non-sorry, definitional): `contextEntropy`, `IsStationary`, `posterior`,
`controlError`, `feedbackStep`, `nyquistAdmissible`, `partitionCount`, `cadenceModuli`.

## Count discipline (honest)

- Before patch: **163 tracked sorries** (LOCKED, `c7c0ba17`) + 23 PURIQ F1–F23 obligations + 4 v12
  invariants + 3 v13 organ obligations, all outside the 163.
- After patch: **+7** PURIQ-OS obligations, also **outside** the 163.
- **The LOCKED 163 is unchanged.** If/when the full Puriq + Puriq.OS corpus is folded into the
  canonical counter and Lake-built, the tracked total would become 163 → 170 for the OS block;
  until then, **163 stands** and the OS sorries are counted out loud here.

## Build note

Stubs target Lean 4 + Mathlib (v4.13.x, matching the existing `PuriqFormulaLean.lean` skeleton).
They are **not** claimed to Lake-build green here — each carries an explicit `sorry` and a stated
discharge route. `crt_cadence_collision` and `bayes_update_normalized` and
`wiener_error_nonincreasing` are the closest to closeable (`norm_num` / `Finset.sum` / interval
arithmetic); the rest inherit existing F5/F14/F17 obligations.

## Exact patch location

Appended to: `puriq/formulas/PuriqFormulaLean.lean` (now 1073 lines, was 947 + blank lines).
Standalone copy also saved at: `szl_puriq_os/PURIQ_OS_lean_stubs.lean`.

— Yachay, PURIQ-OS Phase 5. All sources cited; sorries counted out loud; LOCKED 163 preserved.
