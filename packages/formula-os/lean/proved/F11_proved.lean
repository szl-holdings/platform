
-- PURIQ F11 (Mathlib-free): frustum -> pyramid degeneracy, Int algebraic core.
namespace PuriqF11
def frustumCore (a b : Int) : Int := a^2 + a*b + b^2
theorem frustum_degenerates_core (a : Int) : frustumCore a 0 = a^2 := by
  unfold frustumCore
  simp
end PuriqF11
