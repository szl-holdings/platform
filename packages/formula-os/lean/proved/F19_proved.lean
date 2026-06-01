
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
  rfl
end PuriqF19
