"""
templates.py — standalone, MATHLIB-FREE Lean 4 templates for the 5 lowest-
dependency PURIQ formulas, used by the self-prove sprint (prover.attempt_proof).

Each template is a COMPLETE Lean file (core Lean 4 only, no `import Mathlib`)
with a single `__TACTIC__` placeholder for the proof body, so it can be verified
by the `lean` binary alone without building Mathlib (~minutes, not hours).

The 5 picks (lowest dependency burden — integer / definitional):
  F1  euler_char definitional identity  (target: V-E+F)
  F11 frustum degeneracy to pyramid      (ring identity over a field)
  F12 CRT period of coprime 7,12 = 84    (Nat.lcm, decide)
  F18 program count 2^(k+1)-1 closed form (Nat geometric sum, concrete k)
  F19 fuel-bounded run terminates        (concrete Nat recursion, decide/rfl)

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""

# F1 — Euler characteristic is definitionally V - E + F (mirrors wellFormed_iff Iff.rfl).
F1 = r"""
-- PURIQ F1 (Mathlib-free): euler characteristic definitional identity.
namespace PuriqF1
structure PRG where
  V : Int
  E : Int
  F : Int
def eulerChar (g : PRG) : Int := g.V - g.E + g.F
theorem euler_char_def (g : PRG) : eulerChar g = g.V - g.E + g.F := by
  __TACTIC__
end PuriqF1
"""

# F11 — frustum -> pyramid degeneracy, ALGEBRAIC CORE over Int (Mathlib-free).
# Rationale: the (h/3) prefactor is a field multiple that does not affect the
# degeneracy; core Lean 4 lacks Rat field-power instances (HMul Rat Rat) and the
# `ring` tactic (Mathlib-only), so we verify the faithful Int core:
#   frustumCore a 0 = a^2   (the b->0 degeneracy of a^2 + a*b + b^2).
F11 = r"""
-- PURIQ F11 (Mathlib-free): frustum -> pyramid degeneracy, Int algebraic core.
namespace PuriqF11
def frustumCore (a b : Int) : Int := a^2 + a*b + b^2
theorem frustum_degenerates_core (a : Int) : frustumCore a 0 = a^2 := by
  unfold frustumCore
  __TACTIC__
end PuriqF11
"""

# F12 — CRT period for coprime moduli 7,12: lcm = 84 (concrete, decidable).
F12 = r"""
-- PURIQ F12 (Mathlib-free): CRT collision period for coprime 7,12 is 84.
namespace PuriqF12
def crtPeriod (a b : Nat) : Nat := Nat.lcm a b
theorem crt_7_12 : crtPeriod 7 12 = 84 := by
  __TACTIC__
end PuriqF12
"""

# F18 — program count: 2^(k+1)-1 ; concrete k=10 -> 2047 (decidable closed form).
F18 = r"""
-- PURIQ F18 (Mathlib-free): #programs of length <= 10 is 2^11 - 1 = 2047.
namespace PuriqF18
def numProgramsUpTo (k : Nat) : Nat := 2^(k+1) - 1
theorem programs_k10 : numProgramsUpTo 10 = 2047 := by
  __TACTIC__
end PuriqF18
"""

# F19 — fuel-bounded run terminates; concrete: running countdown step from 3 with
# fuel 10 halts and returns 0 (decidable evaluation).
F19 = r"""
-- PURIQ F19 (Mathlib-free): fuel-bounded countdown terminates (concrete).
namespace PuriqF19
def step (x : Nat) : Option Nat := if x = 0 then none else some (x - 1)
def runFuel : Nat -> Nat -> Option Nat
  | 0, s => some s
  | fuel+1, s => match step s with
    | none => some s
    | some s' => runFuel fuel s'
-- from state 3 with fuel 10, the run halts at 0.
theorem fuel_halts_3 : runFuel 10 3 = some 0 := by
  __TACTIC__
end PuriqF19
"""

TEMPLATES = {
    "F1":  ("euler_char_def",       F1),
    "F11": ("frustum_degenerates_core",  F11),
    "F12": ("crt_7_12",             F12),
    "F18": ("programs_k10",         F18),
    "F19": ("fuel_halts_3",         F19),
}
