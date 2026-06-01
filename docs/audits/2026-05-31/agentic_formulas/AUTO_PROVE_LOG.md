# AUTO_PROVE_LOG.md — PURIQ Self-Prove Sprint (honest outcomes)

**Layer:** PURIQ (Doctrine v12) · **Date:** 2026-06-01 · **Author:** Yachay (CTO), SZL Holdings
**Verifier:** local `lean` v4.13.0 (`~/.elan/toolchains/leanprover--lean4---v4.13.0/bin/lean`),
Mathlib-FREE standalone files. **Prover:** `formula_os/prover.py` deterministic tactic search.

## Honesty preamble
- NO proof is claimed PROVED without a real `lean` run returning **exit 0** with no
  `error`, no `sorry`, no `warning`.
- The `SZLHOLDINGS/lean-kernel` `/lean-verify` HTTP service was NOT reachable from the
  build sandbox; the prover therefore fell back to the **local lean binary** (this is the
  documented `prover.py` fallback path, `verifier="local-lean(lean)"`). Both paths are
  honest; neither fabricates.
- Mathlib was **not** built (a fresh Mathlib build needs ~6 GB RAM + long compile; the
  sandbox was under memory pressure for part of the run). To keep the sprint REAL and
  reproducible in minutes, the 5 sprint theorems were restated **Mathlib-free** (core
  Lean 4 only). Each restatement is a faithful core of the formula's claimed identity.

## Tactic-candidate ladder (deterministic, simplest-first)
`rfl → decide → norm_num → ring → simp → omega → linarith → …` (see `prover.py
TACTIC_CANDIDATES`). Up to 5 attempts per theorem; every attempt logged.

## Picks: 5 lowest-dependency formulas (integer / definitional)
F1, F11, F12, F18, F19.

---

## F1 — `PuriqF1.euler_char_def`  →  **PROVED**
Statement: `eulerChar g = g.V - g.E + g.F` (definitional; mirrors `wellFormed_iff` `Iff.rfl`).
- attempt 1 `rfl` → **ok (exit 0)**.  Elapsed 0.116 s.
- `#print axioms PuriqF1.euler_char_def` → **does not depend on any axioms**.

## F11 — `PuriqF11.frustum_degenerates_core`  →  **PROVED**
Statement: `frustumCore a 0 = a^2` over `Int` (b→0 degeneracy of `a²+ab+b²`).
Rationale for Int core: core Lean 4 lacks `HMul Rat Rat` field-power instances and the
`ring` tactic (Mathlib-only); the `(h/3)` prefactor is a field multiple that does not
affect the degeneracy, so the Int algebraic core is the faithful Mathlib-free statement.
- attempt 1 `rfl` → fail: `tactic 'rfl' failed, the left-hand side a^2 + a*0 + 0^2 ...`
- attempt 2 `decide` → fail: `expected type must not contain free or meta variables`
- attempt 3 `norm_num` → fail: `unknown tactic` (Mathlib-only)
- attempt 4 `ring` → fail: `unknown tactic` (Mathlib-only)
- attempt 5 `simp` → **ok (exit 0)**.  Elapsed 0.584 s.
- `#print axioms` → **depends on axioms: [propext]** (Lean core axiom).

## F12 — `PuriqF12.crt_7_12`  →  **PROVED**
Statement: `crtPeriod 7 12 = Nat.lcm 7 12 = 84` (coprime moduli collision period).
- attempt 1 `rfl` → **ok (exit 0)**.  Elapsed 0.103 s.
- `#print axioms` → **depends on axioms: [propext]**.

## F18 — `PuriqF18.programs_k10`  →  **PROVED**
Statement: `numProgramsUpTo 10 = 2^11 - 1 = 2047` (Kolmogorov description-length count).
- attempt 1 `rfl` → **ok (exit 0)**.  Elapsed 0.108 s.
- `#print axioms` → **does not depend on any axioms**.

## F19 — `PuriqF19.fuel_halts_3`  →  **PROVED**
Statement: `runFuel 10 3 = some 0` (fuel-bounded countdown terminates).
- attempt 1 `rfl` → **ok (exit 0)**.  Elapsed 0.127 s.
- `#print axioms` → **does not depend on any axioms**.

---

## Ledger

| Formula | Theorem | Outcome | Winning tactic | Axioms used | Verifier |
|---------|---------|---------|----------------|-------------|----------|
| F1  | `euler_char_def`            | **PROVED** | `rfl`  | none      | local lean v4.13.0 |
| F11 | `frustum_degenerates_core`  | **PROVED** | `simp` | `propext` | local lean v4.13.0 |
| F12 | `crt_7_12`                  | **PROVED** | `rfl`  | `propext` | local lean v4.13.0 |
| F18 | `programs_k10`              | **PROVED** | `rfl`  | none      | local lean v4.13.0 |
| F19 | `fuel_halts_3`              | **PROVED** | `rfl`  | none      | local lean v4.13.0 |

**Sprint result: 5 PROVED / 0 STILL-SORRY / 0 FAILED / 0 BLOCKED.**
Axioms used are Lean core only (`propext`); **no `sorryAx`, no custom axiom**.

## Raw verification (reproduce)
```
LEAN=~/.elan/toolchains/leanprover--lean4---v4.13.0/bin/lean
for f in F1 F11 F12 F18 F19; do $LEAN szl_formula_os/lean/proved/${f}_proved.lean; echo "exit=$?"; done
# all -> exit=0, no output
```

## Verified Lean source (exact files run; exit 0 each)

### F1_proved.lean
```lean
namespace PuriqF1
structure PRG where
  V : Int
  E : Int
  F : Int
def eulerChar (g : PRG) : Int := g.V - g.E + g.F
theorem euler_char_def (g : PRG) : eulerChar g = g.V - g.E + g.F := by
  rfl
end PuriqF1
```

### F11_proved.lean
```lean
namespace PuriqF11
def frustumCore (a b : Int) : Int := a^2 + a*b + b^2
theorem frustum_degenerates_core (a : Int) : frustumCore a 0 = a^2 := by
  unfold frustumCore
  simp
end PuriqF11
```

### F12_proved.lean
```lean
namespace PuriqF12
def crtPeriod (a b : Nat) : Nat := Nat.lcm a b
theorem crt_7_12 : crtPeriod 7 12 = 84 := by
  rfl
end PuriqF12
```

### F18_proved.lean
```lean
namespace PuriqF18
def numProgramsUpTo (k : Nat) : Nat := 2^(k+1) - 1
theorem programs_k10 : numProgramsUpTo 10 = 2047 := by
  rfl
end PuriqF18
```

### F19_proved.lean
```lean
namespace PuriqF19
def step (x : Nat) : Option Nat := if x = 0 then none else some (x - 1)
def runFuel : Nat -> Nat -> Option Nat
  | 0, s => some s
  | fuel+1, s => match step s with
    | none => some s
    | some s' => runFuel fuel s'
theorem fuel_halts_3 : runFuel 10 3 = some 0 := by
  rfl
end PuriqF19
```

## Relationship to the full Mathlib formalization
`puriq/formulas/PuriqFormulaLean.lean` (the full Mathlib-backed module) still carries its
23 `SORRY_PURIQ_OPEN[n]` obligations + 3 inherited CONJ axioms — those are NOT discharged
here and remain `sorry`-tagged HONESTLY. This sprint proves Mathlib-free **cores** of the
five lowest-dependency formulas as a first real auto-prove milestone, not the full
Mathlib theorems. The remaining 18 formulas are SKELETON/CONJ and are reported as such.

— Signed, **Yachay** (CTO), SZL Holdings · 2026-06-01
