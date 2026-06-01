
-- PURIQ F1 (Mathlib-free): euler characteristic definitional identity.
namespace PuriqF1
structure PRG where
  V : Int
  E : Int
  F : Int
def eulerChar (g : PRG) : Int := g.V - g.E + g.F
theorem euler_char_def (g : PRG) : eulerChar g = g.V - g.E + g.F := by
  rfl
end PuriqF1
