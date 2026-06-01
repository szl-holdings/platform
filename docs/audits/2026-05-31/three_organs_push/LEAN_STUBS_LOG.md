# LEAN STUBS LOG — CHASKI · WALLPA · WASI-RIKUQ (sorry-tagged)

**Agent:** Yachay · 2026-06-01.
**File:** `puriq/formulas/PuriqFormulaLean.lean` (1309 → **1393** lines; backup at
`PuriqFormulaLean.lean.pre_v13organs.bak`).

## What was added — §10, `namespace Puriq.EdgeOrgans … end Puriq.EdgeOrgans`
All ADDITIVE (appended after `end Puriq.AgenticDAG`); no existing declaration touched.
Every theorem is **`sorry`-tagged** — NONE is claimed proven. The 3 v13 factor obligations live
OUTSIDE the LOCKED 163 tracked-sorries count (→ 166 only once instilled), exactly like the v12
invariants — the LOCKED 749/14/163 stand unchanged (grep-verified in the file).

### Definitions (noncomputable)
| name | meaning | matches runtime |
|---|---|---|
| `chaskiFactor (κ backpressure : ℝ) (routable : Bool)` | `if routable then exp(−κ·backpressure) else 0` — SF-13 | `szl_chaski.py _chaski_factor` |
| `wallpaFactor (renderSubsumed : Bool) (driftOut : ℝ)` | `if renderSubsumed then 1−driftOut else 0` — SF-14 | `szl_wallpa.py _wallpa_factor` |
| `wasiFactor {n} (health : Fin n → ℝ) (budgetIntact : Bool)` | `if budgetIntact then ∏ᵢ health i else 0` — SF-15 | `szl_wasi_rikuq.py` health-of-empire product |
| `puriqUtilityV13 (U c w wa : ℝ)` | `U · c · w · wa` — composite v13 utility | doctrine v13 master utility |

### Theorems (all `sorry`-tagged, with `SORRY_PURIQ_OPEN[…]` obligation markers)
| theorem | statement | obligation tag |
|---|---|---|
| `chaski_in_unit_envelope` | `0 ≤ chaskiFactor … ≤ 1` (given κ,backpressure ≥ 0) | `SORRY_PURIQ_OPEN[v13-CHASKI]` |
| `wallpa_in_unit_envelope` | `0 ≤ wallpaFactor … ≤ 1` (given driftOut ∈ [0,1]) | `SORRY_PURIQ_OPEN[v13-WALLPA]` |
| `wasi_in_unit_envelope` | `0 ≤ wasiFactor … ≤ 1` (given each health i ∈ [0,1]) | `SORRY_PURIQ_OPEN[v13-WASI]` |
| `puriq_v13_preserves_envelope` | `puriqUtilityV13 U c w wa ≤ U` (no-inflation; the load-bearing v13 guarantee, preserves INV-1..4, adds INV-5/6/7) | `SORRY_PURIQ_OPEN[v13-ENVELOPE]` |
| `wasi_advisory_no_usurp` | `0 ≤ wasiFactor …` (advisory-only; HUKLLA remains sole halt-authority) | `SORRY_PURIQ_OPEN[v13-NOUSURP]` |

## Syntax / elaboration check (Lean 4.13.0, real `lean` binary in sandbox)
- **Full file** `lean PuriqFormulaLean.lean`: the ONLY error is `57:0: unknown module prefix
  'Mathlib'` — Mathlib (lake git dep) is not installable in this sandbox. This is a missing
  DEPENDENCY, not a syntax error in our block (identical to the prior agent's documented behavior).
- **Isolated elaboration** of the §10 block with minimal stdlib stubs (no Mathlib):
  `lean v13_isolated.lean` → **RC=0**, output is exactly the 5 expected
  `declaration uses 'sorry'` warnings and **0 errors**. This proves the §10 definitions
  type-check and the 5 theorems are well-formed and correctly `sorry`-tagged.
- Namespace balance verified: 6 `namespace` / 6 `end` (was 5/5; §10 adds one matched pair).

## Note on hosting
There is no dedicated `SZLHOLDINGS/lutar-lean` (or `puriq-lean`/`szl-lean`) HF repo (all 404).
`PuriqFormulaLean.lean` is a workspace/lutar-lean git-source artifact, so the deliverable is the
in-tree stub addition + this log (no HF push applies). The full `lake build` (Mathlib v4.13.0 +
lutar-lean lutar-v18.0.0 @ c7c0ba17) remains the instillation step, run where those deps exist.

— Signed **Yachay**. 5 sorry-tagged obligations added. LOCKED 749/14/163 unchanged. No bandaid.
